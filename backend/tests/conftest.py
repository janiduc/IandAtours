import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.seed import seed


@pytest.fixture
def client(monkeypatch):
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    TestSession = sessionmaker(bind=engine, expire_on_commit=False)
    Base.metadata.create_all(engine)
    with TestSession() as session:
        seed(session)

    def override_get_db():
        with TestSession() as session:
            yield session

    # Keep app startup off the developer's real database.
    monkeypatch.setattr("app.main.engine", engine)
    monkeypatch.setattr("app.main.SessionLocal", TestSession)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
