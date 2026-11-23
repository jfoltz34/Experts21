// POST /api/chat - stream one agent's reply as newline-delimited JSON events:
//   {"type":"text","text":"..."} ... {"type":"done","stopReason":"end_turn","model":"..."}
//   {"type":"error","message":"..."}
// Modes:
//   chat       - a direct conversation with one agent ({agent, messages})
//   panel      - an expert answering the orchestrator's brief ({agent, question, task, panel, history})
//   synthesize - the orchestrator combining expert memos ({question, memos, history})
import {
  AGENT_IDS, EFFORT, checkKey, checkPassword, describeApiError, httpError,
  personaOf, streamAgent, titleOf,
} from "../lib/experts.mjs";

export const config = { path: "/api/chat" };

const MAX_MESSAGES = 60;
const MAX_CHARS = 30000;

function cleanMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) throw new Error("messages must be a non-empty array");
  if (messages.length > MAX_MESSAGES) throw new Error(`conversation too long (max ${MAX_MESSAGES} messages); start a new chat`);
  const out = messages.map((m) => {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") {
      throw new Error("each message needs role user|assistant and string content");
    }
    if (m.content.length > MAX_CHARS) throw new Error(`a message is over ${MAX_CHARS} characters`);
    return { role: m.role, content: m.content };
  });
  if (out[0].role !== "user") throw new Error("the first message must be from the user");
  if (out.at(-1).role !== "user") throw new Error("the last message must be from the user");
  return out;
}

function str(v, name, max = MAX_CHARS) {
  if (typeof v !== "string" || !v.trim()) throw new Error(`${name} is required`);
  if (v.length > max) throw new Error(`${name} is too long`);
  return v;
}

// Prior team turns, as alternating user question / assistant combined answer.
function historyMessages(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-6).flatMap((h) => [
    { role: "user", content: str(h.question, "history question") },
    { role: "assistant", content: str(h.answer, "history answer") },
  ]);
}

function buildRequest(body) {
  const mode = body.mode ?? "chat";
  if (mode === "chat") {
    const agent = body.agent;
    if (!AGENT_IDS.includes(agent)) throw new Error("unknown agent");
    return { agentId: agent, messages: cleanMessages(body.messages), effort: EFFORT.chat };
  }
  if (mode === "panel") {
    const agent = body.agent;
    if (!AGENT_IDS.includes(agent) || agent === "orchestrator") throw new Error("unknown expert");
    const question = str(body.question, "question");
    const task = str(body.task, "task", 4000);
    const panel = (Array.isArray(body.panel) ? body.panel : [])
      .filter((id) => AGENT_IDS.includes(id) && id !== agent)
      .map((id) => `${personaOf(id)} (${titleOf(id)})`);
    const context = historyMessages(body.history)
      .map((m) => `${m.role === "user" ? "Earlier question" : "Team's earlier answer"}: ${m.content}`)
      .join("\n\n");
    const brief =
      `You are being consulted as ${titleOf(agent)} on the Tampa upscale-brunch project, as part of an expert panel run by Theo (Orchestrator).\n\n` +
      `Question from the consultant:\n${question}\n\n` +
      (context ? `Earlier in this team conversation:\n${context.slice(-12000)}\n\n` : "") +
      `Your specific task:\n${task}\n\n` +
      `Other experts on this panel: ${panel.join(", ") || "none"}. Stay in your lane and flag hand-offs.\n\n` +
      `Return a recommendation memo (recommendation-memo skill), signed with your name. Keep it under about 350 words, and label numbers Estimate/Verify. ` +
      `End with a one-line "Documents used:" list naming the included files you relied on.`;
    return { agentId: agent, messages: [{ role: "user", content: brief }], effort: EFFORT.panel };
  }
  if (mode === "synthesize") {
    const question = str(body.question, "question");
    const memos = (Array.isArray(body.memos) ? body.memos : []).filter(
      (m) => m && AGENT_IDS.includes(m.agent) && typeof m.text === "string",
    );
    const memoText = memos.length
      ? memos
          .map((m) => `<memo expert="${personaOf(m.agent)} (${m.agent})"${m.truncated ? ' status="cut off before finishing"' : ""}>\n${m.text.slice(0, 12000)}\n</memo>`)
          .join("\n\n")
      : "(No experts were consulted. Answer from the docs and your own judgment, and say so.)";
    const prompt =
      `SYNTHESIS STEP.\n\nThe consultant asked:\n${question}\n\nYour panel's memos:\n\n${memoText}\n\n` +
      `Write the one combined answer in the panel-synthesis format, attributing points by name and role, e.g. (Nora, FP&A). ` +
      `Only attribute what an expert actually wrote above. If any memo was cut off, say so in Open items. Sign it "Theo (Orchestrator)".`;
    return {
      agentId: "orchestrator",
      messages: [...historyMessages(body.history), { role: "user", content: prompt }],
      effort: EFFORT.synthesize,
    };
  }
  throw new Error("unknown mode");
}

export default async (req) => {
  if (req.method !== "POST") return httpError(405, "Use POST");
  const denied = checkPassword(req) ?? checkKey();
  if (denied) return denied;

  let request;
  try {
    request = buildRequest(await req.json());
  } catch (err) {
    return httpError(400, err.message);
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const stream = streamAgent({ ...request, signal: req.signal });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send({ type: "text", text: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        send({ type: "done", stopReason: final.stop_reason, model: final.model, usage: final.usage });
      } catch (err) {
        send({ type: "error", message: describeApiError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
};
