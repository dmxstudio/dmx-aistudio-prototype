# Especificación — Traducción de contenido multi-idioma

> **Estado:** SPEC. La **UI está maquetada (mockup visual, sin traducción real)** en Branding e
> Inteligencia para auditoría; la lógica de traducción y el modelo de datos siguen diferidos a la
> fase de producto. **Fecha:** 2026-07-02 · **Alcance:** paneles de contenido (Brief, Branding y
> cualquier fase con campos).
> Hoy el contenido es monolingüe (ver §1); el mockup pinta estados de traducción DETERMINISTAS
> (falsos) para poder auditar la experiencia.
>
> **Mockup implementado (2026-07-02):** chip de estado en el hero de Branding + panel adaptativo
> (Caso A/B) + indicador por campo (toggle "ver por campo") + fila "Motor de traducción" en
> Inteligencia. Archivos: `src/lib/translation.ts` (modelo mock), `src/components/branding/
> TranslationMock.tsx` (chip + panel), `TransBadge` en `src/components/brief/FieldRow.tsx`,
> cableado en `src/screens/Branding.tsx` y `src/screens/Models.tsx`. Bloque i18n `translation.*`.
> Los botones de traducir son INERTES.

---

## 1. Contexto y problema

El producto separa dos capas de idioma que se traducen de forma distinta:

- **Chrome (estructura):** títulos de sección, botones, ayudas, boilerplate del brand book. Vive en
  diccionarios `es`/`en` hechos a mano (`src/locales/*`, `public/book/assets/i18n/*`). El toggle
  ES/EN los intercambia bien.
- **Contenido (lo que captura el usuario):** cada `BrandField`/`BriefField` guarda **un solo `value`**,
  en el idioma en que se escribió. En el feed al brand book se emite `{ es: ov, en: ov }` — el mismo
  objeto para ambos idiomas. Resultado: al ver la guía en inglés, el chrome está en inglés pero
  **tu contenido aparece en el idioma de origen**.

**Objetivo del spec:** definir cómo el contenido llega a estar realmente en cada idioma de entrega,
sin doble captura manual y sin romper el ritmo de trabajo en el idioma nativo.

---

## 2. Principios de diseño

1. **Separar VER de TRADUCIR.** El toggle de idioma solo cambia la vista; nunca bloquea ni dispara
   trabajo. Traducir es una acción deliberada con su propio punto de entrada.
2. **La traducción es una fuente de PROPUESTAS auditables.** El output de la IA entra al mismo flujo
   revisar→aprobar que ya usan el kickstart y "Generar con IA": campo por campo, con estado y
   procedencia. No se publica traducción sin que exista la opción de auditarla.
3. **Estado de traducción visible y granular.** Por campo × idioma de entrega, agregado por sección y
   por documento. Se ve en el hero de un vistazo.
4. **El origen manda.** Cada proyecto declara un idioma de origen (idioma de trabajo). Traducir nunca
   sobrescribe el origen; solo llena los idiomas de entrega.

---

## 3. Modelo conceptual

- **Idioma de origen** (`sourceLang`): por proyecto/marca. Default heredado del workspace o del Brief.
  Es el idioma en que se captura; el `value` del campo es siempre el texto de origen.
- **Idiomas de entrega** (`targetLangs`): en qué idiomas se entrega el deliverable. Fuente natural: el
  campo **`fmt-locales`** del Brief/Branding (hoy `'es-MX · en-US'`) — se derivan los idiomas de esa lista.
- **Estado de traducción por campo × idioma de entrega:**

  | Estado | Significado | Señal UI |
  |---|---|---|
  | `origen` | Es el idioma de origen del campo | — (no aplica traducir) |
  | `sin-traducir` | El origen tiene contenido, el destino está vacío | punto/etiqueta ámbar |
  | `traducido-ia` | La IA lo tradujo, **sin auditar** | punto/etiqueta violeta "IA · revisar" |
  | `revisado` | Traducción auditada/aprobada por una persona | punto/etiqueta verde |
  | `origen-vacío` | El campo está vacío también en el origen | gris (no cuenta como pendiente de traducir) |

  La cobertura de un idioma = `revisado + traducido-ia` sobre el total de campos con contenido en origen.

---

## 4. Flujos

### 4.1 Cambiar de idioma (ligero, sin fricción)

- El toggle ES/EN **solo cambia la vista**, al instante.
- Al ver un idioma de entrega con campos sin traducir, esos campos muestran el **texto de origen** con
  una marca sutil "sin traducir" (no un modal, no un hueco vacío). Se sigue leyendo la sección.
- **Nudge de primera vez (una sola vez, recordado):** la primera vez que cambias a un idioma de entrega
  con 0 traducciones, aparece un aviso ligero y descartable ofreciendo traducir → abre el panel §4.2.
  No se repite en cada toggle.

### 4.2 Traducir (deliberado) — el panel

Disparadores: el **chip del hero** (§5.1), o una acción a nivel de sección. El panel **se adapta** al
estado del origen:

- **Caso A — origen incompleto** (aún hay campos vacíos en el idioma de origen):
  - Mensaje: *"Aún tienes **N campos vacíos** en Español (idioma de origen). Te recomendamos
    completarlos antes de traducir, para no traducir contenido a medias."*
  - Acciones: **[Ir a completar]** (primaria) · **[Traducir de todas formas los M con contenido]** (secundaria).
- **Caso B — origen completo, destino pendiente:**
  - Mensaje: *"**47 campos** listos en Español · **35 sin traducir** a Inglés."*
  - Acciones: **[Traducir 35 con IA · vía «Brand Specialist»]** (primaria, recomendada) ·
    **[Dejar en Español por ahora]** (secundaria).
