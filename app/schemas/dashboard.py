from app.schemas.applications import ApplicationStatus
from app.schemas.common import ORMModel


class DashboardStats(ORMModel):
    total_applications: int
    applications_by_status: dict[ApplicationStatus, int]
    total_interviews: int
    total_offers: int
    total_rejections: int
    upcoming_interviews: int
    overdue_follow_ups: int
