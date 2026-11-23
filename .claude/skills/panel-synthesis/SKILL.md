---
name: panel-synthesis
description: Combine several expert memos into one answer - find agreement, surface and resolve conflicts, weigh evidence, and produce a single recommendation with attribution. Use when two or more experts have contributed to the same question or when running a go/no-go gate review.
metadata:
  id: S03
  title: Panel Synthesis & Decision Memos
  category: Foundation
  summary: Resolve conflicting expert outputs into one recommendation, run go/no-go gate reviews, and record decisions.
---

# Panel Synthesis & Decision Memos

## Procedure

1. **Line up the bottom lines.** Put each expert's bottom line side by side. Note where they agree.
2. **Find the conflicts.** For each disagreement, classify it:
   - *Factual*: the experts used different numbers. Go back to the docs or the source and pick the better-sourced figure.
   - *Assumption*: they assumed different scenarios. Make the assumption explicit and show the answer under each.
   - *Values / trade-off*: e.g., brand impact vs. cost. Don't hide it. Present the trade-off and recommend one option, with the reason.
3. **Apply the house checks:**
   - Money: does the finance expert's view support it? Is prime cost still ≤62-65% and occupancy ≤10% of conservative-case sales?
   - Risk: which items in `docs/09-risks.md` move, and in which direction?
   - Critical path: does it touch liquor licensing, zoning or the lease? If so, the liquor/zoning attorney's view controls feasibility.
4. **Decide.** Give one recommendation. If the evidence is genuinely balanced, say so and name the single fact that would tip it.
5. **Attribute.** Credit the key points to the experts who made them, so the consultant can follow up.

## Combined answer format

```
# <Question, restated>

**Answer:** <1-3 sentences>

**Recommendation and rationale:** <short paragraphs or bullets, with attributions like (FP&A) or (Liquor & Zoning)>

**Where the experts disagreed and how it was resolved:** <bullets; write "None material" if there were none>

**Numbers that matter:** <table if useful; label Estimate/Verify>

**Risks:** <net effect on the risk register>

**Open items and next steps:** <owner (expert) + action>

**Experts consulted:** <list>
```

## Go/no-go gate reviews

These gates come from `docs/09-risks.md`. Score each criterion Pass / Fail / Unknown, with evidence. The gate passes only when every criterion passes. "Unknown" counts as not yet passed.

- **Site gate:** alcohol-zoning path confirmed, flood zone and insurance quote acceptable, occupancy ≤10% of conservative-case sales.
- **Capital gate:** fully funded through opening plus a 6-month reserve and a 15% contingency.
- **Concept gate:** a clear point of difference, validated by guest testing or pop-ups.
- **Team gate:** a GM and an Executive Chef with upscale, high-volume brunch experience are signed.

## Recording decisions

When the consultant makes a decision, append it to `docs/decision-log.md` in that file's format: date, decision, rationale, decided by, affected docs.
