"""Remove unused account roles and active state.

Revision ID: 0003_remove_user_roles
Revises: 0002_user_roles
"""

import sqlalchemy as sa
from alembic import op

revision = "0003_remove_user_roles"
down_revision = "0002_user_roles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_constraint("ck_users_role", type_="check")
        batch_op.drop_column("is_active")
        batch_op.drop_column("role")


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(
            sa.Column("role", sa.String(length=20), server_default="USER", nullable=False)
        )
        batch_op.add_column(
            sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False)
        )
        batch_op.create_check_constraint(
            "ck_users_role",
            "role IN ('USER', 'ADMIN', 'SUPERADMIN')",
        )
