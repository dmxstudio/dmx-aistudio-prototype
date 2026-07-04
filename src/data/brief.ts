export type FieldStatus = 'empty' | 'closed' | 'inProgress' | 'decision'
export type Origin = 'ai' | 'human'
export type DecisionKind = 'conflict' | 'review' | 'question'

// Rich data model (the full per-field metadata lives here, invisible by default).
export interface BriefField {
  id: string
  label: string
  value: string
  status: FieldStatus
  origin: Origin
  required?: boolean
  optional?: boolean
  inherited?: boolean
  confidence?: number
  kind?: DecisionKind
  aiValue?: string
  humanValue?: string
  blocks?: string
  // Provenance of an AI proposal (e.g. "Brief", "brand-book.pdf", "Sitio: marca.com").
  source?: string
  // Flag-only: this lives in another panel; shown as a boundary hint, not editable here.
  movedTo?: string
}

export interface BriefSection {
  code: string
  id: string
  name: string
  fields: BriefField[]
}

export const briefSections: BriefSection[] = [
  {
    code: 'A',
    id: 'overview',
    name: 'Overview & Business',
    fields: [
      { id: 'a-name', label: 'Nombre del proyecto', value: 'Rediseño Nimbus', status: 'closed', origin: 'human', required: true },
      { id: 'a-client', label: 'Cliente / marca', value: 'Nimbus Coffee', status: 'closed', origin: 'human', required: true },
      { id: 'a-industry', label: 'Industria', value: 'Café de especialidad', status: 'inProgress', origin: 'ai', required: true, confidence: 0.82 },
      { id: 'a-markets', label: 'Mercados objetivo', value: '', status: 'decision', origin: 'ai', required: true, kind: 'conflict', aiValue: 'MX · US', humanValue: 'MX', blocks: 'AI UI Designer' },
      { id: 'a-competitors', label: 'Competidores', value: 'https://bluebottlecoffee.com · https://cafetresmarias.com', status: 'inProgress', origin: 'human', optional: true },
      { id: 'a-problem', label: 'Problema a resolver', value: 'Caen las recompras en línea', status: 'inProgress', origin: 'ai', required: true, confidence: 0.7 },
      { id: 'a-obj', label: 'Objetivo primario (negocio)', value: '+20% conversión a demo', status: 'closed', origin: 'human', required: true },
      { id: 'a-usergoal', label: 'Meta de usuario', value: 'Comprar sin fricción', status: 'closed', origin: 'ai', required: true },
      { id: 'a-brandgoal', label: 'Meta de marca', value: 'Percepción premium', status: 'inProgress', origin: 'ai', optional: true },
      { id: 'a-langs', label: 'Idiomas', value: 'ES, EN', status: 'closed', origin: 'human', optional: true },
    ],
  },
  {
    code: 'B',
    id: 'audience',
    name: 'Audience & Experience',
    fields: [
      { id: 'b-primary', label: 'Audiencia primaria', value: 'Compradores recurrentes, 25-40', status: 'closed', origin: 'human', required: true },
      { id: 'b-journey', label: 'Journey crítico', value: 'Descubrir → suscribir café', status: 'inProgress', origin: 'ai', required: true, confidence: 0.75 },
      { id: 'b-a11y', label: 'Accesibilidad', value: 'WCAG 2.2 AA', status: 'closed', origin: 'human', required: true },
      { id: 'b-secondary', label: 'Segmento secundario', value: 'Regalos corporativos (sugerido)', status: 'decision', origin: 'ai', required: true, kind: 'review', confidence: 0.55, blocks: 'AI UX Designer' },
      { id: 'b-devices', label: 'Dispositivos', value: 'Móvil primero', status: 'closed', origin: 'ai', optional: true },
      { id: 'b-states', label: 'Nivel de rigor de estados UI', value: 'Estándar', status: 'inProgress', origin: 'human', optional: true },
    ],
  },
  {
    code: 'C',
    id: 'scope',
    name: 'Scope & Work Map',
    fields: [
      { id: 'c-deliverables', label: 'Entregables', value: 'Branding, Design System, Sitio', status: 'closed', origin: 'human', required: true },
      { id: 'c-platforms', label: 'Plataformas', value: 'Web responsive', status: 'closed', origin: 'human', required: true },
      { id: 'c-integrations', label: 'Integraciones', value: 'Shopify, Mailchimp', status: 'inProgress', origin: 'ai', required: true, confidence: 0.7 },
      { id: 'c-budget', label: '¿Presupuesto tope?', value: '', status: 'decision', origin: 'human', required: true, kind: 'question', blocks: 'el plan de agentes' },
      { id: 'c-guardian', label: 'Aprobador de agentes (guardián)', value: 'Project Lead', status: 'closed', origin: 'human', required: true },
    ],
  },
  {
    code: 'D',
    id: 'brand',
    name: 'Initial Brand Signals',
    fields: [
      { id: 'd-maturity', label: 'Madurez de marca', value: 'En evolución', status: 'closed', origin: 'human', required: true },
      { id: 'd-refs', label: 'Referencias visuales', value: 'https://bluebottlecoffee.com · https://stumptowncoffee.com · https://vervecoffee.com', status: 'closed', origin: 'human', required: true },
      { id: 'd-tone', label: 'Notas de tono inicial', value: 'Cálido y cercano', status: 'inProgress', origin: 'ai', required: true },
      { id: 'd-anti', label: 'Anti-referencias', value: 'Evitar look corporativo frío', status: 'inProgress', origin: 'ai', optional: true },
      { id: 'd-restrict', label: 'Restricciones', value: 'Conservar el verde de marca', status: 'closed', origin: 'human', optional: true },
    ],
  },
  {
    code: 'E',
    id: 'constraints',
    name: 'Constraints & Risks',
    fields: [
      { id: 'e-timeline', label: 'Timeline', value: '8 semanas', status: 'closed', origin: 'human', required: true },
      { id: 'e-fact', label: 'Hecho (Fact)', value: 'Catálogo de 40 SKUs', status: 'closed', origin: 'human', required: true },
      { id: 'e-dep', label: 'Dependencias', value: 'Aprobación legal de claims', status: 'inProgress', origin: 'human', required: true },
      { id: 'e-assumption', label: 'Supuesto (Assumption)', value: 'Migración desde WordPress', status: 'inProgress', origin: 'ai', optional: true },
      { id: 'e-risk', label: 'Riesgo', value: 'Fotografía de producto incompleta', status: 'inProgress', origin: 'human', optional: true },
    ],
  },
  {
    code: 'F',
    id: 'technical',
    name: 'Technical Context',
    fields: [
      { id: 'f-framework', label: 'Framework frontend', value: 'React', status: 'closed', origin: 'human', required: true },
      { id: 'f-cms', label: 'CMS', value: 'Por definir', status: 'inProgress', origin: 'human', required: true },
      { id: 'f-hosting', label: 'Hosting', value: 'Vercel', status: 'closed', origin: 'ai', optional: true },
    ],
  },
]

