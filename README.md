# Project Performance Intelligence

Gain/fade analysis for completed construction projects. Upload a completed-contracts CSV
and see which jobs gained or faded against the original estimate, which cost category
drove each one, and how much of the variance was change-order scope and how much was
execution.

Live: https://project-performance-analysis.vercel.app

Everything runs in the browser. No file is uploaded to a server.

## How the numbers are built

| Measure | Definition | Why |
|---|---|---|
| Gain/fade | Final profit minus the profit in the original estimate | The standard completed-contract view of estimating and execution together |
| Budget | Revised estimate (original plus approved change orders). Falls back to the original estimate for a project with no revised estimate | Change-order cost is scope the owner paid for, so it is not an overrun |
| Cost variance | Final cost minus budget, by category | The part of the variance the project team owns |
| Labor hours effect | (actual hours - budget hours) x budget rate | Productivity and missed scope |
| Labor rate effect | (actual rate - budget rate) x actual hours | Wages, overtime and crew mix |
| Margin | Total profit over total revenue | A mean of project margins gives a small job the same weight as a large one |
| Index change over a job | Mean of a BLS price index from the bid month to the completion month, over its bid-month value | With no buyout dates, purchases are assumed to be spread evenly over the job |
| Materials exposure | Budgeted materials x index change over the job | What the market move was worth on that job with nothing locked at bid. An estimate to hold next to the actual variance, never a cause |

The formulas live in `src/lib/calculations.ts`, each with a comment giving the reason for it.

## Market indexes

The Market Exposure page reads `src/data/marketIndices.json`: eight BLS Producer Price
Indexes for construction materials and BLS average hourly earnings in construction,
monthly from 2016. The values are copied without change from
[data.cainmenard.com](https://data.cainmenard.com), which pulls them from the BLS API, so
an index reads the same in both places. Credit: U.S. Bureau of Labor Statistics.

The file is a committed snapshot, not a fetch in the browser: the app sends nothing out,
and a build does not depend on another site being up. Refresh it with:

```
node scripts/update-indices.mjs
```

What the indexes are not: they are national averages of what domestic producers charged
(PPI) and of gross pay per hour (earnings), not what one contractor paid in one market.

## Data

- **Sample data** (`src/lib/sampleData.ts`) is synthetic: 48 projects for an invented
  mechanical contractor. Every company, project, person and date in it is invented. A test
  fails the build if a real contractor name is added. One input is real: the BLS
  construction materials index sets how much materials cost moved on each job between its
  bid and its completion.
- **Your data**: download the CSV template from the landing page. Required columns are a
  project name or number, original and final contract value, and original estimated and
  final cost. Everything else is optional; the app says what it cannot compute without it.
  Market Exposure needs "Bid Date" and "Completion Date" (YYYY-MM-DD or M/D/YYYY).
  Files built on the earlier template headers still load.

## Develop

```
npm install
npm run dev      # local dev server
npm test         # unit tests (vitest)
npm run lint
npm run build    # type-check and production build
```

Stack: React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, PapaParse. Deployed on Vercel.

## Embed mode

Add `?embed=1` to any route to skip the landing page and boot on the sample data. The
Field Intelligence page on cainmenard.com uses this.

## Layout

```
src/lib/calculations.ts   every metric and diagnosis
src/lib/marketExposure.ts index change over a job, exposure, fit across jobs
src/lib/csvParser.ts      template, header matching, validation
src/data/marketIndices.json  index snapshot (scripts/update-indices.mjs refreshes it)
src/lib/sampleData.ts     the synthetic portfolio
src/pages/                one file per screen
src/components/           charts, layout, upload
```
