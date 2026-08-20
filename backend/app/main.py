from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import api_router
from app.core.config import settings
from app.core.database import Base, engine

import os
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup as a fail-safe fallback (skip during testing)
    if not os.getenv("TESTING"):
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"Warning: Database connection failed during startup table creation: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

from fastapi.responses import JSONResponse
import traceback
from fastapi import Request

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        tb = traceback.format_exc()
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Internal Server Error: {str(e)}",
                "traceback": tb
            }
        )

# Set CORS origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include central API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root_endpoint():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} REST API",
        "documentation": "/docs",
        "status": "healthy"
    }
