# Equipo

Asignación por módulo (ownership vertical: cada quien lleva su módulo de frontend a backend, no split por capa). Asignada el 2026-08-05.

| Persona | Módulo | Cubre |
|---|---|---|
| **Jorge Cruz** | Agenda + Coordinación general | Vista 3 (Agenda / Google Calendar), Espacios de Trabajo. Además: revisión de PRs, mantenimiento del Project board, seguimiento de fechas de Milestone |
| **Jhunalbis** | Pacientes + Expediente Clínico | Vista 4 completa: datos demográficos, anamnesis, bitácora de evolución, galería antes/después, consentimientos con firma digital |
| **Kevin** | Catálogo + Inventario | Servicios, Paquetes, Espacios de Trabajo (CRUD), receta fija de insumos, comisión prorrateada |
| **Francisco** | Ventas/Facturación + Dashboard | Vista 5 y 2: cobros, abonos, pagos a plazos, gráficas de ingresos y comisiones |

## Por qué esta agrupación

- **Vertical, no por capa:** cada persona es dueña de su módulo de punta a punta (modelo de datos, endpoint, UI) para evitar cuellos de botella de integración con un timeline de 16 días.
- **Agenda con el coordinador:** es el módulo de mayor riesgo técnico (OAuth real con Google Calendar, choque de especialista + espacio), conviene que lo lleve quien está más cerca del seguimiento general de fechas.
- **Pacientes con quien más contexto clínico tiene:** el journey clínico original fue redactado por integrante del equipo con ese conocimiento de dominio.
