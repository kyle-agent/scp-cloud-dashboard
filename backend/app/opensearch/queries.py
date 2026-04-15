"""OpenSearch aggregation query builders.

Each builder returns a `body` dict suitable for `client.search(index=..., body=...)`.

Field names live in `app.config.Settings` so they can be overridden per
environment without touching code. The defaults are placeholders — confirm
against the actual index mapping before going live.
"""
from app.config import settings


def build_service_metrics_query(range_hours: int = 24) -> dict:
    """One query that produces every per-service rollup tab1.js needs.

    Output (under `aggregations.services.buckets`):
      - doc_count               → svc[].r  (total requests in window)
      - resp_pct.values["50.0"] → svc[].p50
      - resp_pct.values["99.0"] → svc[].p99
      - errors.doc_count        → used to compute svc[].e
      - trend_24h.buckets[]     → svc[].qt (24 hourly counts)
    """
    return {
        "size": 0,
        "query": {
            "range": {
                settings.os_field_timestamp: {"gte": f"now-{range_hours}h", "lte": "now"}
            }
        },
        "aggs": {
            "services": {
                "terms": {"field": settings.os_field_service, "size": 200},
                "aggs": {
                    "resp_pct": {
                        "percentiles": {
                            "field": settings.os_field_resp_time,
                            "percents": [50, 99],
                        }
                    },
                    "errors": {
                        "filter": {
                            "range": {settings.os_field_status: {"gte": 400}}
                        }
                    },
                    "trend_24h": {
                        "date_histogram": {
                            "field": settings.os_field_timestamp,
                            "fixed_interval": "1h",
                            "min_doc_count": 0,
                            "extended_bounds": {
                                "min": f"now-{range_hours}h",
                                "max": "now",
                            },
                        }
                    },
                },
            }
        },
    }


def build_endpoint_metrics_query(range_hours: int = 24, top_n: int = 500) -> dict:
    """Top-N endpoint rollups across all services.

    Composite aggregation on (service, method, path) so we can paginate if
    we ever exceed the default bucket cap.
    """
    return {
        "size": 0,
        "query": {
            "range": {
                settings.os_field_timestamp: {"gte": f"now-{range_hours}h", "lte": "now"}
            }
        },
        "aggs": {
            "endpoints": {
                "composite": {
                    "size": top_n,
                    "sources": [
                        {"sv": {"terms": {"field": settings.os_field_service}}},
                        {"m": {"terms": {"field": settings.os_field_method}}},
                        {"p": {"terms": {"field": settings.os_field_path}}},
                    ],
                },
                "aggs": {
                    "resp_pct": {
                        "percentiles": {
                            "field": settings.os_field_resp_time,
                            "percents": [50, 99],
                        }
                    },
                    "errors": {
                        "filter": {
                            "range": {settings.os_field_status: {"gte": 400}}
                        }
                    },
                },
            }
        },
    }


def build_overall_trend_query(range_hours: int = 24) -> dict:
    """Hourly buckets of total calls + 404/500 counts for the trend charts."""
    return {
        "size": 0,
        "query": {
            "range": {
                settings.os_field_timestamp: {"gte": f"now-{range_hours}h", "lte": "now"}
            }
        },
        "aggs": {
            "trend": {
                "date_histogram": {
                    "field": settings.os_field_timestamp,
                    "fixed_interval": "1h",
                    "min_doc_count": 0,
                    "extended_bounds": {
                        "min": f"now-{range_hours}h",
                        "max": "now",
                    },
                },
                "aggs": {
                    "p50_p99": {
                        "percentiles": {
                            "field": settings.os_field_resp_time,
                            "percents": [50, 99],
                        }
                    },
                    "err_404": {
                        "filter": {"term": {settings.os_field_status: 404}}
                    },
                    "err_500": {
                        "filter": {
                            "range": {settings.os_field_status: {"gte": 500}}
                        }
                    },
                },
            }
        },
    }
