import type { BrandSection } from '../data/branding'
import { slugify } from './slug'

// Generates the brand-book template's i18n override object from panel data. Only the keys we
// can fill today are emitted; everything omitted falls back to the template's bundled demo.
// ponytail: emits ONLY 01-strategic keys we already capture as flat fields. Vision / story /
// milestones / personas / value+trait descriptions need the repeatable groups (next slice).
const split = (s: string) => s.split(/\s*·\s*|\s*,\s*/).map((x) => x.trim()).filter(Boolean)

export function buildBookOverrides(branding: BrandSection[]): Record<string, unknown> {
  const all = branding.flatMap((s) => s.fields)
  const field = (id: string) => all.find((f) => f.id === id)
  const v = (id: string) => field(id)?.value ?? ''
  // Value cards: prefer the structured rows ({name,desc}); fall back to splitting the flat value.
  const valueRows = field('bf-values')?.rows ?? split(v('bf-values')).map((name) => ({ name, desc: '' }))
  const milestones = field('bf-milestones')?.rows ?? [] // {year,event}; the template hardcodes years, so only `event` feeds
  const personas = field('ap-personas')?.rows ?? [] // {name,seg,quote} → user / buyer / proto
  const tone = field('vt-tone-traits')?.rows ?? [] // {trait,is,isnot,ex} → tone-trait cards (02-voice)
  const msgRows = field('msg-hierarchy')?.rows ?? [] // {level,text} → message hierarchy (02-voice)
  const grammar = field('vt-grammar')?.rows ?? [] // {rule,example,convention} → grammar table (02-voice)
  const bpTraits = split(v('bp-traits')) // personality traits → 01-strategic personality chips (pt1..3)

  const p3: Record<string, string> = {
    purposeText: v('bf-purpose'),
    visionText: v('bf-vision'),
    missionText: v('bf-mission'),
    storyText: v('bf-story'),
    posText: v('ps-statement'),
    vpText: v('ps-uvp'),
    diffText: v('ps-diff'), // §1.3 positioning · differentiators

    promiseText: v('bf-promise'),
    archetype: v('bp-archetype'), // §1.6 archetype NAME (title)
    archetypeText: v('bp-archetype-desc'), // §1.6 archetype DESCRIPTION (body)
    aaName: v('ap-aaname'),
    aaText: v('ap-aatext'),
    v1: valueRows[0]?.name ?? '',
    v1d: valueRows[0]?.desc ?? '',
    v2: valueRows[1]?.name ?? '',
    v2d: valueRows[1]?.desc ?? '',
    v3: valueRows[2]?.name ?? '',
    v3d: valueRows[2]?.desc ?? '',
    ms1: milestones[0]?.event ?? '',
    ms2: milestones[1]?.event ?? '',
    ms3: milestones[2]?.event ?? '',
    p1name: personas[0]?.name ?? '',
    p1seg: personas[0]?.seg ?? '',
    p1quote: personas[0]?.quote ?? '',
    pbName: personas[1]?.name ?? '',
    pbSeg: personas[1]?.seg ?? '',
    pbQuote: personas[1]?.quote ?? '',
    p2name: personas[2]?.name ?? '',
    p2seg: personas[2]?.seg ?? '',
    p2quote: personas[2]?.quote ?? '',
    // Persona TYPE chips (§1.5) — per-card slots fed from each row's `ptype` select
    // (typeUser/typeBuyer/typeProto are the template's positional slot ids for cards 1/2/3).
    typeUser: personas[0]?.ptype ?? '',
    typeBuyer: personas[1]?.ptype ?? '',
    typeProto: personas[2]?.ptype ?? '',
    // 02-voice: writing-principle cards — name + is / isn't / example all from vt-tone-traits rows
    // (was pulling the name from bp-traits, a different field/section → cards could misalign).
    t1: tone[0]?.trait ?? '',
    t2: tone[1]?.trait ?? '',
    t3: tone[2]?.trait ?? '',
    // 01-strategic personality chips (§1.6) — own keys from bp-traits (personality), NOT the voice
    // traits above; the two shared p3.t1..3 before, so personality showed the voice values.
    pt1: bpTraits[0] ?? '',
    pt2: bpTraits[1] ?? '',
    pt3: bpTraits[2] ?? '',
    voiceDef: v('vt-voicedef'),
    toneDef: v('vt-tonedef'),
    baOn: v('vt-example-on'),
    baOff: v('vt-example-off'),
    // 02-voice 2.6 naming/tagline/CTA — msg-cta is a "·"-list → one chip each (§2.6 has 3 chips)
    namingStatement: v('msg-core'),
    namingCta: split(v('msg-cta'))[0] ?? '',
    namingCta2: split(v('msg-cta'))[1] ?? '',
    namingCta3: split(v('msg-cta'))[2] ?? '',
    // 05-resources §5.3 governance (owner / contact / approvals / review cycle)
    ownerVal: v('gov-owner'),
    contactVal: v('gov-contact'),
    approvalsVal: v('gov-approvals'),
    reviewVal: v('gov-review'),
    // §5.2 Legal: aviso + registro declarados y LICENCIAS compuestas por el sistema (las fuentes
    // vienen de Google Fonts —OFL— y la licencia de iconos se conoce por el proveedor declarado).
    tmNote: (() => {
      const ICON_LICENSES: Record<string, string> = {
        Tabler: 'MIT',
        Lucide: 'ISC',
        Heroicons: 'MIT',
        'Bootstrap Icons': 'MIT',
        'Remix Icon': 'Apache 2.0',
      }
      const parts = [
        [v('legal-notice'), v('legal-entity') && `Titular: ${v('legal-entity')}`, v('legal-tm')].filter(Boolean).join(' · '),
        'Tipografías: Google Fonts (licencia OFL).',
        ICON_LICENSES[v('ico-provider')] ? `Iconos: ${v('ico-provider')} (${ICON_LICENSES[v('ico-provider')]}).` : '',
      ].filter(Boolean)
      // Nunca vacío (la línea de Google Fonts es constante): siempre sustituye la nota demo.
      return parts.join(' ')
    })(),
    t1is: tone[0]?.is ?? '',
    t1not: tone[0]?.isnot ?? '',
    t1ex: tone[0]?.ex ?? '',
    t2is: tone[1]?.is ?? '',
    t2not: tone[1]?.isnot ?? '',
    t2ex: tone[1]?.ex ?? '',
    t3is: tone[2]?.is ?? '',
    t3not: tone[2]?.isnot ?? '',
    t3ex: tone[2]?.ex ?? '',
  }
  msgRows.slice(0, 3).forEach((r, i) => {
    p3[`msgL${i}`] = r.level ?? ''
    p3[`msgL${i}t`] = r.text ?? ''
  })
  grammar.slice(0, 5).forEach((r, i) => {
    const n = i + 1
    p3[`gr${n}n`] = r.rule ?? ''
    p3[`gr${n}e`] = r.example ?? ''
    p3[`gr${n}c`] = r.convention ?? ''
  })

  // Other book namespaces (index cover + 03-visual). i18n.js deepMerges, so only these keys
  // override; the rest of each namespace stays the bundled demo copy. Populated admin fields that
  // previously fed NOTHING on those pages now surface here.
  const home: Record<string, string> = {
    tagline: v('msg-core'), // cover tagline ← core message
    lead: v('ps-statement'), // cover lead ← positioning statement
  }
  const purpose: Record<string, string> = {
    color: v('cd-direction'),
    typography: v('td-personality'),
    imagery: v('img-treatment'),
    grid: v('vi-grid'),
    accessibility: v('acc-req'),
  }
  const viz: Record<string, string> = {
    clearspaceNote: v('logo-clearspace'),
    iconsNote: [v('ico-provider'), v('ico-style')].filter(Boolean).join(' · '), // "Tabler · Lineal · 1.75px"
    motionNote: [v('mo-personality'), v('mo-duration'), v('mo-easing')].filter(Boolean).join(' · '),
    darkNote: v('cd-dark'),
    // §3.6 callout: nivel declarado + contraste mínimo; §3.10: dirección de ilustración.
    a11yNote: [v('acc-req'), v('cd-contrast')].filter(Boolean).join(' · '),
    illNote: v('ill-style'),
    geNote: v('ge-style'), // §3.11 nota de dirección gráfica
    chartNote: v('dv-style'), // §3.14 dirección de dataviz
    sonicNote: v('sonic-style'), // §3.15 dirección sonora
  }
  // §3.12: labels del diagrama derivados de las decisiones de layout.
  const gCols = +(v('grid-columns').match(/\d+/)?.[0] ?? 0)
  const gBase = +(v('grid-spacing').match(/\d+/)?.[0] ?? 0)
  if (gCols) viz.columns = `${gCols} columnas · web`
  if (gBase) viz.spacingScale = `Escala de espaciado (${gBase} pt)`
  // dm-accent is a bare hex by contract; the guide's §3.7 callout is a prose slot, so compose a
  // sentence around it (a non-hex legacy value passes through untouched).
  const dmA = v('dm-accent')
  const dm: Record<string, string> = {
    accentNote: /^#?[0-9a-f]{6}$/i.test(dmA)
      ? `En modo oscuro el acento pasa a ${dmA.startsWith('#') ? dmA : `#${dmA}`}; la rampa de rol se re-mapea para mantener el contraste (≥4.5:1).`
      : dmA,
    surfNote: v('dm-surface'),
    contrastNote: v('cd-contrast'),
  }
  // §3.7 demo captions hardcode the demo hexes ("Acento #4F6FEE", "#2348E0 vibra…"); the recolor
  // sweep repaints the visuals but i18n writes these AFTER it — so recompose them with the
  // brand's actual accents. No brand hex → keys omitted → template demo copy.
  const bHexRaw = v('cd-brand-hex').trim()
  const bHex = /^#?[0-9a-f]{6}$/i.test(bHexRaw) ? (bHexRaw.startsWith('#') ? bHexRaw : `#${bHexRaw}`) : ''
  if (bHex) {
    const dkTokens = buildBookTokensDark(branding)
    const dAcc = /^#?[0-9a-f]{6}$/i.test(dmA) ? (dmA.startsWith('#') ? dmA : `#${dmA}`) : (dkTokens['--accent'] ?? '')
    const dInk = dkTokens['--accent-ink'] ?? ''
    if (dAcc) {
      dm.do3 = `Acento ${dAcc}`
      dm.accentBad = `${bHex} vibra sobre oscuro`
      dm.accentGood = `${dAcc} se lee bien`
      if (dInk) dm.e4 = `El acento saturado pierde contraste y vibra sobre oscuro. Súbelo a ${dAcc} (rellenos) y ${dInk} (texto/links, ≥4.5:1).`
    }
  }
  // 02-voice §2.8 declared format conventions (the rows above the matrix).
  const fmt: Record<string, string> = {
    decLocales: v('fmt-locales'),
    decDate: v('fmt-date'),
    decTime: v('fmt-time'),
    decCurrency: v('fmt-currency'),
    decStorage: v('fmt-storage'),
  }
  // §2.8 example matrix — DERIVED with Intl from the declared conventions (locales, clock,
  // currency) over a fixed sample instant, so the visible examples can never drift from the
  // admin. Rows that are standards/typography (range, phone, units) stay template reference.
  const locs = split(v('fmt-locales')).slice(0, 2)
  if (locs.length === 2) {
    const sample = new Date(2026, 5, 12, 14, 30)
    const hour12 = /12\s*h/i.test(v('fmt-time'))
    const cur = (v('fmt-currency').match(/[A-Z]{3}/) || [])[0]
    if (cur) fmt.mCurrencyData = `1234.50 ${cur}` // the ISO data column follows the declared code too
    locs.forEach((loc, i) => {
      const n = i + 1
      const f = (fn: () => string) => {
        try {
          return fn()
        } catch {
          return ''
        }
      }
      fmt[`loc${n}`] = loc
      fmt[`mDateLong${n}`] = f(() => new Intl.DateTimeFormat(loc, { dateStyle: 'long' }).format(sample))
      fmt[`mDateShort${n}`] = f(() => new Intl.DateTimeFormat(loc, { dateStyle: 'short' }).format(sample))
      fmt[`mTime${n}`] = f(() => new Intl.DateTimeFormat(loc, { timeStyle: 'short', hour12 }).format(sample))
      fmt[`mDatetime${n}`] = f(() => new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeStyle: 'short', hour12 }).format(sample))
      fmt[`mNumber${n}`] = f(() => new Intl.NumberFormat(loc).format(1234567.89))
      fmt[`mCurrency${n}`] = cur ? f(() => new Intl.NumberFormat(loc, { style: 'currency', currency: cur }).format(1234.5)) : ''
      fmt[`mPercent${n}`] = f(() => new Intl.NumberFormat(loc, { style: 'percent' }).format(0.5))
      fmt[`mRelative${n}`] = f(() => new Intl.RelativeTimeFormat(loc, { numeric: 'always' }).format(-2, 'day'))
    })
  }

  // Drop empties so they fall back to the bundled demo instead of blanking the template.
  for (const obj of [p3, home, purpose, viz, dm, fmt]) for (const k of Object.keys(obj)) if (!obj[k]) delete obj[k]

  return { p3, home, purpose, viz, dm, fmt }
}

