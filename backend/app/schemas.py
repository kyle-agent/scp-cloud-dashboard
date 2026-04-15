"""Response models — match the JSON shape that tab1.js currently consumes.

Keeping these identical to `data/metrics.json` means the frontend code does
not need to change when we switch from static JSON to live OpenSearch data.
"""
from typing import List, Optional

from pydantic import BaseModel, Field


class ServiceMetric(BaseModel):
    """Per-service rollup. Maps to entries in the `svc` array."""
    key: str
    name: str
    category: str
    r: int = Field(..., description="Requests per hour")
    p50: int = Field(..., description="P50 response time (ms)")
    p99: int = Field(..., description="P99 response time (ms)")
    e: float = Field(..., description="Error rate (%)")
    qt: List[int] = Field(default_factory=list, description="24h request trend (24 buckets)")
    apiCount: int = 0


class EndpointMetric(BaseModel):
    """Per-endpoint rollup. Maps to entries in the `ep` array."""
    sv: str = Field(..., description="Service name")
    ct: str = Field(..., description="Category")
    m: str = Field(..., description="HTTP method")
    p: str = Field(..., description="API path")
    d: str = Field("", description="Description")
    r: int = Field(..., description="Requests per hour")
    p50: int
    p99: int
    e: float
    s: str = Field("normal", description="State: normal | error")


class MetricsResponse(BaseModel):
    """Combined response — drop-in replacement for data/metrics.json."""
    svc: List[ServiceMetric]
    ep: List[EndpointMetric]
    generated_at: Optional[str] = None
