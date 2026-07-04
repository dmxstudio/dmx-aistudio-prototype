# DMXAiStudio — Repaso de arquitectura & roadmap

> Corte de revisión · 2026-06 · auditoría multi-agente (arquitectura · deuda técnica · huecos de producto · UX/consistencia) sobre `~/ClaudeCode/design-platform/src` (~8.2k LOC).

---

## TL;DR

Esqueleto **genuinamente fuerte** (árbol de 4 providers limpio, paridad i18n forzada por el compilador, modelo de datos pensado para el backend real, sistema de tokens con dark mode), pero **solo 2 de 9 paneles del pipeline son reales**. La promesa *"del brief al sitio publicado"* muere visiblemente dos pasos después de Branding, en siete stubs "Coming soon" idénticos, y **la mitad de entrega (Visualizador/CMS/Publicar) — el sitio publicado, el pago de la promesa — está vacía**.

El problema de fondo: **no se puede demostrar más superficie sobre los cimientos actuales**, porque (1) el estado se reinicia en cada reload (tema e idioma persisten en localStorage, pero todo el trabajo de producto se evapora), (2) **no hay protección de rutas** —`/admin/users` incluido— y `signOut()` vuelve a iniciar sesión como el admin demo, y (3) la **portada (Resumen) es contenido de plantilla de HR** (reclutadores, "956h 23m") que cuenta la historia de otro producto.

**Recomendación:** una fase corta de *endurecer* (persistencia, guard de ruta, matar contenido de plantilla, focus ring), y luego invertir el grueso en la **historia de producto** (Resumen real del pipeline, un flujo de datos Brief→Branding de verdad, atribución de agentes en la generación, y al menos un artefacto que llegue a un preview de sitio publicado). Los refactors (panel kit compartido, keyspace del store, strict mode) van *just-in-time* cuando aterrice el tercer panel real — no como proyecto aparte.

---

## Veredicto rápido

| Sólido (replicar / no tocar) | Deuda que pesa (decidir) |
|---|---|
| Paridad i18n `Dict = typeof es` (cero diff es/en) | Sin persistencia: el trabajo se borra al recargar |
| Modelo de datos shaped-for-backend (event-log, DTCG, model/agent) | Sin guard de rutas; `signOut()` re-loguea al admin |
| `useWorkspaceModels` (hook sobre store, integridad referencial) | Lista de clientes "split-brain" (edits no llegan al switcher) |
| Árbol de providers limpio y bien ordenado | Resumen = plantilla de HR ajena al producto |
| Empty-states reales (Branding kickstart, herencia hermana) | Brief→Branding es herencia **decorativa** (no lee nada) |
| Tokens semánticos + dark + reduced-motion | `strict` de TS apagado; `field id` = foreign key sin enforcement |

---

## Mapa de arquitectura

**Stack:** React + Vite + TS + Tailwind v4, react-router, i18next.

- **Providers** (`main.tsx`): `ThemeProvider › BrowserRouter › AuthProvider › WorkspaceProvider › App`. Orden con intención (Workspace usa `useNavigate`, va dentro del Router; Auth fuera de Workspace). Cada contexto es de una sola responsabilidad y su hook lanza si se usa fuera del provider.
- **Routing** (`App.tsx`): tabla plana. `/login` suelto; todo lo demás bajo `<AppLayout>` (Sidebar+Topbar+Outlet) con `index → /overview` y `*` catch-all. Los 7 paneles no construidos enrutan a un único `<SectionScaffold sectionKey=…>` (reserva limpia del espacio de URLs).
- **Estado / "BD":** contextos en memoria + un store casero (`lib/store.ts`) = `Record<kind, Map<projectId, value>>`, con API de hooks (`usePersistentSections`/`usePersistentValue`) y lectores no-hook (`getPersistentValue`). Modela "estado por proyecto = backend" y **se reinicia al recargar** (por diseño). Los módulos `data/*` son la base de datos mock.
- **i18n:** `es.ts`/`en.ts` (629 líneas c/u, **cero diff de llaves**), `export type Dict = typeof es` + `export const en: Dict` → cualquier drift de idioma es error de compilación. Esquemas de llaves: `fields.<id>`, `fieldHelp.<id>` (planos, ids globales), `brief/branding.sections.<id>`, etc.
- **Sistema de UI:** 12 primitivos en `components/ui` (Button, Card, Modal, Select, Badge, PageHeader, …) temados por tokens semánticos en `index.css` con override `.dark` completo.