// --- Visual tokens (03-visual): the template's colors live in CSS vars + hardcoded hex, not
// i18n. So we generate a brand color scale from one captured hex and inject it as CSS custom
// properties (the book's <head> applies them on :root). One hex → recolors the whole book chrome.
function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    h = (max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60
  }
  return [h, s, l]
}
function hslToHex(h: number, s: number, l: number): string {
  l = Math.max(0, Math.min(1, l))
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

// Which font roles the brand declares (td-direction multiselect: Display/Texto/Mono). A role
// left unselected is excluded from tokens, webfonts, names and tokens.json, and the guide hides
// its specimen. Nothing declared → all roles (template default; never hide everything).
const FONT_ROLE_KEYS = [
  ['Display', 'display'],
  ['Texto', 'text'],
  ['Mono', 'mono'],
] as const
export function fontRolesOf(branding: BrandSection[]): string[] {
  const raw = branding.flatMap((s) => s.fields).find((f) => f.id === 'td-direction')?.value ?? ''
  const parts = raw.split(/\s*·\s*|\s*,\s*/).map((p) => p.trim())
  const roles = FONT_ROLE_KEYS.filter(([es]) => parts.includes(es)).map(([, key]) => key)
  return roles.length ? roles : ['display', 'text', 'mono']
}

// ponytail: a simple fixed lightness ramp (50→900) anchored on the brand hue/sat. Good enough
// for a mockup; swap for a perceptual scale (OKLCH) if the gradients ever look off.
export function buildBookTokens(branding: BrandSection[]): Record<string, string> {
  const all = branding.flatMap((s) => s.fields)
  const v = (id: string) => all.find((f) => f.id === id)?.value?.trim() ?? ''
  const t: Record<string, string> = {}

  // Color: a brand scale generated from one captured hex.
  const hsl = hexToHsl(v('cd-brand-hex'))
  if (hsl) {
    const [h, s, base] = hsl
    const ramp: Record<string, number> = {
      '50': 0.965, '100': 0.92, '200': 0.84, '300': 0.72, '400': 0.6,
      '500': base,
      '600': Math.max(0.3, base - 0.12), '700': Math.max(0.24, base - 0.22),
      '800': Math.max(0.18, base - 0.3), '900': Math.max(0.13, base - 0.4),
    }
    for (const step in ramp) t[`--brand-${step}`] = hslToHex(h, s, ramp[step])
    t['--brand'] = t['--brand-500']
    t['--brand-ink'] = t['--brand-700']
    t['--accent'] = t['--brand-500']
    t['--accent-ink'] = t['--brand-700']
  }

  // Type: the brand's font families, only for the roles td-direction declares (the webfonts are
  // loaded separately, see buildBookFonts).
  const roles = fontRolesOf(branding)
  if (roles.includes('display') && v('font-display')) t['--font-display'] = `'${v('font-display')}', system-ui, sans-serif`
  if (roles.includes('text') && v('font-text')) t['--font-text'] = `'${v('font-text')}', system-ui, sans-serif`
  if (roles.includes('mono') && v('font-mono')) t['--font-mono'] = `'${v('font-mono')}', ui-monospace, monospace`

  return t
}

// Dark-theme overrides for the injected brand tokens. The template's own dark block remaps the
// ramp (tokens.css :root[data-theme="dark"]: lightened accent, translucent tint surfaces, light
// inks) but our inline-style injection outranks CSS — so without this set, dark mode kept the
// opaque LIGHT ramp and light-pinned surfaces (e.g. the .voice card) went light-on-light.
export function buildBookTokensDark(branding: BrandSection[]): Record<string, string> {
  const all = branding.flatMap((s) => s.fields)
  const hsl = hexToHsl(all.find((f) => f.id === 'cd-brand-hex')?.value?.trim() ?? '')
  if (!hsl) return {}
  const [h, s] = hsl
  const rgba = (hx: string, a: number) => {
    const n = parseInt(hx.slice(1), 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
  }
  const l400 = hslToHex(h, s, 0.6)
  const l300 = hslToHex(h, s, 0.72)
  return {
    '--brand': l400,
    '--brand-50': rgba(l400, 0.16),
    '--brand-100': rgba(l400, 0.32),
    '--brand-200': rgba(l300, 0.45),
    '--brand-600': hslToHex(h, s, 0.68),
    '--brand-700': hslToHex(h, s, 0.84),
    '--accent': l400,
    '--accent-ink': l300,
  }
}

// The brand's font families to load (Google Fonts) so --font-* actually renders — declared roles only.
export function buildBookFonts(branding: BrandSection[]): string[] {
  const all = branding.flatMap((s) => s.fields)
  const v = (id: string) => all.find((f) => f.id === id)?.value?.trim() ?? ''
  const roles = fontRolesOf(branding)
  return [
    ...new Set(
      [
        roles.includes('display') ? v('font-display') : '',
        roles.includes('text') ? v('font-text') : '',
        roles.includes('mono') ? v('font-mono') : '',
      ].filter(Boolean),
    ),
  ]
}

// A simple monogram mark (rounded square + initial in the brand color) for brands without a
// captured logo SVG — so every brand gets a distinct mark without authoring an asset.
function generateMonogram(name: string, hex: string): string {
  const initial = (name.trim()[0] ?? '?').toUpperCase()
  const fill = /^#[0-9a-f]{6}$/i.test(hex.trim()) ? hex.trim() : '#2348E0'
  return `<svg class="mk" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="9" fill="${fill}"/><text x="20" y="21" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="700" fill="#fff">${initial}</text></svg>`
}

// Brand identity overrides merged into window.MERIDIAN (config.js) per brand: name + logo mark.
// A captured `logo-svg` wins (keeps a brand's real symbol); otherwise a monogram is generated.
export function buildBookConfig(branding: BrandSection[], brandName: string): Record<string, string> {
  const all = branding.flatMap((s) => s.fields)
  const raw = all.find((f) => f.id === 'logo-svg')?.value?.trim() ?? ''
  const isMarkup = raw.startsWith('<svg')
  const hex = all.find((f) => f.id === 'cd-brand-hex')?.value?.trim() ?? ''
  // Símbolo accepts SVG markup (legacy seeds — integrable/recolorable) or an uploaded image
  // (data-URL / path → the book swaps inline marks for <img> via markImg). No symbol → monogram.
  const cfg: Record<string, string> = { mark: isMarkup ? raw : generateMonogram(brandName, hex) }
  if (raw && !isMarkup) cfg.markImg = raw
  if (brandName) cfg.brand = brandName
  // Versión de la marca = la de la ÚLTIMA entrada del changelog (§5.4) → portada y pie del manual.
  // El año sale de la FECHA de esa entrada (no de «hoy»): la meta es de publicación, no de render.
  const lastEntry = [...(all.find((f) => f.id === 'ver-log')?.rows ?? [])].reverse().find((r) => (r.ver ?? '').trim())
  const ver = lastEntry?.ver?.trim() ?? ''
  const verYear = /(\d{4})/.exec(lastEntry?.date ?? '')?.[1] ?? String(new Date().getFullYear())
  if (ver) cfg.version = `${ver} · ${verYear}`
  return cfg
}

// Per-brand downloadable artifacts for 05-resources (the template ships static Meridian files).
// Each item carries a `match` suffix the book uses to find the matching <a download> link and swap
// its href for a generated Blob. Only the panel-derivable assets are emitted here.
type Download = { match: string; name: string; mime: string; content: string }
export function buildBookDownloads(branding: BrandSection[], brandName: string): Download[] {
  const all = branding.flatMap((s) => s.fields)
  const v = (id: string) => all.find((f) => f.id === id)?.value?.trim() ?? ''
  const slug = slugify(brandName) || 'brand'
  const tokens = buildBookTokens(branding)
  const palette = (all.find((f) => f.id === 'cd-palette')?.rows ?? []) as Array<Record<string, string>>
  // The downloadable logo.svg needs SVG markup: uploaded image symbols fall back to the monogram.
  const mark = v('logo-svg').startsWith('<svg') ? v('logo-svg') : generateMonogram(brandName, v('cd-brand-hex'))

  const scale: Record<string, string> = {}
  for (const k in tokens) if (/^--brand-\d+$/.test(k)) scale[k.replace('--brand-', '')] = tokens[k]

  const semantic = (all.find((f) => f.id === 'cd-semantic')?.rows ?? []) as Array<Record<string, string>>
  const colors = {
    brand: brandName,
    primary: v('cd-brand-hex') || tokens['--brand'] || '',
    scale,
    palette: palette.map((p) => ({ name: p.name, role: p.role, hex: p.hex })),
    semantic: semantic.map((r) => ({ role: r.role, hex: r.hex, use: r.use })),
  }
  const dlRoles = fontRolesOf(branding)
  const tokensJson = {
    $schema: 'https://design-tokens.org',
    color: Object.fromEntries(Object.entries(scale).map(([k, val]) => [`brand-${k}`, { $type: 'color', $value: val }])),
    fontFamily: Object.fromEntries(
      (
        [
          ['display', v('font-display')],
          ['text', v('font-text')],
          ['mono', v('font-mono')],
        ] as const
      )
        .filter(([role]) => dlRoles.includes(role))
        .map(([role, fam]) => [role, { $type: 'fontFamily', $value: fam }]),
    ),
  }

  // voice.md — brand voice as an LLM system prompt, from the 02-voice fields.
  const traitRows = (all.find((f) => f.id === 'vt-tone-traits')?.rows ?? []) as Array<Record<string, string>>
  const md: string[] = [
    `# ${brandName} — brand voice (system prompt)`,
    '',
    `Paste this into the system prompt of any LLM that writes as ${brandName}.`,
    '',
    '---',
    '',
    `You are writing as **${brandName}**.${v('bf-essence') ? ` Brand essence: "${v('bf-essence')}".` : ''}`,
  ]
  if (v('vt-voicedef')) md.push('', `**Voice:** ${v('vt-voicedef')}`)
  if (v('vt-tonedef')) md.push(`**Tone:** ${v('vt-tonedef')}`)
  if (v('vt-principles')) md.push('', '**Principles**', ...split(v('vt-principles')).map((p) => `- ${p}`))
  if (traitRows.length)
    md.push(
      '',
      '**Tone traits**',
      ...traitRows.map(
        (r) => `- **${r.trait}** — ${r.is || ''}${r.isnot ? `, never ${r.isnot}` : ''}${r.ex ? ` · e.g. "${r.ex}"` : ''}`,
      ),
    )
  if (v('vt-formality')) md.push('', `**Formality:** ${v('vt-formality')}`)
  if (v('vt-forbidden')) md.push(`**Avoid:** ${v('vt-forbidden')}`)
  if (v('msg-core')) md.push('', `**Core message:** ${v('msg-core')}`)
  if (v('msg-cta')) md.push(`**CTA language:** ${v('msg-cta')}`)

  // formats.json — locale formatting config captured from the panel's format fields.
  const formats = {
    brand: brandName,
    locales: v('fmt-locales'),
    date: v('fmt-date'),
    time: v('fmt-time'),
    currency: v('fmt-currency'),
    dataStandard: v('fmt-storage'),
  }

  // dark.css — the brand's dark accent (neutrals are standard; the accent is brand-specific).
  const dmAccent = v('dm-accent')
  const darkAccent = /^#?[0-9a-f]{6}$/i.test(dmAccent)
    ? dmAccent.startsWith('#') ? dmAccent : `#${dmAccent}`
    : scale['400'] || scale['500'] || '#4F6FEE'
  const darkCss =
    `/* ${brandName} — dark theme accent (generated from the Branding panel). */\n` +
    `:root[data-theme="dark"] {\n  --accent: ${darkAccent};\n  --accent-ink: ${scale['300'] || darkAccent};\n}\n` +
    (v('dm-surface') ? `\n/* Surfaces & elevation: ${v('dm-surface')} */\n` : '')

  return [
    { match: '-logo.svg', name: `${slug}-logo.svg`, mime: 'image/svg+xml', content: mark },
    { match: '-colors.json', name: `${slug}-colors.json`, mime: 'application/json', content: JSON.stringify(colors, null, 2) },
    { match: '.tokens.json', name: `${slug}.tokens.json`, mime: 'application/json', content: JSON.stringify(tokensJson, null, 2) },
    { match: '-voice.md', name: `${slug}-voice.md`, mime: 'text/markdown', content: md.join('\n') + '\n' },
    { match: '.formats.json', name: `${slug}.formats.json`, mime: 'application/json', content: JSON.stringify(formats, null, 2) },
    { match: '.dark.css', name: `${slug}.dark.css`, mime: 'text/css', content: darkCss },
  ]
}

// §3.2 usage-rule interpretation. Clearspace: the standard options are relative ("½/1×/2× la
// altura…", cap-height ≈ 0.6), resolved against the mark's rendered size in the diagram so the
// dashed frame is faithful to the chosen rule; a custom value paints its screen px (capped so the
// box can't explode). Returns 0 when nothing derivable → the book keeps its template default.
function clearspacePx(raw: string, markPx: number): number {
  if (!raw) return 0
  if (raw.includes('¼')) return Math.round(markPx / 4)
  if (raw.includes('½')) return Math.round(markPx / 2)
  if (raw.includes('2×')) return markPx * 2
  if (raw.includes('1×')) return markPx
  if (/cap/i.test(raw)) return Math.round(markPx * 0.4) // cap-height of the demo wordmark ≈ 0.4× the lockup height
  const px = raw.match(/(\d+(?:\.\d+)?)\s*px/i)
  if (px) return Math.min(120, Math.round(+px[1]))
  const mm = raw.match(/(\d+(?:\.\d+)?)\s*mm/i) // print-only custom still paints on screen (~3.78 px/mm)
  return mm ? Math.min(120, Math.round(+mm[1] * 3.78)) : 0
}

// Min-size "N px pantalla · N mm impreso" → numbers (0 = that half not set).
function pxMm(raw: string): { px: number; mm: number } {
  return {
    px: Math.round(+(raw.match(/(\d+(?:\.\d+)?)\s*px/i)?.[1] ?? 0)),
    mm: +(raw.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[1] ?? 0),
  }
}

// §3.8 icon packs per declared provider. Tabler is the template default (no swap). Webfont
// providers ship CSS + 16 cell classes; Lucide/Heroicons have no webfont → per-icon SVG URLs
// (CDN, verified names) that config.js fetches and inlines so currentColor keeps working.
const ICON_PACKS: Record<string, { css?: string; classes?: string[]; svgBase?: string; names?: string[] } | undefined> = {
  'Bootstrap Icons': {
    css: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    classes: ['bi bi-house', 'bi bi-person', 'bi bi-search', 'bi bi-gear', 'bi bi-bell', 'bi bi-envelope', 'bi bi-calendar', 'bi bi-bar-chart', 'bi bi-folder', 'bi bi-star', 'bi bi-heart', 'bi bi-bookmark', 'bi bi-download', 'bi bi-share', 'bi bi-lock', 'bi bi-globe'],
  },
  'Remix Icon': {
    css: 'https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css',
    classes: ['ri-home-line', 'ri-user-line', 'ri-search-line', 'ri-settings-3-line', 'ri-notification-3-line', 'ri-mail-line', 'ri-calendar-line', 'ri-bar-chart-line', 'ri-folder-line', 'ri-star-line', 'ri-heart-line', 'ri-bookmark-line', 'ri-download-line', 'ri-share-line', 'ri-lock-line', 'ri-global-line'],
  },
  Lucide: {
    svgBase: 'https://cdn.jsdelivr.net/npm/lucide-static@0.462.0/icons/',
    names: ['house', 'user', 'search', 'settings', 'bell', 'mail', 'calendar', 'chart-column', 'folder', 'star', 'heart', 'bookmark', 'download', 'share-2', 'lock', 'globe'],
  },
  Heroicons: {
    svgBase: 'https://cdn.jsdelivr.net/npm/heroicons@2.1.5/24/outline/',
    names: ['home', 'user', 'magnifying-glass', 'cog-6-tooth', 'bell', 'envelope', 'calendar', 'chart-bar', 'folder', 'star', 'heart', 'bookmark', 'arrow-down-tray', 'share', 'lock-closed', 'globe-alt'],
  },
}

// 04 · Aplicaciones: opción canónica del admin → id de sección en 04-applications.html.
const APP_SECTION_IDS: Record<string, string> = {
  'Impresos y papelería': 'print',
  'Digital y web': 'digital',
  'App / UI de producto': 'app-ui',
  'Iconos de app y assets de tienda': 'app-icons',
  'Redes sociales': 'social',
  'Email y firmas': 'email',
  'Presentaciones y documentos': 'presentations',
  'Packaging': 'packaging',
  'Señalética y wayfinding': 'signage',
  'Espacial / retail': 'environmental',
  'Merchandising y apparel': 'merch',
  'Vehículos / rotulación': 'vehicle',
  'Co-branding y alianzas': 'cobranding',
}

// localStorage payload the book reads (?brand=<id>): i18n overrides (es/en) + visual CSS tokens
// + identity config (brand name, logo mark) + per-brand downloads.
export function bookPayload(branding: BrandSection[], brandName = ''): string {
  const ov = buildBookOverrides(branding)
  const fv = (id: string) => branding.flatMap((s) => s.fields).find((f) => f.id === id)?.value?.trim() ?? ''
  const roles = fontRolesOf(branding)
  const palette = branding.flatMap((s) => s.fields).find((f) => f.id === 'cd-palette')?.rows ?? []
  return JSON.stringify({
    es: ov,
    en: ov,
    tokens: buildBookTokens(branding),
    tokensDark: buildBookTokensDark(branding),
    fonts: buildBookFonts(branding),
    // Declared roles only: an unselected role keeps '' so the [data-font] sweep leaves it alone,
    // and fontRoles lets config.js hide its specimen card + scale rows in §3.5.
    fontRoles: roles,
    fontNames: {
      display: roles.includes('display') ? fv('font-display') : '',
      text: roles.includes('text') ? fv('font-text') : '',
      mono: roles.includes('mono') ? fv('font-mono') : '',
    },
    // §3.5 nota "Fuentes complementarias": lista título/familia; la guía NO las carga ni extiende.
    fontExtras: (branding.flatMap((sx) => sx.fields).find((ff) => ff.id === 'font-extra')?.rows ?? [])
      .filter((r) => r.family), // una fila sin familia no anota nada en la guía
    palette,
    config: buildBookConfig(branding, brandName),
    downloads: buildBookDownloads(branding, brandName),
    // Brand imagery → book: photo stages + §3.1 variant tiles + §3.3 primary-logo misuse demos.
    images: {
      photo: fv('img-photo'),
      photo2: fv('img-photo-2'), // §3.9 tiles 2-3: own photo, falling back to photo (tile 1)
      photo3: fv('img-photo-3'),
      logoPrimary: fv('logo-primary'),
      logoStacked: fv('logo-stacked'),
      logoWordmark: fv('logo-wordmark'),
      logoMono: fv('logo-mono'),
      logoInverse: fv('logo-inverse'),
      logoBgPhoto: fv('logo-bg-photo'), // §3.2 "sobre fotografía" tile (placeholder when empty)
    },
    // §3.2 primary-logo usage rules (optional; the guide shows them only when set) + whether a
    // symbol exists at all (wordmark-only brands hide the symbol misuse grid).
    // The numeric companions are the INTERPRETATION the book paints from: relative standards
    // ("1× la altura…") resolve against the mark's rendered size in each diagram (symbol 44px,
    // primary lockup 34px); custom values carry their own px. 0 = not derivable → template default.
    logoUsage: {
      primaryClearspace: fv('logo-primary-clearspace'),
      primaryMinsize: fv('logo-primary-minsize'),
      hasSymbol: !!fv('logo-svg'),
      symbolCsPx: clearspacePx(fv('logo-clearspace'), 44),
      primaryCsPx: clearspacePx(fv('logo-primary-clearspace'), 34),
      symbolMin: pxMm(fv('logo-minsize')),
      primaryMin: pxMm(fv('logo-primary-minsize')),
    },
    // §3.2 "Formatos de archivo": uploaded logo files per format. SVG is system-generated (the
    // '-logo.svg' download); the guide shows ONLY available formats as real download chips.
    logoFiles: {
      png: fv('logo-file-png'),
      eps: fv('logo-file-eps'),
      pdf: fv('logo-file-pdf'),
    },
    // §3.9: los tres primeros estilos nombran los tiles (vacío = captions demo).
    imgStyles: split(fv('img-style') ?? '').slice(0, 3),
    // §3.10/§3.11 son OPCIONALES: sin estilo ni referencias, la guía las oculta; las referencias
    // subidas sustituyen los demos genéricos.
    illStyle: fv('ill-style'),
    illRefs: [fv('ill-ref-1'), fv('ill-ref-2'), fv('ill-ref-3')].filter(Boolean),
    geStyle: fv('ge-style'),
    geRefs: [fv('ge-ref-1'), fv('ge-ref-2'), fv('ge-ref-3')].filter(Boolean),
    // §3.8: grosor de trazo declarado (aplica a los SVGs inline de Lucide/Heroicons).
    // Con varios px en el valor, gana el ÚLTIMO (el clic más reciente del multiselect).
    iconStroke: +((fv('ico-style').match(/[\d.]+(?=\s*px)/g) ?? []).pop() ?? 0),
    // §3.12: el diagrama pinta N columnas y la escala re-etiqueta sus pasos (múltiplos de la base).
    gridCols: +(fv('grid-columns').match(/\d+/)?.[0] ?? 0),
    gridBase: +(fv('grid-spacing').match(/\d+/)?.[0] ?? 0),
    // §3.13: la tabla Entrada/Salida/Énfasis se deriva de la duración base + curva declaradas.
    // ms ANCLADO a la unidad (un "1 segundo" custom no debe volverse 1 ms); una curva
    // cubic-bezier()/steps() escrita literal en "Otro" pasa directo a la tabla.
    motionMs: +(fv('mo-duration').match(/(\d+)\s*ms/i)?.[1] ?? 0),
    motionCurve:
      fv('mo-easing').match(/(cubic-bezier\([^)]*\)|steps\([^)]*\))/i)?.[1] ??
      (/ease-out/i.test(fv('mo-easing'))
        ? 'cubic-bezier(.2,.8,.2,1)'
        : /ease-in-out/i.test(fv('mo-easing'))
          ? 'cubic-bezier(.4,0,.2,1)'
          : /spring/i.test(fv('mo-easing'))
            ? 'cubic-bezier(.34,1.56,.64,1)'
            : /linear/i.test(fv('mo-easing'))
              ? 'linear'
              : ''),
    // §3.14/§3.15 OPCIONALES: sin dirección (ni clips), la guía elimina la sección.
    dvStyle: fv('dv-style'),
    sonicStyle: fv('sonic-style'),
    sonicClips: [fv('sonic-clip-1'), fv('sonic-clip-2'), fv('sonic-clip-3')].filter(Boolean),
    // §3.8: pack del proveedor declarado (null = Tabler/desconocido → grid de plantilla).
    iconPack: ICON_PACKS[fv('ico-provider')] ?? null,
    // 04 · Aplicaciones: ids curados desde "Aplicaciones incluidas", refinados por CONTENIDO
    // (Impresos exige piezas, Social exige redes). Lista vacía → el capítulo entero se oculta.
    apps: split(fv('app-rules') ?? '')
      .map((o) => APP_SECTION_IDS[o] ?? '')
      .filter(Boolean)
      .filter((id) => {
        // Secciones con piezas: sin piezas declaradas, se caen (dirigidas por contenido).
        const req: Record<string, string> = {
          print: 'print-pieces',
          social: 'social-networks',
          presentations: 'pres-pieces',
          packaging: 'pack-pieces',
          signage: 'sign-pieces',
          environmental: 'env-pieces',
          merch: 'merch-pieces',
          vehicle: 'veh-pieces',
        }
        return req[id] ? split(fv(req[id]) ?? '').length > 0 : true
      }),
    // §4.1: piezas con su imagen subida (o mockup del sistema si falta). Hay un slot por opción
    // del catálogo; piezas extra de «Otro» sin slot resuelven a '' (fv de un id inexistente).
    printPieces: split(fv('print-pieces') ?? '').map((name, i) => ({
      name,
      img: fv(`print-img-${i + 1}`),
    })),
    // §4.2: banner social 1200×630 (la guía pinta la zona segura 860×630 encima).
    ogBanner: fv('dig-og'),
    // §4.4: el icono más grande por plataforma; la guía lo aplica a los tamaños listados.
    appIcons: {
      ios: fv('appicon-ios'),
      android: fv('appicon-android'),
      play: fv('appicon-play'),
    },
    // §4.5: redes definidas + plantilla subida por red (un slot por red del catálogo).
    socialNets: split(fv('social-networks') ?? '').map((name, i) => ({
      name,
      img: fv(`social-img-${i + 1}`),
    })),
    // §4.6: teléfono de la firma (también entra al bloque HTML copiable).
    sigPhone: fv('sig-phone'),
    // §5.2: chips legales (nombre+símbolo según registro, y el aviso ©).
    legal: {
      entity: fv('legal-entity'),
      tm: fv('legal-tm'),
      notice: fv('legal-notice'),
    },
    // §5.4: entradas reales del changelog.
    verLog: (branding.flatMap((sx) => sx.fields).find((ff) => ff.id === 'ver-log')?.rows ?? [])
      .filter((r) => (r.ver ?? '').trim() || (r.note ?? '').trim()),
    // §4.7–§4.12: piezas por sección, cada una con su slot de subida (extras de «Otro» con mockup).
    appPieces: Object.fromEntries(
      (
        [
          ['presentations', 'pres'],
          ['packaging', 'pack'],
          ['signage', 'sign'],
          ['environmental', 'env'],
          ['merch', 'merch'],
          ['vehicle', 'veh'],
        ] as const
      ).map(([sec, pre]) => [
        sec,
        split(fv(`${pre}-pieces`) ?? '').map((name, i) => ({
          name,
          img: fv(`${pre}-img-${i + 1}`),
        })),
      ]),
    ),
    // §4.1: especificación Pantone/CMYK; el chip se oculta sin valor.
    printColor: fv('cd-print'),
    // Acento oscuro RESUELTO (mismo criterio que dark.css): dm-accent hex válido, si no la rampa.
    darkAccent: /^#?[0-9a-f]{6}$/i.test(fv('dm-accent'))
      ? (fv('dm-accent').startsWith('#') ? fv('dm-accent') : `#${fv('dm-accent')}`)
      : (buildBookTokensDark(branding)['--accent'] ?? ''),
    // §3.2 curated valid backgrounds (canonical keys; empty/omitted = show all).
    logoBackgrounds: split(fv('logo-backgrounds') ?? '')
      .map((o) => (/claro|light/i.test(o) ? 'light' : /oscuro|dark/i.test(o) ? 'dark' : /marca|brand/i.test(o) ? 'brand' : /foto|photo/i.test(o) ? 'photo' : ''))
      .filter(Boolean),
  })
}
