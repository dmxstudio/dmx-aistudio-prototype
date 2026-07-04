// MOCKUP del modelo de traducción de contenido — SOLO visual, ninguna traducción real corre.
// Ver docs/spec-traduccion-contenido.md. Los estados por campo son deterministas (hash del id)
// para que el chip agregado del hero y los indicadores por campo siempre coincidan.

export type TransState = 'revisado' | 'ia' | 'sin-traducir'

export interface TransSummary {
  total: number // campos con contenido en el idioma de origen
  revisado: number
  ia: number // traducido por IA, sin auditar
  pendiente: number // sin traducir
  done: number // revisado + ia (tienen alguna traducción)
}

const LANG_NAMES: Record<string, { es: string; en: string }> = {
  es: { es: 'Español', en: 'Spanish' },
  en: { es: 'Inglés', en: 'English' },
  pt: { es: 'Portugués', en: 'Portuguese' },
  fr: { es: 'Francés', en: 'French' },
  de: { es: 'Alemán', en: 'German' },
}

// 'es-MX · en-US' → { source: 'es', targets: ['en'] }. El primer locale es el idioma de origen.
export function parseLocales(fmt: string): { source: string; targets: string[] } {
  const codes = fmt
    .split(/\s*·\s*|\s*,\s*/)
    .map((s) => s.trim().split('-')[0].toLowerCase())
    .filter(Boolean)
  const source = codes[0] ?? 'es'
  const targets = [...new Set(codes.slice(1))].filter((c) => c && c !== source)
  return { source, targets }
}

// Estado pseudo-aleatorio pero ESTABLE por (campo, idioma) — mezcla realista para el audit visual.
export function fakeTransState(key: string): TransState {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  const m = h % 100
  return m < 55 ? 'revisado' : m < 80 ? 'ia' : 'sin-traducir'
}

export function summarizeTranslation(ids: string[], lang: string): TransSummary {
  let revisado = 0
  let ia = 0
  let pendiente = 0
  for (const id of ids) {
    const st = fakeTransState(id + ':' + lang)
    if (st === 'revisado') revisado++
    else if (st === 'ia') ia++
    else pendiente++
  }
  return { total: ids.length, revisado, ia, pendiente, done: revisado + ia }
}

export function langLabel(code: string, uiLang: string): string {
  const n = LANG_NAMES[code]
  if (!n) return code.toUpperCase()
  return uiLang.startsWith('en') ? n.en : n.es
}

export const langShort = (code: string): string => code.toUpperCase()
