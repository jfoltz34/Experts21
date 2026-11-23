---
name: expert-routing
description: Directory of every expert agent on the Tampa brunch team, with routing recipes for common question types, mandatory reviewers, and the briefing template for delegating to an expert. Use when deciding which experts should answer a question or when planning work across the team.
metadata:
  id: S36
  title: Expert Routing & Team Directory
  category: Foundation
  summary: Pick the right experts for a question, apply mandatory reviewers, and brief each expert with a self-contained task.
---

# Expert Routing & Team Directory

## Directory

| Agent (`subagent_type`) | Domain | Bring in when the question involves |
|---|---|---|
| `engagement-lead` | Strategy | Engagement plan, priorities, go/no-go gate reviews, decision memos |
| `market-analyst` | Strategy | Market size, demographics, tourism, neighborhood demand |
| `competitive-intel-analyst` | Strategy | Competitors, price benchmarks, openings/closures, white space |
| `brand-strategist` | Strategy | Segments, personas, positioning, name, brand voice, guest promise |
| `culinary-director` | Concept | Menu, pastry/retail, recipe costing, kitchen-menu fit, chef hiring |
| `beverage-director` | Concept | Cocktails, carafes, wine, coffee, zero-proof, pour cost, bottomless, SRX mix |
| `real-estate-advisor` | Real estate | Site search and screening, flood/parking, lease business terms |
| `design-construction-manager` | Real estate | Architect/GC, build-out cost and schedule, construction risk |
| `foodservice-designer` | Real estate | Kitchen, bar and pastry layout, equipment, hoods, refrigeration, capacity |
| `fpa-analyst` | Finance | Budget, P&L, cash flow, break-even, scenarios, "does it pay?" |
| `capital-advisor` | Finance | SBA loans, investors, equity structure, lender/investor materials |
| `tax-accounting-advisor` | Finance | Sales tax, payroll/tip taxes, FICA tip credit, bookkeeping, close |
| `liquor-zoning-attorney` | Legal | Liquor license path, SRX, Tampa alcohol special use, distance waivers |
| `permitting-specialist` | Legal | DBPR food license, building/fire/sign/sidewalk permits, flood, historic, ADA, renewals |
| `labor-law-advisor` | Legal | Minimum/tipped wage, tip pools, service charges, overtime, E-Verify, minors |
| `corporate-counsel` | Legal | Entity, operating agreement, lease legal review, contracts, trademark, music licensing |
| `operations-director` | Operations | Steps of service, SOPs, daypart operations, pre-opening readiness |
| `hr-talent-lead` | Operations | Org chart, pay plan, recruiting, training, retention, culture |
| `food-safety-specialist` | Operations | HACCP, eggs/hollandaise/seafood safety, certifications, inspections |
| `procurement-specialist` | Operations | Vendors, local sourcing, pricing, par levels, inventory, cost of goods |
| `marketing-pr-director` | Marketing | Marketing plan and budget, PR, media, awards, partnerships |
| `digital-social-strategist` | Marketing | Instagram/TikTok, creators, Google profile, reviews, website, email/SMS |
| `events-sales-manager` | Marketing | Private dining, event packages, minimums, group sales pipeline |
| `tech-architect` | Technology | POS, KDS, reservations/CRM, scheduling, payroll, inventory systems |
| `bi-analyst` | Technology | KPIs, dashboards, performance analysis, data insights |
| `risk-insurance-advisor` | Risk | Risk register, insurance (wind/flood/liquor/BI), hurricane plan |
| `meta-agent` | Team | Creating a new expert or skill, or improving an existing one |

## Mandatory reviewers (add these on top of the topic experts)

- **Money involved** (cost, price, revenue, investment): add `fpa-analyst`.
- **Site, lease, or anything that changes seats or square footage:** add `liquor-zoning-attorney`, because SRX needs ≥150 seats and ≥2,500 sq ft of service area, and Tampa alcohol special use applies.
- **Alcohol program changes:** add `beverage-director` and `liquor-zoning-attorney`.
- **New recommendation with material downside:** add `risk-insurance-advisor`.
- **Go/no-go gate or "should we do this project?":** add `engagement-lead`.
- **Pay, tips or scheduling policy:** add `labor-law-advisor`.

## Routing recipes

| Question type | Experts |
|---|---|
| "Should we sign this site / which site?" | real-estate-advisor, liquor-zoning-attorney, permitting-specialist, risk-insurance-advisor, fpa-analyst, market-analyst |
| "How much will it cost to open / can we afford it?" | fpa-analyst, design-construction-manager, foodservice-designer, capital-advisor |
| "Design the menu / set prices" | culinary-director, beverage-director, competitive-intel-analyst, fpa-analyst, brand-strategist |
| "Liquor license / bottomless mimosas?" | liquor-zoning-attorney, beverage-director, risk-insurance-advisor, fpa-analyst |
| "When can we open?" | design-construction-manager, permitting-specialist, liquor-zoning-attorney, operations-director |
| "Staffing plan / hiring / pay" | hr-talent-lead, operations-director, labor-law-advisor, fpa-analyst |
| "Launch / marketing plan" | marketing-pr-director, digital-social-strategist, brand-strategist, events-sales-manager, fpa-analyst |
| "Fix weekday traffic" | brand-strategist, culinary-director, events-sales-manager, marketing-pr-director, operations-director, fpa-analyst |
| "Hurricane / insurance" | risk-insurance-advisor, operations-director, real-estate-advisor, fpa-analyst |
| "Tech stack / reporting" | tech-architect, bi-analyst, operations-director, fpa-analyst |
| "Is this project a go?" | engagement-lead, fpa-analyst, risk-insurance-advisor, market-analyst, liquor-zoning-attorney, capital-advisor |

**Panel size:** use 2-6 experts. One expert is fine for a narrow, single-domain question. More than 6 means the question should be split.

## Briefing template (experts don't see the conversation)

```
You are being consulted as <role> on the Tampa upscale-brunch project.
Question from the consultant: <verbatim question>
Context you need: <facts, decisions, constraints from the conversation and docs/decision-log.md>
Your specific task: <what this expert must answer; scope boundaries>
Other experts consulted: <list>, so stay in your lane and flag hand-offs.
Return: a recommendation memo (recommendation-memo skill), under ~400 words, with numbers labeled Estimate/Verify.
```
