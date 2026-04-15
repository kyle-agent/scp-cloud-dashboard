"""Transform raw OpenSearch aggregation responses into the JSON shape that
`tab1.js` already consumes.

Splitting transform out from query/router keeps each piece testable —
unit tests can feed canned OS responses through these functions without
hitting a live cluster.
"""
from typing import Dict, List

from app.schemas import EndpointMetric, ServiceMetric


def _service_catalog() -> Dict[str, dict]:
    """Load services.json from the repo as a lookup table.

    The frontend already ships a hand-curated catalog (`data/services.json`)
    with stable `key`, `name`, `category`, `apiCount`. We reuse it so the
    backend doesn't need to know about category metadata.
    """
    import json
    from pathlib import Path

    catalog_path = Path(__file__).resolve().parents[3] / "data" / "services.json"
    if not catalog_path.exists():
        return {}
    with catalog_path.open("r", encoding="utf-8") as f:
        items = json.load(f)
    return {item["name"]: item for item in items}


def transform_services(os_response: dict, range_hours: int = 24) -> List[ServiceMetric]:
    catalog = _service_catalog()
    out: List[ServiceMetric] = []
    buckets = os_response.get("aggregations", {}).get("services", {}).get("buckets", [])
    for b in buckets:
        name = b["key"]
        meta = catalog.get(name, {})
        total = b["doc_count"]
        err = b.get("errors", {}).get("doc_count", 0)
        pct = b.get("resp_pct", {}).get("values", {}) or {}
        qt = [hb["doc_count"] for hb in b.get("trend_24h", {}).get("buckets", [])]
        # Normalize to "per hour" so the field meaning matches the existing JSON
        per_hour = round(total / max(range_hours, 1))
        out.append(
            ServiceMetric(
                key=meta.get("key", name.lower().replace(" ", "-")),
                name=name,
                category=meta.get("category", "Unknown"),
                r=per_hour,
                p50=int(pct.get("50.0") or 0),
                p99=int(pct.get("99.0") or 0),
                e=round((err / total * 100) if total else 0, 2),
                qt=qt[-24:],
                apiCount=meta.get("apiCount", 0),
            )
        )
    return out


def transform_endpoints(os_response: dict, range_hours: int = 24) -> List[EndpointMetric]:
    catalog = _service_catalog()
    out: List[EndpointMetric] = []
    buckets = os_response.get("aggregations", {}).get("endpoints", {}).get("buckets", [])
    for b in buckets:
        key = b["key"]
        sv = key.get("sv", "")
        meta = catalog.get(sv, {})
        total = b["doc_count"]
        err = b.get("errors", {}).get("doc_count", 0)
        pct = b.get("resp_pct", {}).get("values", {}) or {}
        err_rate = round((err / total * 100) if total else 0, 2)
        out.append(
            EndpointMetric(
                sv=sv,
                ct=meta.get("category", "Unknown"),
                m=key.get("m", "GET"),
                p=key.get("p", "/"),
                d="",
                r=round(total / max(range_hours, 1)),
                p50=int(pct.get("50.0") or 0),
                p99=int(pct.get("99.0") or 0),
                e=err_rate,
                s="error" if err_rate > 5 else "normal",
            )
        )
    return out
