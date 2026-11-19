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

The formulas live in `src/lib/calculations.ts`, each with a comment giving the reason for it.

## Data

- **Sample data** (`src/lib/sampleData.ts`) is synthetic: 48 projects for an invented
  mechanical contractor. Every company, project and person in it is invented. A test fails
  the build if a real contractor name is added.
- **Your data**: download the CSV template from the landing page. Required columns are a
  project name or number, original and final contract value, and original estimated and
  final cost. Everything else is optional; the app says what it cannot compute without it.
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
src/lib/csvParser.ts      template, header matching, validation
src/lib/sampleData.ts     the synthetic portfolio
src/pages/                one file per screen
src/components/           charts, layout, upload
```
