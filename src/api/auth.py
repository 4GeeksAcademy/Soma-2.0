import os
import secrets
from datetime import datetime, timedelta

from flask import Blueprint, current_app, jsonify, redirect, request
from flask_cors import CORS
from flask_jwt_extended import create_access_token, decode_token, get_jwt_identity, verify_jwt_in_request
from flask_mail import Message

from api import google_calendar
from api.extensions import mail
from api.models import Clinica, Usuario, db

auth = Blueprint("auth", __name__, url_prefix="/api/auth")
CORS(auth)

RESET_TOKEN_VIGENCIA_HORAS = 1


@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify(error="email y password son requeridos"), 400

    # email es global y unico (#66) -- no hace falta pedir la clinica aparte,
    # el Usuario encontrado ya trae su propio clinica_id.
    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario or not usuario.activo or not usuario.check_password(password):
        return jsonify(error="credenciales inválidas"), 401

    clinica = Clinica.query.get(usuario.clinica_id)

    access_token = create_access_token(
        identity=str(usuario.id),
        additional_claims={
            "rol": usuario.rol.value,
            "nombre": usuario.nombre,
            "clinica_id": usuario.clinica_id,
        },
        expires_delta=timedelta(hours=8),
    )

    return jsonify(access_token=access_token, usuario=usuario.serialize(), clinica=clinica.serialize())


@auth.route("/google/callback", methods=["GET"])
def google_calendar_callback():
    """Callback de OAuth2 para conectar el Google Calendar de una Clinica (#71).

    Vive en el blueprint de auth (no en clinica.py) porque GOOGLE_REDIRECT_URI
    ya estaba registrado apuntando a esta ruta exacta desde el spike original
    (ver .env.example) -- cambiar el path implicaria volver a registrar el
    redirect URI en la consola de Google Cloud.

    El 'state' es el JWT de la sesion del Admin que inicio la conexion (ver
    api/clinica.py) -- se decodifica aqui para saber a que clinica_id
    pertenece, ya que esta ruta la visita Google directo (sin header
    Authorization posible en una redireccion de navegador).
    """
    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
    destino = f"{frontend_url}/app/perfil"
    code = request.args.get("code")
    state = request.args.get("state")

    if not code or not state:
        return redirect(f"{destino}?google_calendar=error")

    try:
        claims = decode_token(state)
    except Exception:
        return redirect(f"{destino}?google_calendar=error")

    if claims.get("rol") != "admin":
        return redirect(f"{destino}?google_calendar=error")

    clinica_actual = Clinica.query.get(claims.get("clinica_id"))
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")

    if not clinica_actual or not redirect_uri:
        return redirect(f"{destino}?google_calendar=error")

    try:
        refresh_token, email = google_calendar.intercambiar_codigo(code, redirect_uri)
    except Exception as error:
        print(f"[auth] no se pudo intercambiar el codigo de Google Calendar: {error}")
        return redirect(f"{destino}?google_calendar=error")

    if not refresh_token:
        return redirect(f"{destino}?google_calendar=error")

    clinica_actual.google_refresh_token = refresh_token
    clinica_actual.google_cuenta_email = email
    db.session.commit()

    return redirect(f"{destino}?google_calendar=conectado")


@auth.route("/cambiar-password", methods=["POST"])
def cambiar_password():
    """Cambio de password autenticado -- usado en el primer login cuando debe_cambiar_password=True (#23)."""
    verify_jwt_in_request()
    usuario = Usuario.query.get_or_404(int(get_jwt_identity()))

    data = request.get_json(silent=True) or {}
    password_actual = data.get("password_actual")
    password_nueva = data.get("password_nueva")

    if not password_actual or not password_nueva:
        return jsonify(error="password_actual y password_nueva son requeridos"), 400
    if not usuario.check_password(password_actual):
        return jsonify(error="password_actual incorrecta"), 401

    usuario.set_password(password_nueva)
    usuario.debe_cambiar_password = False
    db.session.commit()
    return jsonify(mensaje="password actualizada")


def _enviar_email_reset(usuario, token):
    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:5173")
    link = f"{frontend_url}/restablecer-password?token={token}"
    try:
        mensaje = Message(
            subject="Restablecer tu contraseña - Soma",
            recipients=[usuario.email],
            body=(
                f"Hola {usuario.nombre},\n\n"
                f"Usa este link para restablecer tu contraseña (valido {RESET_TOKEN_VIGENCIA_HORAS}h):\n{link}\n\n"
                "Si no lo solicitaste, ignora este mensaje."
            ),
        )
        mail.send(mensaje)
    except Exception as error:
        print(f"[auth] no se pudo enviar el email de reset a {usuario.email}: {error}")


@auth.route("/reset-password/solicitar", methods=["POST"])
def solicitar_reset_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    if not email:
        return jsonify(error="email es requerido"), 400

    usuario = Usuario.query.filter_by(email=email).first()
    if usuario:
        token = secrets.token_urlsafe(32)
        usuario.reset_token = token
        usuario.reset_token_expira = datetime.utcnow() + timedelta(hours=RESET_TOKEN_VIGENCIA_HORAS)
        db.session.commit()
        _enviar_email_reset(usuario, token)

    # Respuesta generica siempre, exista o no el email -- evita filtrar que emails estan registrados.
    return jsonify(mensaje="si el email existe, se envio un link de restablecimiento")


@auth.route("/reset-password/confirmar", methods=["POST"])
def confirmar_reset_password():
    data = request.get_json(silent=True) or {}
    token = data.get("token")
    password_nueva = data.get("password_nueva")

    if not token or not password_nueva:
        return jsonify(error="token y password_nueva son requeridos"), 400

    usuario = Usuario.query.filter_by(reset_token=token).first()
    if not usuario or not usuario.reset_token_expira or usuario.reset_token_expira < datetime.utcnow():
        return jsonify(error="token invalido o expirado"), 400

    usuario.set_password(password_nueva)
    usuario.debe_cambiar_password = False
    usuario.reset_token = None
    usuario.reset_token_expira = None
    db.session.commit()
    return jsonify(mensaje="password restablecida")
