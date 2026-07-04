import type { BrandSection } from '../data/branding'
import { buildBookTokens, buildBookTokensDark, buildBookFonts, fontRolesOf } from './bookData'
import base from '../data/ds-tokens-base.json'

// MOCKUP: deriva el Design System del proyecto desde los tokens de Branding (sin IA real —
// derivación determinista). Branding es la fuente de verdad de los tokens de MARCA; el resto del
// árbol (semantic/component) los referencia por alias, así que se resuelven solos.
// Dos salidas: (1) tokens/tokensDark/fonts → feed visual del template humano (public/ds), con los
// MISMOS nombres de variable que /book; (2) designTokens → artefacto DTCG para la máquina.
// Fase 3: perillas (densidad/radios) que RE-DERIVAN, y overrides de import (reconciliación con la
// Marca — el valor resuelto "usar Import" pisa el token de marca ANTES de derivar, vía la marca).

type ColorStep = { $type?: string; $value: string; $description?: string }
interface DTCG {
  $metadata: Record<string, string>
  color: { primitive: { brand: Record<string, ColorStep> } }
  fontFamily: Record<string, { $type?: string; $value: string }>
  [k: string]: unknown
}

// Perillas de alto nivel que regeneran el sistema (multiplicadores sobre los tokens base).
export interface DsKnobs {
  density: 'compact' | 'comfortable' | 'spacious'
  radius: 'sharp' | 'soft' | 'rounded'
}
export const DEFAULT_KNOBS: DsKnobs = { density: 'comfortable', radius: 'soft' }
const DENSITY: Record<string, number> = { compact: 0.75, comfortable: 1, spacious: 1.25 }
const RADIUS_MUL: Record<string, number> = { sharp: 0.4, soft: 1, rounded: 1.75 }

// Resoluciones de import: el valor de import que GANÓ un conflicto contra la Marca.
export interface DsOverrides {
  brandHex?: string
  fontDisplay?: string
}

const RAMP = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']

const fv = (branding: BrandSection[], id: string) =>
  branding.flatMap((s) => s.fields).find((f) => f.id === id)?.value?.trim() ?? ''

const asRec = (v: unknown): Record<string, unknown> | undefined =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined

// Escala en sitio todas las hojas de dimensión ({$value:{value:N}}) de un subárbol.
function scaleDim(node: unknown, mul: number) {
  const o = asRec(node)
  if (!o) return
  const val = asRec(o.$value)
  if (val && typeof val.value === 'number') {
    val.value = Math.round(val.value * mul)
    return
  }
  for (const k in o) if (!k.startsWith('$')) scaleDim(o[k], mul)
}

// Reemplaza el hex de marca / fuente display por el valor de import que ganó la reconciliación,
// ANTES de derivar — así la resolución fluye por la misma derivación (rampa incluida).
export function withOverrides(branding: BrandSection[], ov?: DsOverrides): BrandSection[] {
  if (!ov?.brandHex && !ov?.fontDisplay) return branding
  return branding.map((s) => ({
    ...s,
    fields: s.fields.map((f) => {
      if (f.id === 'cd-brand-hex' && ov.brandHex) return { ...f, value: ov.brandHex }
      if (f.id === 'font-display' && ov.fontDisplay) return { ...f, value: ov.fontDisplay }
      return f
    }),
  }))
}

// Última entrada del changelog (§5.4) con versión.
function lastVerRow(branding: BrandSection[]): Record<string, string> | undefined {
  const rows = branding.flatMap((s) => s.fields).find((f) => f.id === 'ver-log')?.rows ?? []
  return [...rows].reverse().find((r) => (r.ver ?? '').trim())
}
export function brandVersion(branding: BrandSection[]): string {
  return (lastVerRow(branding)?.ver ?? 'v0.1').replace(/^v/i, '')
}
function semver(branding: BrandSection[]): string {
  const parts = brandVersion(branding).split('.')
  return [parts[0] || '0', parts[1] || '1', parts[2] || '0'].join('.')
}

// Transforma el DTCG base sobrescribiendo lo dependiente de marca + aplica las perillas.
export function buildDesignTokens(branding: BrandSection[], brandName: string, knobs?: DsKnobs, ov?: DsOverrides): DTCG {
  const b = withOverrides(branding, ov)
  const dt = JSON.parse(JSON.stringify(base)) as DTCG
  const tokens = buildBookTokens(b)
  const nm = brandName || 'Meridian'

  dt.$metadata = {
    ...dt.$metadata,
    brand: nm,
    system: `${nm} Design System`,
    version: semver(branding),
    updated: lastVerRow(branding)?.date || dt.$metadata.updated,
    source: 'DMXAiStudio',
  }

  // color.primitive.brand ← rampa derivada del hex de marca; semantic/component la siguen por alias.
  for (const step of RAMP) {
    const hex = tokens[`--brand-${step}`]
    if (hex && dt.color.primitive.brand[step]) dt.color.primitive.brand[step].$value = hex.toUpperCase()
  }

  // fontFamily ← familias declaradas, GATED por rol (td-direction), igual que la guía humana.
  const roles = fontRolesOf(b)
  if (roles.includes('display') && fv(b, 'font-display')) dt.fontFamily.display.$value = fv(b, 'font-display')
  if (roles.includes('text') && fv(b, 'font-text')) dt.fontFamily.text.$value = fv(b, 'font-text')
  if (roles.includes('mono') && fv(b, 'font-mono')) dt.fontFamily.mono.$value = fv(b, 'font-mono')

  // Perillas: densidad escala el espaciado + alturas de componente; radios escala los radios (no 'full').
  const dMul = DENSITY[knobs?.density ?? 'comfortable'] ?? 1
  const rMul = RADIUS_MUL[knobs?.radius ?? 'soft'] ?? 1
  if (dMul !== 1) {
    scaleDim(asRec(dt.dimension)?.space, dMul)
    scaleDim(dt.component, dMul)
  }
  if (rMul !== 1) {
    const rad = asRec(dt.radius)
    if (rad) for (const k of ['sm', 'md', 'lg']) scaleDim(rad[k], rMul)
  }

  return dt
}

