from datetime import date
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import select

from app.api.dependencies import CurrentUser, DbSession
from app.models import JobApplication
from app.schemas.applications import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatus,
    ApplicationUpdate,
)

router = APIRouter(prefix="/applications", tags=["applications"])


def get_owned_application(db: DbSession, application_id: int, user_id: int) -> JobApplication:
    application = db.scalar(
        select(JobApplication).where(
            JobApplication.id == application_id, JobApplication.user_id == user_id
        )
    )
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate, db: DbSession, current_user: CurrentUser
) -> JobApplication:
    data = payload.model_dump()
    if data["job_url"] is not None:
        data["job_url"] = str(data["job_url"])
    application = JobApplication(**data, user_id=current_user.id)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("", response_model=list[ApplicationRead])
def list_applications(
    db: DbSession,
    current_user: CurrentUser,
    status_filter: Annotated[ApplicationStatus | None, Query(alias="status")] = None,
    company: str | None = None,
    job_title: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = Query(default=None, min_length=1, max_length=200),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[JobApplication]:
    query = select(JobApplication).where(JobApplication.user_id == current_user.id)
    if status_filter is not None:
        query = query.where(JobApplication.status == status_filter)
    if company:
        query = query.where(JobApplication.company.ilike(f"%{company}%"))
    if job_title:
        query = query.where(JobApplication.job_title.ilike(f"%{job_title}%"))
    if date_from is not None:
        query = query.where(JobApplication.application_date >= date_from)
    if date_to is not None:
        query = query.where(JobApplication.application_date <= date_to)
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(status_code=422, detail="date_from must be on or before date_to")
    if search:
        pattern = f"%{search}%"
        query = query.where(
            JobApplication.company.ilike(pattern) | JobApplication.job_title.ilike(pattern)
        )
    return list(
        db.scalars(
            query.order_by(JobApplication.application_date.desc(), JobApplication.id.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )


@router.get("/{application_id}", response_model=ApplicationRead)
def read_application(
    application_id: int, db: DbSession, current_user: CurrentUser
) -> JobApplication:
    return get_owned_application(db, application_id, current_user.id)


@router.patch("/{application_id}", response_model=ApplicationRead)
def update_application(
    application_id: int, payload: ApplicationUpdate, db: DbSession, current_user: CurrentUser
) -> JobApplication:
    application = get_owned_application(db, application_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("job_url") is not None:
        updates["job_url"] = str(updates["job_url"])
    minimum = updates.get("salary_min", application.salary_min)
    maximum = updates.get("salary_max", application.salary_max)
    if minimum is not None and maximum is not None and minimum > maximum:
        raise HTTPException(status_code=422, detail="salary_min must not exceed salary_max")
    for field, value in updates.items():
        setattr(application, field, value)
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(application_id: int, db: DbSession, current_user: CurrentUser) -> Response:
    application = get_owned_application(db, application_id, current_user.id)
    db.delete(application)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
