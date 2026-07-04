# Integración — Modo oscuro (web) · Meridian Brand Book

> Resumen de contenido y verificación de la integración del modo oscuro.
> Estado: **completo y verificado** (auditoría de 6 agentes + verificador de consistencia).
> Sección guía: **3.7 “Modo oscuro (web)”** — tier `core`, página `03 · Visual`.

---

## 1. Qué se integró

Dos cosas, complementarias:

1. **Un sistema de tema global** (claro/oscuro) que recorre todo el brand book — chrome, superficies de lectura, nav y subnav — sin invertir los demostradores literales de marca (swatches, barra de paleta, logos sobre fondo, mockups y gráficas mantienen su hex fijo).
2. **Una sección-guía 3.7 “Modo oscuro (web)”** que documenta el sistema para los clientes (todos proyectos web), alineada a estándares internacionales.

**Estándares base:** Material 3 (evitar negro puro, elevación = superficie más clara, acento desaturado), Apple HIG (base vs. elevado semántico), IBM Carbon (tokens por capa), WCAG 2.2 (contraste por tema, evitar halación) y el patrón web de MDN (`prefers-color-scheme`, `color-scheme`, `<meta theme-color>`, `[data-theme]`, script anti-FOUC, sistema de 3 estados system|light|dark).

---

## 2. Contenido de la sección 3.7 (13 bloques, en orden)

| # | Bloque | Qué muestra |
|---|--------|-------------|
| 1 | Propósito | Línea de intención: cómo implementar dark mode consistente y accesible en web. |
| 2 | **Preview claro ↔ oscuro** | Dos paneles (`#FFFFFF` vs `#0E1116`) con la **misma** product card Meridian (lockup, título, copy, botón, chip) — el mismo componente en ambos temas. |
| 3 | **6 tarjetas de principio** (3×2) | Cada una con mini-demo visual + título + explicación: Roles no inversión · Sin negro puro (`#000`✕ / `#0E1116`✓) · Elevación por luz · Acento más claro (`#2348E0`✕ / `#4F6FEE`✓) · Texto off-white (`#FFF`✕ / `#F7F9FC`✓) · Mide AA por tema (`17:1` + `AA ✓`). |
| 4 | **Tabla de tokens con swatches** | 9 roles → valor Claro vs Oscuro, cada hex con su muestra de color (`.swdot`). |
| 5 | **Elevación anidada** | Pila Base `#0E1116` → Superficie `#181D25` → Elevada `#222A36`, cada nivel más claro. |
| 6 | Callout (superficies) | Usar superficies más claras para elevación (no sombra). |
| 7 | Callout (acento) | Ajustar el acento para oscuro. |
| 8 | **Comparación de acento** | Wordmark en `#2348E0` (✕ vibra) vs `#4F6FEE` (✓ legible) sobre oscuro. |
| 9 | **Tabla de contraste (oscuro)** | 4 pares con ratio/WCAG: texto/fondo ~17:1 AAA, secundario ~12:1 AAA, acento `#7E99F6` 6.9:1 AA, y `#FFF/#000` 21:1 marcado “halación”. |
| 10 | Callout (contraste) | Medir contraste por tema. |
| 11 | **Qué cambia · qué se queda** | Dos columnas: tokens que cambian vs. literales de marca que se mantienen. |
| 12 | **Implementación web** (código) | Snippet copiable: metas `color-scheme`/`theme-color`, script de init (localStorage/`prefers-color-scheme`) y overrides `:root` / `:root[data-theme=dark]`. |
| 13 | **Do / Don’t** | Dos columnas: 4 buenas prácticas vs 4 prohibidas. |

---

## 3. Sistema de theming global

**Tokens de rol — tema oscuro** (`:root[data-theme="dark"]` en `assets/css/tokens.css`):

```
--bg:#0E1116        --bg-soft:#14181F    --bg-muted:#1A1F27
--surface:#181D25   --surface-raised:#222A36
--text:#F7F9FC      --text-soft:#C2CAD6  --text-mut:#909AAA
--line:#262C36      --line-strong:#3A424E
--brand:#4F6FEE     --brand-50/100/200/600/700 (rampa aclarada)
--accent:#4F6FEE    --accent-ink:#7E99F6
--nav-bg:rgba(14,17,22,.82)   --subnav-bg:rgba(14,17,22,.9)
--shadow:0 1px 2px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.6)
color-scheme:dark
```

**Tokens de rol añadidos al tema claro** (para que el swap funcione): `--surface-raised:#FFFFFF`, `--nav-bg:rgba(255,255,255,.85)`, `--subnav-bg:rgba(255,255,255,.92)`, `color-scheme:light`.

