# Mediavy — Field Force Dashboard

A responsive (desktop + mobile) dashboard for pharma field-force operations:

- **Plan vs actual calls** — by region and by field force rep, with achievement %.
- **HCP engagement** — engagement count and value (detailing, sampling, CME, RTM,
  group meetings) per HCP.
- **HCP / SKU / Chemist mapping** — which chemists fulfil each HCP's prescriptions,
  by SKU, with our brand's value share vs. the market.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma, and Recharts.
The layout is a single responsive web app: a left sidebar on desktop, a bottom
tab bar on mobile.

## Getting started

```bash
npm install          # also generates the Prisma client (postinstall)
npm run db:migrate    # create the local SQLite database from the schema
npm run db:seed       # populate it with 6 months of realistic sample data
npm run dev            # start the dev server at http://localhost:3000
```

Sample data covers 5 regions, ~18 field force reps, ~54 HCPs, 9 SKUs, ~26
chemists, and the trailing 6 months of plan/actual calls, engagements, and
share mapping — enough to see every page fully populated out of the box.

Re-run `npm run db:seed` any time to reset the sample data (it clears and
regenerates all rows).

## Project structure

```
prisma/schema.prisma       Data model (Region, FieldForce, Hcp, Sku, Chemist,
                             CallPlan, CallActual, Engagement, ShareMapping)
prisma/seed.ts              Sample data generator
src/lib/queries.ts          Server-side data access / aggregation
src/lib/types.ts            Shared dashboard types
src/lib/filters.ts          URL search-param <-> filter resolution
src/components/             Shared UI: shell/nav, filter bar, charts, tables
src/app/(dashboard)/        Pages: Overview, Regions, Field Force, Engagement, Mapping
```

## Connecting a real database

The app ships pointed at a local SQLite file (`prisma/dev.db`) so it runs with
zero external setup. To point it at your own Postgres/Supabase instance instead:

1. In `prisma/schema.prisma`, change the datasource `provider` from `"sqlite"`
   to `"postgresql"`.
2. Set `DATABASE_URL` in `.env` to your Postgres connection string.
3. Run `npx prisma migrate deploy` (or `npx prisma db push`) to create the schema
   there, then `npm run db:seed` if you want the sample data, or load your own
   plan/actual/engagement/share data into the same tables via your own ETL/import.

Every table and column in `prisma/schema.prisma` uses portable types, so no
schema changes are needed beyond the datasource switch.

## Design notes

- Filters (period, region) live in the URL (`?period=&region=`), so any view is
  shareable/bookmarkable.
- "Achievement" thresholds: ≥95% on track, 75–94% below plan, <75% at risk.
- Chart colors follow a validated, colorblind-safe categorical palette, with
  light/dark mode both fully specified (`src/app/globals.css`).