// Cuenta tokens hoja por capa (Primitive / Semantic / Component) para el overview del panel.
export function countTokens(dt: DTCG): { primitive: number; semantic: number; component: number; total: number } {
  let primitive = 0
  let semantic = 0
  let component = 0
  const walk = (node: unknown, path: string) => {
    if (!node || typeof node !== 'object') return
    const o = node as Record<string, unknown>
    if ('$value' in o || '$type' in o) {
      if (path.startsWith('color.semantic')) semantic++
      else if (path.startsWith('component') || path.startsWith('typography.component')) component++
      else primitive++
      return
    }
    for (const k in o) if (!k.startsWith('$')) walk(o[k], path ? path + '.' + k : k)
  }
  walk(dt as unknown, '')
  return { primitive, semantic, component, total: primitive + semantic + component }
}

// Tokens CSS de escala para la guía (styles.css usa --s1..9 y --r-sm/md/lg): las perillas los
// reescalan igual que al DTCG, para que la guía humana refleje densidad/radios.
const SPACE_BASE = [4, 8, 12, 16, 24, 32, 48, 64, 96]
function scaleTokens(knobs?: DsKnobs): Record<string, string> {
  const d = DENSITY[knobs?.density ?? 'comfortable'] ?? 1
  const r = RADIUS_MUL[knobs?.radius ?? 'soft'] ?? 1
  const t: Record<string, string> = {}
  if (d !== 1) SPACE_BASE.forEach((v, i) => (t[`--s${i + 1}`] = Math.round(v * d) + 'px'))
  if (r !== 1) {
    t['--r-sm'] = Math.round(6 * r) + 'px'
    t['--r-md'] = Math.round(10 * r) + 'px'
    t['--r-lg'] = Math.round(16 * r) + 'px'
  }
  return t
}

// Lee los valores de MARCA de un JSON de tokens pegado (tolerante: forma DTCG o simple). Solo
// extrae lo que puede chocar con la Marca (color de marca + fuente display); las capas propias del
// DS del import no conflictúan (la Marca no las define). Devuelve {} si no parsea.
export function extractImportBrand(text: string): { brandHex?: string; fontDisplay?: string } {
  try {
    const j = JSON.parse(text) as Record<string, unknown>
    // Desenvuelve el wrapper del token: DTCG {$value}, Style Dictionary/Tokens Studio {value}, o string.
    const unwrap = (v: unknown): unknown => {
      const o = asRec(v)
      if (o && '$value' in o) return o.$value
      if (o && 'value' in o) return o.value
      return v
    }
    const dig = (path: string): unknown => unwrap(path.split('.').reduce<unknown>((a, k) => asRec(a)?.[k], j))
    const hex = dig('color.primitive.brand.500') ?? dig('color.brand.500') ?? dig('color.brand') ?? j.brandColor ?? j.brand
    const font = dig('fontFamily.display') ?? dig('font.display') ?? dig('typography.display')
    // Exige '#' explícito: un nombre de marca de 6 letras a–f ('Facade') NO es un color.
    const hexStr = typeof hex === 'string' ? hex.trim() : ''
    const brandHex = /^#[0-9a-f]{6}$/i.test(hexStr) ? hexStr : undefined
    const fontDisplay = typeof font === 'string' && font.trim() ? font.trim() : undefined
    return { brandHex, fontDisplay }
  } catch {
    return {}
  }
}

// Payload que lee el template (?brand=<id> → localStorage 'dmxds:<id>').
export function dsPayload(branding: BrandSection[], brandName = '', knobs?: DsKnobs, ov?: DsOverrides): string {
  const b = withOverrides(branding, ov)
  return JSON.stringify({
    tokens: { ...buildBookTokens(b), ...scaleTokens(knobs) },
    tokensDark: buildBookTokensDark(b),
    fonts: buildBookFonts(b),
    config: { brand: brandName, system: `${brandName || 'Meridian'} Design System`, version: brandVersion(branding) },
    designTokens: buildDesignTokens(branding, brandName, knobs, ov),
  })
}
