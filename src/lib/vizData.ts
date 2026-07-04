import type { ArchSpec, ArchPage } from './archData'
import type { StyleSpec, AppliedStyle } from './styleData'
import { styleSignature } from './styleData'
import type { UsersSpec } from './usersData'

// Visualizador (fase 7) — Candidate Workbench. Ejecuta la StyleSpec APROBADA sobre la Arquitectura,
// audita con señales etiquetadas por realidad, y sella un DesignBuild. NO decide dirección (frontera
// dura): aquí no hay ningún control que edite la dirección. Render determinista del estudio (sin agente).
// Tres artefactos escalonados: GenerationPlan → DesignCandidate → DesignBuild. Ver memoria visualizer-panel.

export type PageRole = 'landing' | 'list' | 'detail' | 'form' | 'content'
export type RenderMode = 'real' | 'plan'
const ROLES: PageRole[] = ['landing', 'list', 'detail', 'form', 'content']

// El wireframe llega como `unknown` (Puck data / baseWireframe). Parseo defensivo — dato deserializado
// = frontera (mismo criterio que familyToSpec): nunca confiar en la forma, siempre backfill.
export function parseWireframe(page: ArchPage): { role: PageRole; blocks: string[] } {
  const w = page.wireframe as { role?: unknown; blocks?: unknown } | undefined
  const role = typeof w?.role === 'string' && ROLES.includes(w.role as PageRole) ? (w.role as PageRole) : 'content'
  const blocks = Array.isArray(w?.blocks) ? (w!.blocks as unknown[]).filter((b): b is string => typeof b === 'string') : []
  return { role, blocks: blocks.length ? blocks : ['header', 'content', 'footer'] }
}

export interface VizPage {
  pageId: string
  route: string
  name: string
  role: PageRole
  renderMode: RenderMode
  blocks: string[]
  copy: { headline: string; sub: string; cta?: string }
  coverage: string[] // covKeys (seg::goal / seg::pain) que la página atiende/resuelve
}

// El rol de MÁS RIESGO DE SLOP — el que un LLM colapsa en landing (detail/form/list). V1 lo renderiza
// real además de la home para probar que no es una landing-factory. null si el sitio es solo landing/content.
export function criticalRole(arch: ArchSpec): PageRole | null {
  const roles = arch.pages.map((p) => parseWireframe(p).role)
  return (['detail', 'form', 'list'] as PageRole[]).find((r) => roles.includes(r)) ?? null
}
export function criticalPageId(arch: ArchSpec): string | null {
  const crit = criticalRole(arch)
  if (!crit) return null
  return arch.pages.find((p) => parseWireframe(p).role === crit)?.id ?? null
}

// home siempre real; los ids en realIds también (V1 promueve el rol crítico). El resto = ficha de plan.
export function vizPages(arch: ArchSpec, realIds: string[] = []): VizPage[] {
  const real = new Set(['home', ...realIds])
  return arch.pages.map((p) => {
    const { role, blocks } = parseWireframe(p)
    return {
      pageId: p.id, route: p.path, name: p.name, role, renderMode: real.has(p.id) ? 'real' : 'plan',
      blocks, copy: { headline: p.copy.headline, sub: p.copy.sub, cta: p.copy.cta },
      coverage: [...(p.addresses ?? []), ...(p.resolves ?? [])],
    }
  })
}

// ── GenerationPlan: el contrato compilado (cara-máquina, el moat). Aísla la costura BYOM en un punto. ──
export interface PlanPage { pageId: string; path: string; role: PageRole; renderMode: RenderMode; blocks: string[]; coverageTargets: string[] }
export interface GenerationPlan {
  planId: string
  inputContracts: { style: string; arch: string; users: string; ds: string } // firmas aguas arriba — la cascada outdated compara estas
  engine: { agent: string; mode: 'deterministic_mockup'; productionModel: string }
  pages: PlanPage[]
  styleConstraints: { primary: string; forbidden: string[]; strictness: 'strict' | 'balanced' }
}

