from flask import Blueprint, jsonify, request

from api.decorators import rol_requerido
from api.models import Servicio, db


servicios = Blueprint("servicios", __name__, url_prefix="/api/servicios")


@servicios.route("", methods=["POST"])
@rol_requerido("admin", "asistente")
def crear_servicio():
    data = request.get_json(silent=True) or {}

    nombre = data.get("nombre")
    precio = data.get("precio")
    duracion_min = data.get("duracion_min")
    porcentaje_comision = data.get("porcentaje_comision")

    if not nombre or precio is None or duracion_min is None or porcentaje_comision is None:
        return jsonify(
            error="nombre, precio, duracion_min y porcentaje_comision son requeridos"
        ), 400

    servicio = Servicio(
        nombre=nombre,
        precio=precio,
        duracion_min=duracion_min,
        porcentaje_comision=porcentaje_comision,
    )

    db.session.add(servicio)
    db.session.commit()

    return jsonify(servicio.serialize()), 201
