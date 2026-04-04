"""Initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Таблицы создаются автоматически через Base.metadata.create_all
    pass


def downgrade() -> None:
    pass