**Verdad estructural:** la app es "de dos pantallas de profundidad". `Brief.tsx` (455 LOC) y `Branding.tsx` (461 LOC) concentran ~46% de la capa de screens y casi toda la lógica de dominio; los otros 7 paneles son un placeholder. Los patrones que funcionan para dos pantallas acopladas (Branding importando los componentes de `components/brief/` al por mayor, lógica de seed duplicada, `field id` como llave de join entre 4 archivos) son justo los que se van a tensar cuando los paneles vacíos se vuelvan reales.

---

## Fortalezas (replicar en lo que sigue)

- **Paridad i18n forzada por el compilador** — escala a paneles nuevos gratis.
- **Modelo de datos pensado para producción** — `BriefVersion`/`FieldEvent` (event-log), `BrandField` con `owner/taxonomy/approval{human,client}`, registro declarativo `fieldEditors`, ruteo model-vs-agent. La UI ya consume interfaces que un API real puede satisfacer. (`data/brief.ts`, `data/branding.ts`, `data/models.ts`)
- **Inteligencia (`useWorkspaceModels`) es la rebanada mejor factorizada** — hook sobre store con integridad referencial (`connect()` sana defaults colgados, `disconnect()` poda overrides). Es el patrón que Brief/Branding deberían copiar.
- **Empty-states reales** — el Branding kickstart (4 rutas de pre-llenado con gating BYOM) y la **herencia de marca proyecto→proyecto** (`loadSections` del proyecto origen) prueban que el código **sí puede** hacer propagación cross-entity.
- **Tokens + dark + reduced-motion** bien ejecutados.

---

## Deuda técnica & riesgos (con archivo)

### 🔴 Alta
- **Sin protección de rutas.** `AppLayout` no checa sesión; ningún `<Navigate to="/login">`; `auth.tsx:40` `signOut()` hace `setCurrentUserId(CURRENT_USER_ID)` → **re-loguea a Dahir**; `/admin/users` solo está oculto en el menú, no protegido. No hay costura donde encaje un guard real. (`App.tsx`, `AppLayout.tsx`, `lib/auth.tsx`)
- **Lista de clientes "split-brain".** `Workspaces.tsx:23` tiene su propio `useState(seed)`; `WorkspaceProvider` lee el array importado inmutable. Crear/editar/borrar cliente **nunca llega al switcher**. (`screens/Workspaces.tsx`, `lib/workspace.tsx`)
- **Resumen = plantilla de HR.** `mock.ts:44-78` define `topEmployees` (reclutadores), `metrics`, `trend[]`; `Overview.tsx` los renderiza verbatim ("2,683", "956h 23m"). La primera pantalla cuenta la historia de un SaaS de reclutamiento. (`screens/Overview.tsx`, `data/mock.ts`)
- **`field id` = foreign key sin enforcement, entre 4 archivos.** Un id (`bf-essence`) debe coincidir en `branding.ts` + `fieldEditors.ts` + `fields.*`/`fieldHelp.*` (i18n) + `brandCatalogs.ts`. 75 llaves `fields`/`fieldHelp` vs 55 en `fieldEditors` — el gap es intencional (fallback textarea) pero invisible. Mantener este join a mano por campo escala mal a 7 paneles.
- **Branding acoplado a la capa de Brief + seed duplicado 3 veces.** `Branding.tsx` importa FieldRow/DecisionRow/PendingTray/… de `components/brief/`; la lógica de seed está copiada en `Brief.tsx`, `data/brief.ts` y `Branding.tsx`. El tercer panel real forzará una extracción bajo presión.
- **Sin focus indicator (a11y).** Cero `focus-visible`/`focus:ring` en 66 archivos, mientras 14 aplican `outline-none`. La navegación por teclado es invisible — el hueco de a11y de mayor impacto. (`index.css`, primitivos)

