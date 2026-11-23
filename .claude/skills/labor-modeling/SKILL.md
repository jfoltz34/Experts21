---
name: labor-modeling
description: Forecast staffing needs by daypart from covers and reservations, build schedules, and manage labor percentage, sales per labor hour and labor dollars per cover. Use for staffing levels, scheduling, labor-cost or overtime questions.
metadata:
  id: S24
  title: Labor Modeling & Scheduling
  category: Operations
  summary: Forecast staffing by daypart from reservation data and manage labor %, SPLH and labor $ per cover.
---

# Labor Modeling & Scheduling

## Targets (from docs/05-operating-costs.md and 07-staffing.md)

- Total labor 32-36% of sales, including salaried staff, payroll taxes and benefits.
- Sales per labor hour (SPLH) of \$55-70 or more. Labor \$9-12 per cover.
- Headcount about 55-70 people (35-45 FTE). Weekend shifts need about 2× the weekday staffing.
- Florida wages: \$15.00 minimum, \$11.98 tipped cash wage. Payroll taxes and workers' comp add about 10-12%.

## Staffing ratios (weekend peak, Estimates)

| Role | Ratio / count |
|---|---|
| Servers | 1 per 4-5 tables (≈18-24 guests) |
| Server assistants / runners | 1 per 2 servers |
| Bartenders | 1 per ~60-80 drinks/hour at peak, plus a barback |
| Hosts | 2-3 at peak (door, waitlist, phones) |
| Line cooks | By station: egg ×2, griddle, grill, garde-manger, fry/pass, plus expo |
| Dish | 2-3 at peak |
| Managers | 2 FOH + 1-2 kitchen at peak |

## Procedure

1. Forecast covers by 30-minute interval from reservations plus a walk-in history factor, by day of week and season.
2. Convert covers to labor hours by role using the ratios. Add opening and closing side work.
3. Price the hours at wage rates. Compute labor %, SPLH and labor \$ per cover. Compare to targets.
4. Shape the schedule:
   - Stagger starts and cuts.
   - Use part-timers for weekend peaks.
   - Cap full-timers at 40 hours unless overtime is approved.
   - Consider closing slow weekdays (e.g., Monday and Tuesday) if weekday SPLH stays below target.
5. Review each week: actual vs. scheduled hours, overtime, and labor % by day.

## Output

Staffing grid by role and interval, weekly hours and cost, KPI comparison, and recommended changes.
