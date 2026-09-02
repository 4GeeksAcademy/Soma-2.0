import secrets
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from api.models import db, Invite, TipoInvite, Paciente, Usuario, RolUsuario


invites_bp = Blueprint("invites_bp", __name__)

@invites_bp.route("/invites", methods=["POST"])
def generar_invite():
    data = request.get_json()
    tipo_str = data.get("tipo")
    paciente_id = data.get("paciente_id")
    email = data.get("email")

    if not tipo_str:
        return jsonify({"msg": "El tipo de invite es requerido"}), 400

    token_seguro = secrets.token_urlsafe(32)

    fecha_expira = datetime.utcnow() + timedelta(days=1)

    nuevo_invite = Invite(
        token=token_seguro,
        tipo=TipoInvite(tipo_str),
        expira=fecha_expira,
        usado=False
    )

    if tipo_str == "cliente":
        if not paciente_id:
            return jsonify({"msg": "paciente_id es requerido para clientes"}), 400
        nuevo_invite.paciente_id = paciente_id
    else:
        if not email:
            return jsonify({"msg": "email es requerido para asistentes/especialistas"}), 400
        nuevo_invite.email = email

    db.session.add(nuevo_invite)
    db.session.commit()

    return jsonify({"msg": "Invite generado con exito", "token": token_seguro}), 201


@invites_bp.route("/invites/<token>", methods=["GET"])
def verificar_invite(token):

    invite = Invite.query.filter_by(token=token).first()

    if not invite:
        return jsonify({"msg": "El invite no existe"}), 404
    if invite.usado:
        return jsonify({"msg": "El invite ya fue usado"}), 400
    if invite.expira < datetime.utcnow():
        return jsonify({"msg": "El invite ha expirado"}), 400

    return jsonify({"msg": "Invite valido", "invite": invite.serialize()}), 200


@invites_bp.route("/invites/<token>/redimir", methods=["POST"])
def redimir_invite(token):
    invite = Invite.query.filter_by(token=token).first()
    if not invite or invite.usado or invite.expira < datetime.utcnow():
        return jsonify({"msg": "Invite invalido o expirado"}), 400

    data = request.get_json()
    nuevo_password = data.get("password")
    email_ingresado = data.get("email")
    if not nuevo_password:
        return jsonify({"msg": "La contrasena es obligatoria"}), 400

    if invite.tipo == TipoInvite.CLIENTE:
        paciente = Paciente.query.get(invite.paciente_id)
        if not paciente:
            return jsonify({"msg": "Paciente no encontrado"}), 404

        if email_ingresado:
            paciente.email = email_ingresado

        paciente.set_password(nuevo_password)
        paciente.activo = True
    else:
        pass

    invite.usado = True
    db.session.commit()

    return jsonify({"msg": "Contrasena creada con exito."}), 200
