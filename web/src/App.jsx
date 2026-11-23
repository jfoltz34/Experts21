import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import team from "./generated/team.json";
import { PasscodeError, planPanel, setPasscode, streamChat } from "./api.js";

const TEAM_KEY = "orchestrator";
const DOMAIN_ORDER = [
  "Strategy & Leadership", "Concept & Product", "Real Estate & Development", "Finance",
  "Legal & Compliance", "Operations", "Marketing & Sales", "Technology & Data", "Risk", "Team",
];
const TEAM_EXAMPLES = [
  "We found a 3,800 sq ft second-generation space on South Howard at $52/sf plus $16 NNN, with 120 indoor seats and a 30-seat patio. Should we make an offer, and what should the LOI include?",
  "Weekday breakfast is weak in Tampa right now. Give me a plan to make Monday to Friday profitable.",
  "Design an opening menu and drink list that hits a $44 average check while keeping food at 60%+ of sales for the SRX license.",
  "Run the Capital gate and the Site gate. Are we ready to commit money? If not, what's missing and who owns it?",
];

const agentsById = Object.fromEntries(team.agents.map((a) => [a.id, a]));
let idCounter = 0;
const uid = () => `m${Date.now().toString(36)}${(idCounter++).toString(36)}`;

function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: (props) => <a {...props} target="_blank" rel="noreferrer noopener" /> }}
      >
        {children || ""}
      </ReactMarkdown>
    </div>
  );
}

function Avatar({ agent, size = "md" }) {
  return (
    <span className={`avatar avatar-${size} c-${agent?.color ?? "gray"}`} aria-hidden="true">
      {(agent?.persona ?? "?").slice(0, 1)}
    </span>
  );
}

function ModelBadge({ model, why }) {
  return <span className={`badge model-${model}`} title={why || undefined}>{model}</span>;
}

