---
name: financial-modeling
description: Build and stress-test the restaurant P&L, cash-flow, break-even and sensitivity models (conservative/base/strong) for the Tampa brunch concept. Use whenever a question involves revenue, margins, profitability, payback, or comparing financial scenarios.
metadata:
  id: S08
  title: Financial Modeling & Scenario Analysis
  category: Finance
  summary: Build and stress-test P&L, cash-flow, break-even and sensitivity models (conservative/base/strong).
---

# Financial Modeling & Scenario Analysis

## Baseline model (from docs/05-operating-costs.md)

| Driver | Conservative | Base | Strong |
|---|---|---|---|
| Weekend covers/week (Sat+Sun) | 600 | 800 | 1,000 |
| Weekday covers/week | 450 | 650 | 900 |
| Average check | \$38 | \$44 | \$50 |
| Events/year | \$60K | \$150K | \$250K |
| Retail pastry/coffee/year | \$40K | \$100K | \$180K |
| **Annual sales** | **≈\$2.17M** | **≈\$3.57M** | **≈\$5.37M** |

Base-case P&L:
- Cost of goods 27%, labor 34%, so **prime cost 61%**.
- Rent + NNN about \$280K (7.8%), utilities 3.5%, marketing 3%, insurance about \$60K, card fees 2.8%, other 7.5%.
- **EBITDA ≈12.6% (≈\$452K)**.
- Debt service ≈\$238K/yr on \$1.5M (10 years, about 10%).

Break-even: about \$2.0-2.2M/yr at the EBITDA level, and about \$2.4-2.7M/yr after debt service.

## Procedure

1. Start from the baseline. Change only the drivers the question concerns, and list every change.
2. Separate fixed costs (rent, salaried management, insurance, base utilities) from variable costs (cost of goods, hourly labor, card fees, supplies).
3. Always show all three scenarios. Decisions must survive the **conservative** case.
4. Build a monthly cash flow, not just an annual one. Apply seasonality: January-April about 115-120% of average, June-September about 80-85%. Treat year 1 as cash-negative until ramp-up.
5. Run a sensitivity on the five biggest swing factors: weekend covers, average check, labor %, rent, and weekday covers.
6. Report: sales, prime cost %, EBITDA \$ and %, cash flow after debt, break-even, months of reserve consumed, and the sales-to-investment ratio (target ≥1.5:1 by year 2).

## Guardrails

- Prime cost ≤62-65%. Occupancy ≤8-10% of sales. Restaurant EBITDA target 8-14%.
- Florida minimum wage is \$15.00 (tipped \$11.98) since 9/30/2026, inflation-indexed from 9/30/2027. Model annual wage growth of about 3-4% thereafter.
- Sales tax (7.5% in Hillsborough) is collected from guests. It is **not** revenue or a cost.
- Label every changed input **Estimate** unless it comes from a quote.

## Output

Scenario table, key ratios, the arithmetic for any changed figure, and a one-line verdict ("pays back in N years under base; fails under conservative because ...").
