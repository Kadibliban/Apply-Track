"""Create ApplyTrack tables.

Revision ID: 0001_initial
Revises:
"""

import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_table(
        "job_applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("company", sa.String(length=200), nullable=False),
        sa.Column("job_title", sa.String(length=200), nullable=False),
        sa.Column("job_url", sa.String(length=2048)),
        sa.Column("location", sa.String(length=200)),
        sa.Column("employment_type", sa.String(length=80)),
        sa.Column("salary_min", sa.Integer()),
        sa.Column("salary_max", sa.Integer()),
        sa.Column("application_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("job_description", sa.Text()),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "status IN ('APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN')",
            name="ck_job_applications_status",
        ),
        sa.CheckConstraint(
            "salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max",
            name="ck_job_applications_salary_range",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_job_applications_user_status", "job_applications", ["user_id", "status"])
    op.create_index(
        "ix_job_applications_user_application_date",
        "job_applications",
        ["user_id", "application_date"],
    )
    op.create_table(
        "interviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("interview_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("interview_type", sa.String(length=80), nullable=False),
        sa.Column("meeting_link", sa.String(length=2048)),
        sa.Column("notes", sa.Text()),
        sa.ForeignKeyConstraint(["application_id"], ["job_applications.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_interviews_application_date", "interviews", ["application_id", "interview_at"]
    )
    op.create_table(
        "follow_ups",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("is_completed", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["job_applications.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_follow_ups_application_due", "follow_ups", ["application_id", "due_at"])


def downgrade() -> None:
    op.drop_index("ix_follow_ups_application_due", table_name="follow_ups")
    op.drop_table("follow_ups")
    op.drop_index("ix_interviews_application_date", table_name="interviews")
    op.drop_table("interviews")
    op.drop_index("ix_job_applications_user_application_date", table_name="job_applications")
    op.drop_index("ix_job_applications_user_status", table_name="job_applications")
    op.drop_table("job_applications")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
