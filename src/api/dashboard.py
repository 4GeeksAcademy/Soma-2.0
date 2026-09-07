from datetime import datetime, date, timedelta
from flask import Blueprint, jsonify, request
from flask_cors import CORS
from sqlalchemy import func
from api.decorators import clinica_id_actual, rol_requerido
from api.models import db, Pago, Venta, VentaItem, Cita, EstadoCita, Servicio
from flask_jwt_extended import get_jwt_identity


dashboard = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
CORS(dashboard)


def _calcular_rango_filtrado(request, today):
    """Lee ?desde=/?hasta=/?rango= de la query string y devuelve
    (d_desde, d_hasta, inicio_fecha, fin_fecha) -- las dos primeras son
    date, las ultimas datetime (limites del dia, para comparar contra
    columnas DateTime). Compartido entre el resumen de Admin y el de
    Especialista para que "Hoy/Esta semana/Este mes/Fechas" se comporte
    igual en los dos.
    """
    desde_str = request.args.get("desde")
    hasta_str = request.args.get("hasta")
    rango = request.args.get("rango")

    PRESETS = {
        "hoy": today,
        "semana": today - timedelta(days=today.weekday()),
        "mes": date(today.year, today.month, 1),
    }
    d_desde = date.fromisoformat(desde_str) if desde_str else PRESETS.get(rango, today)
    d_hasta = date.fromisoformat(hasta_str) if hasta_str else today

    inicio_fecha = datetime.combine(d_desde, datetime.min.time())
    fin_fecha = datetime.combine(d_hasta, datetime.max.time())
    return d_desde, d_hasta, inicio_fecha, fin_fecha

# Calcular ingresos del dia
def _obtener_ingresos_periodo(clinica_id, inicio_hoy, fin_hoy):
    stmt = db.select(Pago).where(
        Pago.clinica_id == clinica_id, Pago.fecha >= inicio_hoy, Pago.fecha <= fin_hoy
    )
    pagos_hoy = db.session.scalars(stmt).all()
    return {
        "monto_total": round(sum(p.monto for p in pagos_hoy), 2),
        "transacciones_count": len(pagos_hoy)
    }

  # Calcular servicios mas vendidos por filtro de fecha

def _obtener_servicios_top(clinica_id, inicio_fecha, fin_fecha, limite=5):
    # Venta ya no trae servicio_id directo (ahora es una "cuenta" con varios
    # VentaItem) -- se cuenta por item, no por venta, para que un mismo
    # servicio vendido dos veces en una sola cuenta cuente dos veces.
    stmt = (
        db.select(
            VentaItem.servicio_id,
            Servicio.nombre.label("servicio_nombre"),
            func.count(VentaItem.id).label("conteo"),
            func.sum(VentaItem.monto).label("total_monto")
        )
        .join(Venta, VentaItem.venta_id == Venta.id)
        .outerjoin(Servicio, VentaItem.servicio_id == Servicio.id)
        .where(
            Venta.clinica_id == clinica_id,
            Venta.fecha >= inicio_fecha,
            Venta.fecha <= fin_fecha,
            VentaItem.servicio_id.isnot(None),
        )
        .group_by(VentaItem.servicio_id, Servicio.nombre)
        .order_by(func.count(VentaItem.id).desc())
        .limit(limite)
    )
    resultados = db.session.execute(stmt).all()
    return [
        {
            "servicio_id": s_id,
            "nombre": s_nombre or f"Servicio #{s_id}",
            "ventas_count": conteo,
            "monto_total": round(total or 0.0, 2)
        }
        for s_id, s_nombre, conteo, total in resultados
    ]

# Citas pendientes por dia y semana

def _obtener_citas_pendientes(clinica_id, inicio_fecha, fin_fecha):
    stmt = (
        db.select(Cita)
        .where(
            Cita.clinica_id == clinica_id,
            Cita.fecha_hora >= inicio_fecha,
            Cita.fecha_hora <= fin_fecha,
            Cita.estado == EstadoCita.AGENDADA
        )
        .order_by(Cita.fecha_hora.asc())
    )
    citas = db.session.scalars(stmt).all()

    citas_lista = []
    for c in citas:
        c_dict = c.serialize()
        c_dict["especialista_nombre"] = c.especialista.nombre if c.especialista else f"Especialista #{c.especialista_id}"
        c_dict["espacio_nombre"] = c.espacio.nombre if c.espacio else f"Espacio #{c.espacio_id}"
        c_dict["paciente_nombre"] = c.paciente.nombre_completo if c.paciente else ("Paciente no asignado" if not
                                                                                   c.paciente_id else f"Paciente #{c.paciente_id}")
        citas_lista.append(c_dict)

    return {
        "total": len(citas),
        "lista": citas_lista
    }


