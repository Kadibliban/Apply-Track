from datetime import datetime

from pydantic import Field, HttpUrl, field_validator, model_validator

from app.schemas.common import ORMModel


class InterviewCreate(ORMModel):
    interview_at: datetime
    interview_type: str = Field(min_length=1, max_length=80)
    meeting_link: HttpUrl | None = None
    notes: str | None = None

    @field_validator("interview_at")
    @classmethod
    def require_aware_datetime(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("interview_at must include a timezone offset")
        return value


class InterviewUpdate(ORMModel):
    interview_at: datetime | None = None
    interview_type: str | None = Field(default=None, min_length=1, max_length=80)
    meeting_link: HttpUrl | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def required_fields_cannot_be_null(self) -> "InterviewUpdate":
        for field in ("interview_at", "interview_type"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self

    @field_validator("interview_at")
    @classmethod
    def require_aware_datetime(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("interview_at must include a timezone offset")
        return value


class InterviewRead(ORMModel):
    id: int
    application_id: int
    interview_at: datetime
    interview_type: str
    meeting_link: str | None
    notes: str | None


class FollowUpCreate(ORMModel):
    due_at: datetime
    notes: str | None = None

    @field_validator("due_at")
    @classmethod
    def require_aware_datetime(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("due_at must include a timezone offset")
        return value


class FollowUpUpdate(ORMModel):
    due_at: datetime | None = None
    notes: str | None = None
    is_completed: bool | None = None

    @model_validator(mode="after")
    def due_date_cannot_be_null(self) -> "FollowUpUpdate":
        if "due_at" in self.model_fields_set and self.due_at is None:
            raise ValueError("due_at cannot be null")
        return self

    @field_validator("due_at")
    @classmethod
    def require_aware_datetime(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("due_at must include a timezone offset")
        return value


class FollowUpRead(ORMModel):
    id: int
    application_id: int
    due_at: datetime
    notes: str | None
    is_completed: bool
