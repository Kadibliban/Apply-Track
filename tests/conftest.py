import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-key-never-use-in-production")

from app.db.base import Base
from app.db.session import get_db
from app.main import app

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def user_token(client: TestClient) -> str:
    response = client.post(
        "/auth/register",
        json={"name": "Test User", "email": "test@example.com", "password": "verysecurepass123"},
    )
    assert response.status_code == 201
    login = client.post(
        "/auth/login", json={"email": "test@example.com", "password": "verysecurepass123"}
    )
    assert login.status_code == 200
    return login.json()["access_token"]


@pytest.fixture
def auth_headers(user_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def application_payload() -> dict[str, object]:
    return {
        "company": "Acme",
        "job_title": "Backend Engineer",
        "application_date": "2026-10-23",
        "status": "APPLIED",
    }
