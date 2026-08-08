
import click
from api.models import RolUsuario, Usuario, db

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration
with youy database, for example: Import the price of bitcoin every night as 12am
"""
def setup_commands(app):

    """
    Crea el primer usuario Admin (no hay auto-registro público, ver docs/decisiones.md).
    Uso: $ flask seed-admin --email admin@soma.dev --password "algo" --nombre "Admin"
    """
    @app.cli.command("seed-admin")
    @click.option("--email", prompt=True)
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    @click.option("--nombre", prompt=True)
    def seed_admin(email, password, nombre):
        if Usuario.query.filter_by(email=email).first():
            print("Ya existe un usuario con ese email.")
            return

        usuario = Usuario(nombre=nombre, email=email, rol=RolUsuario.ADMIN, activo=True)
        usuario.set_password(password)
        db.session.add(usuario)
        db.session.commit()
        print(f"Admin creado: {email}")