# Bitácora de Decisiones

Registro de decisiones tomadas sobre el documento original de journey del usuario, y de lo que sigue abierto. Este archivo manda sobre `journey-usuario.md` en caso de conflicto.

Última actualización: 2026-08-05.

## Resuelto

| Tema | Decisión |
|---|---|
| Roles del sistema | 3 roles con permisos y vistas distintas: **Administrador** (Dueña), **Asistente**, **Especialista** |
| Identificador de búsqueda de pacientes | **Teléfono** (no nombre — evita ambigüedad por duplicados/typos) |
| Modelo de "Paquete" | Es una entidad propia: conjunto de sesiones vinculado a paciente + servicio (total de sesiones, sesiones usadas, forma de pago, estado) |
| Comisión sobre paquetes | Se **prorratea por sesión aplicada**, no se paga completa al vender el paquete |
| Pagos a plazos de paquetes | Entra al MVP, pero como feature de **baja prioridad** — de las últimas en construirse dentro de ese milestone |
| Consentimiento informado | **Firma digital** (canvas en tablet). Se descarta la variante de firma en papel/escaneo |
| Descuento de insumos | **Automático**, vía receta de insumos configurada por servicio contratado (no descuento manual sesión por sesión) |
| Integración de calendario | **Google Calendar real** (OAuth2 + API), confirmado. No se construye un calendario interno temporal para después migrar — se hace real desde el MVP (Milestone 2), para no duplicar trabajo |
| Estructura de repositorio | Monorepo: frontend y backend en el mismo repo |

## Pendiente — a resolver en la sesión de equipo de hoy (2026-08-05)

- **Recurso de agenda:** ¿la clínica maneja **una sola agenda compartida**, o **una agenda por especialista/sala**? Esto define cómo se modela la integración con Google Calendar (¿un calendario de Google por especialista o uno solo?). **Bloqueante para diseñar el módulo de Agenda en el Milestone 2.**
- **Consentimiento genérico vs. por tratamiento:** ¿un solo texto de consentimiento sirve para todos los servicios, o cada tratamiento (láser, peeling, facial, etc.) necesita su propio texto de riesgos? Queda como *Requerimiento pendiente* — se resuelve justo antes de construir esa feature específica, no bloquea el arranque del proyecto.
- **Cancelaciones / no-shows:** si una paciente con paquete activo no se presenta a su cita, ¿la sesión se descuenta del paquete igual, o se reagenda sin penalización? *Por definir* antes de construir esa lógica.
- **Matriz exacta de permisos por rol:** qué puede ver y hacer cada uno de los 3 roles (Administrador / Asistente / Especialista) en cada vista. Pendiente hasta que el equipo lo defina en la sesión de trabajo de hoy.
- **Roles de los integrantes del equipo** (quién programa qué, no confundir con los roles del sistema): pendiente de asignar en la sesión de trabajo de hoy.
