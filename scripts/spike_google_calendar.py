"""
Spike OAuth2 Google Calendar (issue #1).

Prueba de concepto standalone: autoriza una vez contra la cuenta de Google de
prueba (abre el navegador), guarda el token localmente, crea un evento de
prueba y lista los eventos proximos para confirmar lectura.

Uso:
    pipenv run python scripts/spike_google_calendar.py
"""
import datetime
import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/calendar"]
CREDENTIALS_FILE = "google_credentials.json"
TOKEN_FILE = "google_token.json"


def obtener_credenciales():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return creds


def crear_evento_prueba(service):
    ahora = datetime.datetime.utcnow()
    inicio = ahora + datetime.timedelta(hours=1)
    fin = inicio + datetime.timedelta(minutes=30)

    evento = {
        "summary": "[Soma] Evento de prueba - spike OAuth2",
        "description": "Creado por scripts/spike_google_calendar.py (issue #1)",
        "start": {"dateTime": inicio.isoformat() + "Z"},
        "end": {"dateTime": fin.isoformat() + "Z"},
    }

    creado = service.events().insert(calendarId="primary", body=evento).execute()
    print(f"Evento creado: {creado.get('htmlLink')}")
    return creado


def listar_proximos_eventos(service, max_resultados=5):
    ahora = datetime.datetime.utcnow().isoformat() + "Z"
    resultado = (
        service.events()
        .list(
            calendarId="primary",
            timeMin=ahora,
            maxResults=max_resultados,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
    )
    eventos = resultado.get("items", [])

    if not eventos:
        print("No hay eventos proximos.")
        return

    print(f"Proximos {len(eventos)} eventos:")
    for evento in eventos:
        inicio = evento["start"].get("dateTime", evento["start"].get("date"))
        print(f"  - {inicio}: {evento.get('summary')}")


if __name__ == "__main__":
    creds = obtener_credenciales()
    service = build("calendar", "v3", credentials=creds)

    print("--- Creando evento de prueba ---")
    crear_evento_prueba(service)

    print("\n--- Listando proximos eventos ---")
    listar_proximos_eventos(service)
