from datetime import timedelta

from flask import Blueprint, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import create_access_token

from api.models import Usuario

auth = Blueprint("auth", __name__, url_prefix="/api/auth")
CORS(auth)


@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify(error="email y password son requeridos"), 400

    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario or not usuario.activo or not usuario.check_password(password):
        return jsonify(error="credenciales inválidas"), 401

    access_token = create_access_token(
        identity=str(usuario.id),
        additional_claims={"rol": usuario.rol.value, "nombre": usuario.nombre},
        expires_delta=timedelta(hours=8),
    )

    return jsonify(access_token=access_token, usuario=usuario.serialize())