function Sidebar({ selected, onSelect, open, onClose }) {
  const groups = useMemo(() => {
    const byDomain = {};
    for (const a of team.agents) {
      if (a.id === TEAM_KEY) continue;
      (byDomain[a.domain] ??= []).push(a);
    }
    const rank = (d) => (DOMAIN_ORDER.includes(d) ? DOMAIN_ORDER.indexOf(d) : DOMAIN_ORDER.length);
    return Object.entries(byDomain).sort(([a], [b]) => rank(a) - rank(b));
  }, []);
  const theo = agentsById[TEAM_KEY];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Experts">
      <div className="brand">
        <div>
          <div className="brand-name">Experts21</div>
          <div className="brand-sub">Tampa upscale brunch · {team.agents.length} agents</div>
        </div>
        <button className="icon-btn only-mobile" onClick={onClose} aria-label="Close menu">✕</button>
      </div>

      <button
        className={`team-btn ${selected === TEAM_KEY ? "active" : ""}`}
        onClick={() => onSelect(TEAM_KEY)}
      >
        <Avatar agent={theo} />
        <span className="team-btn-text">
          <strong>Ask the whole team</strong>
          <span>{theo?.persona} picks the experts and combines their answers</span>
        </span>
      </button>

      <nav className="agent-list">
        {groups.map(([domain, agents]) => (
          <section key={domain}>
            <h3>{domain}</h3>
            {agents.map((a) => (
              <button
                key={a.id}
                className={`agent-item ${selected === a.id ? "active" : ""}`}
                onClick={() => onSelect(a.id)}
                title={`${a.title}\nVoice: ${a.voice}\nWorking style: ${a.style}`}
              >
                <Avatar agent={a} size="sm" />
                <span className="agent-text">
                  <span className="agent-line">
                    <strong>{a.persona}</strong>
                    <ModelBadge model={a.model} why={a.why} />
                  </span>
                  <span className="agent-title">{a.title}</span>
                  <span className="agent-voice">{a.voice}</span>
                </span>
              </button>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebar-foot">Built {new Date(team.builtAt).toLocaleString()}</div>
    </aside>
  );
}

function ChatHeader({ agent, isTeam, onNew, onMenu, hasMessages }) {
  return (
    <header className="chat-header">
      <button className="icon-btn only-mobile" onClick={onMenu} aria-label="Open experts menu">☰</button>
      <Avatar agent={agent} />
      <div className="chat-header-text">
        <div className="chat-title">
          {isTeam ? "The whole team" : agent.persona}
          <span className="chat-role">{isTeam ? `run by ${agent.persona} (Orchestrator)` : agent.title}</span>
          <ModelBadge model={agent.model} why={agent.why} />
        </div>
        <div className="chat-sub">
          {isTeam
            ? "Theo chooses 1-6 experts, they answer in parallel, and Theo combines one answer."
            : <>Voice: {agent.voice}. Working style: {agent.style}.</>}
        </div>
        {!isTeam && agent.knowledgeFiles.length > 0 && (
          <div className="chat-sub">Knowledge folder: {agent.knowledgeFiles.map((f) => f.split("/").pop()).join(", ")}</div>
        )}
      </div>
      {hasMessages && <button className="btn ghost" onClick={onNew}>New chat</button>}
    </header>
  );
}

function EmptyState({ agent, isTeam, onPick }) {
  const examples = isTeam
    ? TEAM_EXAMPLES
    : [
        `What should I know first about your area, ${agent.persona}?`,
        `What are the top three risks you see for this project, and what would you do about them?`,
        agent.knowledgeFiles.length ? `Review the documents in your knowledge folder and tell me what matters.` : `Which documents should I add to your knowledge folder?`,
      ];
  return (
    <div className="empty">
      <Avatar agent={agent} size="lg" />
      <h2>{isTeam ? "Ask the whole team" : `Ask ${agent.persona}`}</h2>
      <p>{agent.job}</p>
      <div className="examples">
        {examples.map((e) => (
          <button key={e} className="example" onClick={() => onPick(e)}>{e}</button>
        ))}
      </div>
      <p className="hint">
        Answers are advisory. Legal, tax and insurance points need a licensed professional's confirmation.
      </p>
    </div>
  );
}

function TeamTurn({ turn }) {
  const theo = agentsById[TEAM_KEY];
  const stageLabel = {
    planning: `${theo.persona} is choosing the experts…`,
    experts: "The experts are working…",
    synthesis: `${theo.persona} is combining the answers…`,
  }[turn.stage];
  return (
    <div className="msg assistant team-turn">
      <Avatar agent={theo} size="sm" />
      <div className="msg-body">
        {turn.plan && (
          <div className="plan">
            <div className="plan-head">
              <strong>{theo.persona} convened:</strong>
              {turn.plan.experts.map((e) => {
                const m = turn.memos[e.agent] ?? {};
                return (
                  <span key={e.agent} className={`chip status-${m.status ?? "waiting"}`} title={e.task}>
                    <Avatar agent={agentsById[e.agent]} size="xs" /> {e.persona}
                  </span>
                );
              })}
            </div>
            {turn.plan.rationale && <p className="plan-why">{turn.plan.rationale}</p>}
            {turn.plan.experts.map((e) => {
              const m = turn.memos[e.agent] ?? {};
              const a = agentsById[e.agent];
              return (
                <details key={e.agent} className="memo">
                  <summary>
                    <Avatar agent={a} size="xs" /> {e.persona} · {e.title}
                    <ModelBadge model={a?.model} />
                    <span className="memo-status">
                      {{ streaming: "writing…", done: "done", truncated: "cut off", error: "failed" }[m.status] ?? "waiting"}
                    </span>
                  </summary>
                  <div className="memo-task"><strong>Task:</strong> {e.task}</div>
                  {m.error ? <div className="error-text">{m.error}</div> : <Markdown>{m.text}</Markdown>}
                </details>
              );
            })}
          </div>
        )}
        {turn.synthesis && <div className="synthesis"><Markdown>{turn.synthesis}</Markdown></div>}
        {stageLabel && <div className="working"><span className="dots" /> {stageLabel}</div>}
        {turn.note && <div className="note">{turn.note}</div>}
        {turn.error && <div className="error-text">{turn.error}</div>}
      </div>
    </div>
  );
}

function Message({ msg, agent }) {
  if (msg.kind === "team") return <TeamTurn turn={msg} />;
  if (msg.role === "user") {
    return <div className="msg user"><div className="msg-body"><div className="bubble">{msg.content}</div></div></div>;
  }
  return (
    <div className="msg assistant">
      <Avatar agent={agent} size="sm" />
      <div className="msg-body">
        <Markdown>{msg.content}</Markdown>
        {msg.streaming && !msg.content && <div className="working"><span className="dots" /> {agent.persona} is thinking…</div>}
        {msg.note && <div className="note">{msg.note}</div>}
        {msg.error && <div className="error-text">{msg.error}</div>}
      </div>
    </div>
  );
}

function PasscodeDialog({ onSubmit, onCancel }) {
  const [value, setValue] = useState("");
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pc-title">
      <form className="modal" onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}>
        <h2 id="pc-title">Passcode required</h2>
        <p>This site is protected. Enter the passcode set in Netlify (APP_PASSWORD).</p>
        <input type="password" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="Passcode" />
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn primary" disabled={!value}>Unlock</button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(TEAM_KEY);
  const [convs, setConvs] = useState({});
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [passcodeRetry, setPasscodeRetry] = useState(null);
  const controllers = useRef({});
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const agent = agentsById[selected];
  const isTeam = selected === TEAM_KEY;
  const messages = convs[selected] ?? [];
  const draft = drafts[selected] ?? "";
  const isBusy = Boolean(busy[selected]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 200) el.scrollTop = el.scrollHeight;
  }, [convs, selected]);

  useEffect(() => { inputRef.current?.focus(); }, [selected]);

  const append = (key, msg) => setConvs((p) => ({ ...p, [key]: [...(p[key] ?? []), msg] }));
  const patch = (key, id, fn) =>
    setConvs((p) => ({ ...p, [key]: (p[key] ?? []).map((m) => (m.id === id ? { ...m, ...fn(m) } : m)) }));

  function needPasscode(retry) {
    setPasscodeRetry(() => retry);
  }

  async function runChat(key, text) {
    const prior = (convs[key] ?? []).filter((m) => m.content && !m.error && !m.kind);
    const userMsg = { id: uid(), role: "user", content: text };
    const reply = { id: uid(), role: "assistant", content: "", streaming: true };
    append(key, userMsg);
    append(key, reply);
    const ctrl = new AbortController();
    controllers.current[key] = ctrl;
    setBusy((b) => ({ ...b, [key]: true }));
    try {
      const r = await streamChat(
        { mode: "chat", agent: key, messages: [...prior, userMsg].map(({ role, content }) => ({ role, content })) },
        { signal: ctrl.signal, onText: (_, full) => patch(key, reply.id, () => ({ content: full })) },
      );
      patch(key, reply.id, () => ({
        content: r.text,
        streaming: false,
        note: r.refused ? "The model declined to answer this." : r.truncated ? "The reply was cut off (Netlify's 60-second limit or the length cap). Ask it to continue." : null,
      }));
    } catch (err) {
      if (err instanceof PasscodeError) {
        setConvs((p) => ({ ...p, [key]: (p[key] ?? []).filter((m) => m.id !== userMsg.id && m.id !== reply.id) }));
        needPasscode(() => runChat(key, text));
      } else {
        patch(key, reply.id, () => ({ streaming: false, error: err.name === "AbortError" ? "Stopped." : err.message }));
      }
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  async function runTeam(question) {
    const key = TEAM_KEY;
    const history = (convs[key] ?? [])
      .filter((m) => m.kind === "team" && m.stage === "done" && m.synthesis)
      .map((m) => ({ question: m.question, answer: m.synthesis }));
    const userMsg = { id: uid(), role: "user", content: question };
    const turn = { id: uid(), role: "assistant", kind: "team", question, stage: "planning", plan: null, memos: {}, synthesis: "" };
    append(key, userMsg);
    append(key, turn);
    const ctrl = new AbortController();
    controllers.current[key] = ctrl;
    setBusy((b) => ({ ...b, [key]: true }));
    const setMemo = (agentId, data) =>
      patch(key, turn.id, (m) => ({ memos: { ...m.memos, [agentId]: { ...m.memos[agentId], ...data } } }));

    try {
      const plan = await planPanel({ question, history }, { signal: ctrl.signal });
      patch(key, turn.id, () => ({ plan, stage: plan.experts.length ? "experts" : "synthesis" }));
      const panelIds = plan.experts.map((e) => e.agent);

      const results = await Promise.all(
        plan.experts.map(async (e) => {
          setMemo(e.agent, { status: "streaming", text: "" });
          try {
            const r = await streamChat(
              { mode: "panel", agent: e.agent, question, task: e.task, panel: panelIds, history },
              { signal: ctrl.signal, onText: (_, full) => setMemo(e.agent, { text: full }) },
            );
            setMemo(e.agent, { text: r.text, status: r.truncated ? "truncated" : "done" });
            return r.text ? { agent: e.agent, text: r.text, truncated: r.truncated } : null;
          } catch (err) {
            if (err.name === "AbortError" || err instanceof PasscodeError) throw err;
            setMemo(e.agent, { status: "error", error: err.message });
            return null;
          }
        }),
      );

      patch(key, turn.id, () => ({ stage: "synthesis" }));
      const memos = results.filter(Boolean);
      const r = await streamChat(
        { mode: "synthesize", question, memos, history },
        { signal: ctrl.signal, onText: (_, full) => patch(key, turn.id, () => ({ synthesis: full })) },
      );
      const failed = plan.experts.length - memos.length;
      patch(key, turn.id, () => ({
        synthesis: r.text,
        stage: "done",
        note: [
          failed > 0 ? `${failed} expert(s) failed and were left out.` : "",
          r.truncated ? "The combined answer was cut off. Ask the team to continue." : "",
        ].filter(Boolean).join(" ") || null,
      }));
    } catch (err) {
      if (err instanceof PasscodeError) {
        setConvs((p) => ({ ...p, [key]: (p[key] ?? []).filter((m) => m.id !== userMsg.id && m.id !== turn.id) }));
        needPasscode(() => runTeam(question));
      } else {
        patch(key, turn.id, () => ({ stage: "error", error: err.name === "AbortError" ? "Stopped." : err.message }));
      }
    } finally {
      setBusy((b) => ({ ...b, [key]: false }));
    }
  }

  function send(textArg) {
    const text = (textArg ?? draft).trim();
    if (!text || isBusy) return;
    setDrafts((d) => ({ ...d, [selected]: "" }));
    (isTeam ? runTeam : (t) => runChat(selected, t))(text);
  }

  function stop() {
    controllers.current[selected]?.abort();
  }

  function newChat() {
    stop();
    setConvs((p) => ({ ...p, [selected]: [] }));
  }

  return (
    <div className="app">
      <Sidebar
        selected={selected}
        onSelect={(id) => { setSelected(id); setMenuOpen(false); }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      {menuOpen && <div className="scrim only-mobile" onClick={() => setMenuOpen(false)} />}
      <main className="chat">
        <ChatHeader agent={agent} isTeam={isTeam} onNew={newChat} onMenu={() => setMenuOpen(true)} hasMessages={messages.length > 0} />
        <div className="messages" ref={scrollRef}>
          {messages.length === 0
            ? <EmptyState agent={agent} isTeam={isTeam} onPick={(t) => send(t)} />
            : messages.map((m) => <Message key={m.id} msg={m} agent={agent} />)}
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea
            ref={inputRef}
            rows={2}
            value={draft}
            placeholder={isTeam ? "Ask the whole team…" : `Message ${agent.persona}…`}
            onChange={(e) => setDrafts((d) => ({ ...d, [selected]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
            }}
          />
          {isBusy
            ? <button type="button" className="btn" onClick={stop}>Stop</button>
            : <button type="submit" className="btn primary" disabled={!draft.trim()}>Send</button>}
        </form>
      </main>
      {passcodeRetry && (
        <PasscodeDialog
          onCancel={() => setPasscodeRetry(null)}
          onSubmit={(v) => { setPasscode(v); const retry = passcodeRetry; setPasscodeRetry(null); retry(); }}
        />
      )}
    </div>
  );
}
