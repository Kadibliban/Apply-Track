from datetime import date, datetime
from typing import Literal

from pydantic import Field, HttpUrl, model_validator

from app.schemas.common import ORMModel

ApplicationStatus = Literal["APPLIED", "ASSESSMENT", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]


class ApplicationCreate(ORMModel):
    company: str = Field(min_length=1, max_length=200)
    job_title: str = Field(min_length=1, max_length=200)
    job_url: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=80)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    application_date: date
    status: ApplicationStatus = "APPLIED"
    job_description: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_salary_range(self) -> "ApplicationCreate":
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError("salary_min must not exceed salary_max")
        return self


class ApplicationUpdate(ORMModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    job_title: str | None = Field(default=None, min_length=1, max_length=200)
    job_url: HttpUrl | None = None
    location: str | None = Field(default=None, max_length=200)
    employment_type: str | None = Field(default=None, max_length=80)
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    application_date: date | None = None
    status: ApplicationStatus | None = None
    job_description: str | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def validate_salary_range(self) -> "ApplicationUpdate":
        for field in ("company", "job_title", "application_date", "status"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        minimum = self.salary_min
        maximum = self.salary_max
        if minimum is not None and maximum is not None and minimum > maximum:
            raise ValueError("salary_min must not exceed salary_max")
        return self


class ApplicationRead(ORMModel):
    id: int
    user_id: int
    company: str
    job_title: str
    job_url: str | None
    location: str | None
    employment_type: str | None
    salary_min: int | None
    salary_max: int | None
    application_date: date
    status: ApplicationStatus
    job_description: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
