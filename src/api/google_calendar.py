"""
Sincronizacion de Cita con Google Calendar (issue #5, multi-clinica #71).

Cada Clinica conecta su propia cuenta de Google desde el perfil del Admin
(ver api/clinica.py) -- el refresh_token resultante se guarda en
Clinica.google_refresh_token, ya no en una variable de entorno global
compartida por todo el sistema.

Si una Clinica no ha conectado Google Calendar todavia, las funciones de
sincronizacion no hacen nada en vez de tronar -- crear/editar una Cita no
debe depender de que Google Calendar este disponible.

GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET si son compartidos (un solo cliente
OAuth registrado en Google Cloud para todo el sistema) -- lo que es por
clinica es el refresh_token, no las credenciales del cliente.
"""
import os
from datetime import timedelta

from google.auth.transport.requests import Request
from google.oauth2 import id_token as google_id_token
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from api.models import Clinica, RolUsuario, Usuario

# Google agrega "userinfo.profile" al consentimiento aunque no lo pidamos en
# SCOPES (lo bundlea junto con email/openid) -- oauthlib por defecto truena
# con "Scope has changed" si el scope que regresa el token no es identico al
# solicitado. Se checa en tiempo de ejecucion (fetch_token), no al importar,
# asi que basta con fijarlo aqui una vez.
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]
DURACION_DEFAULT_MIN = 60  # mismo placeholder que api/citas.py, ver comentario ahi
ZONA_HORARIA = "America/Mexico_City"  # Cita.fecha_hora se guarda naive (sin tz) en hora local de la clinica


def _credenciales_cliente_configuradas():
    return bool(os.environ.get("GOOGLE_CLIENT_ID") and os.environ.get("GOOGLE_CLIENT_SECRET"))


