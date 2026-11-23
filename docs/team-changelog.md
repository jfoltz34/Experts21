# Team Changelog

Changes to the expert agents (`.claude/agents/`) and skills (`.claude/skills/`). The `meta-agent` appends an entry for every change. Git history has the line-level detail.

| Date | Change | Why | By |
|---|---|---|---|
| 2026-11-23 | Initial team: 26 roster experts + `orchestrator` + `meta-agent` (28 agents); 37 shared skills + `/ask-experts` and `/improve-team` commands; `tools/team.py` validator and roster generator | Turn docs/expert-roster.md into working Claude Code subagents and skills | Initial build |
| 2026-11-23 | Added `knowledge/<agent>/` folders (with READMEs) and a read-it-first instruction for every agent; set `model` per agent (11 opus, 14 sonnet, 3 haiku); gave every agent a persona (first name, voice, working style); added `docs/agent-brains.md`; validator now enforces all of these | Let the consultant feed each expert its own documents, match model cost to task difficulty, and make experts distinct and easy to address | Consultant request |
