---
name: market-data-analysis
description: Analyze Tampa demographic, income, tourism and foot-traffic data to size brunch demand by neighborhood and compare candidate locations. Use for market sizing, neighborhood comparisons, or demand-side questions.
metadata:
  id: S05
  title: Demographic & Market Data Analysis
  category: Research
  summary: Analyze Census/ACS, income, tourism (bed-tax) and foot-traffic data to size demand by neighborhood.
---

# Demographic & Market Data Analysis

## Baseline facts (from docs/01-market-overview.md)

- City of Tampa: 413,554 people (July 2025), up 7.3% since 2020; about 166K households, 2.2 persons per household.
- Metro division: about 2.47M people; median household income about \$84.7K.
- City median household income is \$75.5K-\$84.1K (depending on source). About 16% of households earn \$200K+, the largest single bracket.
- Median age about 36.
- Tourism: Hillsborough FY2025 taxable hotel revenue was over \$1.2B (a record). Downtown visitors' median household income is about \$92K.
- Fastest-growing urban ZIP: 33602, downtown (+13.5% projected over 5 years).

## Procedure for comparing neighborhoods or sites

1. Define the trade area: about a 10-15 minute drive, or a 1-mile walk in dense areas.
2. Pull for each trade area: population, households, \$100K+ and \$200K+ household share, median age, daytime population (offices), hotel rooms, and the count of competing upscale brunch seats.
3. Score demand drivers: affluent households, young professionals, visitors, office workers (weekday), and event venues.
4. Score supply: competitor count and quality (from `docs/03-competitors.md`), plus parking.
5. Convert to covers: households × participation rate × monthly occasions × party size. State every assumption and run a low/base/high range.
6. Compare the result with the covers the reference concept needs: about **600-900 weekend covers** (Sat + Sun) and **450-900 weekday covers** per week (see 05-operating-costs.md).

## Rules of thumb

- Weekend upscale brunch draws from a wider radius (destination), while weekday business draws only from walking or short-drive distance.
- Visitor demand concentrates downtown, on Water Street and in the Channel District. Locals concentrate in South Tampa, Hyde Park and SoHo.
- Seasonality: model January-April at about 115-120% of average and June-September at about 80-85%.

## Output

A comparison table (one row per area) plus a short verdict. Label any estimated inputs **Estimate**.
