from flask import Blueprint, jsonify, request
from flask_cors import CORS

from api.decorators import clinica_id_actual, rol_requerido
from api.models import (
    Cita, HistorialClinico, Paciente, PaquetePaciente, PaquetePacienteSesion, Venta, db
)

pacientes = Blueprint("pacientes", __name__, url_prefix="/api/pacientes")
CORS(pacientes)


@pacientes.route("", methods=["GET"])
@rol_requerido("admin", "asistente", "especialista")
def listar_pacientes():
    """Los 3 roles consultan pacientes, Especialista solo lectura (ver matriz de
    permisos, docs/decisiones.md). ?telefono= filtra por telefono -- el identificador
    de busqueda acordado (issue #9) -- y es la base de la busqueda inteligente del
    formulario de agendado (issue #7)."""
    telefono = request.args.get("telefono")

    query = Paciente.query.filter_by(clinica_id=clinica_id_actual())
    if telefono:
        query = query.filter_by(telefono=telefono)

    return jsonify([p.serialize() for p in query.all()])


@pacientes.route("/<int:paciente_id>", methods=["GET"])
@rol_requerido("admin", "asistente", "especialista")
# La ficha del paciente (Ver Ficha en el directorio) necesita mas que los
# datos personales -- se arma todo aqui en una sola llamada (citas, historial
# clinico, paquetes con sus sesiones, y ventas/saldo) en vez de que el
# frontend tenga que pegarle a 4 endpoints distintos y cruzarlos el solo.
def obtener_paciente(paciente_id):
    clinica_id = clinica_id_actual()
    paciente = Paciente.query.filter_by(id=paciente_id, clinica_id=clinica_id).first_or_404()

    citas = (
        Cita.query.filter_by(paciente_id=paciente_id, clinica_id=clinica_id)
        .order_by(Cita.fecha_hora.desc())
        .all()
    )
    citas_serializadas = []
    for cita in citas:
        c = cita.serialize()
        c["especialista_nombre"] = cita.especialista.nombre if cita.especialista else None
        c["espacio_nombre"] = cita.espacio.nombre if cita.espacio else None
        c["servicio_nombre"] = cita.servicio.nombre if cita.servicio else None
        citas_serializadas.append(c)

    historial = (
        HistorialClinico.query.filter_by(paciente_id=paciente_id, clinica_id=clinica_id)
        .order_by(HistorialClinico.id.desc())
        .all()
    )
    historial_serializado = []
    for registro in historial:
        h = registro.serialize()
        cita_de_registro = next((c for c in citas if c.id == registro.cita_id), None)
        h["cita_fecha"] = cita_de_registro.fecha_hora.isoformat() if cita_de_registro else None
        historial_serializado.append(h)

    paquetes_paciente = PaquetePaciente.query.filter_by(paciente_id=paciente_id, clinica_id=clinica_id).all()
    paquetes_serializados = []
    for pp in paquetes_paciente:
        sesiones = PaquetePacienteSesion.query.filter_by(paquete_paciente_id=pp.id).all()
        paquetes_serializados.append({
            **pp.serialize(),
            "paquete_nombre": pp.paquete.nombre if pp.paquete else None,
            "sesiones": [
                {**s.serialize(), "servicio_nombre": s.servicio.nombre if s.servicio else None}
                for s in sesiones
            ],
        })

    ventas = (
        Venta.query.filter_by(paciente_id=paciente_id, clinica_id=clinica_id)
        .order_by(Venta.fecha.desc())
        .all()
    )

    return jsonify({
        **paciente.serialize(),
        "citas": citas_serializadas,
        "historial_clinico": historial_serializado,
        "paquetes": paquetes_serializados,
        "ventas": [v.serialize() for v in ventas],
    })


@pacientes.route("", methods=["POST"])
@rol_requerido("admin", "asistente")
def crear_paciente():
    data = request.get_json(silent=True) or {}
    nombre_completo = data.get("nombre_completo")
    cedula = data.get("cedula")
    telefono = data.get("telefono")

    if not nombre_completo or not cedula or not telefono:
        return jsonify(error="nombre_completo, cedula y telefono son requeridos"), 400

    clinica_id = clinica_id_actual()

    if Paciente.query.filter_by(clinica_id=clinica_id, telefono=telefono).first():
        return jsonify(error="ya existe un paciente con ese telefono"), 409

    if Paciente.query.filter_by(clinica_id=clinica_id, cedula=cedula).first():
        return jsonify(error="ya existe un paciente con esa cedula"), 409

    edad = data.get("edad")
    if edad is not None:
        try:
            edad = int(edad)
        except (TypeError, ValueError):
            return jsonify(error="edad debe ser numerica"), 400

    paciente = Paciente(
        clinica_id=clinica_id,
        nombre_completo=nombre_completo,
        cedula=cedula,
        telefono=telefono,
        ocupacion=data.get("ocupacion"),
        edad=edad,
        alergias=data.get("alergias"),
        tipo_piel=data.get("tipo_piel"),
    )
    db.session.add(paciente)
    db.session.commit()
    return jsonify(paciente.serialize()), 201


@pacientes.route("/<int:paciente_id>", methods=["PUT"])
@rol_requerido("admin", "asistente")
def actualizar_paciente(paciente_id):
    clinica_id = clinica_id_actual()
    paciente = Paciente.query.filter_by(id=paciente_id, clinica_id=clinica_id).first_or_404()
    data = request.get_json(silent=True) or {}

    nuevo_telefono = data.get("telefono", paciente.telefono)
    if nuevo_telefono != paciente.telefono:
        if Paciente.query.filter_by(clinica_id=clinica_id, telefono=nuevo_telefono).first():
            return jsonify(error="ya existe un paciente con ese telefono"), 409

    nueva_cedula = data.get("cedula", paciente.cedula)
    if nueva_cedula != paciente.cedula:
        if Paciente.query.filter_by(clinica_id=clinica_id, cedula=nueva_cedula).first():
            return jsonify(error="ya existe un paciente con esa cedula"), 409

    edad = data.get("edad", paciente.edad)
    if edad is not None:
        try:
            edad = int(edad)
        except (TypeError, ValueError):
            return jsonify(error="edad debe ser numerica"), 400

    paciente.nombre_completo = data.get("nombre_completo", paciente.nombre_completo)
    paciente.cedula = nueva_cedula
    paciente.telefono = nuevo_telefono
    paciente.ocupacion = data.get("ocupacion", paciente.ocupacion)
    paciente.edad = edad
    paciente.alergias = data.get("alergias", paciente.alergias)
    paciente.tipo_piel = data.get("tipo_piel", paciente.tipo_piel)
    db.session.commit()
    return jsonify(paciente.serialize())
