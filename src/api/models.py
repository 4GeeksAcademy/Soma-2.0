import enum
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


class RolUsuario(str, enum.Enum):
    ADMIN = "admin"
    ASISTENTE = "asistente"
    ESPECIALISTA = "especialista"


class Usuario(db.Model):
    __tablename__ = "usuario"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[RolUsuario] = mapped_column(Enum(RolUsuario), nullable=False)
    activo: Mapped[bool] = mapped_column(
        Boolean(), default=True, nullable=False)
    debe_cambiar_password: Mapped[bool] = mapped_column(
        Boolean(), default=False, nullable=False)

    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_token_expira: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "email": self.email,
            "rol": self.rol.value,
            "debe_cambiar_password": self.debe_cambiar_password,
        }


class EspacioTrabajo(db.Model):
    __tablename__ = "espacio_trabajo"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    tipo: Mapped[str] = mapped_column(
        String(50), nullable=False)  # sala / cama / estación

    def serialize(self):
        return {"id": self.id, "nombre": self.nombre, "tipo": self.tipo}


class EstadoCita(str, enum.Enum):
    AGENDADA = "agendada"
    REPROGRAMADA = "reprogramada"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class Cita(db.Model):
    __tablename__ = "cita"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Paciente y Servicio todavia no existen en el repo (issues #8 y #12, Jhunalbis/Kevin).
    # Se guardan como columnas simples por ahora -- se agrega la FK real cuando esas
    # tablas aterricen (ver docs/modelo-datos.md).
    paciente_id: Mapped[int | None] = mapped_column(
        ForeignKey("paciente.id"), nullable=True)
    paciente: Mapped["Paciente"] = relationship(back_populates="citas")

    servicio_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    paquete_paciente_sesion_id: Mapped[int | None] = mapped_column(
        Integer, nullable=True)

    especialista_id: Mapped[int] = mapped_column(
        ForeignKey("usuario.id"), nullable=False)
    espacio_id: Mapped[int] = mapped_column(
        ForeignKey("espacio_trabajo.id"), nullable=False)

    fecha_hora: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    estado: Mapped[EstadoCita] = mapped_column(
        Enum(EstadoCita), nullable=False, default=EstadoCita.AGENDADA
    )
    google_event_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True)

    especialista: Mapped["Usuario"] = relationship(
        foreign_keys=[especialista_id])
    espacio: Mapped["EspacioTrabajo"] = relationship(foreign_keys=[espacio_id])

    def serialize(self):
        return {
            "id": self.id,
            "paciente_id": self.paciente_id,
            "servicio_id": self.servicio_id,
            "paquete_paciente_sesion_id": self.paquete_paciente_sesion_id,
            "especialista_id": self.especialista_id,
            "espacio_id": self.espacio_id,
            "fecha_hora": self.fecha_hora.isoformat(),
            "estado": self.estado.value,
            "google_event_id": self.google_event_id,
        }


class Paciente(db.Model):
    __tablename__ = "paciente"
    id: Mapped[int] = mapped_column(primary_key=True)
    nombre_completo: Mapped[str] = mapped_column(String(120), nullable=False)
    cedula: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    telefono: Mapped[str] = mapped_column(String(20), unique=True, nullable=False) 
    ocupacion: Mapped[str | None] = mapped_column(String(120), nullable=True)
    edad: Mapped[int | None] = mapped_column(Integer, nullable=True)
    firma_consentimiento: Mapped[str | None] = mapped_column(String(300), nullable=True) 
    fecha_firma_consentimiento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    citas: Mapped[list["Cita"]] = relationship(back_populates="paciente")
    historiales: Mapped[list["HistorialClinico"]] = relationship(back_populates="paciente")
    
    def serialize(self):
        return {
            "id": self.id, 
            "nombre_completo": self.nombre_completo, 
            "cedula": self.cedula, 
            "telefono": self.telefono, 
            "ocupacion": self.ocupacion, 
            "edad": self.edad,
            "firma_consentimiento": self.firma_consentimiento,
            "fecha_firma_consentimiento": self.fecha_firma_consentimiento.isoformat() if self.fecha_firma_consentimiento else None
        }


class HistorialClinico(db.Model):
    __tablename__ = "historial_clinico"
    id: Mapped[int] = mapped_column(primary_key=True)
    paciente_id: Mapped[int] = mapped_column(ForeignKey("paciente.id"), nullable=False)
    cita_id: Mapped[int] = mapped_column(ForeignKey("cita.id"), nullable=False)
    
    alergias: Mapped[str | None] = mapped_column(String(250), nullable=True)
    tipo_piel: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(String(500), nullable=True)
    foto_antes_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    foto_despues_url: Mapped[str | None] = mapped_column(String(300), nullable=True)
    
  
    paciente: Mapped["Paciente"] = relationship(back_populates="historiales")
    
    def serialize(self):

        return {
            "id": self.id, 
            "paciente_id": self.paciente_id,
            "cita_id": self.cita_id,
            "alergias": self.alergias, 
            "tipo_piel": self.tipo_piel, 
            "observaciones": self.observaciones,
            "foto_antes_url": self.foto_antes_url,
            "foto_despues_url": self.foto_despues_url
        }