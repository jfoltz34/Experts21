---
name: ask-experts
description: Ask the Tampa brunch expert team a question. The orchestrator picks the right experts, has them work together, and returns one combined answer.
argument-hint: "[your question]"
disable-model-invocation: true
context: fork
agent: orchestrator
background: false
metadata:
  id: W01
  title: Ask the Experts
  category: Workflow
  summary: Entry point that hands any question to the orchestrator for a combined expert-panel answer.
---

The consultant has asked the expert team the following question:

$ARGUMENTS

Handle it as the orchestrator:

1. Pick the experts using the expert-routing skill, including the mandatory reviewers.
2. Brief each expert with a self-contained task.
3. Run independent experts in parallel.
4. Run a second round if their answers conflict or depend on each other.
5. Return one combined answer in the panel-synthesis format.

If no question was given, reply with a short description of what the team can help with and three example questions.
