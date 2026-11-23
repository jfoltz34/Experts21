// Smoke test for the Netlify Functions without a real API key or network:
// starts a local mock of the Anthropic Messages API, points the SDK at it with
// ANTHROPIC_BASE_URL, calls the functions directly, and checks both what the
// functions send to the API and what they stream back to the browser.
// Run with: npm test
import http from "node:http";
import assert from "node:assert/strict";

const requests = [];
let nextResponse = null; // optional override for the next mock reply

function sse(res, text) {
  res.writeHead(200, { "content-type": "text/event-stream" });
  const send = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
  send("message_start", { message: { id: "msg_mock", type: "message", role: "assistant", model: "mock", content: [], stop_reason: null, usage: { input_tokens: 10, output_tokens: 0 } } });
  send("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
  for (const piece of text.match(/.{1,12}/gs)) send("content_block_delta", { index: 0, delta: { type: "text_delta", text: piece } });
  send("content_block_stop", { index: 0 });
  send("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 42 } });
  send("message_stop", {});
  res.end();
}

const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    requests.push({ path: req.url, headers: req.headers, body });
    if (nextResponse) { const r = nextResponse; nextResponse = null; return r(res, body); }
    if (body.stream) return sse(res, "Hello from the mock expert. **Bottom line:** test passes.");
    // Non-streaming = the structured-output planning call.
    const plan = {
      rationale: "Money and alcohol are involved.",
      experts: [
        { agent: "fpa-analyst", task: "Check the numbers." },
        { agent: "fpa-analyst", task: "Duplicate that should be removed." },
        { agent: "liquor-zoning-attorney", task: "Check the license path." },
      ],
    };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({
      id: "msg_plan", type: "message", role: "assistant", model: body.model,
      content: [{ type: "text", text: JSON.stringify(plan) }],
      stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 },
    }));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`;
process.env.ANTHROPIC_API_KEY = "test-key";

const chat = (await import("../netlify/functions/chat.mjs")).default;
const plan = (await import("../netlify/functions/plan.mjs")).default;

const post = (fn, body, headers = {}) =>
  fn(new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));

async function readEvents(res) {
  const text = await res.text();
  return text.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

let passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ok  ${name}`); }
  catch (err) { console.error(`  FAIL ${name}\n${err.stack}`); process.exitCode = 1; }
}

console.log("smoke test: Netlify Functions against a mock Anthropic API");

await test("direct chat with an opus agent streams text and uses its knowledge folder", async () => {
  requests.length = 0;
  const res = await post(chat, { mode: "chat", agent: "real-estate-advisor", messages: [{ role: "user", content: "Should we sign?" }] });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /ndjson/);
  const events = await readEvents(res);
  const text = events.filter((e) => e.type === "text").map((e) => e.text).join("");
  assert.equal(text, "Hello from the mock expert. **Bottom line:** test passes.");
  assert.equal(events.at(-1).type, "done");
  assert.equal(events.at(-1).stopReason, "end_turn");
  const sent = requests[0];
  assert.equal(sent.headers.authorization, "Bearer test-key", "API key comes from the server env (SDK 1.x sends it as a Bearer token)");
  assert.equal(sent.body.model, "claude-opus-5-5");
  assert.equal(sent.body.stream, true);
  assert.equal(sent.body.fallbacks, "default");
  assert.match(sent.headers["anthropic-beta"], /server-side-fallback-2026-07-01/);
  assert.equal(sent.body.output_config.effort, "medium");
  assert.equal(sent.body.system[0].cache_control.type, "ephemeral");
  const system = sent.body.system[0].text;
  assert.match(system, /444 Sunkist Drive/, "knowledge folder document included");
  assert.match(system, /persona=Dale/, "agent definition included");
  assert.match(system, /<skill name="lease-analysis">/, "preloaded skills included");
  assert.match(system, /<document path="docs\/decision-log.md">/, "shared docs included");
  assert.ok(!/\\\$\d/.test(system), "skill dollar escapes restored");
});

await test("haiku agent uses claude-haiku-5-5 without the fallback beta", async () => {
  requests.length = 0;
  await readEvents(await post(chat, { mode: "chat", agent: "competitive-intel-analyst", messages: [{ role: "user", content: "hi" }] }));
  const sent = requests[0];
  assert.equal(sent.body.model, "claude-haiku-5-5");
  assert.equal(sent.body.fallbacks, undefined);
  assert.ok(!(sent.headers["anthropic-beta"] ?? "").includes("server-side-fallback"));
});

