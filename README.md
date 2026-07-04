# DMXAiStudio — Prototipo (WIP)

> Plataforma de diseño asistida por IA, **BYOM** (bring-your-own-model): convierte un brief en un
> sitio listo para publicar a través de un pipeline de **contratos estructurados**, no de prompts sueltos.

**Estado:** prototipo navegable · frontend-only · **8/9 fases construidas** · WIP.
**Stack:** React 19 · Vite · TypeScript · Tailwind v4 · React Flow · Puck. Español por defecto · toggle EN.

---

## La idea de producto

La mayoría de las herramientas de "IA que diseña" son generadores de pantallas: prompt → output promedio
(*slop*). DMXAiStudio invierte el modelo. El estudio no rentea el gusto: **lo posee**. La plataforma es una
**cadena de contratos** en la que cada fase produce un artefacto estructurado y versionado que alimenta a la
siguiente. La IA ejecuta dentro de esos contratos; no decide por su cuenta.

**El moat** no es el modelo (ese lo pone el cliente, BYOM) ni el HTML generado (commodity). Es la
combinación de tres cosas que solo el estudio tiene:

1. **Contratos aguas arriba** — brief, marca, design system, usuarios, arquitectura, dirección de arte.
2. **Enforcement** — una crítica reproducible que *rechaza* el output promedio del modelo.
3. **Taste corpus** — la biblioteca de gusto curada del estudio.

> *"La orquestación se renta; el gusto, los contratos y el enforcement se poseen."*

---

## El pipeline (9 fases)

Cada panel comparte el mismo arquetipo **generator-first**: un empty-state (kickstart con 4 orígenes:
*desde upstream (recomendado) · importar · heredar · desde cero*) → derivación determinista desde las fases
anteriores → un HUB con **dos caras**: un contrato JSON (máquina) y editores humanos.

| # | Fase | Qué produce | Estado |
|---|------|-------------|--------|
| 1 | **Brief** | Briefing del proyecto | ✅ |
| 2 | **Branding** | Voz y valores de marca + brand book (`/book`) | ✅ |
| 3 | **Design System** | Tokens DTCG (`design-tokens.json`) + guía humana | ✅ |
| 4 | **El usuario** | Personas, journey, grafo de aceptación (segmento→meta→dolor) + coverage | ✅ |
| 5 | **Arquitectura** | `ArchSpec`: site map + user flow + wireframe/copy (React Flow + Puck) | ✅ |
| 6 | **Estilo de diseño** | `StyleSpec`: compilador de dirección de arte + specimen + biblioteca de estilos | ✅ |
| 7 | **Visualizador** | Candidate Workbench: genera el sitio, lo audita y sella un `DesignBuild` firmado | ✅ |
| 8 | **CMS** | Modelo de contenido (tipos + campos) para un headless CMS | ✅ |
| 9 | **Publicar** | Deploy config + gate | ⏳ pendiente |

**Capas transversales:** **Inteligencia/Modelos** = *Hermes*, la plataforma de agentes (7 agentes por craft,
BYOM / BYO-agent) · **Traducción** = i18n de contenido (spec).

---

## La fase estrella: Visualizador (recién construida, V0→V4)

El Visualizador **no** es un generador de sitios ni un preview bonito — es una **sala de revisión** que
ejecuta la dirección **aprobada** sobre la arquitectura, la audita, y sella un artefacto trazable. Tres
niveles escalonados: `GenerationPlan` → `DesignCandidate` → `DesignBuild` firmado.

- **Render por rol** — un `/checkout` se renderiza como formulario, un `/producto/:slug` como detalle
  (galería + resumen + relacionados), **no** como un clon del hero. HOME + el rol de mayor riesgo de slop
  se renderizan real; el resto se muestran como *fichas de plan* (nunca landings falsas).
- **Auditoría honesta A/B/C/D** — nunca finge visión: **A** real hoy (cobertura, contraste WCAG, patrones
  prohibidos estructurales) · **B** estimación determinista · **C** requiere agente · **D** no evaluado.
- **Taste Evidence** — reglas del estudio con evidencia (match/violación), no un score de distancia falso.
- **Frontera dura** — el panel no tiene ningún control que edite la dirección; un hallazgo de dirección
  emite un `ChangeRequest` estructurado aguas arriba en vez de arreglarse aquí.
- **Versionado** — builds inmutables (event-log + snapshots), diff de datos, cascada *outdated* multi-firma.
- **CMS opcional** — una landing / single-page va directo a Publicar; un sitio con contenido dinámico pasa
  por CMS con *bindings* sección↔campo.

---

## Reglas del prototipo (léelo con esto en mente)

- **Frontend-only, sin backend.** Toda "generación" es **determinista/simulada** hoy; el diseño refleja la
  arquitectura del producto real, donde el modelo del cliente (BYOM) escribiría el HTML.
- **Honestidad de simulación** — nada finge ser lo que no es: copy real de los contratos (no lorem),
  placeholders de imagen tipados (no stock), y lo que requeriría un agente va etiquetado como tal.
- La persistencia es `localStorage` (opt-in por sección); no hay datos reales de cliente.

---

## Correr localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck (tsc -b) + build de producción
```

Login demo: `dahir@designo.mx` / `qwerty` (auth narrativa del mockup, sin backend).

---

## Estado y aviso

Prototipo en desarrollo (WIP) — la interfaz, los contratos y el alcance cambian entre fases. Es una
demostración de la **arquitectura de producto** de DMXAiStudio, no un SaaS en funcionamiento.

© DMX Studio. Todos los derechos reservados. Publicado como prototipo para dejar constancia del estado del
desarrollo y la idea de producto; no destinado a reutilización.
