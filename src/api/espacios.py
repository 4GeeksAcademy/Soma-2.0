from flask import Blueprint, jsonify, request
from flask_cors import CORS

from api.decorators import rol_requerido
from api.models import EspacioTrabajo, db

espacios = Blueprint("espacios", __name__, url_prefix="/api/espacios")
CORS(espacios)


@espacios.route("", methods=["GET"])
@rol_requerido("admin", "asistente")
def listar_espacios():
    """Admin y Asistente listan espacios -- Asistente lo necesita para asignar
    espacio al agendar una cita (mismo criterio que GET /api/usuarios)."""
    return jsonify([e.serialize() for e in EspacioTrabajo.query.all()])


@espacios.route("/<int:espacio_id>", methods=["GET"])
@rol_requerido("admin")
def obtener_espacio(espacio_id):
    espacio = EspacioTrabajo.query.get_or_404(espacio_id)
    return jsonify(espacio.serialize())


@espacios.route("", methods=["POST"])
@rol_requerido("admin")
def crear_espacio():
    data = request.get_json(silent=True) or {}
    nombre = data.get("nombre")
    tipo = data.get("tipo")

    if not nombre or not tipo:
        return jsonify(error="nombre y tipo son requeridos"), 400

    espacio = EspacioTrabajo(nombre=nombre, tipo=tipo)
    db.session.add(espacio)
    db.session.commit()
    return jsonify(espacio.serialize()), 201


@espacios.route("/<int:espacio_id>", methods=["PUT"])
@rol_requerido("admin")
def actualizar_espacio(espacio_id):
    espacio = EspacioTrabajo.query.get_or_404(espacio_id)
    data = request.get_json(silent=True) or {}

    espacio.nombre = data.get("nombre", espacio.nombre)
    espacio.tipo = data.get("tipo", espacio.tipo)
    db.session.commit()
    return jsonify(espacio.serialize())


@espacios.route("/<int:espacio_id>", methods=["DELETE"])
@rol_requerido("admin")
def eliminar_espacio(espacio_id):
    espacio = EspacioTrabajo.query.get_or_404(espacio_id)
    db.session.delete(espacio)
    db.session.commit()
    return "", 204
