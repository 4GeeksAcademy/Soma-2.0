from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_cors import CORS
from api.decorators import clinica_id_actual, rol_requerido
from api.models import (
    db, Venta, VentaItem, Pago, Paciente, Servicio, Cita,
    PaquetePaciente, FormaPagoPaquete, Clinica
)

ventas = Blueprint("ventas", __name__, url_prefix="/api/ventas")
CORS(ventas)

@ventas.route("", methods=["GET"])
@rol_requerido("admin", "asistente")
# Lista las ventas con soporte de filtros (paciente_id y con_deuda)
def listar_ventas():
    paciente_id = request.args.get("paciente_id", type=int)
    con_deuda = request.args.get("con_deuda", "").lower() in ("true", "1", "yes")

    stmt = db.select(Venta).where(Venta.clinica_id == clinica_id_actual()).order_by(Venta.fecha.desc())
    if paciente_id:
        stmt = stmt.where(Venta.paciente_id == paciente_id)

    todas_ventas = db.session.scalars(stmt).all()

    if con_deuda:
        todas_ventas = [v for v in todas_ventas if v.deuda_pendiente > 0]
    return jsonify([v.serialize() for v in todas_ventas]), 200


@ventas.route("/<int:venta_id>", methods=["GET"])
@rol_requerido("admin", "asistente")
# Obtener el detalle de una venta y el historial de pagos
def obtener_venta(venta_id):
    venta = Venta.query.filter_by(id=venta_id, clinica_id=clinica_id_actual()).first()
    if not venta:
        return jsonify(error="Venta no encontrada"), 404
    return jsonify(venta.serialize()), 200


@ventas.route("/<int:venta_id>/recibo", methods=["GET"])
@rol_requerido("admin", "asistente")
# Datos para la vista imprimible del recibo -- el PDF se genera del lado del
# navegador (window.print() -> "Guardar como PDF"), este endpoint solo arma
# los datos ya resueltos (nombres, no ids) para que el frontend no tenga que
# cruzar varios catalogos.
def obtener_recibo_venta(venta_id):
    clinica_id = clinica_id_actual()
    venta = Venta.query.filter_by(id=venta_id, clinica_id=clinica_id).first()
    if not venta:
        return jsonify(error="Venta no encontrada"), 404

    clinica = Clinica.query.get(clinica_id)
    paciente = Paciente.query.get(venta.paciente_id)

    # Un renglon por item de la cuenta -- reemplaza al "concepto" unico de
    # cuando Venta solo podia tener un servicio o un paquete.
    def _nombre_item(item):
        if item.servicio:
            return item.servicio.nombre
        if item.paquete_paciente and item.paquete_paciente.paquete:
            return item.paquete_paciente.paquete.nombre
        return "Servicio"

    conceptos = [
        {"nombre": _nombre_item(item), "monto": item.monto}
        for item in venta.items
    ]

    return jsonify({
        "venta": venta.serialize(),
        "conceptos": conceptos,
        "clinica_nombre": clinica.nombre if clinica else None,
        "paciente_nombre": paciente.nombre_completo if paciente else f"Paciente #{venta.paciente_id}",
        "paciente_telefono": paciente.telefono if paciente else None,
    }), 200


def _resolver_item(item_data, clinica_id):
    """Valida un renglon del carrito y devuelve (servicio_id, paquete_paciente_id, monto)
    o (None, None, mensaje_de_error)."""
    if not isinstance(item_data, dict):
        return None, None, "cada item debe ser un objeto"

    servicio_id = item_data.get("servicio_id")
    paquete_paciente_id = item_data.get("paquete_paciente_id")

    if bool(servicio_id) == bool(paquete_paciente_id):
        return None, None, "cada item debe traer exactamente uno de servicio_id o paquete_paciente_id"

    if servicio_id:
        servicio = Servicio.query.filter_by(id=servicio_id, clinica_id=clinica_id).first()
        if not servicio:
            return None, None, f"el servicio {servicio_id} no existe en esta clinica"
        if "monto" in item_data:
            try:
                monto = float(item_data.get("monto"))
            except (TypeError, ValueError):
                return None, None, "monto debe ser numerico"
        else:
            monto = servicio.precio
        return servicio_id, None, monto

    # paquete_paciente_id: sesion de un paquete ya comprado por el paciente
    paquete_pac = PaquetePaciente.query.filter_by(id=paquete_paciente_id, clinica_id=clinica_id).first()
    if not paquete_pac:
        return None, None, f"el paquete_paciente {paquete_paciente_id} no existe en esta clinica"

    if paquete_pac.forma_pago == FormaPagoPaquete.CONTADO:
        # Ya se cobro completo al comprar el paquete -- cada sesion cuesta $0.
        monto = 0.0
    else:
        # A plazos: el monto es la cuota que se cobra en esta sesion.
        if "monto" not in item_data:
            return None, None, "monto es requerido para una sesion de paquete a plazos"
        try:
            monto = float(item_data.get("monto"))
        except (TypeError, ValueError):
            return None, None, "monto debe ser numerico"

    return None, paquete_paciente_id, monto