// Fingerprint de contenido (NO cripto): djb2 → base36. Congela el plan contra el drift aguas arriba.
const hash = (s: string): string => {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
export const contractSig = (obj: unknown): string => hash(JSON.stringify(obj ?? null))

const forbiddenOf = (style: StyleSpec): string[] => {
  const l = style.layout
  return [...new Set([...l.hero.forbidden, ...l.section.forbidden, ...l.card.forbidden, ...style.antiPatterns])]
}

export function buildGenerationPlan(pages: VizPage[], style: StyleSpec, arch: ArchSpec, users: UsersSpec | null, dsSig = ''): GenerationPlan {
  const inputContracts = {
    style: contractSig(styleSignature(style)),
    arch: contractSig(arch.pages.map((p) => [p.id, p.path, p.copy, p.wireframe ?? 0])),
    users: contractSig(users?.segments.map((s) => [s.id, s.goals.map((g) => g.id), s.pains.map((p) => p.id)]) ?? null),
    ds: contractSig(dsSig), // tokens del DS/Branding (accent+fuentes) — cambia → build outdated
  }
  return {
    planId: `plan-${contractSig(inputContracts)}`,
    inputContracts,
    engine: { agent: 'frontend-artist', mode: 'deterministic_mockup', productionModel: 'BYOM' },
    pages: pages.map((p) => ({ pageId: p.pageId, path: p.route, role: p.role, renderMode: p.renderMode, blocks: p.blocks, coverageTargets: p.coverage })),
    styleConstraints: { primary: style.mix.primary, forbidden: forbiddenOf(style), strictness: 'strict' },
  }
}

export const vizFingerprint = (plan: GenerationPlan, override?: AppliedOverride): string => contractSig([plan.inputContracts, plan.pages, plan.styleConstraints, override ?? null])

// ── SKILL.md: la dirección aprobada compilada a un contrato ejecutable portable (forma html-anything,
// artefacto propio). Es lo que un agente BYOM usaría para generar; NO es la fuente de verdad (esa son
// los contratos + el VizSpec). Copiable/exportable. ──
export function compileSkillMd(plan: GenerationPlan, style: StyleSpec, projectName: string): string {
  const dims = Object.entries(style.dims).map(([k, v]) => `${k}=${v}`).join(' · ')
  const sec = (name: string, s: { composition: string; forbidden: string[] }) =>
    `- ${name}: ${s.composition}${s.forbidden.length ? ` — evita: ${s.forbidden.join(', ')}` : ''}`
  return [
    `# SKILL — Generar el sitio de ${projectName || 'Proyecto'}`,
    '',
    `> ${style.thesis || '—'}`,
    '',
    '## Contexto',
    `- proyecto: ${projectName || 'Proyecto'}`,
    `- motor: ${plan.engine.agent} · modo: ${plan.engine.mode} · en producción: ${plan.engine.productionModel}`,
    `- plan: ${plan.planId}`,
    '',
    '## Dirección (de la StyleSpec aprobada — no la redefinas)',
    `- dimensiones: ${dims}`,
    `- mezcla: ${[style.mix.primary, style.mix.secondary, style.mix.accent].filter(Boolean).join(' + ')}`,
    ...(style.principles.length ? ['- principios:', ...style.principles.map((p) => `  - ${p}`)] : []),
    '',
    '## Layout grammar (composición + prohibiciones por sección)',
    sec('hero', style.layout.hero),
    sec('sección', style.layout.section),
    sec('card', style.layout.card),
    '',
    '## Anti-patterns (no hacer — hard gate)',
    ...(style.antiPatterns.length ? style.antiPatterns.map((a) => `- ${a}`) : ['- —']),
    '',
    '## Páginas a generar',
    ...plan.pages.map((p) => `- ${p.path} (${p.role}, ${p.renderMode}) — bloques: ${p.blocks.join(' › ')}${p.coverageTargets.length ? ` — cubre: ${p.coverageTargets.join(', ')}` : ''}`),
    '',
    '## Gates de auditoría (deben pasar antes de firmar)',
    '- cobertura: cada meta/dolor con al menos una página que lo atienda',
    '- contraste: AA sobre la paleta aplicada',
    '- forbidden: ninguna sección cae en un patrón prohibido de la layout grammar',
    '',
    '## Formato de salida',
    '- render determinista del estudio (React, sin agente) para el mockup; en producción, HTML del modelo BYOM normalizado al modelo del estudio.',
  ].join('\n')
}

// ── Auditoría Clase A (real hoy): señales verificables desde contratos o del AppliedStyle. Etiquetadas
// como CLASE A porque el mockup SÍ puede computarlas (no finge visión). B/C/D llegan en V3. ──
export type SignalClass = 'A' | 'B' | 'C' | 'D'
export type Severity = 'pass' | 'amber' | 'red'
export type FindingCause = 'execution' | 'direction' | 'contract'
export interface Finding {
  id: string
  signalClass: SignalClass
  severity: Severity
  cause: FindingCause // execution→se queda; direction→vuelve a Estilo; contract→vuelve a Arq/Usuario/DS
  scope: { pageId?: string; block?: string }
  rule: string
  message: string
}

// Contraste WCAG real (relative luminance). Sobre la PALETA BASE del estudio (styleFromSpec hardcodea los
// neutros); por eso el hallazgo se etiqueta explícitamente "sobre paleta base", no "contraste del cliente".
const lum = (hex: string): number => {
  const c = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : 'ffffff'
  const rgb = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100
}

// Todas las metas + dolores del Usuario como covKeys objetivo.
export const coverageTargets = (users: UsersSpec | null): string[] =>
  users ? users.segments.flatMap((s) => [...s.goals.map((g) => `${s.id}::${g.id}`), ...s.pains.map((p) => `${s.id}::${p.id}`)]) : []

// forbidden en 3 niveles (declarado / ESTRUCTURAL / perceptual). Aquí computamos el ESTRUCTURAL: ¿la
// composición realmente derivada (asym/heroAlign) cae en el patrón prohibido? El perceptual = agente (V3 C).
export const violatesForbidden = (f: string, a: AppliedStyle): boolean => {
  if (/gradient|gradiente/i.test(f)) return false // no generamos gradientes → nunca viola (antes /saas/ matcheaba "gradientes SaaS")
  if (/centrad/i.test(f)) return !a.asym // hero centrado ("hero SaaS centrado" matchea por "centrado")
  if (/card|cluster/i.test(f)) return !a.asym // grid de cards genérico solo cuenta como slop si es simétrico
  return false
}

export function auditClassA(pages: VizPage[], style: StyleSpec, applied: AppliedStyle, users: UsersSpec | null): Finding[] {
  const out: Finding[] = []

  // (1) Cobertura: metas/dolores sin ninguna página que los atienda → falla de CONTRATO (Arq/Usuario).
  const targets = new Set(coverageTargets(users))
  const covered = new Set(pages.flatMap((p) => p.coverage))
  const uncovered = [...targets].filter((k) => !covered.has(k))
  if (uncovered.length) out.push({ id: 'cov-uncovered', signalClass: 'A', severity: 'amber', cause: 'contract', scope: {}, rule: 'coverage.uncovered', message: `${uncovered.length} meta(s)/dolor(es) sin página que los atienda` })

  // (2) Contraste AA — mide lo que DE VERDAD importa según el ctaStyle: CTA sólido = texto blanco sobre el
  // accent; outline/text = el accent como texto sobre la paleta base. Los neutros base pasan de sobra.
  const solid = applied.ctaStyle === 'solid'
  const ac = solid ? contrastRatio('#FFFFFF', applied.accent) : contrastRatio(applied.accent, applied.bg)
  if (ac < 4.5) out.push({ id: 'contrast-accent', signalClass: 'A', severity: ac < 3 ? 'red' : 'amber', cause: 'direction', scope: { block: 'accent' }, rule: 'contrast.accent.basePalette', message: `contraste ${ac}:1 < AA 4.5 · ${solid ? 'texto blanco sobre el accent (CTA sólido)' : 'accent como texto sobre paleta base'} — revisar en Branding/DS` })

  // (3) Forbidden ESTRUCTURAL: la composición realmente derivada cae en un patrón que la dirección prohíbe
  // → inconsistencia de dirección → vuelve a Estilo. (El perceptual = agente, ver PENDING_CHECKS clase C.)
  const heroViolation = style.layout.hero.forbidden.find((f) => violatesForbidden(f, applied))
  if (heroViolation) out.push({ id: 'forbidden-hero', signalClass: 'A', severity: 'amber', cause: 'direction', scope: { pageId: 'home', block: 'hero' }, rule: 'forbidden.hero.structural', message: `la composición derivada viola un patrón prohibido: "${heroViolation}"` })

  return out
}

// ── Clase B: ESTIMACIONES deterministas (útiles, pero NO equivalentes a criterio humano). Se muestran como
// estimaciones, no como verdad. No bloquean la firma. ──
export function auditClassB(pages: VizPage[], applied: AppliedStyle): Finding[] {
  const out: Finding[] = []
  // riesgo de patrón genérico (per-página, real): landing con composición centrada.
  pages.filter((p) => p.renderMode === 'real' && p.role === 'landing' && !applied.asym).forEach((p) =>
    out.push({ id: `b-generic-${p.pageId}`, signalClass: 'B', severity: 'amber', cause: 'direction', scope: { pageId: p.pageId }, rule: 'genericRisk.estimate', message: 'estimación: composición centrada → riesgo de patrón genérico medio' }))
  // repetición estructural: páginas (todas, no solo las reales) que comparten la MISMA secuencia de bloques.
  const seqs = new Map<string, number>()
  pages.forEach((p) => { const k = p.blocks.join('>'); seqs.set(k, (seqs.get(k) ?? 0) + 1) })
  const repeated = [...seqs.values()].filter((n) => n > 1)
  if (repeated.length) out.push({ id: 'b-repetition', signalClass: 'B', severity: 'amber', cause: 'execution', scope: {}, rule: 'sectionRepetition.estimate', message: `estimación: ${repeated.reduce((s, n) => s + n, 0)} páginas comparten ${repeated.length} secuencia(s) de bloques → monotonía estructural` })
  return out
}

// ── Clase C (requiere agente) y D (no evaluado): NO se computan; se listan con etiqueta honesta. Cada C se
// ancla a un check clase-A real (no percepción fingida). ──
export const PENDING_CHECKS: { cls: 'C' | 'D'; key: string; anchor?: string }[] = [
  { cls: 'C', key: 'perceptualHero', anchor: 'forbidden.hero.structural' },
  { cls: 'C', key: 'tasteBenchmark', anchor: 'tasteEvidence' },
  { cls: 'C', key: 'composition' },
  { cls: 'D', key: 'performance' },
  { cls: 'D', key: 'seo' },
  { cls: 'D', key: 'a11yFull' },
  { cls: 'D', key: 'legal' },
]

// ── Taste Evidence: NO un score de distancia (no hay corpus real). Muestra las REGLAS del estudio activas
// (principios + anti-patterns de la StyleSpec/Librería) con evidencia de match/violación por procedencia. ──
export type TasteStatus = 'active' | 'violate'
export interface TasteEvidence { rule: string; kind: 'principle' | 'antiPattern'; status: TasteStatus }
export function tasteEvidence(style: StyleSpec, applied: AppliedStyle): TasteEvidence[] {
  const principles: TasteEvidence[] = style.principles.map((p) => ({ rule: p, kind: 'principle', status: 'active' }))
  const antis: TasteEvidence[] = [...new Set([...style.antiPatterns, ...style.layout.hero.forbidden])].map((a) => ({ rule: a, kind: 'antiPattern', status: violatesForbidden(a, applied) ? 'violate' : 'active' }))
  return [...principles, ...antis]
}

// ── ChangeRequestToStyle: el Visualizador NO edita la dirección; cuando un hallazgo es de dirección/contrato,
// EMITE una solicitud estructurada de reapertura controlada aguas arriba. Preserva la frontera. ──
export interface ChangeRequest { type: 'style_change_request' | 'arch_change_request'; from: 'visualizador'; to: string; reason: string; axis: string; evidence: string[] }
export function buildChangeRequest(f: Finding): ChangeRequest {
  const dir = f.cause === 'direction'
  return { type: dir ? 'style_change_request' : 'arch_change_request', from: 'visualizador', to: dir ? 'estilo_de_diseno' : 'arquitectura', reason: f.message, axis: f.rule, evidence: [f.id, ...(f.scope.pageId ? [f.scope.pageId] : [])] }
}

// ── V2: iteración ACOTADA. Overrides de EJECUCIÓN (no de dirección): el Visualizador elige una variante
// de render dentro de límites — NO redefine la StyleSpec. Cada chip es un transform PURO y verificable del
// AppliedStyle (no un prompt libre). Un hallazgo de dirección sigue volviendo a Estilo (frontera intacta). ──
export interface AppliedOverride { pad?: number; gap?: number; asym?: boolean; ctaStyle?: 'solid' | 'outline' | 'text' }
export const NOTE_CHIPS: { id: string; delta: (a: AppliedStyle) => AppliedOverride }[] = [
  { id: 'air', delta: (a) => ({ pad: a.pad + 8, gap: a.gap + 6 }) },
  { id: 'compact', delta: (a) => ({ pad: Math.max(12, a.pad - 6), gap: Math.max(6, a.gap - 4) }) },
  { id: 'asym', delta: () => ({ asym: true }) },
  { id: 'symmetric', delta: () => ({ asym: false }) },
  { id: 'ctaSoft', delta: () => ({ ctaStyle: 'outline' }) },
]
export const applyOverride = (a: AppliedStyle, o?: AppliedOverride): AppliedStyle => (o ? { ...a, ...o } : a)
export function appliedDiff(a: AppliedStyle, b: AppliedStyle): { field: string; from: string; to: string }[] {
  const keys: (keyof AppliedStyle)[] = ['pad', 'gap', 'asym', 'ctaStyle', 'radius', 'headlineSize', 'accent']
  return keys.filter((k) => a[k] !== b[k]).map((k) => ({ field: String(k), from: String(a[k]), to: String(b[k]) }))
}

// ── VizSpec: el candidato de trabajo (cara-máquina). Al FIRMAR se congela como un VizBuild inmutable. ──
export interface VizSpec {
  meta: { project: string; source: string }
  plan: GenerationPlan
  fingerprint: string
  note?: string // la nota de iteración que produjo este candidato (acotada, no libre)
  override?: AppliedOverride // el transform de ejecución aplicado en el render
}
export interface BuildVizOpts { projectName?: string; source: string; realIds?: string[]; dsSig?: string; override?: AppliedOverride; note?: string }
export function buildVizSpec(arch: ArchSpec, style: StyleSpec, users: UsersSpec | null, opts: BuildVizOpts): VizSpec {
  const pages = vizPages(arch, opts.realIds ?? [])
  const plan = buildGenerationPlan(pages, style, arch, users, opts.dsSig ?? '')
  return { meta: { project: opts.projectName || 'Proyecto', source: opts.source }, plan, fingerprint: vizFingerprint(plan, opts.override), note: opts.note, override: opts.override }
}

// Un DesignBuild INMUTABLE firmado (snapshot en el árbol de versiones — event-log, NO Git). ts se estampa
// en el runtime (React), no aquí. La firma = fingerprint de contenido; la trazabilidad = las inputContracts.
export interface VizBuild { id: string; ts: number; fingerprint: string; source: string; note?: string; override?: AppliedOverride; planId: string }
export function toBuild(spec: VizSpec, ts: number): VizBuild {
  return { id: `build-${spec.fingerprint}`, ts, fingerprint: spec.fingerprint, source: spec.meta.source, note: spec.note, override: spec.override, planId: spec.plan.planId }
}

export function vizCounts(pages: VizPage[]) {
  return { pages: pages.length, real: pages.filter((p) => p.renderMode === 'real').length, planned: pages.filter((p) => p.renderMode === 'plan').length }
}

// ── V4: handoff. CMS es OPCIONAL — solo los proyectos con contenido dinámico/editable pasan por él; una
// landing / single-page / site pequeño va directo a Publicar. La señal ya existe: roles de colección. ──
export const needsCms = (arch: ArchSpec): boolean => arch.pages.some((p) => { const r = parseWireframe(p).role; return r === 'list' || r === 'detail' })

// Bindings sección↔campo: qué prop de qué sección es contenido editable. Es el eslabón que le falta a CMS
// (que hoy infiere tipos desde Arquitectura sin saber qué secciones los consumen). Solo relevante si needsCms.
export interface Binding { pageId: string; block: string; prop: string; field: string; editableByClient: boolean }
export function buildBindings(pages: VizPage[]): Binding[] {
  return pages.flatMap((p) => {
    const host = p.blocks.includes('hero') ? 'hero' : p.blocks.includes('summary') ? 'summary' : p.blocks.includes('content') ? 'content' : p.blocks[0] ?? 'section'
    const out: Binding[] = []
    const bind = (block: string, prop: string) => out.push({ pageId: p.pageId, block, prop, field: `${p.pageId}.${block}.${prop}`, editableByClient: true })
    if (p.copy.headline) bind(host, 'headline')
    if (p.copy.sub) bind(host, 'sub')
    if (p.copy.cta) bind(host, 'cta')
    if (p.role === 'list' || p.role === 'detail') out.push({ pageId: p.pageId, block: 'collection', prop: 'items', field: `${p.pageId}.items`, editableByClient: true })
    return out
  })
}

// ── V5: Cockpit del OWNER (refinamiento). El que dirige es el portador del criterio, con la confianza total
// del estudio → aquí NO hay muro: control total para terminar el producto. La honestidad (Reto 2) SÍ se
// mantiene: los cambios deterministas son reales; el salto generativo libre = costura del agente etiquetada. ──

// Edición por página que aplica el owner encima del render derivado. NO se recomputa desde upstream (es capa propia).
export interface PageEdit {
  copy?: { headline?: string; sub?: string; cta?: string }
  hidden?: string[] // bloques ocultados
  override?: AppliedOverride // transforms de ejecución (los mismos NOTE_CHIPS), por página
}
export const editedPage = (page: VizPage, edit?: PageEdit): VizPage =>
  !edit ? page : { ...page, blocks: page.blocks.filter((b) => !(edit.hidden ?? []).includes(b)), copy: { ...page.copy, ...edit.copy } }
export const editedStyle = (base: AppliedStyle, edit?: PageEdit): AppliedStyle => applyOverride(base, edit?.override)

// Etiqueta ES de cada bloque para reconocerlo en lenguaje natural (ocultar/mostrar por nombre).
const BLOCK_LABEL: Record<string, string> = { header: 'nav', hero: 'hero', features: 'beneficios', testimonial: 'testimonio', cta: 'cta', footer: 'pie', filters: 'filtros', grid: 'grid', pagination: 'paginación', gallery: 'galería', summary: 'resumen', related: 'relacionados', form: 'formulario', content: 'contenido' }

// Parser DETERMINISTA de prompt → intent. Reconoce transforms acotados / copy / ocultar-mostrar (reales); el
// resto es 'direction' (se aplica en producción + se puede propagar) o 'agent' (salto libre) → costura etiquetada.
export type IntentKind = 'air' | 'compact' | 'asym' | 'symmetric' | 'ctaSoft' | 'hide' | 'show' | 'copy' | 'direction' | 'agent'
export interface Intent { kind: IntentKind; block?: string; field?: 'headline' | 'sub' | 'cta'; value?: string }
export function parsePrompt(text: string, blocks: string[]): Intent {
  const t = text.toLowerCase()
  // copy explícito: "titular: X" / "cta: X" (antes que nada, para no confundir con transforms)
  const cp = /^\s*(titular|título|titulo|headline|encabezado|subtítulo|subtitulo|sub|bajada|cta|botón|boton)\s*[:=]\s*(.+)$/i.exec(text)
  if (cp) { const k = cp[1].toLowerCase(); const field = /cta|bot/.test(k) ? 'cta' : /sub|bajada/.test(k) ? 'sub' : 'headline'; return { kind: 'copy', field, value: cp[2].trim() } }
  // ocultar / mostrar un bloque por nombre — LÍMITE DE PALABRA (no substring: "octaedro" no matchea
  // "cta", "plataforma" no matchea "form").
  const bound = (w: string) => w.length > 0 && new RegExp(`(^|[^a-záéíóúñü])${w}([^a-záéíóúñü]|$)`, 'i').test(t)
  const blk = blocks.find((b) => bound(b) || bound(BLOCK_LABEL[b] ?? ''))
  if (blk && /(oculta|quita|elimina|sin |remueve|esconde|borra)/.test(t)) return { kind: 'hide', block: blk }
  if (blk && /(muestra|agrega|añade|anade|activa|vuelve a poner|pon el|pon la)/.test(t)) return { kind: 'show', block: blk }
  // transforms acotados de ejecución
  if (/(aire|espacio|respir|amplio|holgad|abierto)/.test(t)) return { kind: 'air' }
  if (/(compact|apret|junt|denso|reduce el espacio|menos espacio)/.test(t)) return { kind: 'compact' }
  if (/(asimétr|asimetr|desalin|rompe la simetr)/.test(t)) return { kind: 'asym' }
  if (/(simétr|simetr|centra|alinea al centro)/.test(t)) return { kind: 'symmetric' }
  if (/(cta sutil|bot[oó]n sutil|menos agresiv|cta suave|llamada sutil|cta discret)/.test(t)) return { kind: 'ctaSoft' }
  // dirección (personalidad/arte) — se aplica en producción y se puede propagar a Estilo/corpus
  if (/(editorial|saas|personalidad|direcci[oó]n|estilo|paleta|color|tipograf|m[aá]s c[aá]lid|premium|minimal|atrevid|corporativ)/.test(t)) return { kind: 'direction' }
  return { kind: 'agent' }
}

// Aplica un intent RECONOCIBLE al PageEdit (los transforms usan los mismos NOTE_CHIPS del base). direction/agent
// NO editan aquí (los maneja el chat como costura de agente). Devuelve el edit nuevo o null si no aplica.
export function applyIntent(edit: PageEdit | undefined, intent: Intent, base: AppliedStyle): PageEdit | null {
  const e: PageEdit = { copy: { ...edit?.copy }, hidden: [...(edit?.hidden ?? [])], override: { ...edit?.override } }
  if (intent.kind === 'copy' && intent.field) { e.copy = { ...e.copy, [intent.field]: intent.value }; return e }
  if (intent.kind === 'hide' && intent.block) { if (!e.hidden!.includes(intent.block)) e.hidden!.push(intent.block); return e }
  if (intent.kind === 'show' && intent.block) { e.hidden = e.hidden!.filter((b) => b !== intent.block); return e }
  const chip = NOTE_CHIPS.find((c) => c.id === intent.kind)
  if (chip) { e.override = { ...e.override, ...chip.delta(applyOverride(base, edit?.override)) }; return e }
  return null // direction / agent
}

// Aprobación POR PÁGINA (el owner avala cada página; el Build se sella cuando todas las reales están avaladas).
export const pageSig = (page: VizPage, edit?: PageEdit): string => { const ep = editedPage(page, edit); return contractSig([ep.pageId, ep.copy, ep.blocks, edit?.override ?? null]) }
export type PageStatus = 'pending' | 'approved' | 'outdated'
export function pageStatus(page: VizPage, edit: PageEdit | undefined, approvedSig: string): PageStatus {
  if (!approvedSig) return 'pending'
  return approvedSig === pageSig(page, edit) ? 'approved' : 'outdated'
}

// ¿El DesignBuild sellado sigue VIGENTE? (= buildStatus 'build'). La firma coincide, el upstream no derivó
// (planId), y TODAS las páginas reales siguen avaladas. pageEdits/approvedPages viven FUERA del fingerprint,
// así que hay que plegarlos aquí. Fuente única compartida por el Visualizador (verdad) y Publicar (gate),
// para que el gate de Publicar no pueda considerar firmado un build que el Visualizador ya marca outdated.
export function buildIsCurrent(o: {
  vizSpec: VizSpec | null; vizApproved: string; currentPlanId: string
  realPages: VizPage[]; pageEdits: Record<string, PageEdit>; approvedPages: Record<string, string>
}): boolean {
  if (!o.vizSpec || !o.vizApproved || o.vizApproved !== o.vizSpec.fingerprint) return false
  if (o.currentPlanId && o.currentPlanId !== o.vizSpec.plan.planId) return false // drift aguas arriba
  return o.realPages.length > 0 && o.realPages.every((p) => pageStatus(p, o.pageEdits[p.pageId], o.approvedPages[p.pageId] ?? '') === 'approved')
}

// Mensaje del chat del cockpit. role: owner (el humano) / studio (la máquina).
export interface ChatMsg { id: string; role: 'owner' | 'studio'; text: string; kind: 'applied' | 'agent' | 'direction' | 'note' }
