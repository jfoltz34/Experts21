# Experts21: Expert Team for an Upscale Brunch Restaurant in Tampa, FL

This repository is a working **team of expert AI agents** that advises a consultant on opening an upscale brunch restaurant in Tampa, Florida. It contains:

- `docs/`: the research pack (market, customers, competitors, costs, permits, staffing, marketing, risks), the expert roster, the decision log and the team changelog.
- `.claude/agents/`: 28 project subagents. There are 26 domain experts, plus an orchestrator and a meta agent.
- `.claude/skills/`: 39 project skills. 37 are shared knowledge and procedure skills preloaded into the agents, and 2 are commands you type.
- `tools/team.py`: validates the team and regenerates `docs/expert-roster.md`.

## How to use the team

| You want to... | Do this |
|---|---|
| Ask a question that needs several experts | `/ask-experts <question>`, or "Ask the orchestrator: ..." |
| Ask one specific expert | "Use the fpa-analyst agent to ...", or `@agent-fpa-analyst ...` |
| Make the whole session the orchestrator | `claude --agent orchestrator` |
| Add or improve an expert or skill | `/improve-team <request>`, or "Use the meta-agent to ..." |
| Check the team is valid | `python3 tools/team.py validate` |
| Regenerate the roster after changes | `python3 tools/team.py roster` |

The **orchestrator** works in five steps:
1. It reads the question and `docs/decision-log.md`.
2. It picks 2-6 experts, including mandatory reviewers (money goes to `fpa-analyst`; seats, site or alcohol go to `liquor-zoning-attorney`; downside goes to `risk-insurance-advisor`; pay goes to `labor-law-advisor`; go/no-go goes to `engagement-lead`).
3. It runs the experts in parallel.
4. It runs a cross-review round if they disagree.
5. It returns one combined answer that says who said what, where the experts disagreed, the numbers (with Estimate/Verify labels), the risks, and the next steps.

Example questions:
- "Should we take the former Rome + Fig space at 301 N Rome Ave?"
- "Can we offer bottomless mimosas without risking the SRX license?"
- "Build a menu and price list that hits a $44 average check."
- "How do we make weekdays profitable?"
- "Are we ready to pass the Capital gate?"

## The team

| Domain | Agents |
|---|---|
| Strategy & Leadership | `engagement-lead`, `market-analyst`, `competitive-intel-analyst`, `brand-strategist` |
| Concept & Product | `culinary-director`, `beverage-director` |
| Real Estate & Development | `real-estate-advisor`, `design-construction-manager`, `foodservice-designer` |
| Finance | `fpa-analyst`, `capital-advisor`, `tax-accounting-advisor` |
| Legal & Compliance | `liquor-zoning-attorney`, `permitting-specialist`, `labor-law-advisor`, `corporate-counsel` |
| Operations | `operations-director`, `hr-talent-lead`, `food-safety-specialist`, `procurement-specialist` |
| Marketing & Sales | `marketing-pr-director`, `digital-social-strategist`, `events-sales-manager` |
| Technology & Data | `tech-architect`, `bi-analyst` |
| Risk | `risk-insurance-advisor` |
| Team | `orchestrator` (routes questions and combines answers), `meta-agent` (builds and improves agents and skills) |

`docs/expert-roster.md` has every agent's job description, every skill, and which agents use each skill.

## Project rules (apply to every agent and to the main session)

1. **Ground answers in `docs/`.** Respect the **Estimate** and **Verify** labels. Facts are current as of November 2026. Check `docs/decision-log.md` before recommending anything, and record new consultant decisions there.
2. **Stay consistent with the reference concept** in `docs/README.md` (about 160 seats, about 4,000 sq ft, daytime brunch, full bar), unless the decision log changes it.
3. **Every recommendation names the risks it affects** in `docs/09-risks.md`, and must survive the **conservative** financial case.
4. **Legal, tax and insurance outputs are advisory.** They must say a licensed professional should confirm.
5. **Keep everything in this project.** Agents and skills live only in `.claude/agents/` and `.claude/skills/`, never in `~/.claude/`.
6. **Don't hand-edit `docs/expert-roster.md`.** It is generated. Edit the agent and skill files, then run `python3 tools/team.py roster`.

## Conventions for agents and skills (summary; full rules in `.claude/skills/team-authoring/SKILL.md`)

- **Agents:**
  - Frontmatter has `name`, a short `description`, `disallowedTools: Agent` (experts don't delegate), `skills:` (preloaded skills), and `color`.
  - The body starts with a roster comment (`<!-- roster: id=.. | title=.. | domain=.. | docs=.. -->`) and a `**Job:**` line.
- **Skills:**
  - The directory name equals `name`.
  - Frontmatter includes `metadata` with `id`, `title`, `category`, `summary`.
  - A dollar sign before a digit is escaped as `\$`, because skill bodies substitute `$0`, `$1`, ...
- **After any change:** wire it into `expert-routing` and the orchestrator's `Agent(...)` list, run `python3 tools/team.py validate`, then `roster`, and log it in `docs/team-changelog.md`.
- **Reference docs:** https://code.claude.com/docs/en/sub-agents and https://code.claude.com/docs/en/skills
