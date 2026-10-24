# ApplyTrack

ApplyTrack is a REST API for tracking job applications, interviews, and follow-up reminders. It uses FastAPI, SQLAlchemy 2, PostgreSQL, Alembic, JWT bearer authentication, and Argon2 password hashing.

## Requirements

- Python 3.12+
- PostgreSQL 16+ (or Docker Compose)

## Local setup

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

Set `DATABASE_URL` to a PostgreSQL database you control, choose a database password, and replace `JWT_SECRET_KEY` with a random secret of at least 32 characters. The API refuses to start if the key is missing or too short. Then run:

```powershell
alembic upgrade head
uvicorn app.main:app --reload
```

The API is at <http://localhost:8000>; interactive Swagger documentation is at <http://localhost:8000/docs>. `GET /health` checks the database connection.

## Docker Compose

```powershell
Copy-Item .env.example .env
# Replace every replace-this placeholder with local values; use a URL-safe database password.
docker compose up --build
```

Compose starts PostgreSQL and the API; the API waits for database health and applies migrations at startup. Stop with `Ctrl+C`; `docker compose down` stops containers. `docker compose down -v` also deletes the local database volume. The example values are placeholders only; do not expose them or use them in production.

## Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `APP_NAME` | FastAPI application title | `ApplyTrack` |
| `ENVIRONMENT` | Deployment environment | `development` |
| `DATABASE_URL` | SQLAlchemy PostgreSQL URL | local PostgreSQL URL |
| `JWT_SECRET_KEY` | Secret used to sign access tokens (required, 32+ characters) | none |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `30` |
| `LOG_LEVEL` | Python logging level | `INFO` |
| `FRONTEND_ORIGIN` | Allowed browser origin for the frontend | `http://localhost:5173` |

The `.env.example` values are placeholders, not production credentials. `.env` is excluded from Git.

## Account access

ApplyTrack provides a user-facing tracker only. Each signed-in user can access and manage their own applications, interviews, follow-ups, and dashboard. There is no admin or superadmin portal or account-management API. All accounts, including accounts that previously had an admin role, use the same user experience and can access only their own records.

The migration history includes earlier role-related schema revisions for upgrade compatibility. The latest migration (`0003_remove_user_roles`) removes those role fields. Apply migrations with `alembic upgrade head` before starting the API.

## Frontend

The React + TypeScript frontend lives in `frontend/` and connects to this API. Configure the backend's `FRONTEND_ORIGIN` to the frontend origin (default `http://localhost:5173`) so the browser can make authenticated API requests.

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open <http://localhost:5173>. The frontend `.env` variable `VITE_API_URL` defaults to `http://localhost:8000`; set it to the API origin if your backend uses a different URL. To run frontend tests and create a production build, use `npm test` and `npm run build`. Start the backend separately using the local setup instructions above.

## Database migrations

Create a revision after changing models:

```powershell
alembic revision --autogenerate -m "describe schema change"
alembic upgrade head
```

Use `alembic downgrade -1` to revert one migration. Supply `DATABASE_URL` for the target database.

## Tests

```powershell
python -m pip install -e ".[dev]"
pytest
```

Tests use an isolated in-memory SQLite database and do not touch the configured development database. The migration itself is designed for PostgreSQL.

## API overview

All application, interview, follow-up, and dashboard endpoints require `Authorization: Bearer <access_token>`. Register and log in using JSON:

```http
POST /auth/register
Content-Type: application/json

{"name":"Alex Example","email":"alex@example.com","password":"use-a-long-password"}
```

```http
POST /auth/login
Content-Type: application/json

{"email":"alex@example.com","password":"use-a-long-password"}
```

Example successful login response:

```json
{"access_token":"<signed-token>","token_type":"bearer"}
```

Create an application with the returned token:

```http
POST /applications
Authorization: Bearer <access_token>
Content-Type: application/json

{"company":"Example Inc","job_title":"Backend Engineer","job_url":"https://example.com/jobs/42","location":"Remote","employment_type":"Full-time","salary_min":120000,"salary_max":150000,"application_date":"2026-10-23","status":"APPLIED","notes":"Referral"}
```

Example application response:

```json
{
  "id": 1,
  "user_id": 1,
  "company": "Example Inc",
  "job_title": "Backend Engineer",
  "job_url": "https://example.com/jobs/42",
  "location": "Remote",
  "employment_type": "Full-time",
  "salary_min": 120000,
  "salary_max": 150000,
  "application_date": "2026-10-23",
  "status": "APPLIED",
  "job_description": null,
  "notes": "Referral",
  "created_at": "2026-10-23T12:00:00Z",
  "updated_at": "2026-10-23T12:00:00Z"
}
```

List/filter applications using `GET /applications?status=APPLIED&company=Example&search=backend&limit=20&offset=0`. Application statuses are `APPLIED`, `ASSESSMENT`, `INTERVIEW`, `OFFER`, `REJECTED`, and `WITHDRAWN`. Create interviews at `/applications/{id}/interviews`, follow-ups at `/applications/{id}/follow-ups`, and view user-specific summary data at `/dashboard/stats`. All timestamps must include a timezone offset.

Validation and application errors use a consistent `{"detail":"..."}` response. Swagger at `/docs` documents request and response schemas.
