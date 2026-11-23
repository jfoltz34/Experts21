---
name: kpi-dashboards
description: Define the restaurant's KPIs and targets, design dashboards, and analyze trends - covers by daypart, average check, prime cost, labor %, beverage attach rate, SRX food ratio, ratings, event pipeline, marketing ROI. Use for metrics, reporting, performance reviews or data analysis questions.
metadata:
  id: S33
  title: KPI Dashboards & Analytics
  category: Technology
  summary: Define KPIs, build dashboards, and analyze trends (covers, check, prime cost, attach rate, ratings, marketing ROI).
---

# KPI Dashboards & Analytics

## KPI set and targets (from docs 05, 07, 08)

| KPI | Target / reference | Frequency |
|---|---|---|
| Covers: weekend (Sat+Sun), weekday | Base 800 / 650 per week | Daily, weekly |
| Average check (food + beverage) | Base \$44 | Daily |
| Net sales vs. plan | Plan by month with seasonality | Daily, weekly |
| Food cost %, beverage cost % | 26-30%, 18-22% | Weekly |
| Labor % (all-in), SPLH, labor \$/cover | 32-36%, ≥\$55-70, \$9-12 | Weekly |
| **Prime cost %** | ≤62-65% | Weekly |
| Beverage attach rate (weekend) | ~1.3 alcoholic drinks per guest | Weekly |
| **SRX food ratio** (food + non-alcoholic ÷ total food & beverage) | ≥51% (target ≥60%) | Monthly, trailing 3 months |
| Reservation share, no-show rate | ~70-80% weekend reserved; no-shows under 5% | Weekly |
| Ticket time (weekend peak) | 15-18 minutes | Daily |
| Ratings: Google / Yelp / TripAdvisor | ≥4.6 Google | Weekly |
| Event inquiries → bookings, event revenue | ≥30% conversion | Weekly |
| Email/SMS list size, social engagement | Growth | Monthly |
| Marketing \$ per incremental cover | Track | Monthly |
| EBITDA %, cash balance and runway | 8-14%; reserve ≥ plan | Monthly |
| Hourly turnover | Under 50%/yr | Quarterly |

## Dashboard design

- One page. The top row is the north-star metrics: sales vs. plan, prime cost %, covers, rating.
- Compare to plan **and** to the same period last year (once available). Highlight exceptions (red, amber, green).
- Split by daypart (weekend vs. weekday) and channel (reservation vs. walk-in vs. event).
- Data sources: POS, reservations, scheduling/payroll, inventory, reviews, email platform (see `restaurant-tech-stack`).

## Analysis habits

1. Look for the driver. A sales miss breaks into covers × check. Covers break into daypart × channel.
2. Separate seasonality from trend (January-April peak, June-September trough).
3. Each weekly insight should end with an action and an owner.

## Output

A KPI table with values vs. targets, 3-5 insights, and recommended actions.
