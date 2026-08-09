"""merge migration heads

Revision ID: 86bbb97a6588
Revises: 0723ba5c624b, d94513d1ee72
Create Date: 2026-08-09 00:32:36.224894

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '86bbb97a6588'
down_revision = ('0723ba5c624b', 'd94513d1ee72')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
