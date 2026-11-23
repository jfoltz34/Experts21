---
name: improve-team
description: Ask the meta agent to create a new expert or skill, or improve existing ones, then validate the team and regenerate the roster.
argument-hint: "[what to add or improve]"
disable-model-invocation: true
context: fork
agent: meta-agent
background: false
allowed-tools: Bash(python3 tools/team.py *)
metadata:
  id: W02
  title: Improve the Team
  category: Workflow
  summary: Entry point that hands a team change request to the meta agent, which edits agents and skills and re-validates.
---

The consultant wants this change to the expert team:

$ARGUMENTS

Handle it as the meta agent. Follow the team-authoring skill:

1. Check for overlap with existing agents and skills.
2. Write or edit the files.
3. Wire them into expert-routing, the orchestrator and CLAUDE.md as needed.
4. Run `python3 tools/team.py validate` until it passes.
5. Run `python3 tools/team.py roster`.
6. Log the change in docs/team-changelog.md.
7. Report what changed.

If no change was given, run `python3 tools/team.py validate`, review the team for gaps, overlaps and weak prompts, and propose the three most valuable improvements without making them.