**Anti-FOUC + metas — en los 6 heads** (`index` + `01`–`05`, byte-idénticos):
- Script inline que lee `localStorage['meridian-theme']` (o `prefers-color-scheme`) y fija `data-theme` antes de pintar.
- `<meta name="color-scheme" content="light dark">`
- `<meta name="theme-color">` ×2 (claro `#FFFFFF` / oscuro `#0E1116`).

**Toggle** (`assets/js/nav.js`): botón `.theme-btn` (icono sol/luna) en la barra → `toggleTheme()` escribe `localStorage['meridian-theme']` y llama `applyTheme()`; `currentTheme()` respeta override manual sobre el sistema.

---

## 4. i18n

- **Namespace `dm`: 59 claves** por idioma (ES/EN), **paridad perfecta**.
- Grupos: títulos `t1–t6` + explicaciones `e1–e6` (principios) · tabla `tokRol/tokLight/tokDark` + `rBg…rAccentInk` · superficies `surfTitle/base/surf1/surf2/surfNote` · acento `accentNote/accentBad/accentGood` · contraste · flips · web · do/dont · `preview/btn/chip` · `fileLabel`.
- Claves relacionadas fuera de `dm`: `sections.darkmode`, `purpose.darkmode`, `ui.themeDark/themeLight`, `viz.darkNote`.
- **Limpieza:** se eliminaron las 6 claves legacy `dm.p1–p6` (sustituidas por `t/e`); cero referencias rotas.

---

## 5. CSS de la sección (visuales, en `components.css`)

- `.theme-compare` + `.tc-*` — preview claro/oscuro lado a lado.
- `.swdot` — muestra de color en la tabla de tokens.
- `.elev` / `.elev-1` / `.elev-2` — elevación anidada.
- `.accent-cmp` + `.a/.big/.cap` — comparación de acento sobre oscuro.
- `.dm-principles` / `.dm-pr` / `.pr-demo` — grid de tarjetas de principio.

**Responsive:** preview colapsa a 1 col `≤600px`; principios `3 → 2 col ≤880px → 1 col ≤560px`.

---

## 6. Catálogo, índice y descargable

- **`brandbook-catalog.json`** — entrada `darkmode`, num `3.7`, tier `core`, media `["color","code"]`. Totales: `sections 55 · core 26 · rec 24 · adv 5 · media 33 · textOnly 22`.
- **`index.html`** — pill “Modo oscuro” → `03-visual.html#darkmode`; capítulo 03 Visual con `15 · secciones`.
- **Descargable** — `assets/downloads/meridian.dark.css` (1 547 B): tokens de rol en `:root`, swap en `:root[data-theme="dark"]`, espejo en `@media (prefers-color-scheme:dark)` para `:root:not([data-theme])`, más snippet `<head>` anti-FOUC comentado.

---

## 7. Verificación de consistencia (auditoría adversarial)

| Check | Resultado |
|-------|-----------|
| Heads idénticos (anti-FOUC + metas) en los 6 archivos | ✅ byte-idénticos |
| Paridad i18n ES/EN (namespace `dm`) | ✅ 59 = 59 |
| Toda `data-i18n` de #darkmode resuelve en ES y EN | ✅ 62/62 |
| `num` del catálogo == `sec-num` en HTML | ✅ 3.7 = 3.7 |
| `id` ancla == clave i18n == `id` catálogo | ✅ todo “darkmode” |
| Claves muertas | ✅ `dm.p1–p6` eliminadas |
| Totales catálogo (55) vs `<section>` en 01–05 (52) | ℹ️ por diseño: las 3 de portada (cover/toc/how-to) viven en `index.html`, no como `<section>`. Catálogo internamente consistente. |

---

## 8. Archivos tocados

```
assets/css/tokens.css          bloque [data-theme="dark"] + tokens de rol en claro
assets/css/components.css      clases visuales de la sección 3.7
03-visual.html                 sección 3.7 (13 bloques)
assets/i18n/es.json / en.json  namespace dm (59) + claves relacionadas
assets/js/nav.js               toggle de tema (.theme-btn, apply/toggle/currentTheme)
index.html + 01–05.html        anti-FOUC + metas color-scheme/theme-color en los 6 heads
index.html                     pill + conteo del índice
brandbook-catalog.json         entrada darkmode + totales (55) + legend
assets/downloads/meridian.dark.css   descargable (nuevo)
```

**Rollback:** respaldo íntegro en `../brand-guidelines-backup-pre-darkmode/`.
