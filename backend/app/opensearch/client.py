"""OpenSearch client factory."""
from functools import lru_cache

from opensearchpy import OpenSearch

from app.config import settings


@lru_cache(maxsize=1)
def get_client() -> OpenSearch:
    auth = None
    if settings.opensearch_user:
        auth = (settings.opensearch_user, settings.opensearch_password)
    return OpenSearch(
        hosts=settings.opensearch_host_list,
        http_auth=auth,
        verify_certs=settings.opensearch_verify_certs,
        timeout=10,
        max_retries=2,
        retry_on_timeout=True,
    )
