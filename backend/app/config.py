"""Centralized settings, populated from environment variables / .env file."""
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # OpenSearch
    opensearch_hosts: str = "http://localhost:9200"
    opensearch_user: str = ""
    opensearch_password: str = ""
    opensearch_index: str = "apigw-access-*"
    opensearch_verify_certs: bool = True

    # Field names — override per environment
    os_field_service: str = "service.name.keyword"
    os_field_resp_time: str = "response_time_ms"
    os_field_status: str = "status"
    os_field_path: str = "http.path.keyword"
    os_field_method: str = "http.method.keyword"
    os_field_timestamp: str = "@timestamp"

    # Server behavior
    cache_ttl_seconds: int = 60
    cors_origins: str = "*"
    log_level: str = "INFO"

    @property
    def opensearch_host_list(self) -> List[str]:
        return [h.strip() for h in self.opensearch_hosts.split(",") if h.strip()]

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