def _client_config():
    return {
        "web": {
            "client_id": os.environ["GOOGLE_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }


def _construir_flow(redirect_uri):
    # autogenerate_code_verifier=False -- google-auth-oauthlib >=1.x activa PKCE
    # por defecto, pero genera_url_autorizacion() e intercambiar_codigo() crean
    # cada uno su propio Flow (son dos requests HTTP separadas, con la
    # redireccion a Google en medio; no hay forma de reusar el mismo objeto
    # Flow entre ambas). Sin este flag, el segundo Flow no conoce el
    # code_verifier que genero el primero y Google responde
    # "(invalid_grant) Missing code verifier". PKCE no es necesario aqui: es
    # un cliente confidencial (tiene client_secret), la proteccion la da eso
    # mas el 'state' firmado, igual que cuando se escribio este codigo.
    return Flow.from_client_config(
        _client_config(),
        scopes=SCOPES,
        redirect_uri=redirect_uri,
        autogenerate_code_verifier=False,
    )


def generar_url_autorizacion(state, redirect_uri):
    """URL a la que el frontend redirige al Admin para conectar su cuenta de Google."""
    flow = _construir_flow(redirect_uri)
    url, _ = flow.authorization_url(
        access_type="offline",
        prompt="consent",  # fuerza a Google a regresar refresh_token incluso en re-conexiones
        state=state,
        include_granted_scopes="true",
    )
    return url


def intercambiar_codigo(code, redirect_uri):
    """Cambia el 'code' del callback de Google por credenciales. Devuelve (refresh_token, email)."""
    flow = _construir_flow(redirect_uri)
    flow.fetch_token(code=code)
    creds = flow.credentials

    email = None
    if creds.id_token:
        try:
            info = google_id_token.verify_oauth2_token(creds.id_token, Request(), creds.client_id)
            email = info.get("email")
        except ValueError:
            email = None

    return creds.refresh_token, email


def _calendar_id(clinica):
    # Fallback a "primary" por si una clinica se conecto antes de que existiera
    # el calendario dedicado (issue #69) y crear_calendario_dedicado fallo o
    # todavia no corrio para ella.
    return clinica.google_calendar_id or "primary"


def _configurado(clinica):
    return bool(clinica and clinica.google_refresh_token and _credenciales_cliente_configuradas())


def _service(clinica):
    creds = Credentials(
        token=None,
        refresh_token=clinica.google_refresh_token,
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

    attendees = []
    if cita.especialista and cita.especialista.email:
        attendees.append({"email": cita.especialista.email})
    # cita.paciente.email todavia no existe en el modelo -- se agrega cuando el
    # portal de paciente (#70) le agregue email a Paciente. Hasta entonces el
    # paciente no recibe notificacion propia, solo la especialista.
    paciente_email = getattr(cita.paciente, "email", None) if cita.paciente else None
    if paciente_email:
        attendees.append({"email": paciente_email})

    return {
        "summary": f"Cita - {especialista} - {espacio}",
        "description": f"Especialista: {especialista}\nEspacio: {espacio}\nEstado: {cita.estado.value}",
        "start": {"dateTime": cita.fecha_hora.isoformat(), "timeZone": ZONA_HORARIA},
        "end": {"dateTime": fin.isoformat(), "timeZone": ZONA_HORARIA},
        "attendees": attendees,
    }


def crear_evento(cita):
    """Devuelve el google_event_id creado, o None si la integracion no esta configurada o falla."""
    clinica = Clinica.query.get(cita.clinica_id)
    if not _configurado(clinica):
        return None
    try:
        evento = (
            _service(clinica)
            .events()
            .insert(calendarId=_calendar_id(clinica), body=_cuerpo_evento(cita), sendUpdates="all")
            .execute()
        )
        return evento["id"]
    except Exception as error:
        print(f"[google_calendar] no se pudo crear el evento de la cita {cita.id}: {error}")
        return None


def actualizar_evento(cita):
    clinica = Clinica.query.get(cita.clinica_id)
    if not cita.google_event_id or not _configurado(clinica):
        return
    try:
        _service(clinica).events().update(
            calendarId=_calendar_id(clinica),
            eventId=cita.google_event_id,
            body=_cuerpo_evento(cita),
            sendUpdates="all",
        ).execute()
    except Exception as error:
        print(f"[google_calendar] no se pudo actualizar el evento de la cita {cita.id}: {error}")


def eliminar_evento(cita):
    clinica = Clinica.query.get(cita.clinica_id)
    if not cita.google_event_id or not _configurado(clinica):
        return
    try:
        _service(clinica).events().delete(
            calendarId=_calendar_id(clinica), eventId=cita.google_event_id, sendUpdates="all"
        ).execute()
    except Exception as error:
        print(f"[google_calendar] no se pudo eliminar el evento de la cita {cita.id}: {error}")


def crear_calendario_dedicado(clinica):
    """Crea un calendario nuevo y separado del personal/'primary' del Admin,
    dedicado a esta Clinica (issue #69) -- es el que despues se comparte de
    solo lectura con asistentes y especialistas. Devuelve el id creado, o
    None si la integracion no esta configurada o la llamada falla.
    """
    if not _configurado(clinica):
        return None
    try:
        calendario = _service(clinica).calendars().insert(
            body={"summary": f"Soma — {clinica.nombre}", "timeZone": ZONA_HORARIA}
        ).execute()
        return calendario["id"]
    except Exception as error:
        print(f"[google_calendar] no se pudo crear el calendario dedicado de la clinica {clinica.id}: {error}")
        return None


def compartir_calendario(clinica, email, rol="reader"):
    """Comparte (ACL) el calendario dedicado de la Clinica con un email. No hace
    nada si la clinica no esta configurada, no tiene calendario dedicado
    todavia, o no se proporciona un email (staff sin correo capturado)."""
    if not email or not _configurado(clinica) or not clinica.google_calendar_id:
        return
    try:
        _service(clinica).acl().insert(
            calendarId=clinica.google_calendar_id,
            body={"role": rol, "scope": {"type": "user", "value": email}},
        ).execute()
    except Exception as error:
        print(f"[google_calendar] no se pudo compartir el calendario de la clinica {clinica.id} con {email}: {error}")


def compartir_calendario_con_staff(clinica):
    """Comparte de solo lectura el calendario dedicado con todas las
    asistentes/especialistas activas de la clinica -- se llama al crear el
    calendario por primera vez y al redimir un invite nuevo de ese tipo."""
    staff = Usuario.query.filter(
        Usuario.clinica_id == clinica.id,
        Usuario.rol.in_([RolUsuario.ASISTENTE, RolUsuario.ESPECIALISTA]),
        Usuario.activo.is_(True),
    ).all()
    for usuario in staff:
        compartir_calendario(clinica, usuario.email, rol="reader")
