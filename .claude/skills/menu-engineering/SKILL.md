---
name: menu-engineering
description: Cost recipes, set menu prices to target food cost, and analyze item popularity versus profitability for the brunch menu and pastry/retail program. Use when designing or pricing menu items, reviewing menu mix, or cutting food cost.
metadata:
  id: S12
  title: Menu Engineering & Recipe Costing
  category: Product
  summary: Cost recipes, set prices to target food cost, and analyze item popularity versus profitability (including pastry/retail).
---

# Menu Engineering & Recipe Costing

## Targets

- Food cost 26-30% of food sales. Blended cost of goods 25-29% with the bar.
- Average check about \$44 per guest, food plus beverage (base case). Check food against the competitor price ladder in `docs/03-competitors.md`.
- The pastry/retail counter targets about \$100K/yr in the base case, with food cost of 20-28%.

## Recipe costing procedure

1. Build a recipe card: ingredient, purchase unit and cost, yield % (after trim and cooking), portion, and cost per portion.
2. Plate cost = the sum of the ingredient portion costs + garnish + a 2-5% waste/condiment allowance.
3. Price = plate cost ÷ target food-cost %. Round to a menu price point and check it against competitors.
4. Recost quarterly, and whenever a key input moves more than 10%: eggs, butter, seafood, citrus, coffee.

## Menu engineering matrix

Classify each item by **popularity** (mix % vs. 70% of a fair share) and **contribution margin** (\$ margin vs. the average):

| | High margin | Low margin |
|---|---|---|
| **High popularity** | Star: keep it prominent | Plowhorse: re-cost, reprice, or re-portion |
| **Low popularity** | Puzzle: reposition, rename, or let servers feature it | Dog: remove |

## Brunch-specific guidance

- Eggs and starches are cheap. Premium seafood, steak and imported cheese drive cost. Balance every "moment" dish with high-margin anchors.
- Offer smaller-portion and protein-forward items (the GLP-1 trend) priced on margin, not size.
- Shareable prix-fixe or "brunch for the table" formats raise the check and simplify the line. Use them for weekend peaks.
- Line capacity: the menu must be executable at about 400 weekend covers per day. Limit the number of items on the egg station, and batch hollandaise safely (see `food-safety-haccp`).
- Florida identity: Gulf seafood, citrus, Plant City strawberries, Cuban/Spanish heritage. Watch seasonality and price swings.

## Output

Recipe cost cards, a priced menu table (price, plate cost, food cost %, contribution margin, intended role), and an estimated check-average impact.
