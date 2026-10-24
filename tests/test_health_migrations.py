from datetime import date

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import JobApplication, User


def test_health_and_docs(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/docs").status_code == 200


def test_frontend_cors_preflight(client: TestClient) -> None:
    response = client.options(
        "/auth/me",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_migration_head_revision() -> None:
    scripts = ScriptDirectory.from_config(Config("alembic.ini"))
    revision = scripts.get_revision("head")
    assert revision is not None
    assert revision.revision == "0003_remove_user_roles"
    assert revision.down_revision == "0002_user_roles"


def test_application_database_constraints() -> None:
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        user = User(name="Constraint Test", email="constraint@example.com", password_hash="hash")
        db.add(user)
        db.commit()

        invalid_applications = [
            {"status": "INVALID", "salary_min": 10, "salary_max": 20},
            {"status": "APPLIED", "salary_min": 200, "salary_max": 100},
        ]
        for values in invalid_applications:
            with pytest.raises(IntegrityError):
                db.add(
                    JobApplication(
                        user_id=user.id,
                        company="Acme",
                        job_title="Engineer",
                        application_date=date(2026, 10, 23),
                        **values,
                    )
                )
                db.flush()
            db.rollback()
    engine.dispose()
