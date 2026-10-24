from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.applications import get_owned_application
from app.api.dependencies import CurrentUser, DbSession
from app.models import FollowUp, Interview, JobApplication
from app.schemas.activities import (
    FollowUpCreate,
    FollowUpRead,
    FollowUpUpdate,
    InterviewCreate,
    InterviewRead,
    InterviewUpdate,
)

router = APIRouter(tags=["interviews and follow-ups"])


@router.post(
    "/applications/{application_id}/interviews",
    response_model=InterviewRead,
    status_code=status.HTTP_201_CREATED,
)
def create_interview(
    application_id: int, payload: InterviewCreate, db: DbSession, current_user: CurrentUser
) -> Interview:
    application = get_owned_application(db, application_id, current_user.id)
    data = payload.model_dump()
    if data["meeting_link"] is not None:
        data["meeting_link"] = str(data["meeting_link"])
    interview = Interview(**data, application_id=application.id)
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


@router.get("/interviews/upcoming", response_model=list[InterviewRead])
def list_upcoming_interviews(
    db: DbSession, current_user: CurrentUser, limit: int = Query(default=50, ge=1, le=100)
) -> list[Interview]:
    return list(
        db.scalars(
            select(Interview)
            .join(JobApplication)
            .where(
                JobApplication.user_id == current_user.id,
                Interview.interview_at >= datetime.now(UTC),
            )
            .order_by(Interview.interview_at)
            .limit(limit)
        ).all()
    )


@router.get("/applications/{application_id}/interviews", response_model=list[InterviewRead])
def list_application_interviews(
    application_id: int, db: DbSession, current_user: CurrentUser
) -> list[Interview]:
    get_owned_application(db, application_id, current_user.id)
    return list(
        db.scalars(
            select(Interview)
            .where(Interview.application_id == application_id)
            .order_by(Interview.interview_at)
        ).all()
    )


@router.get("/interviews/{interview_id}", response_model=InterviewRead)
def read_interview(interview_id: int, db: DbSession, current_user: CurrentUser) -> Interview:
    interview = db.scalar(
        select(Interview)
        .join(JobApplication)
        .where(Interview.id == interview_id, JobApplication.user_id == current_user.id)
    )
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


@router.patch("/interviews/{interview_id}", response_model=InterviewRead)
def update_interview(
    interview_id: int, payload: InterviewUpdate, db: DbSession, current_user: CurrentUser
) -> Interview:
    interview = db.scalar(
        select(Interview)
        .join(JobApplication)
        .where(Interview.id == interview_id, JobApplication.user_id == current_user.id)
    )
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("meeting_link") is not None:
        updates["meeting_link"] = str(updates["meeting_link"])
    for field, value in updates.items():
        setattr(interview, field, value)
    db.commit()
    db.refresh(interview)
    return interview


@router.post(
    "/applications/{application_id}/follow-ups",
    response_model=FollowUpRead,
    status_code=status.HTTP_201_CREATED,
)
def create_follow_up(
    application_id: int, payload: FollowUpCreate, db: DbSession, current_user: CurrentUser
) -> FollowUp:
    application = get_owned_application(db, application_id, current_user.id)
    follow_up = FollowUp(**payload.model_dump(), application_id=application.id)
    db.add(follow_up)
    db.commit()
    db.refresh(follow_up)
    return follow_up


@router.get("/follow-ups/upcoming", response_model=list[FollowUpRead])
def list_upcoming_follow_ups(
    db: DbSession, current_user: CurrentUser, limit: int = Query(default=50, ge=1, le=100)
) -> list[FollowUp]:
    return _list_follow_ups(db, current_user.id, datetime.now(UTC), False, limit)


@router.get("/follow-ups/overdue", response_model=list[FollowUpRead])
def list_overdue_follow_ups(
    db: DbSession, current_user: CurrentUser, limit: int = Query(default=50, ge=1, le=100)
) -> list[FollowUp]:
    return _list_follow_ups(db, current_user.id, datetime.now(UTC), True, limit)


def _list_follow_ups(
    db: DbSession, user_id: int, now: datetime, overdue: bool, limit: int
) -> list[FollowUp]:
    due_filter = FollowUp.due_at < now if overdue else FollowUp.due_at >= now
    return list(
        db.scalars(
            select(FollowUp)
            .join(JobApplication)
            .where(
                JobApplication.user_id == user_id,
                FollowUp.is_completed.is_(False),
                due_filter,
            )
            .order_by(FollowUp.due_at)
            .limit(limit)
        ).all()
    )


@router.get("/applications/{application_id}/follow-ups", response_model=list[FollowUpRead])
def list_application_follow_ups(
    application_id: int, db: DbSession, current_user: CurrentUser
) -> list[FollowUp]:
    get_owned_application(db, application_id, current_user.id)
    return list(
        db.scalars(
            select(FollowUp)
            .where(FollowUp.application_id == application_id)
            .order_by(FollowUp.due_at)
        ).all()
    )


@router.get("/follow-ups/{follow_up_id}", response_model=FollowUpRead)
def read_follow_up(follow_up_id: int, db: DbSession, current_user: CurrentUser) -> FollowUp:
    follow_up = db.scalar(
        select(FollowUp)
        .join(JobApplication)
        .where(FollowUp.id == follow_up_id, JobApplication.user_id == current_user.id)
    )
    if follow_up is None:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    return follow_up


@router.patch("/follow-ups/{follow_up_id}", response_model=FollowUpRead)
def update_follow_up(
    follow_up_id: int, payload: FollowUpUpdate, db: DbSession, current_user: CurrentUser
) -> FollowUp:
    follow_up = db.scalar(
        select(FollowUp)
        .join(JobApplication)
        .where(FollowUp.id == follow_up_id, JobApplication.user_id == current_user.id)
    )
    if follow_up is None:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(follow_up, field, value)
    db.commit()
    db.refresh(follow_up)
    return follow_up
