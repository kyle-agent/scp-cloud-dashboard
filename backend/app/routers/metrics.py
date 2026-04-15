"""Tab1 metrics endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.cache import ttl_cache
from app.config import settings
from app.opensearch.client import get_client
from app.opensearch.queries import (
    build_endpoint_metrics_query,
    build_service_metrics_query,
)
from app.opensearch.transform import transform_endpoints, transform_services
from app.schemas import MetricsResponse

router = APIRouter()


@ttl_cache(seconds=settings.cache_ttl_seconds)
def _fetch_services():
    client = get_client()
    return client.search(index=settings.opensearch_index, body=build_service_metrics_query())


@ttl_cache(seconds=settings.cache_ttl_seconds)
def _fetch_endpoints():
    client = get_client()
    return client.search(index=settings.opensearch_index, body=build_endpoint_metrics_query())


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    """Drop-in replacement for `data/metrics.json`."""
    try:
        svc_raw = _fetch_services()
        ep_raw = _fetch_endpoints()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"OpenSearch query failed: {exc}") from exc

    return MetricsResponse(
        svc=transform_services(svc_raw),
        ep=transform_endpoints(ep_raw),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/metrics/services")
def get_metrics_services():
    return {"svc": transform_services(_fetch_services())}


@router.get("/metrics/endpoints")
def get_metrics_endpoints():
    return {"ep": transform_endpoints(_fetch_endpoints())}
