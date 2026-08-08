"""
Sincronizacion de Cita con Google Calendar (issue #5).

Usa un refresh_token guardado en GOOGLE_REFRESH_TOKEN -- autorizado una sola
vez contra la cuenta de Google de la clinica (ver docs/stack.md, mono-clinica:
un solo calendario compartido). No vuelve a pedir consentimiento en cada
llamada, a diferencia del flujo interactivo de scripts/spike_google_calendar.py.

Si GOOGLE_REFRESH_TOKEN no esta configurado (por ejemplo en un entorno de
desarrollo que todavia no conecto Google), las funciones no hacen nada en vez
de tronar -- crear/editar una Cita no debe depender de que Google Calendar
este disponible.
"""
import os
from datetime import timedelta

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]
DURACION_DEFAULT_MIN = 60  # mismo placeholder que api/citas.py, ver comentario ahi
ZONA_HORARIA = "America/Mexico_City"  # Cita.fecha_hora se guarda naive (sin tz) en hora local de la clinica


def _configurado():
    return bool(
        os.environ.get("GOOGLE_REFRESH_TOKEN")
        and os.environ.get("GOOGLE_CLIENT_ID")
        and os.environ.get("GOOGLE_CLIENT_SECRET")
    )


def _service():
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        scopes=SCOPES,
    )
    creds.refresh(Request())
    return build("calendar", "v3", credentials=creds)


def _cuerpo_evento(cita):
    especialista = cita.especialista.nombre if cita.especialista else f"especialista #{cita.especialista_id}"
    espacio = cita.espacio.nombre if cita.espacio else f"espacio #{cita.espacio_id}"
    fin = cita.fecha_hora + timedelta(minutes=DURACION_DEFAULT_MIN)

    return {
        "summary": f"Cita - {especialista} - {espacio}",
        "description": f"Especialista: {especialista}\nEspacio: {espacio}\nEstado: {cita.estado.value}",
        "start": {"dateTime": cita.fecha_hora.isoformat(), "timeZone": ZONA_HORARIA},
        "end": {"dateTime": fin.isoformat(), "timeZone": ZONA_HORARIA},
    }


def crear_evento(cita):
    """Devuelve el google_event_id creado, o None si la integracion no esta configurada o falla."""
    if not _configurado():
        return None
    try:
        evento = _service().events().insert(calendarId="primary", body=_cuerpo_evento(cita)).execute()
        return evento["id"]
    except Exception as error:
        print(f"[google_calendar] no se pudo crear el evento de la cita {cita.id}: {error}")
        return None


def actualizar_evento(cita):
    if not cita.google_event_id or not _configurado():
        return
    try:
        _service().events().update(
            calendarId="primary", eventId=cita.google_event_id, body=_cuerpo_evento(cita)
        ).execute()
    except Exception as error:
        print(f"[google_calendar] no se pudo actualizar el evento de la cita {cita.id}: {error}")


def eliminar_evento(cita):
    if not cita.google_event_id or not _configurado():
        return
    try:
        _service().events().delete(calendarId="primary", eventId=cita.google_event_id).execute()
    except Exception as error:
        print(f"[google_calendar] no se pudo eliminar el evento de la cita {cita.id}: {error}")
