// Valida el DTCG derivado con los MISMOS checks de token-contract que el validador del template
// (public/ds/scripts/validate-design-system.mjs) — la porción que depende de los tokens (no de los
// archivos/HTML, que son fijos). Es el "build gate" de la máquina: confirma que el artefacto es
// válido y coherente. Determinista, sin dependencias.

interface Node {
  $type?: string
  $value?: unknown
  [k: string]: unknown
}

export interface DsCheck {
  key: 'structure' | 'required' | 'aliases' | 'figma' | 'openpencil'
  ok: boolean
}
export interface DsValidation {
  checks: DsCheck[]
  tokenCount: number
  ok: boolean
}

// Tokens que el validador exige que existan (con $value).
const REQUIRED_PATHS = [
  'color.primitive.brand.500',
  'color.primitive.neutral.900',
  'color.semantic.background.default',
  'color.semantic.action.primary.background.default',
  'color.semantic.focus.ring',
  'dimension.space.4',
  'radius.md',
  'typography.component.heading.display',
  'component.button.primary.background.default',
  'component.button.primary.focusRing',
  'component.input.border.error',
  'component.card.background',
  'component.modal.shadow',
  'breakpoint.lg',
  'zIndex.modal',
  'duration.base',
  'easing.standard',
]

const isObj = (v: unknown): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v)
const getByPath = (obj: unknown, p: string): unknown =>
  p.split('.').reduce<unknown>((acc, k) => (isObj(acc) ? acc[k] : undefined), obj)

// Recolecta las hojas de token (nodos con $value) → path → nodo.
function collectTokens(node: unknown, prefix: string[] = [], out = new Map<string, Node>()): Map<string, Node> {
  if (!isObj(node)) return out
  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    out.set(prefix.join('.'), node as Node)
    return out
  }
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue
    collectTokens(v, [...prefix, k], out)
  }
  return out
}

// Alias `{path}` dentro de un $value (string, array o composite).
function collectAliases(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    for (const m of value.matchAll(/\{([^}]+)\}/g)) out.push(m[1])
  } else if (Array.isArray(value)) {
    value.forEach((x) => collectAliases(x, out))
  } else if (isObj(value)) {
    Object.values(value).forEach((x) => collectAliases(x, out))
  }
  return out
}

export function validateDesignTokens(dt: unknown): DsValidation {
  const tokens = collectTokens(dt)
  const structure = [...tokens.values()].every((tok) => !!tok.$type && tok.$value != null)
  const required = REQUIRED_PATHS.every((p) => {
    const tok = getByPath(dt, p)
    return isObj(tok) && Object.prototype.hasOwnProperty.call(tok, '$value')
  })
  const aliases = [...tokens.values()].every((tok) =>
    collectAliases(tok.$value).every((a) => {
      const target = getByPath(dt, a)
      return isObj(target) && Object.prototype.hasOwnProperty.call(target, '$value')
    }),
  )
  const ext = isObj(dt) ? (dt.$extensions as Record<string, unknown> | undefined) : undefined
  const figma = !!(isObj(ext?.figma) && Array.isArray((ext!.figma as Record<string, unknown>).variableCollections) && ((ext!.figma as Record<string, unknown>).variableCollections as unknown[]).length)
  const openpencil = !!(isObj(ext?.openPencil) && Array.isArray((ext!.openPencil as Record<string, unknown>).componentManifest) && ((ext!.openPencil as Record<string, unknown>).componentManifest as unknown[]).length)

  const checks: DsCheck[] = [
    { key: 'structure', ok: structure },
    { key: 'required', ok: required },
    { key: 'aliases', ok: aliases },
    { key: 'figma', ok: figma },
    { key: 'openpencil', ok: openpencil },
  ]
  return { checks, tokenCount: tokens.size, ok: checks.every((c) => c.ok) }
}

// Cobertura por categoría (para el overview): agrupa las hojas por el primer segmento del path.
const CAT: Record<string, string> = {
  color: 'color',
  dimension: 'space',
  radius: 'radius',
  borderWidth: 'radius',
  fontFamily: 'type',
  fontWeight: 'type',
  fontSize: 'type',
  lineHeight: 'type',
  typography: 'type',
  shadow: 'effects',
  opacity: 'effects',
  duration: 'motion',
  easing: 'motion',
  breakpoint: 'layout',
  zIndex: 'layout',
  component: 'components',
}
const CAT_ORDER = ['color', 'type', 'space', 'radius', 'effects', 'motion', 'layout', 'components']

export function tokenGroups(dt: unknown): { key: string; n: number }[] {
  const tokens = collectTokens(dt)
  const counts: Record<string, number> = {}
  for (const path of tokens.keys()) {
    const cat = CAT[path.split('.')[0]] ?? 'other'
    counts[cat] = (counts[cat] ?? 0) + 1
  }
  return CAT_ORDER.filter((k) => counts[k]).map((k) => ({ key: k, n: counts[k] }))
}
