"""Trivial single-slot TTL cache decorator.

For a richer setup (per-key, async-safe, redis-backed) swap this out — but
for a one-process BFF serving 60s-cached snapshots this is enough.
"""
import time
from functools import wraps
from threading import Lock
from typing import Callable


def ttl_cache(seconds: int):
    def decorator(fn: Callable):
        store = {"value": None, "expires_at": 0.0}
        lock = Lock()

        @wraps(fn)
        def wrapper(*args, **kwargs):
            now = time.time()
            with lock:
                if store["value"] is None or now >= store["expires_at"]:
                    store["value"] = fn(*args, **kwargs)
                    store["expires_at"] = now + seconds
                return store["value"]

        wrapper.invalidate = lambda: store.update(value=None, expires_at=0.0)  # type: ignore
        return wrapper

    return decorator
