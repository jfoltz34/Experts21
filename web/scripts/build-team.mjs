// Build-time step: read the expert team from this repository and generate
//   src/generated/team.json            -> public sidebar data (names, personas, models)
//   netlify/lib/team-data.generated.mjs -> server-only prompt material (agent prompts,
//                                          skills, knowledge folders, docs)
// The knowledge folders and prompts never go into the browser bundle.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(here, "..");
const REPO = path.resolve(WEB, "..");
const AGENTS_DIR = path.join(REPO, ".claude", "agents");
const SKILLS_DIR = path.join(REPO, ".claude", "skills");
const KNOWLEDGE_DIR = path.join(REPO, "knowledge");
const DOCS_DIR = path.join(REPO, "docs");

const TEXT_EXT = new Set(["", ".md", ".markdown", ".txt", ".csv", ".tsv", ".json", ".yaml", ".yml", ".html"]);
const MAX_KNOWLEDGE_FILE_BYTES = 400_000; // keep prompts well inside the context window
const ALWAYS_DOCS = ["README.md", "decision-log.md", "09-risks.md"];

function splitFrontmatter(text, file) {
  if (!text.startsWith("---\n")) throw new Error(`${file}: missing YAML frontmatter`);
  const end = text.indexOf("\n---", 4);
  if (end === -1) throw new Error(`${file}: unterminated frontmatter`);
  return { fm: YAML.parse(text.slice(4, end)) ?? {}, body: text.slice(end + 4).replace(/^\n+/, "") };
}

function asList(v) {
  if (!v) return [];
  return Array.isArray(v) ? v.map(String) : String(v).split(",").map((s) => s.trim()).filter(Boolean);
}

function rosterMeta(body) {
  const m = body.match(/<!--\s*roster:(.*?)-->/s);
  const meta = {};
  if (m) for (const part of m[1].split("|")) {
    const i = part.indexOf("=");
    if (i > 0) meta[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return meta;
}

// docs/agent-brains.md rows: | `name` | **Persona** | model | why | voice | style |
function readBrains() {
  const out = {};
  const file = path.join(DOCS_DIR, "agent-brains.md");
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\|\s*`([a-z0-9-]+)`\s*\|\s*\*\*(.+?)\*\*\s*\|\s*([\w.-]+)\s*\|(.*)\|\s*$/);
    if (!m) continue;
    const [why, voice, style] = m[4].split("|").map((s) => s.trim());
    out[m[1]] = { persona: m[2], model: m[3], why, voice, style };
  }
  return out;
}

// Map roster "docs" tokens (e.g. "04, 05", "README", "expert-roster") to docs/ files.
function resolveDocs(tokens, docFiles) {
  const files = new Set();
  for (const t of tokens) {
    const tok = t.trim();
    const hit = docFiles.find((f) => f === `${tok}.md` || f.startsWith(`${tok}-`) || f === tok);
    if (hit) files.add(hit);
  }
  return [...files];
}

function readKnowledge(agent) {
  const dir = path.join(KNOWLEDGE_DIR, agent);
  const files = [];
  const skipped = [];
  if (!fs.existsSync(dir)) return { files, skipped };
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(d, entry.name);
      if (entry.name.startsWith(".")) continue;
      if (entry.isDirectory()) { walk(full); continue; }
      const rel = path.relative(REPO, full).split(path.sep).join("/");
      const ext = path.extname(entry.name).toLowerCase();
      const size = fs.statSync(full).size;
      if (!TEXT_EXT.has(ext)) { skipped.push(`${rel} (not a text file)`); continue; }
      if (size > MAX_KNOWLEDGE_FILE_BYTES) { skipped.push(`${rel} (over ${MAX_KNOWLEDGE_FILE_BYTES / 1000} KB)`); continue; }
      files.push({ path: rel, content: fs.readFileSync(full, "utf8") });
    }
  };
  walk(dir);
  return { files, skipped };
}

