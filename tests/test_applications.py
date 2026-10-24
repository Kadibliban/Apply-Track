from fastapi.testclient import TestClient


def test_application_crud_filters_search_and_pagination(
    client: TestClient, auth_headers: dict[str, str], application_payload: dict[str, object]
) -> None:
    first = client.post("/applications", json=application_payload, headers=auth_headers)
    assert first.status_code == 201
    assert first.json()["user_id"] > 0
    second_payload = {
        **application_payload,
        "company": "Other Corp",
        "job_title": "Data Engineer",
        "status": "INTERVIEW",
    }
    assert (
        client.post("/applications", json=second_payload, headers=auth_headers).status_code == 201
    )

    filtered = client.get("/applications?status=APPLIED&company=acme", headers=auth_headers)
    assert filtered.status_code == 200
    assert len(filtered.json()) == 1
    assert (
        client.get("/applications?search=data", headers=auth_headers).json()[0]["company"]
        == "Other Corp"
    )
    assert len(client.get("/applications?limit=1&offset=0", headers=auth_headers).json()) == 1
    assert (
        client.get(
            "/applications?date_from=2026-10-24&date_to=2026-10-22", headers=auth_headers
        ).status_code
        == 422
    )

    application_id = first.json()["id"]
    updated = client.patch(
        f"/applications/{application_id}", json={"status": "OFFER"}, headers=auth_headers
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "OFFER"
    assert (
        client.patch(
            f"/applications/{application_id}", json={"company": None}, headers=auth_headers
        ).status_code
        == 422
    )
    assert client.get(f"/applications/{application_id}", headers=auth_headers).status_code == 200
    assert client.delete(f"/applications/{application_id}", headers=auth_headers).status_code == 204
    assert client.get(f"/applications/{application_id}", headers=auth_headers).status_code == 404


def test_application_validation_and_unauthorized(
    client: TestClient, application_payload: dict[str, object]
) -> None:
    assert client.get("/applications").status_code == 401
    assert client.post("/applications", json=application_payload).status_code == 401
    bad = {**application_payload, "status": "UNKNOWN"}
    assert (
        client.post(
            "/auth/register",
            json={"name": "A", "email": "a@example.com", "password": "a-secure-password-123"},
        ).status_code
        == 201
    )
    token = client.post(
        "/auth/login", json={"email": "a@example.com", "password": "a-secure-password-123"}
    ).json()["access_token"]
    assert (
        client.post(
            "/applications", json=bad, headers={"Authorization": f"Bearer {token}"}
        ).status_code
        == 422
    )
    invalid_salary = {**application_payload, "salary_min": 150, "salary_max": 100}
    assert (
        client.post(
            "/applications", json=invalid_salary, headers={"Authorization": f"Bearer {token}"}
        ).status_code
        == 422
    )


def test_users_cannot_access_each_others_applications(
    client: TestClient, auth_headers: dict[str, str], application_payload: dict[str, object]
) -> None:
    created = client.post("/applications", json=application_payload, headers=auth_headers).json()
    client.post(
        "/auth/register",
        json={"name": "Other", "email": "other@example.com", "password": "another-secure-pass123"},
    )
    other_token = client.post(
        "/auth/login", json={"email": "other@example.com", "password": "another-secure-pass123"}
    ).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}
    assert client.get(f"/applications/{created['id']}", headers=other_headers).status_code == 404
    assert (
        client.patch(
            f"/applications/{created['id']}", json={"status": "OFFER"}, headers=other_headers
        ).status_code
        == 404
    )
    assert client.delete(f"/applications/{created['id']}", headers=other_headers).status_code == 404