### 🟠 Media
- **Sin persistencia de contenido.** Todo en Maps a nivel módulo + `useState`; reload borra briefs, aprobaciones, proyectos, conexiones. (Irónico: tema/idioma **sí** persisten en localStorage.) (`lib/store.ts`)
- **`strict` de TS apagado.** `tsconfig.app.json` sin `strict`/`strictNullChecks`/`noImplicitAny`. La null-safety es por disciplina, no por compilador; los `as T` del store no se verifican.
- **Keyspace del store stringly-typed.** `kind` es string libre sin registro/enum; un typo crea un bucket huérfano silencioso; dos llamadas con distinto `T` para el mismo `kind` compilan.
- **Project count desincronizado.** `Client.projects` es número estático; `createProject` no lo incrementa. (`mock.ts`, `Workspaces.tsx`)
- **`getPersistentValue` no reactivo** + **seed en effects con deps suprimidas (stale-closure)** — latentes; explotan cuando los 7 paneles agreguen escrituras cross-screen.
- **Sin estrategia responsive del chrome.** `Sidebar.tsx:20` hardcodea `w-64 shrink-0` sin breakpoints; en móvil el sidebar consume el viewport.
- **Search del Topbar es dead-end vivo** (`Topbar.tsx:129`): escribible, sin `value/onChange`. **AuditBar**: 4 botones (validar/auditar/mejorar/complementar) sin `onClick`.
- **aria-labels hardcodeados** (9) que saltan `t()` y mezclan ES/EN (`Modal.tsx:46` "Cerrar", `FieldEditModal` "Quitar", "Toggle theme", "Notifications").

### 🟡 Baja
- `'p1'` es el proyecto mágico "con contenido" (branches por id literal en varias pantallas).
- Brief/Branding **rehacen `PageHeader` inline** en vez de reusarlo.
- Helper `Field({label,children})` **duplicado en 4 archivos** (ya driftó: `block flex-1` vs `block`).
- `Modal` sin focus-trap ni `aria-labelledby`; Overview con `Wed/Thu/Fri` y nombres/roles en inglés sin `t()`.

---

## Huecos de producto / narrativa

- **7/9 paneles son stubs idénticos** y **toda la mitad de entrega está vacía** — la promesa se rompe dos pasos adentro y nunca llega a un sitio publicado. Incluso el tramo que funciona termina en stub (el gate Branding→Design System lleva a un placeholder).
- **Brief→Branding es herencia falsa.** Los campos de branding cargan `source:'brief.signals.tone'` pero Branding **nunca lee** `d-tone`/`d-restrict` del Brief; editar el brief no cambia nada abajo. La única propagación que el pitch necesita es decoración. *(La herencia proyecto→proyecto sí es real — el patrón existe, solo no donde importa.)*
- **El relato "agentes trabajando" es estático.** Los 7 agentes Hermes solo aparecen como opciones en Selects; `generate()` copia seeds al instante, sin atribución ni estado "corriendo".
- **Sin happy-path end-to-end** que un viewer pueda seguir hasta el pago; el Sidebar no distingue paneles reales de stubs (no muestra readiness/lock por panel, aunque Brief/Branding ya los calculan).

---

## Roadmap priorizado (valor / esfuerzo)

