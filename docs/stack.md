# Stack Técnico

## Confirmado

| Capa | Tecnología |
|---|---|
| Frontend | React (Vite) |
| Backend | Flask |
| ORM | SQLAlchemy |
| Base de datos | PostgreSQL |
| Autenticación | JWT |
| Cifrado de contraseña | `werkzeug.security` (`generate_password_hash` / `check_password_hash`) — ya viene con Flask, sin dependencia extra |
| Estructura de repo | Monorepo — plantilla 4Geeks (`src/api` + `src/front`) en el repo `Soma-2.0`, requisito de evaluación del bootcamp |
| Calendario | Google Calendar real (OAuth2 + Google Calendar API) — **un solo calendario compartido de la clínica**, no uno por especialista. Eventos etiquetados con especialista y espacio de trabajo asignados |
| Recursos de agenda | Cada cita requiere **especialista + espacio de trabajo** disponibles simultáneamente (varias especialistas, varios espacios) |
| Firma de consentimientos | Firma digital (canvas), texto genérico único para todos los tratamientos |
| Inventario | Descuento automático por receta fija de insumos por servicio. Unidades enteras (no ml/volumen) |

## Spike OAuth2 Google Calendar (issue #1) — resultado

Probado con `scripts/spike_google_calendar.py` (`google-auth`, `google-auth-oauthlib`, `google-api-python-client`, flujo `InstalledAppFlow`). Resultado: **funciona** — se autorizó, se creó un evento vía API y se listaron eventos existentes sin problema.

Limitaciones encontradas mientras el proyecto de Google Cloud esté en modo **Testing** (Google Auth Platform → Público → Estado de publicación):
- Solo pueden usarlo las cuentas agregadas explícitamente como **usuario de prueba** (máximo 100).
- El `refresh_token` emitido en modo Testing **expira a los 7 días** — hay que re-autorizar si el token queda viejo. No pasar a modo Production sin necesidad: requiere verificación de Google (puede tardar días/semanas) por el scope de Calendar (sensible).
- Scope usado: `https://www.googleapis.com/auth/calendar` (acceso completo de lectura/escritura).

**Pendiente para el issue #5 (integración real):** el spike se autorizó contra una cuenta de Google personal de prueba. Para producción hay que repetir la autorización con la **cuenta de Google real de la clínica** (la única compartida, ver fila "Calendario" arriba) — no reusar la cuenta personal usada en el spike.

## Roles del sistema

Administrador (Dueña), Asistente, Especialista — 3 roles con vistas y permisos distintos. Matriz completa de permisos: ver `decisiones.md`.

## Pendiente de definir

- **Almacenamiento de fotos y firmas** (antes/después, firma digital de consentimientos): no se ha confirmado proveedor. Sugerencia a evaluar: Cloudinary (free tier) — evita montar un bucket S3 desde cero. **No confirmado por el equipo todavía.**
- **Librería de calendario en frontend** para renderizar la vista de Agenda sincronizada con Google Calendar (ej. `react-big-calendar` o similar) — a decidir cuando se diseñe el módulo de Agenda.
- **Proveedor de envío de email** (requerido para el restablecimiento de contraseña, issue #27): opciones a evaluar — SMTP de Gmail (app password, más simple para desarrollo, sin alta en un servicio nuevo) vs. un servicio transaccional tipo Resend o SendGrid (mejor entregabilidad, más apropiado si esto llega a producción real). **No confirmado por el equipo todavía.**
