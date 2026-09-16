"""
DSS Ask Policy FastAPI Application Entrypoint.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.features.admin.router import router as admin_router
from app.features.chat.router import router as chat_router
from app.features.escalations.router import router as escalations_router
from app.features.ops.router import router as ops_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    yield
    # Shutdown logic


app = FastAPI(
    title="DSS Ask Policy API",
    description="Enterprise Policy Assistant & HR Ops Console Backend",
    version="1.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Feature Routers
app.include_router(chat_router)
app.include_router(escalations_router)
app.include_router(ops_router)
app.include_router(admin_router)


@app.get("/healthz", tags=["Health"])
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "env": settings.app_env,
        "release": "v1.0.0",
        "service": "dss-ask-policy-backend",
    }
