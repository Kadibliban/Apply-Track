from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_interviews_follow_ups_and_dashboard(
    client: TestClient, auth_headers: dict[str, str], application_payload: dict[str, object]
) -> None:
    app_response = client.post("/applications", json=application_payload, headers=auth_headers)
    application_id = app_response.json()["id"]
    interview_time = (datetime.now(UTC) + timedelta(days=2)).isoformat()
    interview = client.post(
        f"/applications/{application_id}/interviews",
        json={"interview_at": interview_time, "interview_type": "Technical"},
        headers=auth_headers,
    )
    assert interview.status_code == 201
    assert len(client.get("/interviews/upcoming", headers=auth_headers).json()) == 1
    assert (
        client.patch(
            f"/interviews/{interview.json()['id']}",
            json={"interview_type": "Final"},
            headers=auth_headers,
        ).json()["interview_type"]
        == "Final"
    )
    assert (
        client.get(f"/applications/{application_id}/interviews", headers=auth_headers).json()[0][
            "interview_type"
        ]
        == "Final"
    )
    assert (
        client.get(f"/interviews/{interview.json()['id']}", headers=auth_headers).status_code == 200
    )

    overdue = client.post(
        f"/applications/{application_id}/follow-ups",
        json={
            "due_at": (datetime.now(UTC) - timedelta(days=1)).isoformat(),
            "notes": "Email recruiter",
        },
        headers=auth_headers,
    )
    upcoming = client.post(
        f"/applications/{application_id}/follow-ups",
        json={"due_at": (datetime.now(UTC) + timedelta(days=1)).isoformat()},
        headers=auth_headers,
    )
    assert overdue.status_code == 201
    assert len(client.get("/follow-ups/overdue", headers=auth_headers).json()) == 1
    assert len(client.get("/follow-ups/upcoming", headers=auth_headers).json()) == 1
    assert (
        len(client.get(f"/applications/{application_id}/follow-ups", headers=auth_headers).json())
        == 2
    )
    assert (
        client.get(f"/follow-ups/{upcoming.json()['id']}", headers=auth_headers).status_code == 200
    )
    completed = client.patch(
        f"/follow-ups/{overdue.json()['id']}",
        json={"is_completed": True},
        headers=auth_headers,
    )
    assert completed.json()["is_completed"] is True
    stats = client.get("/dashboard/stats", headers=auth_headers).json()
    assert stats["total_applications"] == 1
    assert stats["applications_by_status"]["APPLIED"] == 1
    assert stats["total_interviews"] == 1
    assert stats["upcoming_interviews"] == 1
    assert stats["overdue_follow_ups"] == 0
    assert upcoming.json()["is_completed"] is False


def test_activity_timezone_and_ownership(
    client: TestClient, auth_headers: dict[str, str], application_payload: dict[str, object]
) -> None:
    application_id = client.post(
        "/applications", json=application_payload, headers=auth_headers
    ).json()["id"]
    no_timezone = client.post(
        f"/applications/{application_id}/interviews",
        json={"interview_at": "2026-10-24T12:00:00", "interview_type": "Phone"},
        headers=auth_headers,
    )
    assert no_timezone.status_code == 422
    assert client.get("/interviews/999", headers=auth_headers).status_code == 404
    assert client.get("/follow-ups/999", headers=auth_headers).status_code == 404
    client.post(
        "/auth/register",
        json={"name": "Other", "email": "other@example.com", "password": "another-secure-pass123"},
    )
    other_token = client.post(
        "/auth/login", json={"email": "other@example.com", "password": "another-secure-pass123"}
    ).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}
    assert (
        client.post(
            f"/applications/{application_id}/follow-ups",
            json={"due_at": datetime.now(UTC).isoformat()},
            headers=other_headers,
        ).status_code
        == 404
    )
    own_interview = client.post(
        f"/applications/{application_id}/interviews",
        json={
            "interview_at": (datetime.now(UTC) + timedelta(days=1)).isoformat(),
            "interview_type": "Phone",
        },
        headers=auth_headers,
    ).json()
    own_follow_up = client.post(
        f"/applications/{application_id}/follow-ups",
        json={"due_at": (datetime.now(UTC) + timedelta(days=1)).isoformat()},
        headers=auth_headers,
    ).json()
    assert (
        client.get(f"/interviews/{own_interview['id']}", headers=other_headers).status_code == 404
    )
    assert (
        client.get(f"/follow-ups/{own_follow_up['id']}", headers=other_headers).status_code == 404
    )