// Meridian (workspace 3, project p4) — 100%-populated brief for a marketing site that sells
// their brand-design + digital-brandbook service. Content sourced from the Meridian strategic
// page (purpose/positioning/values: "Aligned by design") with gaps invented in line with it.
// ponytail: a value map over the shared structure beats re-declaring 39 field objects.
const meridianValues: Record<string, string> = {
  'a-name': 'Sitio web Meridian',
  'a-client': 'Meridian',
  'a-industry': 'Sistemas de marca / branding (servicio + brandbook digital)',
  'a-markets': 'MX · US · LATAM',
  'a-competitors': 'https://frontify.com · https://brandpad.io · https://standards.site',
  'a-problem': 'El servicio se explica en llamadas; el sitio no convierte ni muestra el producto (brandbook digital)',
  'a-obj': '+30% leads calificados a demo del brandbook',
  'a-usergoal': 'Entender el servicio y pedir una demo sin fricción',
  'a-brandgoal': 'Posicionar a Meridian como el estándar de coherencia de marca',
  'a-langs': 'ES, EN',
  'b-primary': 'Líderes de diseño y marca en equipos que crecen rápido (scale-ups), 28-45',
  'b-journey': 'Descubrir → ver el brandbook en vivo → pedir demo',
  'b-a11y': 'WCAG 2.2 AA',
  'b-secondary': 'Agencias que revenden el sistema a sus clientes',
  'b-devices': 'Desktop primero (decisores en oficina), responsive',
  'b-states': 'Alto — demos interactivas y estados vacíos cuidados',
  'c-deliverables': 'Branding, Design System, Sitio de marketing + demo de brandbook',
  'c-platforms': 'Web responsive',
  'c-integrations': 'HubSpot (leads) · Cal.com (demos) · Stripe (planes)',
  'c-budget': '$45,000 USD',
  'c-guardian': 'Líder de proyecto (Meridian) + Dahir (DMX)',
  'd-maturity': 'Madura — sistema de marca propio (dirección suiza, cobalto)',
  'd-refs': 'https://frontify.com · https://brandpad.io · https://standards.site',
  'd-tone': 'Claro, riguroso y cálido — "Aligned by design"',
  'd-anti': 'Evitar lo frío/corporativo y la jerga (disruptivo, sinergia)',
  'd-restrict': 'Respetar el sistema Meridian (cobalto #2348E0, Space Grotesk/Inter)',
  'e-timeline': '10 semanas',
  'e-fact': 'El brandbook ya existe como sistema (6 capítulos, 55 secciones)',
  'e-dep': 'Contenido y assets finales del brandbook Meridian',
  'e-assumption': 'Migración desde una landing actual en Webflow',
  'e-risk': 'El producto (brandbook digital) sigue evolucionando durante el diseño',
  'f-framework': 'React',
  'f-cms': 'Sanity',
  'f-hosting': 'Vercel',
}

