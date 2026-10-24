from fastapi.testclient import TestClient


def test_registration_login_and_me(client: TestClient) -> None:
    registration = client.post(
        "/auth/register",
        json={"name": "Alex", "email": "Alex@example.com", "password": "a-secure-password-123"},
    )
    assert registration.status_code == 201
    assert registration.json()["email"] == "alex@example.com"
    assert "password_hash" not in registration.json()
    login = client.post(
        "/auth/login",
        json={"email": "alex@example.com", "password": "a-secure-password-123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert client.get("/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 200


def test_duplicate_email_and_invalid_credentials(client: TestClient) -> None:
    payload = {"name": "Alex", "email": "alex@example.com", "password": "a-secure-password-123"}
    assert client.post("/auth/register", json=payload).status_code == 201
    assert client.post("/auth/register", json=payload).status_code == 409
    assert (
        client.post(
            "/auth/login", json={"email": payload["email"], "password": "wrong-password"}
        ).status_code
        == 401
    )


def test_registration_rejects_short_password(client: TestClient) -> None:
    response = client.post(
        "/auth/register", json={"name": "Alex", "email": "alex@example.com", "password": "short"}
    )
    assert response.status_code == 422


def test_administration_endpoints_are_not_available(client: TestClient) -> None:
    assert client.get("/admin/users").status_code == 404
    assert client.patch("/admin/users/1/role", json={"role": "SUPERADMIN"}).status_code == 404
