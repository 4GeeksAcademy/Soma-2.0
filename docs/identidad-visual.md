# Identidad visual de Soma

Sistema de diseño v1, definido para alinear al equipo antes de construir el UI. Vive en este doc + en `src/front/styles/tokens.css` (tokens reales, listos para usar en cualquier componente). Versión interactiva navegable: **https://claude.ai/code/artifact/46a173f7-0d32-4c6d-8ccd-231eec4c1f26** (paleta, tipografía, radios, glassmorphism y componentes base en vivo — mejor punto de partida antes de leer este doc).

## Dirección de marca

- **Tono:** spa / bienestar premium, pero el producto maneja expedientes clínicos y consentimientos firmados — de ahí la tensión deliberada "calidez de spa, precisión clínica".
- **Paleta:** blanco predominante, UI en negro cálido, acentos en nude/beige/café. Referencia de partida: apps tipo "N99° Beauty Studio" (fotografía cálida + chips de vidrio esmerilado sobre foto + botones píldora), pero en versión **clara**, no oscura.
- **Forma:** bordes muy redondeados (radio grande) y superficies de vidrio esmerilado (glassmorphism) sobre fotografía.
- **Elemento firma:** la píldora de vidrio flotando sobre una foto cálida (chips, hoja de confirmación) — se repite en agenda, expedientes y en la landing. Es lo que hace que la app se vea como "Soma" y no como cualquier dashboard genérico.

## Paleta

| Token | Hex | Uso |
|---|---|---|
| `--color-paper` | `#FCFAF7` | Fondo predominante — pantallas, modales, tarjetas |
| `--color-paper-alt` | `#F4EEE6` | Fondo secundario — sidebar, header de tabla, hover de fila |
| `--color-ink` | `#1C1815` | Negro cálido — texto principal, nav, botones primarios. **Nunca `#000` puro** |
| `--color-ink-soft` | `#4A4038` | Texto secundario |
| `--color-ink-faint` | `#8C8177` | Texto terciario / placeholders |
| `--color-nude` | `#E7D6C4` | Superficies suaves — chips, badges neutros, hover de nav |
| `--color-beige` | `#D3BC9C` | Bordes, divisores, botones secundarios |
| `--color-cafe` | `#5A3826` | Acento de marca — links, íconos activos, foco. Cumple AA sobre paper |

**Semántico — independiente del acento de marca.** Nunca usar café/nude para representar estado; siempre este set:

| Estado | Fondo | Texto |
|---|---|---|
| Confirmada / en stock | `#E4E9DC` | `#4F6142` |
| Pendiente / stock bajo | `#F3E4C8` | `#8A5A18` |
| Cancelada / agotado | `#F3DCD4` | `#9C4632` |

## Tipografía

Tres roles, sin excepciones:

- **Display — Fraunces** (peso 600): títulos H1/H2 únicamente. Uso restringido — es el tono cálido/editorial, no se usa para párrafos ni UI.
- **Body — Plus Jakarta Sans** (peso 400–500): todo el texto de interfaz, párrafos, botones, labels. Terminales suaves que dialogan con el radio grande de los componentes.
- **Data — JetBrains Mono** (peso 400–600): horarios, precios, cifras de inventario. Siempre con `font-variant-numeric: tabular-nums` para que las columnas alineen.

Ya están cargadas vía Google Fonts en `tokens.css`. Para producción (mejor rendimiento, sin depender del CDN) migrar a self-host con `fontsource`:

```
npm i @fontsource/fraunces @fontsource-variable/plus-jakarta-sans @fontsource/jetbrains-mono
```

## Radios

| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | 10px | checkboxes, elementos chicos |
| `--radius-sm` | 16px | inputs |
| `--radius-md` | 24px | tarjetas, contenedor de tabla |
| `--radius-lg` | 32px | paneles, modales |
| `--radius-xl` | 40px | hero, contenedores de media |
| `--radius-full` | 999px | botones, chips, avatares, nav — **todo lo que sea interactivo y pequeño es píldora** |

## Glassmorphism — dos recetas, no una

**Glass Light** — tarjetas elevadas y modales sobre fondo blanco:
```css
background: var(--glass-light-bg);       /* rgba(255,255,255,.60) */
backdrop-filter: blur(18px) saturate(160%);
border: 1px solid var(--glass-light-border);
```

**Glass Ink** — overlays *directamente sobre fotografía real* (galería del expediente, antes/después, portada de servicio):
```css
background: var(--glass-ink-bg);         /* rgba(28,24,21,.46) */
backdrop-filter: blur(16px) saturate(150%);
border: 1px solid var(--glass-ink-border);
color: var(--color-paper);
```

### Dónde sí / dónde no

- ✅ Glass Ink sobre fotos de antes/después, portadas de servicio, galería de inspiración del cliente.
- ✅ Glass Light para la hoja de confirmación de cita y modales que flotan sobre contenido.
- ❌ Blur sobre tablas de inventario o formularios largos — reduce contraste y cuesta rendimiento en listas largas. Ahí van superficies planas (`--color-paper` / `--color-paper-alt`).
- ❌ Café u otro acento como fondo grande — se reserva para texto, íconos y detalles pequeños.

## Checklist rápido antes de construir una pantalla

- [ ] Fondo `--color-paper` por defecto; `--color-paper-alt` solo para diferenciar zonas.
- [ ] `--color-ink` es el único negro — nunca `#000` puro en texto ni superficies.
- [ ] Radio mínimo en cualquier componente nuevo: `--radius-sm` (16px). Botones y chips siempre píldora.
- [ ] Todo estado (confirmado/pendiente/cancelado, stock) usa el set semántico, nunca café ni nude.
- [ ] Cifras, horas y precios siempre en `--font-data` con tabular-nums.
- [ ] Foco de teclado visible en cada elemento interactivo.

## Cómo usar los tokens

Ya están importados globalmente vía `src/front/index.css` → `src/front/styles/tokens.css`. Cualquier componente puede usarlos directo:

```css
.mi-boton {
  background: var(--color-ink);
  color: var(--color-paper);
  border-radius: var(--radius-full);
  font-family: var(--font-body);
}
```

No se agregó ninguna librería de UI ni Tailwind — son variables CSS planas para no imponer una decisión de stack que no se discutió con el equipo. Si en algún momento se quiere migrar a Tailwind, estos mismos valores se mapean directo a `theme.extend` en `tailwind.config.js`.
