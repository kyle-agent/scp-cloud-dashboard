# Samsung Cloud Platform Operations Dashboard

Interactive operations dashboard for the Samsung Cloud Platform (SCP), providing real-time visibility into API health, service metrics, revenue analytics, and infrastructure monitoring.

## Features

**Tab 1 - Service Status (서비스 현황)**
- API health monitoring across all services (kr-west1 endpoints)
- Real-time call volume, response time (P50/P99), error rates
- 24h trend charts for API calls, response times, and errors (404/500)
- Top 10 services by API call volume with normal/error ratios
- Individual service cards with status indicators (green/amber/red)
- Click any service card → Top 5 API details expansion
- Top 20 error APIs table

**Tab 2 - Service Provision (서비스 제공 현황)**
- Account summary (total, new today/week/month)
- Revenue KPIs (last month, MoM growth, active instances, top service)
- Category revenue breakdown and monthly trends
- Per-category, per-service instance counts and revenue trends
- 12-month charts for instances and revenue per service

## Architecture

```
scp-cloud-dashboard/
├── index.html          # Main HTML with inline CSS
├── config.js           # Central configuration (colors, icons, data paths)
├── tab1.js             # Tab 1 logic (API health, trends)
├── tab2.js             # Tab 2 logic (provision, revenue)
└── data/
    ├── services.json   # Service catalog with health check URLs
    ├── metrics.json    # API metrics (calls, P50/P99, error rates)
    └── accounts.json   # Account & revenue statistics
```

## Data Integration

All data loads from JSON files in `data/`. To connect live data:

1. Update `config.js` → `DATA_URL` to your API base URL
2. Ensure endpoints return compatible JSON:
   - `/data/services.json` → `[{key, name, category, healthUrl}, ...]`
   - `/data/metrics.json` → `{svc: [...], ep: [...]}`
   - `/data/accounts.json` → `{totalAccounts, newAccountsToday, ...}`

```javascript
// config.js - change this:
DATA_URL: '.',          // local JSON files
// to:
DATA_URL: '/api/v1',    // your API backend
```

## Running

Serve with any static server:
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Or deploy to S3/GitHub Pages.

## Technologies
- Chart.js — interactive charts
- Vanilla JS — no framework dependencies
- Static JSON — no database requirement