function main() {
  const brains = readBrains();
  const docFiles = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md")).sort();

  // Skills: name -> body (frontmatter stripped; escaped "\$" restored to "$")
  const skills = {};
  for (const name of fs.readdirSync(SKILLS_DIR).sort()) {
    const file = path.join(SKILLS_DIR, name, "SKILL.md");
    if (!fs.existsSync(file)) continue;
    const { fm, body } = splitFrontmatter(fs.readFileSync(file, "utf8"), file);
    if (fm["disable-model-invocation"] === true) continue; // typed-only commands, not knowledge
    skills[name] = body.replace(/\\\$/g, "$");
  }

  const agents = {};
  const publicAgents = [];
  const docsNeeded = new Set(ALWAYS_DOCS.filter((f) => docFiles.includes(f)));
  const knowledge = {};
  const warnings = [];

  for (const file of fs.readdirSync(AGENTS_DIR).filter((f) => f.endsWith(".md")).sort()) {
    const full = path.join(AGENTS_DIR, file);
    const { fm, body } = splitFrontmatter(fs.readFileSync(full, "utf8"), full);
    const name = fm.name;
    if (!name || !fm.description) { warnings.push(`${file}: skipped (no name/description)`); continue; }
    const meta = rosterMeta(body);
    const brain = brains[name] ?? {};
    const agentDocs = resolveDocs((meta.docs ?? "").split(","), docFiles);
    agentDocs.forEach((d) => docsNeeded.add(d));
    const k = readKnowledge(name);
    knowledge[name] = k.files;
    k.skipped.forEach((s) => warnings.push(`knowledge skipped: ${s}`));
    const agentSkills = asList(fm.skills).filter((s) => {
      if (!skills[s]) warnings.push(`${name}: skill '${s}' not found`);
      return Boolean(skills[s]);
    });

    agents[name] = {
      model: String(fm.model ?? "opus"),
      body,
      skills: agentSkills,
      docs: [...new Set([...ALWAYS_DOCS.filter((f) => docFiles.includes(f)), ...agentDocs])],
    };
    publicAgents.push({
      id: name,
      persona: meta.persona ?? brain.persona ?? name,
      title: meta.title ?? name,
      domain: meta.domain ?? "Other",
      rosterId: meta.id ?? "",
      model: String(fm.model ?? "opus"),
      color: fm.color ?? null,
      description: fm.description,
      job: (body.match(/^\*\*Job:\*\*\s*(.+)$/m) ?? [])[1] ?? "",
      voice: brain.voice ?? "",
      style: brain.style ?? "",
      why: brain.why ?? "",
      knowledgeFiles: k.files.map((f) => f.path).filter((p) => !p.endsWith("/README.md")),
    });
  }
  if (!agents.orchestrator) throw new Error("orchestrator agent not found in .claude/agents");

  const docs = {};
  for (const f of docsNeeded) docs[`docs/${f}`] = fs.readFileSync(path.join(DOCS_DIR, f), "utf8");
  for (const a of Object.values(agents)) a.docs = a.docs.map((f) => `docs/${f}`);
  const claudeMd = fs.existsSync(path.join(REPO, "CLAUDE.md")) ? fs.readFileSync(path.join(REPO, "CLAUDE.md"), "utf8") : "";

  publicAgents.sort((a, b) => a.rosterId.localeCompare(b.rosterId));
  const builtAt = new Date().toISOString();

  fs.mkdirSync(path.join(WEB, "src", "generated"), { recursive: true });
  fs.writeFileSync(path.join(WEB, "src", "generated", "team.json"),
    JSON.stringify({ builtAt, agents: publicAgents }, null, 2));

  fs.mkdirSync(path.join(WEB, "netlify", "lib"), { recursive: true });
  const data = { builtAt, claudeMd, agents, skills, docs, knowledge };
  fs.writeFileSync(path.join(WEB, "netlify", "lib", "team-data.generated.mjs"),
    "// GENERATED by scripts/build-team.mjs at build time. Do not edit or commit.\n" +
    `export const TEAM = ${JSON.stringify(data)};\n`);

  const kCount = Object.values(knowledge).flat().filter((f) => !f.path.endsWith("/README.md")).length;
  console.log(`build-team: ${publicAgents.length} agents, ${Object.keys(skills).length} skills, ` +
    `${Object.keys(docs).length} docs, ${kCount} knowledge document(s) (plus READMEs)`);
  warnings.forEach((w) => console.warn(`build-team: WARN ${w}`));
}

main();
