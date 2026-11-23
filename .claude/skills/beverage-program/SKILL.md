---
name: beverage-program
description: Design and cost the cocktail, carafe, wine, coffee, juice and zero-proof programs at target pour cost, and model bottomless-program economics. Use for drink menu, beverage pricing, bar operations, or beverage-margin questions.
metadata:
  id: S13
  title: Beverage Program & Pour-Cost Management
  category: Product
  summary: Design cocktail, carafe, wine, coffee and zero-proof menus at target pour cost; model bottomless-program economics.
---

# Beverage Program & Pour-Cost Management

## Targets

- Beverage cost 18-22% of beverage sales. Spirits-based cocktails 16-22%, wine by the glass 25-30%, coffee and espresso 10-20%, fresh juice 25-35%.
- Bar mix about 25-35% of total sales.
- Attach rate of about 1.3 alcoholic drinks per guest on weekends.
- **SRX constraint:** alcohol must stay **below 49%** of food-and-beverage revenue. Brunch normally clears this easily, but bottomless programs push it up. Track it monthly (`florida-alcohol-law`).

## Program building blocks

- **Signatures:** mimosa and bellini flights, spritzes, espresso martinis, and a local-citrus program (Florida).
- **Carafes and towers for groups:** high margin, low labor, good for photos.
- **Zero-proof:** 4-6 serious options (the sober-curious and GLP-1 trends). Price at about 70-80% of the cocktail price, with a 15-25% cost target.
- **Coffee:** a specialty program (local roaster) is both a weekday traffic driver and a high-margin anchor.
- **Wine:** short, brunch-friendly list (sparkling, rosé, light whites), plus a champagne upsell for celebrations.

## Pour-cost procedure

1. Spec each drink: ingredient, pour (oz), cost per oz, garnish, and ice/dilution.
2. Cost = sum of the ingredients. Price = cost ÷ target pour cost, rounded to a price point.
3. Use jiggers or a measured-pour system. Run weekly bar inventory and variance reports (target variance under 2%).

## Bottomless-program check (before anyone markets "unlimited")

- Prefer time-limited (90 minutes) or carafe-based formats to truly unlimited.
- Model a heavy-drinker case (e.g., 6 mimosas) for pour cost, the SRX ratio, and over-service risk.
- Legal and insurance: confirm current ABT rules and liquor-liability coverage (**Verify** with liquor-zoning-attorney and risk-insurance-advisor).

## Output

A drink menu table (price, cost, pour cost %, role), the projected bar mix %, the impact on the SRX food ratio, and any compliance flags.
