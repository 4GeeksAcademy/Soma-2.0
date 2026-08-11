from datetime import datetime, date, timedelta
from flask import Blueprint, jsonify, request
from flask_cors import CORS
from sqlalchemy import func
from api.decorators import rol_requerido, permiso_requerido
from api.models import db, Pago, Venta, Cita, EstadoCita
from api.permisos import obtener_matriz_permisos

dashboard = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")
CORS(dashboard)

 # Calcular ingresos del dia
def _obtener_ingresos_hoy(inicio_hoy, fin_hoy):
        stmt = db.select(Pago).where(Pago.fecha >= inicio_hoy, Pago.fecha <= fin_hoy)
        pagos_hoy = db.session.scalars(stmt).all()
        return {
            "monto_total": round(sum(p.monto for p in pagos_hoy), 2),
            "transacciones_count": len(pagos_hoy)
        }


  # Calcular servicios mas vendidos por filtro de fecha
def _obtener_servicios_top(inicio_fecha, fin_fecha, limite=5):
        stmt = (
            db.select(
                Venta.servicio_id,
                func.count(Venta.id).label("conteo"),
                func.sum(Venta.monto_total).label("total_monto")
            )
            .where(Venta.fecha >= inicio_fecha, Venta.fecha <= fin_fecha, Venta.servicio_id.isnot(None))
            .group_by(Venta.servicio_id)
            .order_by(func.count(Venta.id).desc())
            .limit(limite)
        )
        resultados = db.session.execute(stmt).all()
        return [
            {
                "servicio_id": s_id,
                "nombre": f"Servicio #{s_id}",
                "ventas_count": conteo,
                "monto_total": round(total or 0.0, 2)
            }
            for s_id, conteo, total in resultados
        ]

#Citas pendientes por dia y semana

def _obtener_citas_pendientes(inicio_fecha, fin_fecha):
        stmt = (
            db.select(Cita)
            .where(
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
    today = date.today()

    desde_str = request.args.get("desde")
    hasta_str = request.args.get("hasta")
    rango = request.args.get("rango")

    try:
        PRESETS = {
            "semana": today - timedelta(days=today.weekday()),
            "mes": date(today.year, today.month, 1),
            }
        d_desde = date.fromisoformat(desde_str) if desde_str else PRESETS.get(rango, today)
        d_hasta = date.fromisoformat(hasta_str) if hasta_str else today
    except ValueError:
            return jsonify(error="Formato de fecha inválido. Usar YYYY-MM-DD"), 400

           #fechas del filtro
    inicio_fecha = datetime.combine(d_desde, datetime.min.time())
    fin_fecha = datetime.combine(d_hasta, datetime.max.time())

    

        #fechas del dia y la semana 

    inicio_hoy = datetime.combine(today, datetime.min.time())
    fin_hoy = datetime.combine(today, datetime.max.time())
    inicio_semana = datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time())





    return jsonify({
            "rango_filtrado": {
                "desde": d_desde.isoformat(),
                "hasta": d_hasta.isoformat()
            },
            "ingresos": _obtener_ingresos_hoy(inicio_fecha, fin_fecha),
            "servicios_top": _obtener_servicios_top(inicio_fecha, fin_fecha),
            "citas_pendientes_hoy": _obtener_citas_pendientes(inicio_hoy, fin_hoy),
            "citas_pendientes_semana": _obtener_citas_pendientes(inicio_semana, fin_hoy)  


        }), 200



#Endpoint para obtener la matriz de los permisosprobe
@dashboard.route("/matriz-permisos", methods=["GET"])
@permiso_requerido("dashboard:matriz_permisos")
def obtener_matriz():
        return jsonify({"matriz": obtener_matriz_permisos()}), 200

