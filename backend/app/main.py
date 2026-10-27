from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, SessionLocal, engine
from app.routers import tours, vehicles
from app.seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    if settings.seed_on_startup:
        with SessionLocal() as db:
            seed(db)
    yield


IS_PRODUCTION = settings.environment == "production"

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
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if IS_PRODUCTION:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
app.include_router(tours.router)
app.include_router(vehicles.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
