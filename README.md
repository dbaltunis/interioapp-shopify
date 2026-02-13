# InterioApp — Made-to-Measure Calculator

A Shopify app for calculating made-to-measure pricing for **blinds**, **curtains**, and **shutters**. Built with Remix, Shopify Polaris, and Prisma.

## Features

- **Product Calculator** — Instant pricing based on dimensions, fabric, lining, and heading style
- **Multi-Region Support** — US, UK, AU, NZ, CA, EU with automatic currency and unit handling
- **Metric & Imperial** — Toggle between cm and inches
- **Regional Price Modifiers** — Configurable multipliers and tax rates per region
- **Quote Management** — Database-backed calculations and quote requests (via Prisma)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Remix (React) |
| UI | Shopify Polaris |
| App Bridge | @shopify/app-bridge-react |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Language | TypeScript |
| Hosting | Heroku |

## Project Structure

```
interioapp-shopify/
├── app/
│   ├── components/
│   │   ├── Calculator.tsx        # Core calculator with Polaris forms
│   │   └── RegionSelector.tsx    # Region and unit selector
│   ├── routes/
│   │   ├── _index.tsx            # Dashboard
│   │   ├── app.calculator.tsx    # Calculator page
│   │   └── app.settings.tsx      # Regional pricing settings
│   ├── types/
│   │   └── calculator.ts         # Types, constants, pricing data
│   ├── utils/
│   │   └── pricing.ts            # Price calculation engine
│   └── root.tsx                  # App shell with Polaris provider
├── prisma/
│   └── schema.prisma             # Database models
├── .env.example
├── package.json
├── remix.config.js
└── tsconfig.json
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in your Shopify and Supabase credentials
```

### 3. Set up database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run development server

```bash
npm run dev
```

## Database Models

- **Shop** — Installed shop with preferences
- **Product** — Product templates with pricing rules
- **Calculation** — Saved price calculations
- **QuoteRequest** — Customer quote requests with status tracking
- **Region** — Regional pricing configuration

## Architecture

The calculator engine (`utils/pricing.ts`) computes prices from:
1. **Base price** per product type
2. **Area cost** (width × height in m²) × per-m² rate
3. **Fabric surcharge** scaled by area
4. **Lining surcharge** (flat)
5. **Heading style surcharge** (flat)
6. **Regional modifier** (multiplier)

All measurements are normalised to mm internally. The UI accepts cm (metric) or inches (imperial).

## Deployment

Designed for Heroku with Supabase PostgreSQL:

```bash
# Via Shopify CLI
shopify app deploy

# Or manual Heroku
git push heroku main
```

## License

Proprietary — InterioApp
