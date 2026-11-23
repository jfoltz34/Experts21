#!/usr/bin/env python3
"""Validate the expert team and regenerate docs/expert-roster.md.

The agent files (.claude/agents/*.md) and skill files (.claude/skills/*/SKILL.md)
are the single source of truth. This script checks them against the Claude Code
rules and the house conventions, and derives the roster document from them.

Usage:
    python3 tools/team.py validate   # exit 1 if any error
    python3 tools/team.py roster     # rewrite docs/expert-roster.md
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("PyYAML is required: pip install pyyaml")

ROOT = Path(__file__).resolve().parent.parent
AGENTS_DIR = ROOT / ".claude" / "agents"
SKILLS_DIR = ROOT / ".claude" / "skills"
ROSTER = ROOT / "docs" / "expert-roster.md"
BRAINS = ROOT / "docs" / "agent-brains.md"
KNOWLEDGE_DIR = ROOT / "knowledge"
MODELS = {"opus", "sonnet", "haiku", "fable", "inherit"}

ORCHESTRATOR = "orchestrator"
ROUTING_SKILL = "expert-routing"
MIN_AGENTS, MAX_AGENTS = 10, 50
MAX_PRELOADED_SKILLS = 32
DESC_TOKEN_BUDGET = 15000  # Claude Code warns above this (all agent descriptions)
SKILL_DESC_LIMIT = 1536

# Frontmatter fields documented at code.claude.com/docs/en/sub-agents and /skills
AGENT_FIELDS = {
    "name", "description", "tools", "disallowedTools", "model", "permissionMode",
    "maxTurns", "autoCompactWindow", "skills", "mcpServers", "hooks", "memory",
    "background", "omitClaudeMd", "effort", "isolation", "color", "initialPrompt",
    "experimental",
}
SKILL_FIELDS = {
    "name", "description", "when_to_use", "argument-hint", "arguments",
    "disable-model-invocation", "user-invocable", "allowed-tools",
    "disallowed-tools", "model", "effort", "context", "agent", "background",
    "hooks", "paths", "shell", "metadata", "license", "compatibility",
}
COLORS = {"red", "blue", "green", "yellow", "purple", "orange", "pink", "cyan"}
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ROSTER_RE = re.compile(r"<!--\s*roster:(.*?)-->", re.S)
JOB_RE = re.compile(r"^\*\*Job:\*\*\s*(.+)$", re.M)
UNESCAPED_ARG_RE = re.compile(r"(?<!\\)\$(?:\d|ARGUMENTS)")
SHELL_INJECT_RE = re.compile(r"!`")

DOMAIN_ORDER = [
    "Strategy & Leadership", "Concept & Product", "Real Estate & Development",
    "Finance", "Legal & Compliance", "Operations", "Marketing & Sales",
    "Technology & Data", "Risk", "Team",
]
CATEGORY_ORDER = [
    "Foundation", "Research", "Finance", "Product", "Legal & Compliance",
    "Real Estate", "Operations", "Marketing", "Technology", "Risk", "Workflow",
]


def split_frontmatter(text: str):
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---", 4)
    if end == -1:
        return None, text
    raw = text[4:end]
    body = text[end + 4:].lstrip("\n")
    return yaml.safe_load(raw) or {}, body


def as_list(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [v.strip() for v in re.split(r",(?![^()]*\))", value) if v.strip()]
    return [str(v).strip() for v in value]


def load_agents(errors):
    agents = {}
    for path in sorted(AGENTS_DIR.glob("**/*.md")):
        rel = path.relative_to(ROOT)
        try:
            fm, body = split_frontmatter(path.read_text())
        except yaml.YAMLError as exc:
            errors.append(f"{rel}: YAML does not parse: {exc}")
            continue
        if fm is None:
            errors.append(f"{rel}: frontmatter must start with '---' on line 1")
            continue
        name = fm.get("name")
        if not name:
            errors.append(f"{rel}: missing required 'name'")
            continue
        meta = {}
        m = ROSTER_RE.search(body)
        if m:
            for part in m.group(1).split("|"):
                if "=" in part:
                    k, v = part.split("=", 1)
                    meta[k.strip()] = v.strip()
        job = JOB_RE.search(body)
        agents[name] = {
            "path": rel, "fm": fm, "body": body, "meta": meta,
            "job": job.group(1).strip() if job else "",
        }
    return agents


def load_skills(errors):
    skills = {}
    for d in sorted(p for p in SKILLS_DIR.iterdir() if p.is_dir()):
        path = d / "SKILL.md"
        rel = path.relative_to(ROOT)
        if not path.exists():
            errors.append(f"{d.relative_to(ROOT)}: missing SKILL.md")
            continue
        text = path.read_text()
        try:
            fm, body = split_frontmatter(text)
        except yaml.YAMLError as exc:
            errors.append(f"{rel}: YAML does not parse: {exc}")
            continue
        if fm is None:
            errors.append(f"{rel}: frontmatter must start with '---' on line 1")
            continue
        skills[d.name] = {"path": rel, "fm": fm, "body": body, "text": text,
                          "meta": fm.get("metadata") or {}}
    return skills


def orchestrator_targets(fm) -> list[str] | None:
    for tool in as_list(fm.get("tools")):
        m = re.fullmatch(r"(?:Agent|Task)\((.*)\)", tool)
        if m:
            return [t.strip() for t in m.group(1).split(",") if t.strip()]
    return None


def validate(agents, skills, errors, warnings):
    # --- agents
    n = len(agents)
    if not MIN_AGENTS <= n <= MAX_AGENTS:
        errors.append(f"team has {n} agents; target is {MIN_AGENTS}-{MAX_AGENTS}")
    ids, desc_chars = {}, 0
    for name, a in agents.items():
        fm, rel = a["fm"], a["path"]
        if not NAME_RE.match(name) or len(name) > 256:
            errors.append(f"{rel}: name '{name}' must be lowercase-hyphenated, no ':'")
        if rel.stem != name:
            warnings.append(f"{rel}: filename differs from name '{name}'")
        desc = fm.get("description")
        if not desc:
            errors.append(f"{rel}: missing required 'description'")
        else:
            desc_chars += len(desc)
            if len(desc) > 600:
                warnings.append(f"{rel}: description is {len(desc)} chars; keep it short")
        for key in fm:
            if key not in AGENT_FIELDS:
                warnings.append(f"{rel}: unknown frontmatter field '{key}' (ignored by Claude Code)")
        color = fm.get("color")
        if color and color not in COLORS:
            errors.append(f"{rel}: color '{color}' not in {sorted(COLORS)}")
        listed = as_list(fm.get("skills"))
        if len(set(listed)) > MAX_PRELOADED_SKILLS:
            errors.append(f"{rel}: {len(set(listed))} skills; only the first {MAX_PRELOADED_SKILLS} preload")
        if len(listed) != len(set(listed)):
            warnings.append(f"{rel}: duplicate entries in skills")
        for s in listed:
            if s not in skills:
                errors.append(f"{rel}: skill '{s}' does not exist in .claude/skills/")
            elif skills[s]["fm"].get("disable-model-invocation") is True:
                errors.append(f"{rel}: skill '{s}' sets disable-model-invocation and cannot be preloaded")
        for k in ("id", "title", "domain", "docs", "persona"):
            if not a["meta"].get(k):
                errors.append(f"{rel}: roster comment missing '{k}' (<!-- roster: id=.. | title=.. | domain=.. | docs=.. | persona=.. -->)")
        model = fm.get("model")
        if not model:
            errors.append(f"{rel}: no 'model' set (choose opus, sonnet or haiku and explain it in docs/agent-brains.md)")
        elif model not in MODELS and not str(model).startswith("claude-"):
            errors.append(f"{rel}: model '{model}' is not a known alias or claude-* ID")
        if "## Persona" not in a["body"]:
            errors.append(f"{rel}: missing '## Persona' section")
        kdir = KNOWLEDGE_DIR / name
        if not (kdir / "README.md").exists():
            errors.append(f"knowledge/{name}/README.md is missing")
        if f"knowledge/{name}/" not in a["body"]:
            errors.append(f"{rel}: prompt must tell the agent to read knowledge/{name}/ first")
        if not a["job"]:
            errors.append(f"{rel}: missing '**Job:** ...' line")
        aid = a["meta"].get("id")
        if aid:
            if aid in ids:
                errors.append(f"{rel}: roster id {aid} also used by {ids[aid]}")
            ids[aid] = name
        if name != ORCHESTRATOR:
            tools = as_list(fm.get("tools"))
            disallowed = as_list(fm.get("disallowedTools"))
            if "Agent" not in disallowed and not (tools and not any(t.startswith("Agent") for t in tools)):
                warnings.append(f"{rel}: can spawn subagents; experts should set 'disallowedTools: Agent'")
    tokens = desc_chars // 4
    if tokens > DESC_TOKEN_BUDGET:
        errors.append(f"agent descriptions ≈{tokens} tokens exceed the {DESC_TOKEN_BUDGET}-token budget")

    # --- orchestrator wiring
    if ORCHESTRATOR not in agents:
        errors.append("orchestrator agent is missing")
    else:
        targets = orchestrator_targets(agents[ORCHESTRATOR]["fm"])
        if targets is None:
            errors.append("orchestrator: 'tools' must include Agent(<expert names>)")
        else:
            expected = set(agents) - {ORCHESTRATOR}
            for missing in sorted(expected - set(targets)):
                errors.append(f"orchestrator: '{missing}' missing from its Agent(...) list")
            for extra in sorted(set(targets) - set(agents)):
                errors.append(f"orchestrator: Agent(...) lists unknown agent '{extra}'")

    # --- skills
    used_by = {s: [] for s in skills}
    for name, a in agents.items():
        for s in as_list(a["fm"].get("skills")):
            if s in used_by:
                used_by[s].append(name)
    sids = {}
    for sname, s in skills.items():
        fm, rel, meta = s["fm"], s["path"], s["meta"]
        if not NAME_RE.match(sname):
            errors.append(f"{rel}: directory name '{sname}' must be lowercase-hyphenated")
        if fm.get("name") and fm["name"] != sname:
            errors.append(f"{rel}: name '{fm['name']}' should equal directory '{sname}'")
        desc = (fm.get("description") or "") + (fm.get("when_to_use") or "")
        if not fm.get("description"):
            errors.append(f"{rel}: missing description")
        elif len(desc) > SKILL_DESC_LIMIT:
            errors.append(f"{rel}: description + when_to_use is {len(desc)} chars (> {SKILL_DESC_LIMIT})")
        for key in fm:
            if key not in SKILL_FIELDS:
                warnings.append(f"{rel}: unknown frontmatter field '{key}' (ignored by Claude Code)")
        for k in ("id", "title", "category", "summary"):
            if not meta.get(k):
                errors.append(f"{rel}: metadata.{k} missing")
        sid = meta.get("id")
        if sid:
            if sid in sids:
                errors.append(f"{rel}: metadata.id {sid} also used by {sids[sid]}")
            sids[sid] = sname
        workflow = meta.get("category") == "Workflow"
        for lineno, line in enumerate(s["text"].splitlines(), 1):
            for m in UNESCAPED_ARG_RE.finditer(line):
                if workflow and m.group(0) == "$ARGUMENTS":
                    continue
                errors.append(f"{rel}:{lineno}: unescaped '{m.group(0)}' will be substituted; write '\\{m.group(0)}'")
            if SHELL_INJECT_RE.search(line):
                errors.append(f"{rel}:{lineno}: '!`' runs a shell command at load time")
        if len(s["text"].splitlines()) > 500:
            warnings.append(f"{rel}: over 500 lines; move reference material to sibling files")
        if workflow:
            if fm.get("context") == "fork" and fm.get("agent") and fm["agent"] not in agents:
                errors.append(f"{rel}: agent '{fm['agent']}' does not exist")
        elif not used_by[sname]:
            errors.append(f"{rel}: not used by any agent (add it to an agent's skills or delete it)")

    # --- brains table matches agent files
    if not BRAINS.exists():
        errors.append("docs/agent-brains.md is missing")
    else:
        brains = {}
        for line in BRAINS.read_text().splitlines():
            m = re.match(r"\|\s*`([a-z0-9-]+)`\s*\|\s*\*\*(.+?)\*\*\s*\|\s*([\w.-]+)\s*\|", line)
            if m:
                brains[m.group(1)] = (m.group(2), m.group(3))
        for name, a in agents.items():
            if name not in brains:
                errors.append(f"docs/agent-brains.md: no row for '{name}'")
                continue
            persona, model = brains[name]
            if model != str(a["fm"].get("model")):
                errors.append(f"docs/agent-brains.md: '{name}' brain is {model} but its file says {a['fm'].get('model')}")
            if persona != a["meta"].get("persona"):
                errors.append(f"docs/agent-brains.md: '{name}' name is {persona} but its file says {a['meta'].get('persona')}")
        for extra in sorted(set(brains) - set(agents)):
            errors.append(f"docs/agent-brains.md: row for unknown agent '{extra}'")

    # --- routing directory covers every agent
    if ROUTING_SKILL in skills:
        text = skills[ROUTING_SKILL]["text"]
        for name in agents:
            if name != ORCHESTRATOR and f"`{name}`" not in text:
                errors.append(f"{ROUTING_SKILL}: agent '{name}' is missing from the directory table")
    else:
        errors.append(f"skill '{ROUTING_SKILL}' is missing")
    return used_by, tokens


def sort_key(order, value):
    return (order.index(value) if value in order else len(order), value)


def build_roster(agents, skills, used_by) -> str:
    def aid(n):
        return agents[n]["meta"].get("id", "A99")

    names = sorted(agents, key=aid)
    title = {n: agents[n]["meta"].get("title", n) for n in names}
    domain_skills = [s for s in skills if skills[s]["meta"].get("category") != "Workflow"]
    workflow = [s for s in skills if skills[s]["meta"].get("category") == "Workflow"]
    shared_all = [s for s in domain_skills if len(used_by[s]) == len(agents)]
    domains = sorted({agents[n]["meta"].get("domain", "") for n in names},
                     key=lambda d: sort_key(DOMAIN_ORDER, d))

    L = []
    w = L.append
    w("# Expert Agent Roster: Upscale Brunch Restaurant, Tampa FL")
    w("")
    w("<!-- GENERATED by `python3 tools/team.py roster` from .claude/agents and .claude/skills. "
      "Do not edit by hand; edit the agent/skill files and regenerate. -->")
    w("")
    w("Built from the research pack in this folder (see [README.md](README.md)). Every role below is a "
      "Claude Code project subagent in `.claude/agents/<name>.md`, and every skill is a project skill in "
      "`.claude/skills/<name>/SKILL.md`. Each agent preloads its skills through the `skills:` field in its "
      "frontmatter, reads its own `knowledge/<name>/` folder before answering, and runs on the model (\"brain\") "
      "explained in [agent-brains.md](agent-brains.md). See [../CLAUDE.md](../CLAUDE.md) for how to use the team.")
    w("")
    w(f"**{len(agents)} agents** across {len(domains)} domains, **{len(domain_skills)} shared skills**, "
      f"and **{len(workflow)} entry-point commands**.")
    w("")
    w("## 1. Agents")
    w("")
    for d in domains:
        w(f"### {d}")
        w("")
        w("| ID | Agent (`name`) | Name | Brain | One-line job description | Primary docs |")
        w("|---|---|---|---|---|---|")
        for n in names:
            if agents[n]["meta"].get("domain") == d:
                m = agents[n]["meta"]
                w(f"| {m.get('id')} | **{title[n]}** (`{n}`) | {m.get('persona', '')} | {agents[n]['fm'].get('model', '')} | "
                  f"{agents[n]['job']} | {m.get('docs', '')} |")
        w("")
    w("## 2. Skills and the agents that use them")
    w("")
    w("Each skill is defined once and preloaded into every agent listed under **Used by**.")
    w("")
    cats = sorted({skills[s]["meta"].get("category", "") for s in domain_skills},
                  key=lambda c: sort_key(CATEGORY_ORDER, c))
    for c in cats:
        w(f"### {c}")
        w("")
        w("| ID | Skill (`name`) | What it covers | Used by | # |")
        w("|---|---|---|---|---|")
        rows = sorted((s for s in domain_skills if skills[s]["meta"].get("category") == c),
                      key=lambda s: skills[s]["meta"].get("id", ""))
        for s in rows:
            m = skills[s]["meta"]
            users = sorted(used_by[s], key=aid)
            if s in shared_all:
                who = "**All agents**"
            else:
                who = ", ".join(f"{aid(u)} `{u}`" for u in users)
            w(f"| {m.get('id')} | **{m.get('title')}** (`{s}`) | {m.get('summary')} | {who} | {len(users)} |")
        w("")
    w("## 3. Skills by agent")
    w("")
    w("| ID | Agent | Preloaded skills | # |")
    w("|---|---|---|---|")
    for n in names:
        listed = as_list(agents[n]["fm"].get("skills"))
        w(f"| {aid(n)} | `{n}` | " + ", ".join(f"`{s}`" for s in listed) + f" | {len(listed)} |")
    w("")
    w("## 4. Entry-point commands")
    w("")
    w("| Command | What it does | Runs as |")
    w("|---|---|---|")
    for s in sorted(workflow, key=lambda s: skills[s]["meta"].get("id", "")):
        fm = skills[s]["fm"]
        hint = f" {fm['argument-hint']}" if fm.get("argument-hint") else ""
        w(f"| `/{s}{hint}` | {skills[s]['meta'].get('summary')} | `{fm.get('agent', 'main')}` subagent |")
    w("")
    w("## 5. How the team works together")
    w("")
    w("- **Orchestrated panels:** the `orchestrator` takes a question, picks 2-6 experts with the "
      "`expert-routing` skill, runs them in parallel, adds a cross-review round when they conflict, and "
      "returns one combined answer (`panel-synthesis`).")
    w("- **Mandatory reviewers:** money questions go to `fpa-analyst`; seats, square footage, site or "
      "alcohol questions go to `liquor-zoning-attorney`; material downside goes to `risk-insurance-advisor`; "
      "pay or tips go to `labor-law-advisor`; go/no-go questions go to `engagement-lead`.")
    w("- **No deep nesting:** experts set `disallowedTools: Agent`, so only the orchestrator delegates. "
      "This stays within Claude Code's limit of 3 subagent levels.")
    w("- **Self-maintaining:** the `meta-agent` creates and improves agents and skills, then runs "
      "`python3 tools/team.py validate` and `roster` to keep this file in sync.")
    w("- **Go/no-go gates** (from [09-risks.md](09-risks.md)) are run by `engagement-lead`.")
    w("")
    return "\n".join(L)


def main(argv):
    cmd = argv[1] if len(argv) > 1 else "validate"
    errors, warnings = [], []
    agents = load_agents(errors)
    skills = load_skills(errors)
    used_by, tokens = validate(agents, skills, errors, warnings)
    roster = build_roster(agents, skills, used_by)

    if cmd == "roster":
        if errors:
            print("Refusing to write the roster while validation has errors:")
            for e in errors:
                print(f"  ERROR {e}")
            return 1
        ROSTER.write_text(roster)
        print(f"wrote {ROSTER.relative_to(ROOT)}: {len(agents)} agents, {len(skills)} skills")
        return 0

    if cmd != "validate":
        print(__doc__)
        return 2
    if not ROSTER.exists() or ROSTER.read_text() != roster:
        errors.append("docs/expert-roster.md is out of date; run: python3 tools/team.py roster")
    for wmsg in warnings:
        print(f"WARN  {wmsg}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"\n{len(agents)} agents, {len(skills)} skills, agent descriptions ≈{tokens} tokens; "
          f"{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
