# Meridian — Brand Guidelines (plantilla)

[![Demo en vivo](https://img.shields.io/badge/Demo-en%20vivo-2348E0?style=for-the-badge&logo=github)](https://dmxstudio.github.io/dmx-web-brand-guidelines-template/) [![Licencia](https://img.shields.io/badge/Licencia-CC%20BY--NC%204.0-555555?style=for-the-badge)](./LICENSE)

**▶️ Ver demo en vivo → https://dmxstudio.github.io/dmx-web-brand-guidelines-template/**

| Modo claro | Modo oscuro |
|:----------:|:-----------:|
| ![Meridian brand book — modo claro](assets/img/screenshot-light.png) | ![Meridian brand book — modo oscuro](assets/img/screenshot-dark.png) |

Plantilla profesional de *brand guidelines*, **multipágina, bilingüe (ES/EN), responsive e imprimible**, construida en **HTML + CSS + JS estático** (sin build, portable). Pensada como base reutilizable y para integrarse a un sistema mayor. Marca demo ficticia: **Meridian** ("Aligned by design").

Este README **complementa** [`brandbook-catalog.json`](./brandbook-catalog.json) (el índice machine-readable de todo el contenido).

---

## De un vistazo

- **6 páginas / 55 secciones** · core 26 · rec 24 · adv 5 · con media 33 · solo-texto 22
- **Bilingüe ES/EN** con toggle (persistido en `localStorage`); títulos con nombre estándar EN
- **Dirección visual B · "Sistema suizo"**: cobalto `#2348E0`, Space Grotesk + Inter, neutros fríos
- IA validada contra estándar internacional (IBM, Mailchimp, Material, Atlassian, Audi, Uber, Spotify) + la referencia *flowguide*
- **Modo claro/oscuro (web)**: tema por tokens de rol, toggle persistido (`localStorage`), anti-FOUC y metas `color-scheme`/`theme-color`; los demostradores de marca (swatches, logos, mockups) **no se invierten**. Guía dedicada en la sección 3.7

## Stack y cómo correr

Estático: cualquier servidor de archivos. Ej.:
```
python3 -m http.server 4173 --directory brand-guidelines
```
(En este repo está configurado en `.claude/launch.json` como `brand-guidelines`.)

## Estructura de archivos

```
brand-guidelines/
  index.html            00 · Portada (front matter)
  01-strategic.html     01 · Fundamento estratégico
  02-voice.html         02 · Tono de voz
  03-visual.html        03 · Identidad visual
  04-applications.html  04 · Aplicaciones
  05-resources.html     05 · Recursos y gobernanza
  brandbook-catalog.json   índice machine-readable (este doc lo complementa)
  assets/
    css/  tokens · base · nav · components (@imports motion) · print
    js/   config · i18n · nav · copy
    i18n/ es.json · en.json
    downloads/  archivos reales descargables (ver abajo)
```

## Arquitectura de IA (6 áreas)

`00` Portada → `01` Fundamento (purpose-led: Propósito → Visión → Misión → Valores) → `02` Voz → `03` Visual → `04` Aplicaciones → `05` Recursos. El detalle por sección (id, número, nombre ES/EN, tier, media, tipos) está en el catálogo.

## Cómo leer `brandbook-catalog.json`

Objeto raíz: `brand`, `version`, `totals`, `legend`, `pillars[]`. Cada sección:

| Campo | Significado |
|---|---|
| `id` | identificador estable (= ancla `#id` en la página y key i18n `sections.<id>`) |
| `num` | número visible (p. ej. `3.4`) |
| `name_es` / `name_en` | título bilingüe |
| `tier` | `core` (esencial) · `rec` (recomendado) · `adv` (avanzado) |
| `media` | `true` si la sección espera assets más allá de texto |
| `mediaTypes` | uno o más de 16 tipos (ver `legend.mediaType`): text, color, vector, font, image, illustration, pattern, icon-set, diagram, mockup, motion, audio, chart, document, file-bundle, code |
| `mediaOptional` | `true` si el media es opcional |
| `deliverable` | qué entregable se espera en esa sección |

## Sistema de diseño (tokens)

Definido en `assets/css/tokens.css` y exportado en `assets/downloads/meridian.tokens.json` (formato **W3C**) y `meridian.tailwind.js`.
- **Color:** Cobalt `#2348E0` (primario), Ink `#0E1116`, Mist `#EEF1F5` + escalas de marca y neutros (50–900) + semánticos. Pares validados a **WCAG 2.2 AA**.
- **Tipografía:** Space Grotesk (display), Inter (texto), Space Mono (mono). **Fallbacks con `size-adjust`** (faces metric-matched) para CLS ~0.
- **Espaciado** 8pt · **radios** 6/10/16.

## Navegación e interacción

- Multipágina con **top-nav** + **sub-navegación horizontal** (sticky, scrollspy) + **paginación prev/next** + toggle ES/EN.
- **Menú móvil** (drawer) bajo 820px.
- **Nav que se oculta al bajar y reaparece al subir**; el sub-menú queda fijado arriba.
- **Reveal al scroll** (IntersectionObserver, transición 0.75s, re-dispara) + parallax sutil en el hero. Hovers: zoom en imágenes, lift en botones.
- Todo el movimiento respeta `prefers-reduced-motion` y se neutraliza en impresión.

## Accesibilidad

Landmarks semánticos, un solo H1 por página, foco visible, `alt`/`aria` en marcas y diagramas, contraste AA, `prefers-reduced-motion`, navegación por teclado.

## Impresión / PDF

`assets/css/print.css`: `print-color-adjust: exact` (los colores sí imprimen), saltos de página por componente, oculta el chrome interactivo, y header/footer corridos (marca + página / versión + URL).

## Convenciones de formato (sección 2.8)

Fechas, horas, números, moneda, porcentaje, rangos, teléfono y unidades en **es-MX**, **en-US** y **Datos/ISO 8601**. Regla: guardar en ISO 8601 / E.164 / ISO 4217 y formatear en display con `Intl`/CLDR/ICU. Config machine-readable en `assets/downloads/meridian.formats.json`.

## Descargables reales (`assets/downloads/`)

`meridian.tokens.json` (W3C) · `meridian.tailwind.js` · `meridian.dark.css` · `meridian.formats.json` · `meridian-colors.json` · `meridian-logo.svg` · `llms.txt` · `meridian-voice.md` (system prompt de voz) · `AGENTS.md` · `meridian.mcp.json`. En la guía se listan junto a binarios demo (fonts/plantillas/skills/.zip, Figma/Pencil) y el botón "Brand guidelines" dispara imprimir/PDF.

## Notas de integración

- Los `id` de sección son la llave de unión con cualquier sistema: coinciden con anclas `#id` y con las keys i18n `sections.<id>` / `purpose.<id>`.
- El contenido bilingüe vive en `assets/i18n/{es,en}.json` (namespaces: `nav`, `ui`, `home`, `pages`, `sections`, `purpose`, `viz`, `dm`, `p3`, `fmt`).
- `tier` + `media` + `mediaTypes` permiten mapear cada sección a campos/uploaders/validaciones de tu sistema.
- Las secciones `adv` (sonora, data-viz, vehículos) van como placeholders demostrativos: actívalas solo donde la marca tenga ese touchpoint.

## Licencia

© 2026 **DMX Studio**. Publicado bajo **Creative Commons Attribution–NonCommercial 4.0 International (CC BY-NC 4.0)** — texto completo en [`LICENSE`](./LICENSE).

- ✅ **Libre de usar, copiar y adaptar** — siempre con **atribución** a DMX Studio (crédito visible + enlace al repositorio y a la licencia).
- 🚫 **No comercial**: no se permite **vender** el template ni usarlo con fines comerciales **sin permiso y remuneración previa**.
- 💼 ¿Uso comercial o licencia a medida? Escríbenos a **designomexico@gmail.com**.

`SPDX-License-Identifier: CC-BY-NC-4.0`

---

_Versión de contenido: v0.1 · estándar internacional · bilingüe ES/EN._