// Shared seed: a populated brief for the demo project (p1), Meridian for p4, empty for the rest.
// Used by the Brief screen and by Branding (to read the brief's readiness as context).
export function seedBrief(projectId: string): BriefSection[] {
  if (projectId === 'p1') return briefSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f })) }))
  if (projectId === 'p4')
    return briefSections.map((s) => ({
      ...s,
      fields: s.fields.map((f): BriefField => ({
        ...f,
        value: meridianValues[f.id] ?? '',
        status: meridianValues[f.id] ? 'closed' : 'empty',
        kind: undefined,
        aiValue: undefined,
        humanValue: undefined,
        confidence: undefined,
      })),
    }))
  return briefSections.map((s) => ({
    ...s,
    fields: s.fields.map((f): BriefField => ({
      ...f,
      value: '',
      status: 'empty',
      kind: undefined,
      aiValue: undefined,
      humanValue: undefined,
      confidence: undefined,
    })),
  }))
}

// Version control model — shaped for the final product (swap this mock for the real
// event store / snapshots DB without touching the UI).
export interface BriefVersion {
  id: string
  label: string
  author: string
  when: string
  current?: boolean
  sealed?: boolean
  origin?: 'ai' | 'human'
}

export const briefVersions: BriefVersion[] = [
  { id: 'v3', label: 'Borrador actual', author: 'tú', when: 'hace 2 min', current: true },
  { id: 'v2', label: 'Aprobada para Branding', author: 'Project Lead', when: '12 jun', sealed: true },
  { id: 'v1', label: 'Brief inicial', author: 'IA', when: '10 jun', origin: 'ai' },
]

export interface FieldEvent {
  id: string
  field: string
  detail: string
  origin: 'ai' | 'human'
  when: string
}

export const briefHistory: FieldEvent[] = [
  { id: 'h1', field: 'Mercados objetivo', detail: 'conflicto resuelto: IA “MX · US” → “MX · US”', origin: 'human', when: 'ahora' },
  { id: 'h2', field: 'Tono de marca', detail: 'IA generó “Cálido y cercano” · 0.6', origin: 'ai', when: 'ayer' },
  { id: 'h3', field: 'Objetivo primario', detail: 'editado → “+20% conversión a demo” · aprobado', origin: 'human', when: '11 jun' },
  { id: 'h4', field: 'Industria', detail: 'IA propuso “Café de especialidad”', origin: 'ai', when: '10 jun' },
]

// A virgin/empty brief reuses the same structure with no content (e.g. a brand-new project).
export const emptyVersions: BriefVersion[] = [
  { id: 'v1', label: 'Borrador inicial', author: 'tú', when: 'ahora', current: true },
]

export const emptyHistory: FieldEvent[] = []
