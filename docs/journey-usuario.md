# Flujo del Sistema (Journey del Usuario)

> Documento fuente redactado por el equipo. Las decisiones que modifican o resuelven ambigüedades de este documento están en [`decisiones.md`](decisiones.md) — ese archivo manda sobre este en caso de conflicto.

## Fase 1: El Primer Contacto y la Reserva Inteligente

- **La Paciente:** Escribe por WhatsApp pidiendo una cita (ej. para un Tratamiento Facial o Sesión Reductiva).
- **La Asistente:** Entra al sistema, abre la Agenda (Google Calendar) y selecciona un horario libre.
- **El Sistema:** Muestra una barra de Búsqueda Inteligente (por teléfono — ver decisiones.md).
  - **Camino A (Paciente Nueva):** La asistente no la encuentra en el buscador. El sistema le pide los datos básicos (Nombre, Teléfono, Servicio deseado) y la guarda como un nuevo registro.
  - **Camino B (Paciente Recurrente - Servicio Nuevo):** La asistente escribe el teléfono, el sistema la reconoce y autocompleta sus datos al instante. Selecciona el nuevo servicio y guarda.
  - **Camino C (Paciente Recurrente - Paquete Activo):** El sistema detecta que la paciente tiene un paquete comprado (ej. Reductivo 10 sesiones). La asistente hace clic en agendar siguiente sesión. El sistema enlaza la cita y la marca como "Sesión 2 de 10", sin generar un cobro duplicado.
- **El Sistema:** Bloquea el horario en Google Calendar para evitar choques de agenda.

## Fase 2: El Recordatorio Automático (El día anterior)

- **La Asistente:** Revisa la agenda del día de "Mañana".
- **La Asistente:** Hace clic en el botón de "WhatsApp" al lado del nombre de cada paciente.
- **El Sistema:** Abre WhatsApp Web con un mensaje automático precargado: "Hola [Nombre], te recordamos tu cita mañana a las [Hora] para tu [Servicio]...".
- **La Paciente:** Recibe el mensaje y confirma su asistencia.

## Fase 3: Llegada a la Clínica y Consentimientos

- **La Paciente:** Llega físicamente a la estética.
- **La Asistente:**
  - Si es Nueva: Va a "Gestión de Pacientes" y crea su Ficha Clínica médica completa (alergias, edad, tipo de piel).
  - Si es Recurrente: Se salta este paso (su ficha ya existe).
- **Consentimiento Informado (firma digital — ver decisiones.md):**
  - Si es un servicio nuevo o la 1ra sesión de un paquete, la asistente genera el consentimiento. La paciente lo firma digitalmente en una Tablet.
  - Si es la sesión 2 de un paquete activo, el sistema detecta que ya firmó antes y se salta este paso.
- **La Especialista:** Desde su Tablet/PC revisa el historial, verifica la firma, hace pasar a la paciente y le toma la Foto del "Antes", cargándola directo a la Galería de la paciente.

## Fase 4: El Tratamiento y el Control de Inventario

- **La Especialista:** Realiza el tratamiento. Al terminar, toma la Foto del "Después" y la sube al historial para dejar evidencia de la evolución médica.
- **El Sistema:** Descuenta automáticamente los insumos del inventario según la receta configurada para ese servicio (ver decisiones.md).

## Fase 5: El Cobro y la Fidelización

- **La Paciente:** Pasa a recepción.
- **La Asistente:** Entra a Ventas y Facturación. Selecciona a la paciente.
  - Si es un servicio único/nuevo: El sistema trae el precio automáticamente del Catálogo de Servicios. La asistente registra el pago completo o un Abono (dejando una Deuda pendiente).
  - Si es una sesión de un paquete: El sistema indica que es una sesión de continuación (el monto a cobrar es $0, a menos que la paciente estuviera pagando el paquete a plazos y le toque dar una cuota).
- **El Sistema (Por detrás):** Registra la Comisión a favor de la Especialista, prorrateada por sesión aplicada (ver decisiones.md).
- **La Asistente:** Le pregunta cuándo debe volver y agenda ahí mismo su próxima sesión mediante la Búsqueda Inteligente.

## Fase 6: Cierre del Día / Mes (La Dueña)

- **La Dueña (al final del día):** Entra al Dashboard Principal. Revisa las gráficas de ingresos, servicios más populares del día y verifica que el "Cierre de Caja" coincida con el dinero físico/bancario.
- **La Dueña (a fin de mes):** Abre el reporte automatizado de Comisiones. Revisa cuánto dinero en comisiones generó cada Especialista, les paga y reinicia los contadores para el nuevo mes.

---

# Arquitectura de Vistas (Pantallas)

## 1. Vista de Login (Autenticación)
Formulario de acceso con correo y contraseña. Redirige según el rol: Administrador (Dueña), Asistente o Especialista (3 roles — ver decisiones.md).

## 2. Vista de Dashboard (Panel Principal)
Resumen general del día: gráficos de ingresos, servicios más vendidos, citas pendientes de hoy y cálculo mensual de comisiones.

## 3. Vista de Agenda y Citas (Calendario)
Calendario principal integrado con Google Calendar (integración real, no simulada). Búsqueda Inteligente de pacientes por teléfono para agendar (servicios únicos o continuación de un Paquete) y botón rápido para enviar recordatorios por WhatsApp.

## 4. Vista de Pacientes e Historial Clínico Exhaustivo
Lista de todos los pacientes. Al hacer clic en uno, se abre su Expediente Médico Completo:
1. **Datos Demográficos:** Nombre, edad, contacto, ocupación.
2. **Anamnesis (Antecedentes):** Alergias, cirugías, enfermedades crónicas, medicamentos, embarazo/lactancia.
3. **Perfil Estético:** Fototipo/tipo de piel, sensibilidad, tratamientos previos.
4. **Bitácora de Evolución:** Registro por sesión de qué se hizo, observaciones y parámetros usados.
5. **Consentimientos Informados:** Firmas digitales.
6. **Galería de "Antes y Después".**

## 5. Vista de Ventas y Facturación
La caja registradora: pagos completos o abonos, actualización automática de deudas, y asiento de comisiones de las especialistas.

## 6. Vista de Inventario y Gastos
Control de stock y caja chica: descuento automático de insumos por receta de servicio, y registro de gastos fijos del local.

## 7. Vista de Catálogo de Servicios (Configuración)
Panel administrativo — CRUD de tratamientos: precio, duración y % de comisión por servicio.
