"""venta acumulativa: agregar venta_item, mover servicio y paquete de venta

Revision ID: 5e379e39df28
Revises: 8c7ff9173b3e
Create Date: 2026-09-06 22:06:54.403467

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e379e39df28'
down_revision = '8c7ff9173b3e'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('venta_item',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('clinica_id', sa.Integer(), nullable=False),
    sa.Column('venta_id', sa.Integer(), nullable=False),
    sa.Column('servicio_id', sa.Integer(), nullable=True),
    sa.Column('paquete_paciente_id', sa.Integer(), nullable=True),
    sa.Column('monto', sa.Float(), nullable=False),
    sa.ForeignKeyConstraint(['clinica_id'], ['clinica.id'], ),
    sa.ForeignKeyConstraint(['paquete_paciente_id'], ['paquete_paciente.id'], ),
    sa.ForeignKeyConstraint(['servicio_id'], ['servicio.id'], ),
    sa.ForeignKeyConstraint(['venta_id'], ['venta.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    # Migrar datos existentes: cada Venta vieja (un solo servicio o un solo
    # paquete) se vuelve su propio VentaItem antes de borrar las columnas.
    op.execute("""
        INSERT INTO venta_item (clinica_id, venta_id, servicio_id, paquete_paciente_id, monto)
        SELECT clinica_id, id, servicio_id, paquete_paciente_id, monto_total
        FROM venta
        WHERE servicio_id IS NOT NULL OR paquete_paciente_id IS NOT NULL
    """)

    # Sin drop_constraint explicito a proposito: en SQLite el drop de columna
    # recrea la tabla completa a partir del metadata destino (que ya no
    # incluye estas columnas/FKs), y paquete_paciente_id ni siquiera tiene
    # nombre de constraint ahi (ver nota similar en f7417f1596a8). En
    # Postgres, DROP COLUMN tambien tira consigo cualquier constraint que
    # dependa solo de esa columna -- no hace falta el paso aparte en ningun
    # dialecto.
    with op.batch_alter_table('venta', schema=None) as batch_op:
        batch_op.drop_column('servicio_id')
        batch_op.drop_column('paquete_paciente_id')


def downgrade():
    with op.batch_alter_table('venta', schema=None) as batch_op:
        batch_op.add_column(sa.Column('paquete_paciente_id', sa.INTEGER(), nullable=True))
        batch_op.add_column(sa.Column('servicio_id', sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key(batch_op.f('fk_venta_servicio_id_servicio'), 'servicio', ['servicio_id'], ['id'])
        batch_op.create_foreign_key('venta_paquete_paciente_id_fkey', 'paquete_paciente', ['paquete_paciente_id'], ['id'])

    # Restaurar servicio_id/paquete_paciente_id desde el primer VentaItem de
    # cada Venta -- si una Venta tenia varios items, el downgrade solo puede
    # quedarse con uno (se pierde info a proposito: es lo que existia antes).
    op.execute("""
        UPDATE venta
        SET servicio_id = (
            SELECT servicio_id FROM venta_item
            WHERE venta_item.venta_id = venta.id AND venta_item.servicio_id IS NOT NULL
            ORDER BY venta_item.id LIMIT 1
        ),
        paquete_paciente_id = (
            SELECT paquete_paciente_id FROM venta_item
            WHERE venta_item.venta_id = venta.id AND venta_item.paquete_paciente_id IS NOT NULL
            ORDER BY venta_item.id LIMIT 1
        )
    """)

    op.drop_table('venta_item')
