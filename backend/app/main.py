from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import SessionLocal
from app.migrate import upgrade_to_head
from app.routers import admin, assistant, auth, bookings, payments, tours, vehicles
from app.seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.auto_migrate:
        upgrade_to_head(settings.database_url)
    if settings.seed_on_startup:
        with SessionLocal() as db:
            seed(db)
    yield


IS_PRODUCTION = settings.is_production

app = FastAPI(
    title="I&A Tours API",
    lifespan=lifespan,
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None,
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.path.startswith(("/api/admin", "/api/auth", "/api/bookings", "/api/assistant")):
        response.headers["Cache-Control"] = "no-store"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


for router in (tours, vehicles, bookings, payments, auth, admin, assistant):
    app.include_router(router.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