@ventas.route("", methods=["POST"])
@rol_requerido("admin", "asistente")
# Registra una "cuenta" (Venta) con uno o varios items (servicios sueltos y/o
# sesiones de paquete), tipo cuenta de restaurante: un solo monto_total
# combinado y un solo saldo pendiente, pagable en abonos contra el total.
def registrar_venta():
    data = request.get_json(silent=True) or {}
    clinica_id = clinica_id_actual()

    paciente_id = data.get("paciente_id")
    if not paciente_id:
        return jsonify(error="paciente_id es requerido"), 400

    paciente = Paciente.query.filter_by(id=paciente_id, clinica_id=clinica_id).first()
    if not paciente:
        return jsonify(error="El paciente especificado no existe"), 404

    cita_id = data.get("cita_id")
    if cita_id and not Cita.query.filter_by(id=cita_id, clinica_id=clinica_id).first():
        return jsonify(error="La cita especificada no existe"), 404

    items_data = data.get("items")
    if not isinstance(items_data, list) or len(items_data) == 0:
        return jsonify(error="items es requerido y debe tener al menos un elemento"), 400

    items_resueltos = []
    for item_data in items_data:
        servicio_id, paquete_paciente_id, resultado = _resolver_item(item_data, clinica_id)
        if servicio_id is None and paquete_paciente_id is None:
            return jsonify(error=resultado), 400
        items_resueltos.append((servicio_id, paquete_paciente_id, resultado))

    monto_total = sum(monto for _, _, monto in items_resueltos)
    if monto_total < 0:
        return jsonify(error="El monto total no puede ser negativo"), 400

    try:
        pago_monto = float(data.get("pago_monto", 0.0) or 0.0)
    except (TypeError, ValueError):
        return jsonify(error="pago_monto debe ser numérico"), 400

    if pago_monto < 0:
        return jsonify(error="El monto del pago no puede ser negativo"), 400

    if pago_monto > monto_total:
        return jsonify(error="El pago no puede exceder el monto total de la cuenta"), 400

    # 1. Crear la Venta (la cuenta)
    nueva_venta = Venta(
        clinica_id=clinica_id,
        paciente_id=paciente_id,
        cita_id=cita_id,
        monto_total=round(monto_total, 2),
        fecha=datetime.utcnow()
    )
    db.session.add(nueva_venta)
    db.session.flush()

    # 2. Crear un VentaItem por cada renglon del carrito
    for servicio_id, paquete_paciente_id, monto in items_resueltos:
        db.session.add(VentaItem(
            clinica_id=clinica_id,
            venta_id=nueva_venta.id,
            servicio_id=servicio_id,
            paquete_paciente_id=paquete_paciente_id,
            monto=round(monto, 2),
        ))

    # 3. Registrar el Pago inicial (contra el total combinado) si aplica
    if pago_monto > 0:
        metodo_pago = data.get("pago_metodo", "efectivo")
        if metodo_pago not in ("efectivo", "tarjeta", "transferencia"):
            metodo_pago = "efectivo"

        nuevo_pago = Pago(
            clinica_id=clinica_id,
            venta_id=nueva_venta.id,
            monto=round(pago_monto, 2),
            metodo=metodo_pago,
            fecha=datetime.utcnow()
        )
        db.session.add(nuevo_pago)

    db.session.commit()

    return jsonify(nueva_venta.serialize()), 201
