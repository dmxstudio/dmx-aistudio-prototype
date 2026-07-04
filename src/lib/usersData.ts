import type { BriefField, BriefSection } from '../data/brief'
import type { BrandSection } from '../data/branding'

// MOCKUP: "El usuario" — la RÚBRICA de aceptación del proyecto. La médula es un grafo
// segmento → meta → dolor con ids estables (cara MÁQUINA = UsersSpec); las cards y el journey son la
// cara HUMANA de ese grafo. Se deriva del Brief (audiencias, journey, problema, meta) + Branding
// (personas ap-personas). Ver memoria users-section-approach.

export type Evidence = 'fact' | 'assumption' | 'risk' // reutiliza la taxonomy de Branding
export type GoalKind = 'persona' | 'quality'

export interface UserGoal {
  id: string
  kind: GoalKind
  story: { role: string; want: string; soFar: string } // "Como {role}, quiero {want}, para {soFar}"
  acceptance: string // criterio comprobable — lo que una pantalla aprueba o no
  resolvesPainIds: string[] // enlace muchos-a-muchos a dolores del segmento
  evidence: Evidence
  coveredBy?: string[] // U3: ids aguas abajo que reclaman atender esta meta (NO entra en la firma)
}
export interface PainPoint {
  id: string
  text: string
  evidence: Evidence
  resolvedBy?: string[] // U3: ids aguas abajo que reclaman resolver este dolor (NO entra en la firma)
}
export interface JourneyStage {
  id: string
  label: string
  context: string // dispositivo / canal
  emotion: number // -2..2 (curva de emoción)
  painIds: string[] // dolores que muerden en esta etapa
}
export interface UserSegment {
  id: string
  name: string
  kind: 'primary' | 'secondary'
  from?: string // procedencia (campo del Brief)
  evidence: Evidence
  persona: { handle: string; quote: string }
  context: { device: string }
  goals: UserGoal[]
  pains: PainPoint[]
  journey: JourneyStage[]
}
export interface UsersSpec {
  meta: { project: string; generatedFrom: string }
  segments: UserSegment[]
}

const fv = (sections: { fields: BriefField[] }[], id: string) => sections.flatMap((s) => s.fields).find((f) => f.id === id)
const val = (f?: BriefField) => f?.value?.trim() ?? ''
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
// Taxonomy de evidencia desde el estado del campo de origen: cerrado→hecho, decisión→riesgo, resto→supuesto.
const evi = (f?: BriefField): Evidence => (!f ? 'risk' : f.status === 'closed' ? 'fact' : f.status === 'decision' ? 'risk' : 'assumption')

// Deriva la journey desde "Descubrir → suscribir café": tokens + etapa de recompra si es recurrente.
function deriveJourney(journeyText: string, device: string, recurring: boolean, recompraPainId?: string): JourneyStage[] {
  const tokens = journeyText.split(/→|->|›|»|>/).map((t) => t.trim()).filter(Boolean)
  const labels = tokens.length ? tokens.map(cap) : ['Descubrir', 'Decidir']
  if (recurring && !labels.some((l) => /recompra|volver|renov/i.test(l))) labels.push('Recompra')
  const last = labels.length - 1
  return labels.map((label, i) => ({
    id: `stg-${i + 1}`,
    label,
    context: device || 'Móvil',
    emotion: i === 0 ? 1 : i === last ? 2 : 0,
    painIds: recompraPainId && i === last && recurring ? [recompraPainId] : [],
  }))
}

