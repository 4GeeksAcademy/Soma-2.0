# Identidad visual de Soma

Sistema de diseño v1, definido para alinear al equipo antes de construir el UI. Vive en este doc + en `tailwind.config.js` (los tokens reales, ya cargados como clases de utilidad). Versión interactiva navegable: **https://claude.ai/code/artifact/46a173f7-0d32-4c6d-8ccd-231eec4c1f26** (paleta, tipografía, radios, glassmorphism y componentes base en vivo — mejor punto de partida antes de leer este doc).

## Dirección de marca

- **Tono:** spa / bienestar premium, pero el producto maneja expedientes clínicos y consentimientos firmados — de ahí la tensión deliberada "calidez de spa, precisión clínica".
- **Paleta:** blanco predominante, UI en negro cálido, acentos en nude/beige/café. Referencia de partida: apps tipo "N99° Beauty Studio" (fotografía cálida + chips de vidrio esmerilado sobre foto + botones píldora), pero en versión **clara**, no oscura.
- **Forma:** bordes muy redondeados (radio grande) y superficies de vidrio esmerilado (glassmorphism) sobre fotografía.
- **Elemento firma:** la píldora de vidrio flotando sobre una foto cálida (chips, hoja de confirmación) — se repite en agenda, expedientes y en la landing. Es lo que hace que la app se vea como "Soma" y no como cualquier dashboard genérico.

## Stack de UI: Tailwind CSS

El proyecto usa **Tailwind CSS** (v3, vía PostCSS). Todos los tokens de abajo están mapeados en `tailwind.config.js` — no hay variables CSS sueltas que mantener sincronizadas a mano. Después de traer esta rama, correr `npm install` una vez para que se instalen `tailwindcss`, `postcss` y `autoprefixer`.

## Paleta

| Clase Tailwind | Hex | Uso |
|---|---|---|
| `bg-paper` / `text-paper` | `#FCFAF7` | Fondo predominante — pantallas, modales, tarjetas |
| `bg-paper-alt` | `#F4EEE6` | Fondo secundario — sidebar, header de tabla, hover de fila |
| `bg-ink` / `text-ink` | `#1C1815` | Negro cálido — texto principal, nav, botones primarios. **Nunca `#000` puro (no usar `bg-black`)** |
| `text-ink-soft` | `#4A4038` | Texto secundario |
| `text-ink-faint` | `#8C8177` | Texto terciario / placeholders |
| `bg-nude` | `#E7D6C4` | Superficies suaves — chips, badges neutros, hover de nav |
| `bg-nude-deep` | `#D9C3A9` | Variante más oscura de nude |
| `bg-beige` / `border-beige` | `#D3BC9C` | Bordes, divisores, botones secundarios |
| `text-cafe` / `bg-cafe` | `#5A3826` | Acento de marca — links, íconos activos, foco. Cumple AA sobre paper |
| `bg-cafe-soft` | `#8A6349` | Variante clara de café — hover, detalles |

**Semántico — independiente del acento de marca.** Nunca usar `cafe`/`nude` para representar estado; siempre este set:

| Estado | Clases |
|---|---|
| Confirmada / en stock | `bg-success-bg text-success-text` |
| Pendiente / stock bajo | `bg-warning-bg text-warning-text` |
| Cancelada / agotado | `bg-error-bg text-error-text` |

## Tipografía

Tres roles, sin excepciones, disponibles como `font-display` / `font-body` / `font-data`:

- **`font-display` — Fraunces** (peso 600): títulos H1/H2 únicamente. Ya aplicado por defecto a `h1`–`h4` en `index.css`. Uso restringido — no se usa para párrafos ni UI.
- **`font-body` — Plus Jakarta Sans** (peso 400–500): todo el texto de interfaz, párrafos, botones, labels. Es la fuente default del `body`.
- **`font-data` — JetBrains Mono** (peso 400–600): horarios, precios, cifras de inventario. Combinar siempre con `tabular-nums` (`font-variant-numeric: tabular-nums`, o la clase `tabular-nums` de Tailwind) para que las columnas alineen.

Las tres se cargan vía Google Fonts en `index.css`. Para producción (mejor rendimiento, sin depender del CDN) migrar a self-host con `fontsource`:

```
npm i @fontsource/fraunces @fontsource-variable/plus-jakarta-sans @fontsource/jetbrains-mono
```

## Radios

`rounded-{tamaño}` — **ojo:** estos valores sobreescriben los defaults de Tailwind a propósito, no son los estándar del framework:

| Clase | Valor | Uso |
|---|---|---|
| `rounded-xs` | 10px | checkboxes, elementos chicos |
| `rounded-sm` | 16px | inputs |
| `rounded-md` | 24px | tarjetas, contenedor de tabla |
| `rounded-lg` | 32px | paneles, modales |
| `rounded-xl` | 40px | hero, contenedores de media |
| `rounded-full` | píldora | botones, chips, avatares, nav — **todo lo que sea interactivo y pequeño es píldora** |

## Glassmorphism — dos recetas, no una

Ya están armadas como clases de componente en `index.css` (`@layer components`) — se usan directo, sin repetir utilidades:

```html
<!-- Glass Light: tarjetas elevadas y modales sobre fondo blanco -->
<div class="glass-light rounded-lg p-4">...</div>

<!-- Glass Ink: overlays directamente sobre fotografía real (galería, antes/después) -->
<div class="glass-ink rounded-full px-4 py-2">...</div>
```

Si hace falta ajustar la receta, se edita una sola vez en `src/front/index.css`, no en cada componente.

### Dónde sí / dónde no

- ✅ `glass-ink` sobre fotos de antes/después, portadas de servicio, galería de inspiración del cliente.
- ✅ `glass-light` para la hoja de confirmación de cita y modales que flotan sobre contenido.
- ❌ Blur sobre tablas de inventario o formularios largos — reduce contraste y cuesta rendimiento en listas largas. Ahí van superficies planas (`bg-paper` / `bg-paper-alt`).
- ❌ Café u otro acento como fondo grande — se reserva para texto, íconos y detalles pequeños.

## Checklist rápido antes de construir una pantalla

- [ ] Fondo `bg-paper` por defecto; `bg-paper-alt` solo para diferenciar zonas.
- [ ] `ink` es el único negro — nunca `bg-black`/`text-black` de Tailwind.
- [ ] Radio mínimo en cualquier componente nuevo: `rounded-sm` (16px). Botones y chips siempre `rounded-full`.
- [ ] Todo estado (confirmado/pendiente/cancelado, stock) usa `success`/`warning`/`error`, nunca `cafe` ni `nude`.
- [ ] Cifras, horas y precios siempre en `font-data` con `tabular-nums`.
- [ ] Foco de teclado visible en cada elemento interactivo (Tailwind ya trae `focus-visible` por defecto — no quitarlo con `outline-none` sin reemplazo).

## Ejemplo

```jsx
<button className="bg-ink text-paper font-body font-semibold rounded-full px-6 py-3 shadow-soft hover:bg-cafe">
  Confirmar cita
</button>
```
