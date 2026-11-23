---
name: team-authoring
description: Conventions and procedure for creating or improving expert subagents in .claude/agents/ and skills in .claude/skills/ for this project - frontmatter rules from the official Claude Code docs, house templates, wiring, validation and roster regeneration. Use when adding, changing, splitting, merging or removing an agent or skill.
metadata:
  id: S37
  title: Agent & Skill Authoring
  category: Foundation
  summary: Create and improve subagents and skills following Claude Code rules and house conventions, then validate and regenerate the roster.
---

# Agent & Skill Authoring

Official references: https://code.claude.com/docs/en/sub-agents and https://code.claude.com/docs/en/skills. Re-read them (use `primary-source-research`) before relying on a field you haven't used before.

## Hard rules from the Claude Code docs

**Subagents** (`.claude/agents/<name>.md`)

- YAML frontmatter must start on line 1. `name` and `description` are required.
  - `name` uses lowercase letters and hyphens, has no `:`, doesn't start with `-`, and is unique.
  - Claude Code silently ignores unknown or misspelled fields. Field names are camelCase.
- `skills:` preloads the **full content** of each listed skill at startup. Up to 32 distinct names. A skill with `disable-model-invocation: true` can't be preloaded.
- `tools` is an allowlist and `disallowedTools` is a denylist. Omitting both inherits every tool, including MCP tools.
- Subagents can spawn subagents only if `Agent` is available to them, and only up to 3 levels below the main conversation.
- The body becomes the system prompt. The subagent does **not** see the parent conversation, only the delegation message, CLAUDE.md and its preloaded skills.
- Keep `description` short: combined descriptions over about 15,000 tokens trigger a startup warning. Put detail in the body.
- Other valid fields: `model`, `permissionMode`, `maxTurns`, `memory` (user/project/local), `effort`, `color` (red, blue, green, yellow, purple, orange, pink, cyan), `background`, `isolation`, `hooks`, `mcpServers`, `initialPrompt`, `omitClaudeMd`.

**Skills** (`.claude/skills/<skill-name>/SKILL.md`)

- The directory name is the command (`/skill-name`). `name` should equal the directory name.
- `description` is recommended. The key use case comes first. `description` + `when_to_use` is truncated at 1,536 characters.
- Other fields: `disable-model-invocation`, `user-invocable`, `allowed-tools`, `context: fork` + `agent`, `argument-hint`, `metadata` (a free-form map; this project uses it for roster data).
- In the body, the argument placeholders (dollar sign followed by ARGUMENTS, or by a digit such as 0 or 1) are substituted at load time. **Put a backslash before any dollar sign that is followed by a digit or by ARGUMENTS** when you mean it literally, e.g. a price written as backslash-dollar-15.00. `python3 tools/team.py validate` flags unescaped cases.
- A line starting with an exclamation mark followed by a backtick runs a shell command. Never write that pattern by accident.
- Keep SKILL.md under 500 lines. Move long reference material into sibling files and link to them.

## House conventions

**Expert agent template**

```
---
name: <kebab-name>
description: <Role> for the Tampa brunch project. <What it owns>. Use for <triggers>.
model: <opus|sonnet|haiku>    # see "Choosing a brain" below
disallowedTools: Agent        # experts don't spawn subagents
skills:
  - research-pack-navigation  # always
  - recommendation-memo       # always (experts)
  - <domain skills...>
color: <domain color>
---

<!-- roster: id=A<NN> | title=<Display Title> | domain=<Domain> | docs=<01, 05> | persona=<FirstName> -->
**Job:** <one-line job description used in docs/expert-roster.md>

## Persona

Your name is **<FirstName>**. Voice: <voice>. Working style: <style>.
Sign every memo as "<FirstName> (<Display Title>)". Let the personality shape tone, never accuracy.

## Always read your knowledge folder first

Before answering anything, list and read the documents in `knowledge/<kebab-name>/` ...

You are ... (background, mandate, ground truth, how you work, hand-offs, output)
```

- **Choosing a brain (`model`):**
  - `opus` for deep strategy, legal and finance judgment, and cross-expert synthesis.
  - `sonnet` for most specialist work.
  - `haiku` for fast, simple lookups and structured repetitive work. Haiku agents must hand judgment calls to a colleague.
- **Personas:** give each agent a unique first name, a voice and a working style. No two agents share a first name. Don't use real public figures.
- **Every agent needs:**
  - A row in `docs/agent-brains.md` (agent, name, brain, why, voice, working style).
  - A `knowledge/<kebab-name>/README.md` explaining what documents belong there.
  - A row in `knowledge/README.md`.
  - The validator checks the brains row, the README, and the knowledge-folder instruction.
- Domain colors: Strategy and Team purple, Concept orange, Real Estate yellow, Finance green, Legal and Risk red, Operations blue, Marketing pink, Technology cyan.
- Skill frontmatter must include `metadata` with `id` (S<NN>), `title`, `category`, `summary`. Workflow skills use category `Workflow`.
- Use the next free ID numbers. Never reuse a retired ID.

## Procedure: add or change an agent or skill

1. **Check for overlap.** Read `docs/expert-roster.md` and the existing agents and skills. Prefer improving or extending over adding. A new agent needs a distinct domain or a distinct way of working.
2. **Write the files** using the templates. Reuse existing skills where possible. A new skill should serve 2+ agents, or encode a clearly reusable procedure.
3. **Wire it up:**
   - Add the skill to each agent's `skills:` list.
   - Add a new agent to the **directory table and routing recipes** in `.claude/skills/expert-routing/SKILL.md`.
   - Add a new agent to the `Agent(...)` list in `.claude/agents/orchestrator.md`.
   - Create `knowledge/<name>/README.md` and add the agent to `knowledge/README.md`.
   - Add a row to `docs/agent-brains.md`. If you change a model or persona, update the row.
   - Update the team table in `CLAUDE.md` if the change affects how people use the team.
4. **Validate:** `python3 tools/team.py validate`. Fix every error.
5. **Regenerate the roster:** `python3 tools/team.py roster` (rewrites `docs/expert-roster.md`).
6. **Log the change** in `docs/team-changelog.md`: date, what changed, why.
7. **Report:** list the files changed, what was validated, and anything you couldn't verify.

## Quality bar for prompts

- Specific to this project: Tampa facts, the reference concept, and the relevant docs files.
- States the mandate, the boundaries (what to hand off, and to whom), and the output format.
- Bodies should be concise. Preloaded skill content already counts toward the context budget.
- Never delete or rename an agent or skill without the consultant's explicit approval. Propose it instead.
