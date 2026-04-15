## Dashboard ETL (Tab2 — 서비스 제공 현황)

A scheduled job that produces `data/accounts.json` from the same source the
existing Apache Superset dashboard uses. Tab2 data (revenue, accounts,
instances) changes slowly so a daily rebuild is fine — no live backend
needed for this tab.

```
cron (02:00 KST) ──> generate_accounts.py ──┬─> RDB direct (preferred)
                                            └─> Superset REST API (fallback)
                                  │
                                  └─> writes data/accounts.json (committed or pushed to S3)
```

### Two source modes

`generate_accounts.py` accepts a `--source` flag:

| Mode       | Reads from                                    | When to use                                |
|------------|-----------------------------------------------|--------------------------------------------|
| `db`       | RDB directly (SQL files in `etl/sql/`)        | We have a read replica / read-only account |
| `superset` | `POST /api/v1/chart/<id>/data/`               | Only Superset is exposed, no DB access     |

Both modes produce the same JSON shape, so the frontend doesn't care which
one ran.

### Run

```bash
cd etl
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then edit

python generate_accounts.py --source db --out ../data/accounts.json
```

### Cron

```cron
0 2 * * * cd /opt/scp-dashboard/etl && .venv/bin/python generate_accounts.py --source db --out ../data/accounts.json >> /var/log/dashboard-etl.log 2>&1
```

### TODO before going live

1. **Choose source** — DB direct or Superset API. Fill in `.env` accordingly.
2. **Populate `etl/sql/*.sql`** — currently placeholders. Pull the SQL out
   of the existing Superset charts (View query in chart editor) and paste
   in. Each file documents the columns its query must return.
3. **Map Superset chart IDs** in `etl/superset_charts.yaml` if using
   `--source superset` instead.
