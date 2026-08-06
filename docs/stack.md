# Stack Técnico

## Confirmado

| Capa | Tecnología |
|---|---|
| Frontend | React (Vite) |
| Backend | Flask |
| ORM | SQLAlchemy |
| Base de datos | PostgreSQL |
| Autenticación | JWT |
| Estructura de repo | Monorepo — `/frontend` y `/backend` en el mismo repo (`La-Churrer-a`) |
| Calendario | Integración real con Google Calendar (OAuth2 + Google Calendar API). No se construye un calendario interno intermedio. |
| Firma de consentimientos | Firma digital (canvas), no papel/escaneo |
| Inventario | Descuento automático por receta de insumos configurada por servicio |

## Roles del sistema

Administrador (Dueña), Asistente, Especialista — 3 roles con vistas y permisos distintos. Matriz exacta de permisos: **pendiente** (ver `decisiones.md`).

## Pendiente de definir

- **Almacenamiento de fotos y firmas** (antes/después, firma digital de consentimientos): no se ha confirmado proveedor. Sugerencia a evaluar: Cloudinary (free tier) — evita montar un bucket S3 desde cero. **No confirmado por el equipo todavía.**
- **Librería de calendario en frontend** para renderizar la vista de Agenda sincronizada con Google Calendar (ej. `react-big-calendar` o similar) — a decidir cuando se diseñe el módulo de Agenda.
