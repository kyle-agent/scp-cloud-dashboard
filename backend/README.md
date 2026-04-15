## Dashboard BFF (Tab1 — 서비스 현황)

A thin FastAPI service that queries OpenSearch and returns the JSON shape
the frontend (`tab1.js`) already expects. The frontend is unchanged except
for `config.js` which now points `metrics` at this backend.

```
[browser] ──GET /api/dashboard/metrics──> [FastAPI] ──aggregations──> [OpenSearch]
                                              │
                                              └─ in-memory TTL cache (60s)
```

### Endpoints

| Method | Path                              | Source         | Cached |
|--------|-----------------------------------|----------------|--------|
| GET    | `/health`                         | -              | no     |
| GET    | `/api/dashboard/metrics`          | OpenSearch     | 60s    |
| GET    | `/api/dashboard/metrics/services` | OpenSearch     | 60s    |
| GET    | `/api/dashboard/metrics/endpoints`| OpenSearch     | 60s    |

`/metrics` returns the combined `{svc:[...], ep:[...]}` shape that
`data/metrics.json` currently has, so no frontend logic changes.

### Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then edit
uvicorn app.main:app --reload --port 8000
```

### Configuration (`.env`)

| Var                    | Default                  | Notes                                 |
|------------------------|--------------------------|---------------------------------------|
| `OPENSEARCH_HOSTS`     | `http://localhost:9200`  | Comma-separated for clusters          |
| `OPENSEARCH_USER`      | `""`                     | Optional basic auth                   |
| `OPENSEARCH_PASSWORD`  | `""`                     | Optional basic auth                   |
| `OPENSEARCH_INDEX`     | `apigw-access-*`         | Index pattern to query                |
| `CACHE_TTL_SECONDS`    | `60`                     | Match `POLL_INTERVAL` in `config.js`  |
| `CORS_ORIGINS`         | `*`                      | Tighten for production                |

### TODO before going live

The query builder in `app/opensearch/queries.py` uses **placeholder field
names** that need to be confirmed against the real index mapping:

- `SERVICE_FIELD` — which field identifies the service?
- `RESP_TIME_FIELD` — milliseconds vs microseconds?
- `STATUS_FIELD` — status code numeric field
- `PATH_FIELD`, `METHOD_FIELD`
- `TIMESTAMP_FIELD` — assumed `@timestamp`

Once confirmed, no other code changes should be needed.
