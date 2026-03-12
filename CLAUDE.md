# Datastore — Brand Data Center & Intelligence Platform

## Overview
Datastore is an internal brand data center that consolidates Shopify, Meta Ads, Google Ads, and future channels into a single analytics dashboard. It serves as the "Architecture of Truth" — self-hosted, auditable, and team-owned.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, TypeScript
- **Charts**: Recharts + custom SVG sparklines
- **Tables**: TanStack Table v8
- **Icons**: Lucide React
- **Fonts**: Geist (body) + Geist Mono (numbers/metrics)
- **Backend** (future): Fastify + tRPC on Railway
- **Database** (future): PostgreSQL 16 via Drizzle ORM
- **AI** (future): Anthropic Claude Sonnet for daily briefings

## Design System
- **Dark mode default**: bg `#0A0A0B`, surface `#111113`, border `#1F1F23`
- **Light mode**: bg `#FAFAFA`, surface `#FFFFFF`, border `#E5E5E5`
- **Colors**: Green `#22C55E`, Red `#EF4444`, Blue `#3B82F6`
- **Channel colors**: Meta `#1877F2`, Google `#4285F4`, Shopify `#96BF48`, Email `#F59E0B`, Organic `#8B5CF6`
- **Philosophy**: Bloomberg Terminal meets Linear — data-dense but breathable, no gratuitous effects

## Project Structure
```
src/
├── app/(dashboard)/       # All dashboard pages
│   ├── page.tsx           # Unified brand overview
│   ├── shopify/           # Shopify deep dive
│   ├── meta/              # Meta Ads (overview, ads table, creatives, campaigns)
│   ├── google/            # Google Ads overview
│   ├── analytics/         # Cross-channel analytics & P&L
│   ├── products/          # Product cross-channel view
│   ├── insights/          # AI briefings & alerts hub
│   └── settings/          # Business config
├── components/
│   ├── layout/            # Sidebar, TopBar, DateRangePicker
│   ├── charts/            # Recharts-based visualizations
│   ├── cards/             # KPICard, ChannelCard, AlertCard, InsightCard
│   ├── tables/            # DataTable, AdsTable, etc.
│   └── ui/                # Shared UI primitives
└── lib/
    ├── mock-data.ts       # Mock data for all views
    ├── format.ts          # Currency, percentage, number formatters
    └── utils.ts           # Shared utilities
```

## Key Metrics (The Core 7)
1. **Incremental ROAS** — Real return from new users
2. **Reach CPM** — Cost to reach unique users
3. **Incremental Reach %** — New audience expansion rate
4. **Contribution Margin** — Revenue minus all real costs
5. **Conversion Rate + AOV** — Funnel efficiency
6. **Hook Rate** — Video 3-second attention capture
7. **Engagement Depth** — Organic interaction rate

## Conventions
- Use `clsx` for conditional classnames
- Format all currency with `$` prefix and comma separators
- Format percentages to 1 decimal place
- All metrics show trend arrows (▲ green, ▼ red, — gray)
- Monospace font (Geist Mono) for all numeric values
- Pages are server components by default; add `"use client"` only when needed
