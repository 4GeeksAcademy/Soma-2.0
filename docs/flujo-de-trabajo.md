# Flujo de trabajo (branches y Pull Requests)

## Reglas

- `main` es la rama protegida. **Nunca se le hace push directo** (salvo el commit inicial de arranque del repo).
- Todo cambio se hace en una branch corta y se integra a `main` vía Pull Request.
- Antes de mergear, al menos **1 compañero revisa el PR**.
- Al mergear, se borra la branch.

## Nomenclatura de branches

`<tipo>/<numero-issue>-<descripcion-corta>`

- `feature/12-modulo-agenda`
- `fix/8-bug-login`
- `docs/setup-inicial`

El número referencia el issue de GitHub que la branch resuelve.

## Flujo típico

1. Tomar un issue del Project.
2. Crear branch desde `main` actualizado: `git checkout -b feature/12-modulo-agenda`.
3. Trabajar y commitear en esa branch.
4. Abrir Pull Request hacia `main`. En la descripción incluir `Closes #12` para que el issue se cierre y mueva solo en el Project al hacer merge.
5. Esperar revisión de al menos un compañero.
6. Mergear y borrar la branch.

## Por qué

Evita que todos trabajen sobre la misma branch (conflictos masivos de merge) y evita que código sin revisar llegue directo a `main`.
