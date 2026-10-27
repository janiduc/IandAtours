import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.db import Base, get_db
from app.main import app
from app.models import Role, User
from app.security import booking_limiter, hash_password, login_limiter
from app.seed import seed

PASSWORD = "correct-horse-battery"


@pytest.fixture
def session_factory(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    TestSession = sessionmaker(bind=engine, expire_on_commit=False)
    Base.metadata.create_all(engine)
    with TestSession() as session:
        seed(session)
        session.add_all(
            [
                User(email="admin@iandatours.lk", name="Admin", role=Role.admin, password_hash=hash_password(PASSWORD)),
                User(email="staff@iandatours.lk", name="Staff", role=Role.staff, password_hash=hash_password(PASSWORD)),
            ]
        )
        session.commit()

    # Keep app startup off the developer's real database.
    monkeypatch.setattr(settings, "auto_migrate", False)
    monkeypatch.setattr(settings, "seed_on_startup", False)
    monkeypatch.setattr(settings, "payhere_merchant_id", "")
    monkeypatch.setattr(settings, "payhere_merchant_secret", "")
    login_limiter.reset()
    booking_limiter.reset()
    return TestSession


@pytest.fixture
def client(session_factory):
    def override_get_db():
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def login(client: TestClient, email: str) -> TestClient:
    response = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert response.status_code == 200, response.text
    return client


@pytest.fixture
def staff_client(client):
    return login(client, "staff@iandatours.lk")


@pytest.fixture
def admin_client(client):
    return login(client, "admin@iandatours.lk")


@pytest.fixture
def payhere_enabled(monkeypatch):
    monkeypatch.setattr(settings, "payhere_merchant_id", "1211149")
    monkeypatch.setattr(settings, "payhere_merchant_secret", "test-secret")
