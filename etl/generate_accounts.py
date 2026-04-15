#!/usr/bin/env python3
"""Generate data/accounts.json from RDB or Superset.

Two source modes (`--source db` or `--source superset`) produce the same
output JSON shape so the frontend doesn't care which one ran.

Usage:
    python generate_accounts.py --source db --out ../data/accounts.json
    python generate_accounts.py --source superset --out ../data/accounts.json
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv

ETL_DIR = Path(__file__).resolve().parent
SQL_DIR = ETL_DIR / "sql"
DEFAULT_OUT = ETL_DIR.parent / "data" / "accounts.json"

load_dotenv(ETL_DIR / ".env")


# ---------------------------------------------------------------------------
# Source: direct DB
# ---------------------------------------------------------------------------
def fetch_from_db() -> Dict[str, Any]:
    """Run the SQL files in `etl/sql/` and assemble the JSON payload."""
    from sqlalchemy import create_engine, text

    db_url = os.environ.get("DB_URL")
    if not db_url:
        raise RuntimeError("DB_URL not set — see etl/.env.example")

    engine = create_engine(db_url, pool_pre_ping=True)

    def run(sql_file: str) -> list[dict]:
        sql = (SQL_DIR / sql_file).read_text()
        with engine.connect() as conn:
            return [dict(row._mapping) for row in conn.execute(text(sql))]

    summary = run("accounts_summary.sql")[0]
    monthly = run("monthly_revenue.sql")
    category = run("category_revenue.sql")
    per_service = run("per_service_stats.sql")
    trends = run("per_service_trends.sql")

    return _assemble(summary, monthly, category, per_service, trends)


# ---------------------------------------------------------------------------
# Source: Superset REST API
# ---------------------------------------------------------------------------
def fetch_from_superset() -> Dict[str, Any]:
    """Pull each chart's data via Superset's chart data API.

    NOTE: This is a placeholder — wiring up auth + chart-id mapping is
    deferred until we know which chart IDs to use. See `superset_charts.yaml`.
    """
    import yaml
    import requests  # noqa: F401  (used once chart calls are wired)

    base = os.environ.get("SUPERSET_BASE_URL")
    if not base:
        raise RuntimeError("SUPERSET_BASE_URL not set — see etl/.env.example")

    chart_map = yaml.safe_load((ETL_DIR / "superset_charts.yaml").read_text())
    if any(v.get("chart_id", 0) == 0 for v in chart_map.values()):
        raise RuntimeError(
            "Superset chart IDs not configured. Edit superset_charts.yaml first."
        )

    # TODO: implement once chart IDs and auth are known. The flow:
    #   1. POST /api/v1/security/login → access_token
    #   2. POST /api/v1/chart/<id>/data/ → JSON results per chart
    #   3. Reshape into the same dict that _assemble() expects
    raise NotImplementedError("Superset source mode not yet implemented")


# ---------------------------------------------------------------------------
# Shared assembler
# ---------------------------------------------------------------------------
def _assemble(summary, monthly, category, per_service, trends) -> Dict[str, Any]:
    """Build the final accounts.json structure that `tab2.js` expects."""
    monthly_revenue_trend = [int(row["revenue_krw"]) for row in monthly]
    last_month_rev = monthly_revenue_trend[-1] if monthly_revenue_trend else 0
    prev_month_rev = monthly_revenue_trend[-2] if len(monthly_revenue_trend) >= 2 else 0
    mom_growth = ((last_month_rev - prev_month_rev) / prev_month_rev) if prev_month_rev else 0

    category_revenue = {row["category"]: int(row["revenue_krw"]) for row in category}

    # Group trends by service_key
    per_service_trends: Dict[str, Dict[str, list]] = {}
    for row in trends:
        key = row["service_key"]
        bucket = per_service_trends.setdefault(key, {"instanceTrend": [], "revenueTrend": []})
        bucket["instanceTrend"].append(int(row["instance_count"]))
        bucket["revenueTrend"].append(int(row["revenue_krw"]))

    per_service_out: Dict[str, Dict[str, Any]] = {}
    for row in per_service:
        key = row["service_key"]
        trend = per_service_trends.get(key, {"instanceTrend": [], "revenueTrend": []})
        per_service_out[key] = {
            "tI": int(row["total_instances"]),
            "nM": int(row["new_this_month"]),
            "nD": int(row["new_today"]),
            "lastRev": int(row["last_month_rev"]),
            **trend,
        }

    total_instances = sum(s["tI"] for s in per_service_out.values())
    new_instances_today = sum(s["nD"] for s in per_service_out.values())

    return {
        "totalAccounts": int(summary["total_accounts"]),
        "newAccountsToday": int(summary["new_today"]),
        "newAccountsThisWeek": int(summary["new_this_week"]),
        "newAccountsThisMonth": int(summary["new_this_month"]),
        "lastMonthRevenue": last_month_rev,
        "monthOverMonthGrowth": round(mom_growth, 4),
        "totalActiveInstances": total_instances,
        "newInstancesToday": new_instances_today,
        "monthlyRevenueTrend": monthly_revenue_trend,
        "categoryRevenue": category_revenue,
        "perService": per_service_out,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", choices=["db", "superset"], default="db")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--dry-run", action="store_true", help="Print to stdout instead of writing")
    args = parser.parse_args()

    if args.source == "db":
        data = fetch_from_db()
    else:
        data = fetch_from_superset()

    payload = json.dumps(data, indent=2, ensure_ascii=False)

    if args.dry_run:
        print(payload)
    else:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(payload, encoding="utf-8")
        print(f"wrote {args.out} ({len(payload)} bytes)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
