from datetime import UTC, datetime

from fastapi import APIRouter
from sqlalchemy import func, select

from app.api.dependencies import CurrentUser, DbSession
from app.models import FollowUp, Interview, JobApplication
from app.schemas.applications import ApplicationStatus
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: DbSession, current_user: CurrentUser) -> DashboardStats:
    user_id = current_user.id
    counts = db.execute(
        select(JobApplication.status, func.count(JobApplication.id))
        .where(JobApplication.user_id == user_id)
        .group_by(JobApplication.status)
    ).all()
    by_status: dict[ApplicationStatus, int] = {status: count for status, count in counts}
    for status in ("APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"):
        by_status.setdefault(status, 0)  # type: ignore[arg-type]

    interview_count = (
        db.scalar(
            select(func.count(Interview.id))
            .join(JobApplication)
            .where(JobApplication.user_id == user_id)
        )
        or 0
    )
    now = datetime.now(UTC)
    upcoming_count = (
        db.scalar(
            select(func.count(Interview.id))
            .join(JobApplication)
            .where(JobApplication.user_id == user_id, Interview.interview_at >= now)
        )
        or 0
    )
    overdue_count = (
        db.scalar(
            select(func.count(FollowUp.id))
            .join(JobApplication)
            .where(
                JobApplication.user_id == user_id,
                FollowUp.is_completed.is_(False),
                FollowUp.due_at < now,
            )
        )
        or 0
    )
    return DashboardStats(
        total_applications=sum(by_status.values()),
        applications_by_status=by_status,
        total_interviews=interview_count,
        total_offers=by_status["OFFER"],
        total_rejections=by_status["REJECTED"],
        upcoming_interviews=upcoming_count,
        overdue_follow_ups=overdue_count,
    )
