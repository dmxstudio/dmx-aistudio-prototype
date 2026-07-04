# BrandBook (catálogo + visualizador) — Análisis de convivencia & plan de integración

> 2026-06 · Fuente: `~/ClaudeCode/brand-guidelines/` (catálogo `brandbook-catalog.json` de 53 secciones en 6 pilares + visualizador estático multipágina bilingüe, marca demo "Meridian"). Objetivo: alinearlo con nuestro **panel de Branding** (19 secciones) y poblar el visualizador con la data de nuestro panel.

---

## TL;DR

El catálogo es el **brand book "gold standard"** (**55 secciones** — el `brandbook-catalog.json` v0.1 listaba 53; el template suma **«Convenciones de formato»** (rec, 2.8) y **«Modo oscuro / web»** (core, 3.7) — 6 pilares, con tiers core/rec/adv y tipos de media). Nuestro panel de Branding **no es el mismo objeto**: es la **captura de DECISIONES/dirección** (≈19 secciones, ~50 campos de texto). El brand book es el **ENTREGABLE renderizado** — mucho más grande, con especificación fina y *assets* (vectores, fuentes, mockups, motion, audio).

Convivencia en **tres capas**: (1) **taxonomía** — nuestro panel es un subconjunto estratégico del catálogo y debería hablar su mismo idioma de IDs; (2) **profundidad de contenido** — nuestro campo = una frase de dirección, el visualizador quiere la spec completa (`viz.dontStretch`, escala tipográfica, do/don't, quotes de persona); (3) **assets** — el catálogo es pesado en media, nuestro panel es solo texto; los assets son OUTPUTS aguas abajo (tokens del handoff, logo/fuentes generados o subidos).

El visualizador se puebla con un **bundle** (`config.js` de marca + diccionario i18n + descargas) y su chrome es neutral ("Meridian" es solo el sujeto demo). Así que integrar = **generar ese bundle desde nuestro panel** y renderizar el visualizador (casi sin tocar). Encaja perfecto con el relato BYOM/agentes: las descargas (`*.tokens.json`, `tailwind.js`, `voice.md`, `AGENTS.md`, `*.mcp.json`, `llms.txt`) son **marca legible por máquina para agentes** — y son justo el "pago" que el repaso de arquitectura pedía.

---

## Qué es cada cosa (no confundir)

| | Nuestro **panel de Branding** | El **BrandBook** (catálogo + visualizador) |
|---|---|---|
| Rol | Captura de **decisiones/dirección** | **Entregable** renderizado (output) |
| Tamaño | 19 secciones · ~50 campos texto | 53 secciones · 6 pilares · spec + assets |
| Contenido | 1 frase por concepto (dirección) | Spec fina (`p3.*`, `viz.*`) + media |
| Quién lo llena | Estudio + agentes IA, campo por campo | Se **genera** desde el panel + assets |
| Dónde vive | Pipeline (paso 2) | **Output de Branding** (≠ "Visualizador" del sitio) |

⚠️ **Choque de nombres:** nuestro pipeline ya tiene un panel **"Visualizador"** (preview del *sitio generado*). El **visualizador del BrandBook** es otra cosa: el *brand book* renderizado. Hay que desambiguar (p. ej. "Brand Book" / "Vista de marca").

---

## Mapa de convivencia (catálogo → cobertura del panel)

✅ cubierto (tenemos la decisión) · ◑ parcial (dirección, falta profundidad/asset) · ✗ hueco · ⚙ generado aguas abajo

**00 Portada (3):** ⚙ todo se genera de metadata (nombre de marca, versión, owner via cuentas).

**01 Fundamento estratégico (6):** mission ✅ (essence/purpose/mission/values — falta *visión* explícita) · story ✗ · positioning ✅ · value-prop ✅ (uvp+promise) · audience ◑ (vive en **Brief** b-primary/secondary + perception; faltan personas/quotes) · personality ✅. **→ El pilar mejor cubierto.**

**02 Tono de voz (13):** verbal-foundations ◑ · voice-tone ◑ · writing-principles ◑ · tone-flexing ✗ · messaging ✅ · naming ◑ · grammar ✗ · terminology ◑ (vt-forbidden) · inclusive ✗ · examples ✗ (do/don't) · channels ✗ · **ai-voice ◑⚙ (mapea a nuestros agentes + las descargas voice.md/AGENTS.md)** · **convenciones-de-formato ✗⚙ (NUEVO, rec)** — fecha/hora/número/moneda/%/rango/teléfono/unidades por locale (es-MX/en-US) + storage ISO; entregable `formats.json`. **→ Nuestra área MÁS delgada: 3 campos vs 13 secciones. Gran oportunidad para que los agentes generen.**

**03 Identidad visual (15):** logo ◑ · logo-usage ◑ · logo-misuse ✗ · **color ✅** (cd-*; falta swatches/tokens del handoff) · **darkmode ✅ (sección propia en el panel, código 11)** — `cd-dark` + `dm-accent` + `dm-surface`; el sistema de tokens/código es output/handoff · typography ◑ (falta fuentes+escala) · accessibility ✅ · iconography ◑ · imagery ✅ · illustration ◑ · graphic-elements ✗ · grid ◑ · motion ◑ · dataviz ✗ · sonic ✗. **→ Dirección bien cubierta; faltan los ASSETS (vectores, fuentes, icon-set) que produce Design System / la generación.**

**04 Aplicaciones (14):** print/digital/app-ui/app-icons/social/email/presentations/advertising/packaging/signage/environmental/merch/vehicle/cobranding → casi todo ✗⚙. Nuestro panel tiene **1 campo** (app-rules). **→ El hueco estructural más grande — pero es apropiado: las aplicaciones son OUTPUTS (mockups), no decisiones.**

**05 Recursos & gobernanza (4):** assets ◑⚙ (handoff dsh-tokens + descargas) · legal ✗ · governance ◑ (owner/aprobación) · versioning ◑ (brief-versioning).

**Lectura:** de 55 secciones, ~13 cubiertas como decisión, ~18 parciales (dirección que necesita profundidad/asset), ~24 hueco o output aguas abajo. **Nuestro panel es el SOURCE estratégico; el brand book es un OUTPUT mucho mayor que el panel siembra pero no contiene entero.**

---

## Adición: Convenciones de formato (sección nueva, doble relevancia)

`brandbook-catalog.json` v0.1 (53) no la traía; el template real la suma (54). Es **doblemente relevante**:

1. **Sección del brand book** (pilar 02 · Voz/contenido, tier **rec**, media `code`+`text`). Documenta cómo la marca escribe **fecha · hora · número · moneda · % · rango · fecha relativa · teléfono · unidades**, por locale (**es-MX**, **en-US**) + el estándar de datos. Entregable machine-readable: **`formats.json`** → encaja en el "pago" de descargas para agentes.
2. **Convención de NUESTRO sistema.** La regla de oro es: **guardar/intercambiar en ISO 8601 / E.164 / ISO 4217 / SI; formatear SOLO en display con `Intl`/CLDR/ICU por locale.** DMXAiStudio es bilingüe y hoy tiene fechas/horas a mano (versions "hace 2 min"/"ahora", Overview "956h 23m", "Wed/Thu/Fri" — marcados en el [repaso de arquitectura](architecture-review.md)). Adoptar este config **arregla esos strings de paso** y hace que la marca documentada y la herramienta compartan la misma disciplina.

**Modelo (de `meridian.formats.json`):** `locales.{es-MX,en-US}` con `date{long,medium,short}` · `time{hour12,short,withMeridiem}` · `number{decimal,group,pattern}` · `currency{code,symbol,position,display}` · `percent` · `phone`; más `data{standard:ISO 8601, date:YYYY-MM-DD, datetime, currencyCodes:ISO 4217, phone:E.164, units:SI, rule}`. (i18n: namespace `fmt` con etiquetas + notas anti-ambigüedad.)

**Integración:** en el panel = una sección **estructurada** (no prosa) con **defaults sensatos precargados** (es-MX/en-US con los patrones estándar) que el estudio confirma/ajusta y genera `formats.json`. En el sistema = un helper de formato por locale (store-ISO + `Intl`). **Marcada "se queda".**

---

## El contrato de datos (cómo se puebla el visualizador)

El visualizador es **data-driven por i18n**: HTML con `data-i18n="…"`; el contenido vive en `assets/i18n/{es,en}.json`; la marca/páginas/logo en `config.js`; los entregables en `assets/downloads/`. Para poblarlo con nuestra data:

```
buildBrandBook(brandingData, briefData, generatedAssets) → {
  config:    { brand, version, mark(SVG), pages },
  i18n:      { es:{ sections, purpose, p3, viz, … }, en:{…} },   // ← mapeo de campos
  downloads: { tokens.json, tailwind.js, voice.md, AGENTS.md, mcp.json, llms.txt, logo.svg }
}
```

- **Campos que tenemos** → poblar directo (foundation, positioning, color, accessibility, etc.).
- **Campos que no tenemos** (voice profundo, examples, personas) → **generar con agentes** (el ángulo BYOM) o marcar **"pendiente / generable"**.
- **Assets** (logo SVG, fuentes, tokens) → del **handoff a Design System** / generación / upload.
- **Readiness por sección:** cada una de las 53 muestra Listo / Parcial / Pendiente según haya fuente. Honesto **y** aspiracional — y se vuelve la lista de trabajo.

---

## Modelo de integración (recomendado)

1. **Adoptar el catálogo como contrato canónico.** `brandbook-catalog.json` entra al repo como la IA fuente de verdad del brand book. Construir el **mapeo** field→sección (la tabla de arriba, formalizada).
2. **El panel se mantiene "lean" (decisiones) y alinea su taxonomía** a los IDs del catálogo, para que hablen el mismo idioma. Añadir solo las pocas secciones de texto que SON decisión y faltan (brand story, ejemplos de voz, logo-misuse). **No** inflar el panel a 53.
3. **Generador `buildBrandBook`** = el puente. Mapea panel(+brief+assets) al bundle del visualizador.
4. **Portar/embeber el visualizador** como output de Branding. Dos caminos (decisión abajo): iframe del sitio estático alimentado por el bundle, vs portar a componentes React con nuestros tokens.
5. **Poblar + readiness + descargas.** Data real, estado por sección, y las descargas legibles-por-máquina generadas de nuestra data → el pago BYOM/agentes.
6. **Ubicación y nombre.** Es el brand book OUTPUT de Branding (no el "Visualizador" del sitio). Acceso desde Branding ("Ver Brand Book") o ruta propia. **Encaja como la pieza de "pago" de la Fase 3 del [repaso de arquitectura](architecture-review.md)** — más alineada a Branding que un preview de sitio.

---

## Fases sugeridas

- **F1 — Contrato & mapeo:** catálogo al repo, tabla field→sección formal, alinear IDs de secciones del panel a la taxonomía del catálogo. *(Sin UI nueva.)*
- **F2 — Generador + bundle:** `buildBrandBook()` que produce config+i18n+downloads desde el panel; poblar lo cubierto; readiness por sección.
- **F3 — Visualizador integrado:** traer el visualizador (iframe o React), conectado al bundle, accesible desde Branding, bilingüe (ya lo es), con estado por sección.
- **F4 — Cerrar huecos con agentes:** generar la profundidad faltante (voz 12-secciones, examples, personas) y los assets (tokens del handoff, logo) — el relato "agentes construyen el brand book".

---

## Decisiones abiertas (te tocan)

1. **Tecnología del visualizador:** *iframe* del sitio estático tal cual (rápido; mantiene su CSS/print/bilingüe; lo alimentamos con el bundle) **vs** portarlo a React con nuestros tokens (coherente con la app, reusable, pero rehacer 6 páginas). Trade-off velocidad vs coherencia.
2. **Alcance del panel:** mantener lean + alinear taxonomía + 3-4 secciones core de texto **(recomendado)** vs crecer el panel hacia las 53.
3. **Estrategia de huecos:** renderizar las 53 con *readiness* + **generar lo faltante con agentes** (el relato de producto) **vs** mostrar solo lo que tenemos.
4. **Assets:** ¿de dónde salen logo/fuentes/tokens? — del handoff a Design System, generación IA, o upload. Define cuán "real" se ve el brand book.
5. **Nombre/ubicación** y desambiguación con el panel "Visualizador" del sitio.
6. **¿Marca sujeto = el proyecto activo?** El brand book debería documentar la marca del proyecto activo (Nimbus Coffee, etc.), no "Meridian". Confirmar que el sujeto se toma del workspace/proyecto.
