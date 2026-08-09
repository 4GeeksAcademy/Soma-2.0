"""unir cabezas de migraciones

Revision ID: b7ec2f6c3e1e
Revises: 1881c7e0768f, 412bb25ac91b
Create Date: 2026-08-09 03:22:19.219185

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b7ec2f6c3e1e'
down_revision = ('1881c7e0768f', '412bb25ac91b')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
