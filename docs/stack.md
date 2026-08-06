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
| Calendario | Google Calendar real (OAuth2 + Google Calendar API) — **un solo calendario compartido de la clínica**, no uno por especialista. Eventos etiquetados con especialista y espacio de trabajo asignados |
| Recursos de agenda | Cada cita requiere **especialista + espacio de trabajo** disponibles simultáneamente (varias especialistas, varios espacios) |
| Firma de consentimientos | Firma digital (canvas), texto genérico único para todos los tratamientos |
| Inventario | Descuento automático por receta fija de insumos por servicio. Unidades enteras (no ml/volumen) |

## Roles del sistema

Administrador (Dueña), Asistente, Especialista — 3 roles con vistas y permisos distintos. Matriz completa de permisos: ver `decisiones.md`.

## Pendiente de definir

- **Almacenamiento de fotos y firmas** (antes/después, firma digital de consentimientos): no se ha confirmado proveedor. Sugerencia a evaluar: Cloudinary (free tier) — evita montar un bucket S3 desde cero. **No confirmado por el equipo todavía.**
- **Librería de calendario en frontend** para renderizar la vista de Agenda sincronizada con Google Calendar (ej. `react-big-calendar` o similar) — a decidir cuando se diseñe el módulo de Agenda.