await test("sonnet agent uses claude-sonnet-5-5 with fallbacks", async () => {
  requests.length = 0;
  await readEvents(await post(chat, { mode: "chat", agent: "culinary-director", messages: [{ role: "user", content: "hi" }] }));
  assert.equal(requests[0].body.model, "claude-sonnet-5-5");
  assert.equal(requests[0].body.fallbacks, "default");
});

await test("plan: orchestrator returns a de-duplicated panel with personas", async () => {
  requests.length = 0;
  const res = await post(plan, { question: "Can we do bottomless mimosas?" });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.experts.map((e) => e.agent), ["fpa-analyst", "liquor-zoning-attorney"]);
  assert.deepEqual(body.experts.map((e) => e.persona), ["Nora", "Celeste"]);
  const sent = requests[0].body;
  assert.equal(sent.model, "claude-opus-5-5");
  assert.equal(sent.output_config.effort, "low");
  assert.equal(sent.output_config.format.type, "json_schema");
  assert.match(sent.system[0].text, /expert-routing/);
  assert.match(sent.messages.at(-1).content, /PLANNING STEP/);
});

await test("panel mode briefs the expert with the task and the other panelists", async () => {
  requests.length = 0;
  await readEvents(await post(chat, { mode: "panel", agent: "fpa-analyst", question: "Q?", task: "Check the numbers.", panel: ["fpa-analyst", "liquor-zoning-attorney"] }));
  const brief = requests[0].body.messages[0].content;
  assert.match(brief, /Check the numbers\./);
  assert.match(brief, /Celeste \(Liquor License & Zoning Attorney\)/);
  assert.ok(!brief.includes("Nora (Restaurant Finance"), "doesn't list itself as another panelist");
});

await test("synthesize mode sends memos to the orchestrator with history", async () => {
  requests.length = 0;
  await readEvents(await post(chat, {
    mode: "synthesize", question: "Q?", history: [{ question: "Earlier?", answer: "Earlier answer." }],
    memos: [{ agent: "fpa-analyst", text: "Nora's memo text" }, { agent: "liquor-zoning-attorney", text: "Celeste memo", truncated: true }],
  }));
  const sent = requests[0].body;
  assert.match(sent.system[0].text, /How the panel runs in the web app/);
  assert.equal(sent.messages.length, 3);
  assert.match(sent.messages.at(-1).content, /Nora's memo text/);
  assert.match(sent.messages.at(-1).content, /cut off before finishing/);
});

await test("bad requests are rejected before calling the API", async () => {
  requests.length = 0;
  assert.equal((await post(chat, { mode: "chat", agent: "nobody", messages: [{ role: "user", content: "x" }] })).status, 400);
  assert.equal((await post(chat, { mode: "chat", agent: "fpa-analyst", messages: [{ role: "assistant", content: "x" }] })).status, 400);
  assert.equal((await post(chat, { mode: "mystery" })).status, 400);
  assert.equal((await post(plan, { question: "" })).status, 400);
  const get = await chat(new Request("http://localhost/api/chat"));
  assert.equal(get.status, 405);
  assert.equal(requests.length, 0);
});

await test("APP_PASSWORD gates both functions", async () => {
  process.env.APP_PASSWORD = "brunch";
  try {
    assert.equal((await post(chat, { mode: "chat", agent: "fpa-analyst", messages: [{ role: "user", content: "x" }] })).status, 401);
    assert.equal((await post(plan, { question: "x" })).status, 401);
    const ok = await post(chat, { mode: "chat", agent: "fpa-analyst", messages: [{ role: "user", content: "x" }] }, { "x-app-password": "brunch" });
    assert.equal(ok.status, 200);
    await ok.text();
  } finally {
    delete process.env.APP_PASSWORD;
  }
});

await test("missing ANTHROPIC_API_KEY gives a clear setup error", async () => {
  const key = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const res = await post(chat, { mode: "chat", agent: "fpa-analyst", messages: [{ role: "user", content: "x" }] });
    assert.equal(res.status, 500);
    assert.match((await res.json()).error, /ANTHROPIC_API_KEY is not set/);
  } finally {
    process.env.ANTHROPIC_API_KEY = key;
  }
});

await test("an upstream auth error is reported as an error event", async () => {
  nextResponse = (res) => {
    res.writeHead(401, { "content-type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }));
  };
  const events = await readEvents(await post(chat, { mode: "chat", agent: "fpa-analyst", messages: [{ role: "user", content: "x" }] }));
  assert.equal(events.at(-1).type, "error");
  assert.match(events.at(-1).message, /API key was rejected/);
});

server.close();
console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