@dashboard.route("/resumen", methods=["GET"])
@rol_requerido("admin")
def obtener_resumen_admin():
    clinica_id = clinica_id_actual()
    today = date.today()

    try:
        d_desde, d_hasta, inicio_fecha, fin_fecha = _calcular_rango_filtrado(request, today)
    except ValueError:
        return jsonify(error="Formato de fecha inválido. Usar YYYY-MM-DD"), 400

    # fechas del dia y la semana

    inicio_hoy = datetime.combine(today, datetime.min.time())
    fin_hoy = datetime.combine(today, datetime.max.time())
    inicio_semana = datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time())
    fin_semana = datetime.combine(today - timedelta(days=today.weekday()) + timedelta(days=6), datetime.max.time())

    return jsonify({
        "rango_filtrado": {
            "desde": d_desde.isoformat(),
            "hasta": d_hasta.isoformat()
        },
        "ingresos": _obtener_ingresos_periodo(clinica_id, inicio_fecha, fin_fecha),
        "servicios_top": _obtener_servicios_top(clinica_id, inicio_fecha, fin_fecha),
        "citas_pendientes_hoy": _obtener_citas_pendientes(clinica_id, inicio_hoy, fin_hoy),
        "citas_pendientes_semana": _obtener_citas_pendientes(clinica_id, inicio_semana, fin_semana)


    }), 200


@dashboard.route("/mis-citas", methods=["GET"])
@rol_requerido("especialista")
def obtener_resumen_especialista():
    """Comisiones de citas completadas (por el periodo seleccionado) y citas
    programadas de ESTE especialista -- version de Especialista del resumen
    de Admin (ver docs/decisiones.md, matriz de permisos: "Dashboard propio
    (sus sesiones/comisiones del dia) -- solo lo suyo").

    La comision se calcula sobre el precio de catalogo del Servicio
    (Servicio.precio * Servicio.porcentaje_comision / 100), no sobre lo
    realmente cobrado en una Venta -- hoy no hay forma confiable de ligar una
    Cita a la Venta que la pago (el carrito de Ventas no manda cita_id) y la
    tabla Comision nunca se llego a implementar. Si el precio de catalogo
    cambia despues de la cita esto no lo refleja retroactivamente --
    limitacion conocida, no un intento de contabilidad exacta.
    """
    clinica_id = clinica_id_actual()
    especialista_id = int(get_jwt_identity())
    today = date.today()

    try:
        d_desde, d_hasta, inicio_fecha, fin_fecha = _calcular_rango_filtrado(request, today)
    except ValueError:
        return jsonify(error="Formato de fecha inválido. Usar YYYY-MM-DD"), 400

    completadas = (
        Cita.query.filter(
            Cita.clinica_id == clinica_id,
            Cita.especialista_id == especialista_id,
            Cita.estado == EstadoCita.COMPLETADA,
            Cita.fecha_hora >= inicio_fecha,
            Cita.fecha_hora <= fin_fecha,
        )
        .order_by(Cita.fecha_hora.desc())
        .all()
    )

    citas_comision = []
    total_comision = 0.0
    for cita in completadas:
        servicio = cita.servicio
        precio = servicio.precio if servicio else 0.0
        porcentaje = servicio.porcentaje_comision if servicio else 0.0
        comision = round(precio * porcentaje / 100, 2)
        total_comision += comision
        citas_comision.append({
            **cita.serialize(),
            "paciente_nombre": cita.paciente.nombre_completo if cita.paciente else None,
            "servicio_nombre": servicio.nombre if servicio else None,
            "monto_servicio": precio,
            "comision": comision,
        })

    programadas = (
        Cita.query.filter(
            Cita.clinica_id == clinica_id,
            Cita.especialista_id == especialista_id,
            Cita.estado.in_([EstadoCita.AGENDADA, EstadoCita.REPROGRAMADA]),
            Cita.fecha_hora >= inicio_fecha,
            Cita.fecha_hora <= fin_fecha,
        )
        .order_by(Cita.fecha_hora.asc())
        .all()
    )
    citas_programadas = [
        {
            **cita.serialize(),
            "paciente_nombre": cita.paciente.nombre_completo if cita.paciente else None,
            "servicio_nombre": cita.servicio.nombre if cita.servicio else None,
            "espacio_nombre": cita.espacio.nombre if cita.espacio else None,
        }
        for cita in programadas
    ]

    return jsonify({
        "rango_filtrado": {
            "desde": d_desde.isoformat(),
            "hasta": d_hasta.isoformat()
        },
        "comisiones": {
            "citas": citas_comision,
            "total_citas": len(citas_comision),
            "total_comision": round(total_comision, 2),
        },
        "programadas": citas_programadas,
    }), 200
