# Modelo de Datos (ERD inicial)

Última actualización: 2026-08-05. Este es un borrador para revisión del equipo — ajusten nombres de campo libremente, pero una vez acordado, no lo cambien sin avisar al resto (varios módulos dependen de estas tablas).

## Por qué existe este documento

Los 4 módulos (Agenda, Pacientes, Catálogo, Ventas) no son independientes a nivel de base de datos: hay tablas que se referencian entre módulos (foreign keys). Si cada quien modela su parte sin coordinar, terminamos con nombres de campo distintos para lo mismo, o con conflictos de migración (Alembic) al mezclar 4 PRs que tocan el esquema en paralelo.

## Orden de construcción recomendado

1. **`Usuario`** (login/roles) — fundacional, bloquea todo lo demás. Recomendado: la arma Jorge primero, ya que Agenda depende de `Usuario` para especialistas.
2. **`Paciente`** (Jhunalbis) y **`Servicio` / `Paquete`** (Kevin) — deben existir antes de que Agenda y Ventas puedan crear sus propias FKs hacia ellas.
3. El resto de las tablas depende de 1 y 2.

**Regla de migraciones:** antes de mergear cualquier PR que toque modelos, hacer `git pull origin main` y regenerar la migración (`flask db migrate`) para evitar múltiples heads de Alembic.

---

## `Usuario` — fundacional

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| nombre | texto |
| email | texto, único |
| password_hash | texto |
| rol | enum: admin \| asistente \| especialista |

## `Paciente` — Jhunalbis

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| nombre_completo | texto |
| telefono | texto, **único** (identificador de búsqueda — ver `decisiones.md`) |
| cedula | texto, único |
| edad | número |
| tipo_piel | texto |
| alergias | texto |

**Cambios 2026-08-08:** `nombre` → `nombre_completo`. Se agregan `cedula`, `tipo_piel`, `alergias`. Se quita `ocupacion` (no se implementó). `telefono` sigue siendo el único campo con restricción `unique` — es el identificador de búsqueda, no `cedula` (aunque `cedula` también sea única como dato de identidad, no reemplaza a `telefono` en ese rol).

## `HistorialClinico` — Jhunalbis

Reemplaza a los modelos `ExpedienteClinico`, `Consentimiento`, `FotoEvolucion` y `BitacoraEvolucion` que estaban planeados por separado — se consolidan en una sola tabla, una fila por visita.

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| paciente_id | FK → Paciente |
| cita_id | FK → Cita |
| foto_antes_url | texto, nullable |
| foto_despues_url | texto, nullable |
| observaciones | texto, nullable |

**Cambios 2026-08-08 (consolidación):** esta tabla **no tiene campo para la firma digital del consentimiento** (`firma`/`fecha_firma` del `Consentimiento` original) ni los campos clínicos detallados del `ExpedienteClinico` original (`cirugias`, `enfermedades_cronicas`, `medicamentos`, `embarazo_lactancia`, `fototipo`, `sensibilidad`, `tratamientos_previos`). Si el consentimiento informado con firma digital (ya confirmado en `decisiones.md`) sigue siendo un requisito, falta decidir dónde vive ese dato — no quedó modelado en ningún lado tras esta consolidación.

## `Servicio` — Kevin

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| nombre | texto |
| precio | número |
| duracion_min | número |
| porcentaje_comision | número |

## `Paquete` — Kevin

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| nombre | texto |
| precio_total | número |

## `PaqueteServicio` (detalle: qué servicios y cuántas sesiones componen un paquete) — Kevin

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| paquete_id | FK → Paquete |
| servicio_id | FK → Servicio |
| num_sesiones | número |

## `Insumo` — Kevin

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| nombre | texto |
| stock | número entero |

## `RecetaServicio` (receta fija, bill of materials) — Kevin

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| servicio_id | FK → Servicio |
| insumo_id | FK → Insumo |
| cantidad_fija | número entero |

## `EspacioTrabajo` — Jorge

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| nombre | texto |
| tipo | texto (sala/cama/estación) |

## `Cita` — Jorge

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| paciente_id | FK → Paciente |
| especialista_id | FK → Usuario |
| espacio_id | FK → EspacioTrabajo |
| servicio_id | FK → Servicio, nullable (si es sesión suelta) |
| paquete_paciente_sesion_id | FK → PaquetePacienteSesion, nullable (si es sesión de un paquete) |
| fecha_hora | fecha/hora |
| estado | enum: agendada \| reprogramada \| completada \| cancelada |
| google_event_id | texto |

## `PaquetePaciente` (instancia de un paquete comprado por una paciente) — Kevin/Francisco

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| paciente_id | FK → Paciente |
| paquete_id | FK → Paquete |
| fecha_compra | fecha |
| forma_pago | enum: contado \| plazos |
| estado | enum: activo \| agotado |

## `PaquetePacienteSesion` (cada sesión individual dentro del paquete comprado) — Kevin/Jorge

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| paquete_paciente_id | FK → PaquetePaciente |
| servicio_id | FK → Servicio |
| estado | enum: pendiente \| aplicada |
| cita_id | FK → Cita, nullable |

## `Venta` — Francisco

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| paciente_id | FK → Paciente |
| cita_id | FK → Cita, nullable |
| servicio_id | FK → Servicio, nullable |
| paquete_paciente_id | FK → PaquetePaciente, nullable |
| monto_total | número |
| fecha | fecha |

## `Pago` (abonos, uno o varios por venta) — Francisco

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| venta_id | FK → Venta |
| monto | número |
| metodo | texto |
| fecha | fecha |

## `Comision` — Francisco

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| especialista_id | FK → Usuario |
| venta_id | FK → Venta |
| monto | número |
| mes | fecha (año-mes) |
| pagada | booleano |

## `GastoFijo` — Francisco

| Campo | Tipo / Referencia |
|---|---|
| id | PK |
| concepto | texto |
| monto | número |
| fecha | fecha |
