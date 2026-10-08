# coenzeng.com

Personal website built with Next.js (App Router), TypeScript, Tailwind CSS, and Recharts.

- `/` is a single link to the calculator.
- `/net-worth-calculator` is the **Net Worth Goal Calculator – Canada**.

## Running the project

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Build for production with `npm run build`.

## Tax brackets

All tax is calculated with marginal (progressive) brackets on taxable income. Each bracket taxes only the income that falls inside it.

### Federal (all provinces)

| Taxable income | Rate |
| --- | --- |
| $58,523 or less | 14% |
| $58,523 – $117,045 | 20.5% |
| $117,045 – $181,440 | 26% |
| $181,440 – $258,482 | 29% |
| Over $258,482 | 33% |

### British Columbia

| Taxable income | Rate |
| --- | --- |
| Up to $50,363 | 5.6% |
| $50,363 – $100,728 | 7.7% |
| $100,728 – $115,648 | 10.5% |
| $115,648 – $140,430 | 12.29% |
| $140,430 – $190,405 | 14.7% |
| $190,405 – $265,545 | 16.8% |
| Over $265,545 | 20.5% |

### Ontario (approximate)

| Taxable income | Rate |
| --- | --- |
| Up to $52,886 | 5.05% |
| $52,886 – $105,775 | 9.15% |
| $105,775 – $150,000 | 11.16% |
| $150,000 – $220,000 | 12.16% |
| Over $220,000 | 13.16% |

Ontario also applies the provincial surtax: 20% of basic Ontario tax above $5,710, plus 36% of basic Ontario tax above $7,307.

The tax engine lives in `src/lib/tax.ts`. Brackets are not indexed for inflation, and they are not modelled to change in future years.

### Not modelled

Credits and deductions (including the basic personal amount), CPP/EI, the Ontario health premium, and RRSP/TFSA treatment are all excluded. Taxes are a simplified estimate.

## Self-employment income and expenses

- Taxable self-employment income = self-employment income − self-employment expenses.
- Taxable income = job income + max(0, taxable self-employment income). A self-employment loss does not reduce job income for tax purposes and is not carried forward.
- Effective after-tax income = gross income − self-employment expenses − tax. Expenses therefore reduce the cash available each year even when they are not tax-deductible in full.
- Self-employment income grows at its own rate, independent of job income.

## How the "Date to quit job" feature works

- Job income is earned up to the quit date and is $0 on and after it.
- In the quit year, job income is prorated to the days worked before the quit date. For example, a 30 June quit earns about 181/365 of the year's job income.
- Self-employment income continues normally after the quit date.
- The chart shows a dashed vertical line at the quit date and labels it "Job ends YEAR". The results panel states the exact date.
- Leaving the field empty means the job continues for the whole projection.

## How the two income growth rates are applied

- **Job income** in projection year *t* = job income × (1 + job growth)^t × share of the year employed.
- **Self-employment income** in year *t* = self-employment income × (1 + self-employment growth)^t.
- The two rates are independent. Changing one never changes the other.
- Year 0 uses the values you enter. Growth begins in the following year.

## How multi-scenario management works

- The calculator starts with one scenario, "Stay at Job".
- **+ Add scenario** creates a new scenario with default inputs. The view scrolls to the new column.
- Each scenario has an editable title, its own province, and its own inputs.
- **Duplicate** copies a scenario and inserts the copy directly after it.
- **Delete** removes a scenario. The last remaining scenario cannot be deleted.
- **Reset to defaults** resets one scenario's inputs (its title and colour are kept).
- Each scenario has its own accent colour, used for its column border, the chart line, and the legend.
- The fastest scenario to reach the goal is highlighted with a "Fastest" badge, a shadow, and a banner above the chart.
- The net worth goal and start year are shared by all scenarios.
- Export buttons create a CSV or plain-text summary of every scenario side by side.
- All scenarios and settings are saved in `localStorage` under the key `net-worth-goal-calculator:v1`.

## Growth calculation logic

Each scenario has two buckets:

- **Portfolio**: starts at current net worth (treated as already invested). Each month it grows at the equivalent monthly rate of the expected annual return, and the monthly investment is added at the end of the month. The monthly rate is (1 + annual return)^(1/12) − 1, so the annual growth is exact.
- **Cash**: each year it accumulates after-tax income − living expenses − annual investment contributions. Cash does not earn a return. If spending plus investing exceeds after-tax income, cash falls below zero and reduces net worth.

Net worth = portfolio + cash.

Each year:

1. Compute job income (growth, quit proration) and self-employment income (growth).
2. Compute the self-employment expenses and living expenses. These rise with inflation only when the inflation toggle is on.
3. Compute taxable income, federal and provincial tax, and after-tax income.
4. Compound the portfolio monthly for 12 months, adding the monthly investment each month.
5. Add (after-tax income − living expenses − 12 × monthly investment) to cash.

The projection runs for up to 60 years. The first year in which net worth is at or above the goal is the time to goal. Milestones at 5, 10, 15, and 20 years are read directly from the projection.

### Today's dollars

When **Today's dollars** is on, every net worth value is divided by (1 + inflation rate)^t, where t is the year index. Living and self-employment expenses also grow at the inflation rate. The goal is compared against the deflated values.

## Limitations

This is a simplified educational tool. Actual taxes, investment returns, and expenses will vary. Consult a financial advisor.

## Project layout

```
src/
  app/                       routes (home link, calculator page), layout, global styles
  components/calculator/     calculator UI: settings bar, chart, scenario column, inputs, results
  components/ui/             form controls, tooltips, theme toggle
  hooks/useNetWorthPlanner   scenario state, persistence, add/duplicate/delete/reset
  lib/tax.ts                 bracket tables and progressive tax
  lib/projection.ts          monthly/annual projection, quit proration, goal detection
  lib/export.ts              CSV and text summaries
  lib/storage.ts             localStorage load/save with validation
```