export function buildUsersSpec(brief: BriefSection[], branding: BrandSection[], projectName: string): UsersSpec {
  const bf = (id: string) => fv(brief, id)
  const brf = (id: string) => fv(branding as unknown as { fields: BriefField[] }[], id)
  const personas = ((brf('ap-personas') as unknown as { rows?: { name: string; seg?: string; quote?: string }[] })?.rows) ?? []
  const device = val(bf('b-devices')) || 'Móvil'

  const segments: UserSegment[] = []

  // ── Segmento primario (b-primary) ─────────────────────────────────────────
  const primary = bf('b-primary')
  if (primary && val(primary)) {
    const persona = personas[0] ?? { name: '', seg: '', quote: '' }
    const role = persona.seg || 'usuario'
    const painRe: PainPoint = { id: 'pn-recompra', text: val(bf('a-problem')) || 'Fricción en la recompra', evidence: evi(bf('a-problem')) }
    const goalFric: UserGoal = {
      id: 'gl-friccion', kind: 'persona',
      story: { role, want: (val(bf('a-usergoal')) || 'comprar sin fricción').toLowerCase(), soFar: 'no abandonar la compra' },
      acceptance: 'Checkout en ≤ 2 pasos', resolvesPainIds: [painRe.id], evidence: evi(bf('a-usergoal')),
    }
    const goalPerf: UserGoal = {
      id: 'gl-perf', kind: 'quality',
      story: { role: '', want: `Carga móvil rápida y accesible (${val(bf('b-a11y')) || 'WCAG 2.2 AA'})`, soFar: '' },
      acceptance: 'LCP < 2s · contraste AA', resolvesPainIds: [], evidence: evi(bf('b-a11y')),
    }
    segments.push({
      id: 'seg-primary', name: val(primary), kind: 'primary', from: 'b-primary', evidence: evi(primary),
      persona: { handle: persona.name, quote: persona.quote ?? '' }, context: { device },
      goals: [goalFric, goalPerf], pains: [painRe],
      journey: deriveJourney(val(bf('b-journey')), device, true, painRe.id),
    })
  }

  // ── Segmento secundario (b-secondary, típicamente un supuesto/riesgo) ──────
  const secondary = bf('b-secondary')
  if (secondary && val(secondary)) {
    const persona = personas[1] ?? { name: '', seg: '', quote: '' }
    const role = persona.seg || 'responsable de compras'
    const painSec: PainPoint = { id: 'pn-grupal', text: 'Coordinar un pedido grupal es tedioso', evidence: 'assumption' }
    const goalSec: UserGoal = {
      id: 'gl-grupal', kind: 'persona',
      story: { role, want: 'pedir para varios sin complicarme', soFar: 'quedar bien con el equipo' },
      acceptance: 'Pedido múltiple en 1 formulario', resolvesPainIds: [painSec.id], evidence: 'assumption',
    }
    segments.push({
      id: 'seg-secondary', name: val(secondary).replace(/\s*\(sugerido\)\s*/i, ''), kind: 'secondary', from: 'b-secondary', evidence: evi(secondary),
      persona: { handle: persona.name, quote: persona.quote ?? '' }, context: { device },
      goals: [goalSec], pains: [painSec],
      journey: deriveJourney('Descubrir → Cotizar → Pedir', device, false),
    })
  }

  return { meta: { project: projectName || 'Proyecto', generatedFrom: 'Brief + Branding' }, segments }
}

// Un segmento mínimo (para "Desde cero" y para "+ Añadir segmento").
export function emptySegment(id: string, name = 'Nuevo segmento'): UserSegment {
  return { id, name, kind: 'secondary', evidence: 'assumption', persona: { handle: '', quote: '' }, context: { device: 'Móvil' }, goals: [], pains: [], journey: [] }
}

// ── Resumen + aprobación por segmento (mismo mecanismo que Arquitectura) ─────
export function usersCounts(spec: UsersSpec) {
  const goals = spec.segments.reduce((n, s) => n + s.goals.length, 0)
  const pains = spec.segments.reduce((n, s) => n + s.pains.length, 0)
  return { segments: spec.segments.length, goals, pains }
}

// U3 cobertura: clave GLOBAL de una meta/dolor (los ids son únicos por segmento, no entre segmentos).
// Arquitectura/Visualizador etiquetan sus piezas con estas claves; El usuario mide contra ellas.
export const covKey = (segId: string, itemId: string) => `${segId}::${itemId}`
// Objetivos de cobertura (metas/dolores etiquetables) que El usuario expone aguas abajo.
export type CovTargets = { goals: { key: string; label: string }[]; pains: { key: string; label: string }[] }

export type UsersApprovals = Partial<Record<string, string>> // segId → firma de contenido al aprobar
export type UserStatus = 'pending' | 'approved' | 'outdated'

// Firma del CONTENIDO del segmento (excluye coverage, que lo reclama aguas abajo y no debe reabrir la
// aprobación). JSON.stringify → estructural, escapa separadores.
export function segmentSignature(spec: UsersSpec, segId: string): string {
  const s = spec.segments.find((x) => x.id === segId)
  if (!s) return ''
  return JSON.stringify([
    s.name, s.kind, s.persona, s.context, s.evidence,
    s.goals.map((g) => [g.id, g.kind, g.story, g.acceptance, g.resolvesPainIds, g.evidence]),
    s.pains.map((p) => [p.id, p.text, p.evidence]),
    s.journey.map((j) => [j.id, j.label, j.context, j.emotion, j.painIds]),
  ])
}
export function segmentStatus(spec: UsersSpec, approvals: UsersApprovals, segId: string): UserStatus {
  const sig = approvals[segId]
  if (sig == null) return 'pending'
  return sig === segmentSignature(spec, segId) ? 'approved' : 'outdated'
}
