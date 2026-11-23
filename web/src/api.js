// Browser-side client for the Netlify Functions. No API key here: the functions
// hold ANTHROPIC_API_KEY on the server.

const PASS_KEY = "experts21-passcode";

export function getPasscode() {
  try { return localStorage.getItem(PASS_KEY) || ""; } catch { return ""; }
}
export function setPasscode(value) {
  try { value ? localStorage.setItem(PASS_KEY, value) : localStorage.removeItem(PASS_KEY); } catch { /* ignore */ }
}

export class PasscodeError extends Error {}

function headers() {
  const h = { "content-type": "application/json" };
  const p = getPasscode();
  if (p) h["x-app-password"] = p;
  return h;
}

async function failure(res) {
  if (res.status === 401) throw new PasscodeError("Passcode required");
  let msg = `${res.status} ${res.statusText}`;
  try { msg = (await res.json()).error || msg; } catch { /* not JSON */ }
  if (res.status === 404) msg = "The API functions aren't running. Locally, use `netlify dev` instead of `npm run dev`.";
  throw new Error(msg);
}

// Stream an agent reply. Calls onText(delta) as text arrives.
// Resolves to {text, stopReason, model, truncated}.
export async function streamChat(payload, { onText, signal } = {}) {
  const res = await fetch("/api/chat", { method: "POST", headers: headers(), body: JSON.stringify(payload), signal });
  if (!res.ok) await failure(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let done = null;

  const handle = (line) => {
    if (!line.trim()) return;
    const evt = JSON.parse(line);
    if (evt.type === "text") { text += evt.text; onText?.(evt.text, text); }
    else if (evt.type === "done") done = evt;
    else if (evt.type === "error") throw new Error(evt.message);
  };

  for (;;) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      handle(buffer.slice(0, nl));
      buffer = buffer.slice(nl + 1);
    }
  }
  handle(buffer);

  // No "done" event means the stream was cut off (e.g. the 60-second function limit).
  return {
    text,
    stopReason: done?.stopReason ?? null,
    model: done?.model ?? null,
    truncated: !done || done.stopReason === "max_tokens",
    refused: done?.stopReason === "refusal",
  };
}

export async function planPanel(payload, { signal } = {}) {
  const res = await fetch("/api/plan", { method: "POST", headers: headers(), body: JSON.stringify(payload), signal });
  if (!res.ok) await failure(res);
  return res.json();
}