| # | Iniciativa | Valor | Esf. | Depende de |
|---|---|:---:|:---:|---|
| 1 | **Persistir el store en localStorage** detrás de la API load/save existente (~10-15 líneas) | Alto | S | — |
| 2 | **Reconstruir Resumen como dashboard real del pipeline** (readiness/gate/decisiones/engine por fase ya existen); borra mock de plantilla | Alto | M | — |
| 3 | **Guard de ruta + estado deslogueado real**, proteger `/admin/users` | Medio | M | — |
| 4 | **Brief→Branding como flujo de datos vivo** (no metadata de seed) | Alto | M | #1 |
| 5 | **Atribución de generación a agentes por fase + estado "corriendo"** | Alto | M | #4 |
| 6 | **Un panel downstream + preview de sitio publicado mock** (cierra el loop) | Alto | L | #5 |
| 7 | **Extraer el panel kit compartido** (`components/brief` → `components/panel`) + `usePanel` *(just-in-time con el 3er panel)* | Medio | L | #6 |
| 8 | **Arreglar la lista split-brain + derivar el project count** | Medio | S | — |
| 9 | **Focus-visible global + a11y del Modal** (focus-trap, `aria-labelledby`, fugas de aria-label) | Medio | S | — |
| 10 | **Status del pipeline en el Sidebar + neutralizar controles dead-end** (search, AuditBar) | Medio | S | — |
| 11 | **Encender `strict` + keyspace tipado del store** *(antes de triplicar el código)* | Bajo | M | — |

---

## Secuencia recomendada

0. **Fase 0 — Hacer el demo sobrevivible y honesto** (S, días): persistencia localStorage, matar el Resumen de plantilla, focus-visible global + fugas de aria-label, neutralizar dead-ends (search, AuditBar). *No se puede demostrar más superficie sobre un piso que se reinicia y una portada que cuenta el producto equivocado.*
1. **Fase 1 — Portada real & costura de acceso:** Resumen como dashboard del pipeline, guard de ruta + deslogueo real, arreglar la lista split-brain / project count derivado. *Una sola fuente de verdad y un landing coherente antes de paneles que se leen entre sí.*
2. **Fase 2 — Cruzar Brief→Branding de verdad:** herencia viva + atribución a agentes con estado "corriendo". *El corazón del producto (propagación + agentes BYOM como actores); el código ya prueba que puede hacerlo.*
3. **Fase 3 — Llegar al pago:** un panel downstream que herede de Branding + preview de sitio publicado mock, con status por panel en el Sidebar. *Cierra el loop "del brief al sitio publicado".*
4. **Fase 4 — Refactor just-in-time con el 3er panel:** extraer el panel kit + `usePanel`, encender strict, tipar el keyspace. *Bajo la presión de un tercer panel concreto, para que la abstracción sea real, no especulativa.*

---

## Decisiones abiertas (te tocan)

1. **¿Trayectoria mock o producto real?** Si se queda en demo, guard de rutas y strict son opcionales; si va a backend, la persistencia, la costura de auth y el store tipado deben diseñarse ahora que la superficie es chica. **Reordena todo el roadmap.**
2. **Alcance de persistencia:** localStorage delgado (barato, estados "a mitad" curados) vs swap a backend real detrás de la API existente. Define el piso para que la Fase 0 no se sobre-construya.
3. **¿Cuál panel downstream primero?** Design System (tokens, lo más cercano a Branding, mejor historia de herencia) vs un preview de Visualizador (lo más "sitio publicado", mayor pago narrativo). Solo se necesita uno para cruzar la frontera.
4. **¿Qué tan honesta la superficie no construida?** 7 stubs idénticos vs placeholders con estado (locked/upcoming con preview de datos heredados) que fijan expectativas.
5. **Atribución de agentes: teatro vs sustancia.** Un estado "agente corriendo" simulado se lee como real pero es scripted — ¿el demo implica capacidades (validar/auditar) que no existen, o las marca como próximas?
6. **Timing del refactor:** extraer el panel kit y encender strict **antes** del 3er panel (piso limpio, arranque más lento) o **durante** (más rápido al primer panel nuevo, riesgo de un tercer fork de `components/brief/`).
