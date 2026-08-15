from api.models import Servicio, db
from api.decorators import rol_requerido
from flask import Blueprint, jsonify, request
```python


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

    # Validar que los valores numéricos realmente sean números.
    try:
        precio = float(precio)
        duracion_min = int(duracion_min)
        porcentaje_comision = float(porcentaje_comision)
    except (TypeError, ValueError):
        return jsonify(
            error="precio, duracion_min y porcentaje_comision deben ser numéricos"
        ), 400

    # Validar rangos.
    if precio < 0:
        return jsonify(error="El precio no puede ser negativo"), 400

    if duracion_min <= 0:
        return jsonify(error="La duración debe ser mayor que 0"), 400

    if porcentaje_comision < 0 or porcentaje_comision > 100:
        return jsonify(
            error="El porcentaje de comisión debe estar entre 0 y 100"
        ), 400

    # Evitar nombres duplicados.
    servicio_existente = Servicio.query.filter_by(nombre=nombre).first()

    if servicio_existente:
        return jsonify(error="Ya existe un servicio con ese nombre"), 409

    servicio = Servicio(
        nombre=nombre,
        precio=precio,
        duracion_min=duracion_min,
        porcentaje_comision=porcentaje_comision,
    )

    db.session.add(servicio)
    db.session.commit()

    return jsonify(servicio.serialize()), 201


```
