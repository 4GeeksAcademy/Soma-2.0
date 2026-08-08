# La Churrería — SAS para Estéticas

Proyecto Final 4Geeks. Sistema de administración para una clínica de estética: agenda, expedientes clínicos, paquetes de sesiones, ventas/comisiones e inventario.

## Documentación

- [`docs/journey-usuario.md`](docs/journey-usuario.md) — Flujo completo del sistema (journey del usuario) y arquitectura de las 7 vistas.
- [`docs/stack.md`](docs/stack.md) — Stack técnico y decisiones de arquitectura.
- [`docs/decisiones.md`](docs/decisiones.md) — Bitácora de decisiones y **pendientes por resolver**.
- [`docs/milestones.md`](docs/milestones.md) — Milestones, alcance y fechas.
- [`docs/flujo-de-trabajo.md`](docs/flujo-de-trabajo.md) — Convención de branches y Pull Requests.

## Fechas clave

- Meta interna de equipo: **21 de agosto**
- Entrega oficial 4Geeks: **28 de agosto**

## Roles del sistema

Administrador (Dueña), Asistente, Especialista — permisos exactos en definición (ver `docs/decisiones.md`).

## Instalación (plantilla 4Geeks — React + Flask)

Backend:

1. Instalar paquetes: `pipenv install`
2. Copiar `.env.example` a `.env` y llenar los valores reales
3. Crear la base de datos (Postgres) y setear `DATABASE_URL` en `.env`
4. Generar migración: `pipenv run migrate` (solo si hay cambios en `src/api/models.py`)
5. Aplicar migración: `pipenv run upgrade`
6. Correr la app: `pipenv run start`

Frontend:

1. Instalar paquetes: `npm install`
2. Correr el servidor de desarrollo: `npm run start`

Más detalle en la [documentación oficial de la plantilla](https://4geeks.com/docs/start/react-flask-template).
