"""FastAPI entry point for the SCP dashboard BFF."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import metrics

logging.basicConfig(level=settings.log_level)

app = FastAPI(
    title="SCP Dashboard BFF",
    description="Backend-for-frontend serving Tab1 (서비스 현황) data from OpenSearch.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api/dashboard", tags=["metrics"])


@app.get("/health")
def health():
    return {"status": "ok"}
