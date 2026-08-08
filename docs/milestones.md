# Milestones

Meta interna de equipo: **21 de agosto de 2026**. Entrega oficial 4Geeks: **28 de agosto de 2026**.

## M1 — Definición de alcanzables y arquitectura
**Fecha límite: 5 de agosto**

- Documentación base del proyecto (este `/docs`).
- Resolver los pendientes de `decisiones.md`: recurso de agenda, matriz de permisos por rol, composición de paquetes, granularidad de Google Calendar.
- Pendiente de cerrar: roles de los integrantes del equipo (quién programa qué).
- Modelo de datos inicial.

## M2 — MVP
**Fecha límite: lunes 10 de agosto**

- Login con 3 roles (Administrador, Asistente, Especialista) — incluye modelo de Usuario con email real y contraseña cifrada (Werkzeug), alta de usuario por Admin, y restablecimiento de contraseña por email (issues #25, #26, #27).
- Gestión de Pacientes + expediente básico.
- Catálogo de servicios y paquetes (alta de servicios, armado de paquetes predefinidos).
- Espacios de trabajo (configuración) — requerido por Agenda para evitar choques de recursos.
- Agenda con integración real a Google Calendar (un solo calendario compartido, especialista + espacio por cita).
- Ventas: pago completo y abonos.
- Pagos a plazos de paquetes (prioridad baja — última feature del milestone).
- Dashboard básico.

## M3 — Fase 2
**Fecha límite: lunes 17 de agosto**

- Paquetes de sesiones + comisión prorrateada por sesión aplicada.
- Consentimientos informados con firma digital (texto genérico).
- Galería de fotos "Antes y Después".
- Inventario con descuento automático por receta fija de servicio (unidades enteras).

## M4 — Nice to have
**Fecha límite: viernes 21 de agosto (meta interna)**

- Recordatorios por WhatsApp (deep link con mensaje precargado).
- Cierre de caja / conciliación con dinero físico-bancario.
- Reporte automatizado de comisiones de fin de mes.
