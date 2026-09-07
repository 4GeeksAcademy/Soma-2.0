"""add paquete paciente sesion

Revision ID: e581e34595e7
Revises: a9319846ad7c
Create Date: 2026-09-04 03:27:26.481281

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e581e34595e7"
down_revision = "a9319846ad7c"
branch_labels = None
depends_on = None


def upgrade():
    # La FK hacia cita va inline en el create_table (no en un
    # op.create_foreign_key aparte despues) -- SQLite no soporta "ALTER TABLE
    # ADD CONSTRAINT" fuera de batch mode, y esta tabla es nueva en esta misma
    # migracion, asi que no hace falta ALTER para nada de lo suyo.
    op.create_table(
        "paquete_paciente_sesion",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("paquete_paciente_id", sa.Integer(), nullable=False),
        sa.Column("servicio_id", sa.Integer(), nullable=False),
        sa.Column(
            "estado",
            sa.Enum(
                "PENDIENTE",
                "APLICADA",
                name="estadopaquetepacientesesion",
            ),
            nullable=False,
        ),
        sa.Column("cita_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["paquete_paciente_id"],
            ["paquete_paciente.id"],
        ),
        sa.ForeignKeyConstraint(
            ["servicio_id"],
            ["servicio.id"],
        ),
        sa.ForeignKeyConstraint(
            ["cita_id"],
            ["cita.id"],
            name="fk_paquete_paciente_sesion_cita_id",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add the FK from cita to paquete_paciente_sesion.
    with op.batch_alter_table("cita", schema=None) as batch_op:
        batch_op.create_foreign_key(
            "fk_cita_paquete_paciente_sesion_id",
            "paquete_paciente_sesion",
            ["paquete_paciente_sesion_id"],
            ["id"],
        )


def downgrade():
    # Remove the FK from cita first.
    with op.batch_alter_table("cita", schema=None) as batch_op:
        batch_op.drop_constraint(
            "fk_cita_paquete_paciente_sesion_id",
            type_="foreignkey",
        )

    # Borrar la tabla completa ya se lleva entre las manos la FK hacia cita
    # (estaba inline en su create_table) -- no hace falta un drop_constraint
    # aparte, que es justo el que no funciona fuera de batch mode en SQLite.
    op.drop_table("paquete_paciente_sesion")

    # Postgres no borra el tipo ENUM al borrar la tabla, hay que hacerlo
    # explicito o queda huerfano y el proximo upgrade truena con
    # "ya existe un tipo estadopaquetepacientesesion".
    sa.Enum(name="estadopaquetepacientesesion").drop(
        op.get_bind(), checkfirst=True)
