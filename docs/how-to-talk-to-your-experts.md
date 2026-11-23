# How to Talk to Your Experts

A quick guide to working with the expert team in this repository. Open Claude Code in the repo folder (`claude`) and use any of the patterns below. Everything here runs on the project's agents in `.claude/agents/` and skills in `.claude/skills/`. See [expert-roster.md](expert-roster.md) for the full list.

## 1. Ask the whole team

The **orchestrator** reads your question, picks the right experts (2-6 of them), runs them in parallel, has them cross-check each other if they disagree, and returns **one combined answer**.

**Option A: the slash command (most reliable)**

```
/ask-experts Should we take the former Rome + Fig space at 301 N Rome Ave?
```

**Option B: plain language**

```
Ask the expert team: what would it take to open by next October?
```

```
Have the orchestrator figure out whether our startup budget is realistic.
```

**Option C: @-mention the orchestrator**

```
@agent-orchestrator What's our biggest risk right now, and what should we do about it?
```

**Option D: make the whole session the orchestrator**

Every message in the session then goes to the panel:

```bash
claude --agent orchestrator
```

## 2. Ask one specific expert

Use this when the question clearly belongs to a single domain. You'll get that expert's memo directly, with no panel.

**Name the agent in plain language:**

```
Use the fpa-analyst agent to tell me how many weekday covers we need to break even.
```

```
Have the liquor-zoning-attorney explain the difference between a 4COP-SRX and a quota license.
```

**@-mention the agent.** Type `@` and pick it from the list, or type the name out:

```
@agent-culinary-director Draft five signature brunch dishes that use Florida ingredients.
```

```
@agent-risk-insurance-advisor Which coverages do we need before we sign a lease?
```

**Run a whole session as one expert:**

```bash
claude --agent fpa-analyst
```

> **Tip:** Agent names are lowercase with hyphens: `fpa-analyst`, `brand-strategist`, `events-sales-manager`, and so on. The full list is in the [CLAUDE.md](../CLAUDE.md) team table and in [expert-roster.md](expert-roster.md).

## 3. Example prompts that bring several experts together

Each of these spans several domains, so the orchestrator assembles a panel and coordinates one answer. The "likely panel" column shows who the routing rules should bring in. The orchestrator makes the final choice.

### Example 1: Site decision

```
/ask-experts We found a 3,800 sq ft second-generation restaurant space on South Howard
in SoHo at $52/sf plus $16 NNN, with 120 indoor seats and a 30-seat patio. Should we
make an offer, and what conditions should the LOI include?
```

**Likely panel:**

| Expert | What they'll look at |
|---|---|
| `real-estate-advisor` | Site and lease terms |
| `liquor-zoning-attorney` | Whether 150 seats including the patio and 2,500 sq ft qualify for SRX; alcohol special use |
| `permitting-specialist` | Historic district and flood issues |
| `risk-insurance-advisor` | Flood and wind insurance |
| `fpa-analyst` | Occupancy cost as a % of conservative sales |
| `market-analyst` | Demand in SoHo |

**Why it's a good test:** The square footage and seat count put it near the SRX thresholds, so expect a real debate between the legal and real estate experts.

### Example 2: Fixing weekdays

```
/ask-experts Weekday breakfast is weak in Tampa right now. Give me a plan to make Monday
to Friday profitable. Should we close some weekdays, push the pastry counter, chase
corporate breakfasts, or do something else?
```

**Likely panel:** `brand-strategist`, `culinary-director`, `events-sales-manager`, `marketing-pr-director`, `operations-director` (staffing and whether to close days), `fpa-analyst` (does each option pay?).

**Why it's a good test:** The options compete with each other. The finance and operations experts will push back on ideas that add labor without enough covers.

### Example 3: Menu, drinks and price

```
/ask-experts Design the opening brunch menu and drink list so we hit a $44 average check
with food cost under 30% and beverage cost under 22%, while keeping food at 60%+ of
sales for the SRX license. Show the top 10 items with prices.
```

**Likely panel:** `culinary-director`, `beverage-director`, `competitive-intel-analyst` (price benchmarks), `fpa-analyst` (check and margin math), `liquor-zoning-attorney` (SRX food ratio), `food-safety-specialist` (egg and hollandaise safety).

**Why it's a good test:** The culinary and beverage experts' outputs feed the finance expert's math, so expect a second cross-review round.

### Example 4: Go/no-go readiness

```
/ask-experts Run the Capital gate and the Site gate from the risk register. Are we ready
to commit money? If not, what's missing, who owns it, and what's the fastest path to a
"go"?
```

**Likely panel:** `engagement-lead` (runs the gates), `fpa-analyst`, `capital-advisor`, `real-estate-advisor`, `liquor-zoning-attorney`, `risk-insurance-advisor`.

**Why it's a good test:** It produces a Pass / Fail / Unknown scorecard for each gate, with owners and next actions. That's a good periodic check-in.

## 4. What a team answer looks like

The orchestrator returns one answer in this shape:

1. **Answer:** the bottom line in 1-3 sentences.
2. **Recommendation and rationale:** with attributions such as (FP&A) or (Liquor & Zoning).
3. **Where the experts disagreed:** and how it was resolved, or the trade-off if it wasn't.
4. **Numbers that matter:** labeled **Estimate** or **Verify**.
5. **Risks:** the net effect on the risk register in [09-risks.md](09-risks.md).
6. **Open items and next steps:** each with an owning expert.
7. **Experts consulted.**

## 5. Tips for better answers

- **Give specifics.** Square footage, seats, rent, prices and dates let the experts calculate instead of guess.
- **Say what you need back:** "under 300 words", "a table", "the top 3 options with a recommendation".
- **Record decisions.** When you decide something, say "log this decision": for example, "Log this decision: we're targeting Water Street only." The orchestrator adds it to [decision-log.md](decision-log.md), and every expert respects it from then on.
- **Follow up with one expert** when the team answer raises a deep question in a single domain. For example: "@agent-fpa-analyst show me the monthly cash flow for that option."
- **Legal, tax and insurance answers are advisory.** Confirm them with a licensed professional before acting.

## 6. Changing the team itself

To add an expert or improve one, ask the meta agent:

```
/improve-team Add a pastry and bakery operations expert who owns the retail counter.
```

```
/improve-team The beverage-director should know more about Florida craft breweries.
```

With no request, it reviews the team and proposes the three most valuable improvements:

```
/improve-team
```