- **Selector de alcance:** todo el documento / secciones específicas (con conteo de pendientes por sección).
- El motor/agente que ejecuta se muestra explícito y sale de Inteligencia (§5.4).

### 4.3 Auditar campo por campo

- Tras traducir, cada campo destino queda en estado `traducido-ia` ("IA · revisar").
- Se revisan con el mismo mecanismo que las propuestas: ver origen ↔ traducción lado a lado, editar la
  traducción (override manual → pasa a `revisado`), o aprobar tal cual.
- Editar el **origen** de un campo ya traducido marca sus traducciones como "desactualizadas"
  (re-traducir sugerido) — análogo a una decisión que se reabre.

### 4.4 Estado siempre visible

El chip del hero (§5.1) refleja la cobertura en vivo, sin tener que abrir nada.

---

## 5. Componentes UI

### 5.1 Hero — chip de estado de traducción

- Vive junto al medidor `minViable X/Y` del hero (mismo patrón visual).
- Muestra: `Origen: ES · EN 12/47` con color de estado (verde completo / ámbar pendientes / violeta hay IA sin auditar).
- Con varios idiomas de entrega, un chip por idioma o un chip resumen que despliega el detalle.
- **Clic → abre el panel §4.2.** Este es el punto de entrada principal (mejor que el modal-en-toggle).

### 5.2 Panel "Traducir a «X»"

- Modal/drawer con la lógica adaptativa de §4.2 (Caso A / Caso B).
- Resumen de estado, selector de alcance, motor a usar (explícito), acción recomendada destacada.
- La salida NO se auto-aprueba: entra como propuestas auditables (§4.3).

### 5.3 FieldRow — indicador por idioma

- Un indicador pequeño por campo con su estado de traducción para el idioma en vista
  (`sin-traducir` / `IA · revisar` / `revisado`).
- Permite editar la traducción del campo directamente (override del texto de la IA).

### 5.4 Inteligencia — motor/agente de traducción

- **NO** es una 10ª fase del pipeline: la traducción es **transversal** (aplica a Brief, Branding y
  toda fase con contenido). Se modela como una **capacidad propia** en el panel Inteligencia:
  - **Motor de traducción (default)** — un modelo o agente asignable, junto a (no dentro de) la lista
    de las 9 fases `PHASES`.
  - **Override opcional por par de idiomas** (algunos modelos rinden mejor en ciertos idiomas), con el
    mismo patrón default + overrides que ya usan las fases.
- Reusa la distinción modelo vs agente existente; podría existir un agente Hermes especializado en
  traducción/localización.

---

## 6. Modelo de datos propuesto (para la fase de producto)

Ilustrativo — hoy no se implementa. El `value` sigue siendo el texto de origen; las traducciones son
una capa aparte para no tocar los editores ni los invariantes de merge del origen:

```ts
interface BrandField {
  value: string                 // texto en el idioma de ORIGEN (sin cambios)
  // NUEVO — capa de traducción, solo idiomas de entrega:
  i18n?: Record<string, {       // clave = lang de entrega, p.ej. 'en'
    value: string
    status: 'ia' | 'revisado'
    stale?: boolean             // el origen cambió después de traducir
  }>
}
```

- El idioma de origen se declara a nivel de proyecto (`sourceLang`), no por campo.
- El feed al brand book deja de ser `{ es: ov, en: ov }`: cada idioma se compone de `value` (si es el
  origen) o de `i18n[lang].value` (si existe), con fallback al origen marcado "sin traducir".
- La exportación JSON para agentes incluiría `i18n` para no perder las traducciones.

---

## 7. Copys (borrador ES/EN)

| Clave | ES | EN |
|---|---|---|
| chip hero | `Origen: {{src}} · {{tgt}} {{done}}/{{total}}` | `Source: {{src}} · {{tgt}} {{done}}/{{total}}` |
| nudge 1ª vez | `Este contenido está en {{src}}. ¿Traducir a {{tgt}}?` | `This content is in {{src}}. Translate to {{tgt}}?` |
| panel · caso A | `Aún tienes {{n}} campos vacíos en {{src}} (idioma de origen). Te recomendamos completarlos antes de traducir.` | `You still have {{n}} empty fields in {{src}} (source language). We recommend completing them before translating.` |
| panel · caso B | `{{ready}} campos listos en {{src}} · {{pending}} sin traducir a {{tgt}}.` | `{{ready}} fields ready in {{src}} · {{pending}} untranslated to {{tgt}}.` |
| acción traducir | `Traducir {{n}} con IA · vía «{{engine}}»` | `Translate {{n}} with AI · via “{{engine}}”` |
| acción diferir | `Dejar en {{src}} por ahora` | `Keep in {{src}} for now` |
| campo sin traducir | `sin traducir` | `untranslated` |
| campo IA | `IA · revisar` | `AI · review` |

---

## 8. Fuera de alcance ahora

- Es un mockup frontend con contenido volátil (localStorage). El modelo de datos bilingüe, la ejecución
  real de la IA y la auditoría persistente son infraestructura de la **fase seria** (requieren el motor
  de modelos realmente conectado, hoy diferido).
- **Anti-patrón a evitar:** doble captura manual (`{ es, en }` en cada editor). Duplica el trabajo de
  captura y de seeds para siempre, y lo tira a la basura cuando llegue la traducción por IA. Este spec
  la descarta a propósito a favor del flujo IA + auditoría.
- Mientras tanto, el estado actual es aceptable para demo: chrome bilingüe + contenido en idioma de
  origen reflejado en ambos. Ver [[branding-guide-admin-audit]] para el detalle del feed `es/en`.
