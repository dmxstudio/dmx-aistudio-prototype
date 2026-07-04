import type { BriefField, BriefSection } from '../data/brief'
import type { BrandSection } from '../data/branding'
import type { UsersSpec } from './usersData'
import type { ArchSpec } from './archData'

// MOCKUP: "Estilo de diseño" (fase 6) — compilador de DIRECCIÓN DE ARTE. NO genera el sitio (eso es el
// Visualizador); APRUEBA una dirección EJECUTABLE. Cara máquina = StyleSpec (style.json) que REFERENCIA
// tokens (DS) / voz (Branding) / rúbrica (Usuario) / estructura (Arquitectura) y NO los redefine. La
// dirección se prueba con un SPECIMEN determinista (styleFromSpec) antes de aprobar. Ver design-style-engine.

export type Ownership = 'editable' | 'derived' | 'patch'
export type DimId =
  | 'density' | 'rhythm' | 'surface' | 'imagery' | 'expressive' // editable aquí
  | 'brandPosture' | 'emotionalTemp' | 'conversionTone'         // derivada (read-only, de aguas arriba)
  | 'typography' | 'color' | 'motion'                           // con-patch (propone al DS)

export const OWNERSHIP: Record<DimId, Ownership> = {
  density: 'editable', rhythm: 'editable', surface: 'editable', imagery: 'editable', expressive: 'editable',
  brandPosture: 'derived', emotionalTemp: 'derived', conversionTone: 'derived',
  typography: 'patch', color: 'patch', motion: 'patch',
}
// Fuente de las dimensiones derivadas (para el tag "de Marca / de Usuario").
export const DERIVED_FROM: Partial<Record<DimId, string>> = { brandPosture: 'brand', emotionalTemp: 'brand', conversionTone: 'user' }

export const EDITABLE_DIMS: DimId[] = ['density', 'rhythm', 'surface', 'imagery', 'expressive']
export const NONEDIT_DIMS: DimId[] = ['typography', 'color', 'motion', 'brandPosture', 'emotionalTemp', 'conversionTone']
export const DIM_IDS: DimId[] = [...EDITABLE_DIMS, ...NONEDIT_DIMS]

// Escala de cada dimensión: value 0..100 → bucket de palabra. (label vive en i18n como style.dim.<id>.)
const DIM_SCALE: Record<DimId, string[]> = {
  density: ['Densa', 'Equilibrada', 'Sparse'],
  rhythm: ['Simétrico', 'Modular', 'Asimétrico', 'Cinemático'],
  surface: ['Plana', 'En capas', 'Táctil', 'Brutalista'],
  imagery: ['Producto', 'Humana', 'Abstracta', 'Editorial'],
  expressive: ['Conservadora', 'Media', 'Expresiva', 'Experimental'],
  brandPosture: ['Institucional', 'Experta', 'Cercana', 'Lujo', 'Disruptiva'],
  emotionalTemp: ['Fría', 'Neutral', 'Cálida'],
  conversionTone: ['Directa', 'Consultiva', 'Aspiracional', 'Premium'],
  typography: ['Funcional', 'Geométrica', 'Humanista', 'Editorial'],
  color: ['Monocromo', 'Contenido', 'Con acento', 'Vibrante'],
  motion: ['Estático', 'Sutil', 'Guiado', 'Inmersivo'],
}
export function dimValueLabel(id: DimId, value: number): string {
  const s = DIM_SCALE[id]
  return s[Math.min(s.length - 1, Math.max(0, Math.floor((value / 100) * s.length)))]
}

export interface LayoutSection { composition: string; scale?: string; density?: string; ctaDensity?: string; imageTreatment?: string; forbidden: string[] }
export interface LayoutGrammar { hero: LayoutSection; section: LayoutSection; card: LayoutSection }
export interface TokenPatch { token: string; current: string; proposed: string; reason: string }

export interface StyleFamily {
  id: string
  name?: string // solo custom (las built-in resuelven su nombre por i18n style.family.<id>)
  dims: Record<DimId, number>
  thesis: string
  principles: string[]
  antiPatterns: string[]
  imagery: string
  motion: string
  layout: LayoutGrammar
}

export interface StyleSpec {
  meta: { project: string; generatedFrom: string }
  mix: { primary: string; secondary?: string; accent?: string }
  dims: Record<DimId, number>
  thesis: string
  principles: string[]
  imagery: string
  motion: string
  antiPatterns: string[]
  layout: LayoutGrammar
  rationale: { sources: string[]; why: string } // trazabilidad — NO entra en la firma
}

// ── Familias (6) = puntos nombrados en el espacio de dimensiones ─────────────
const FORBIDDEN_BASE = ['hero SaaS centrado', 'cluster de cards genérico', 'gradientes azul-morado']
const dimsOf = (p: Partial<Record<DimId, number>>): Record<DimId, number> =>
  DIM_IDS.reduce((o, id) => ({ ...o, [id]: p[id] ?? 50 }), {} as Record<DimId, number>)

export const FAMILIES: Record<string, StyleFamily> = {
  modern: {
    id: 'modern', dims: dimsOf({ density: 70, rhythm: 30, surface: 20, imagery: 30, expressive: 25, typography: 45, color: 30, motion: 35, brandPosture: 40, emotionalTemp: 45, conversionTone: 20 }),
    thesis: 'Limpio, espacioso y preciso — la contención antes que la decoración.',
    principles: ['El espacio crea la jerarquía.', 'Tipografía sans nítida, sin ruido gráfico.', 'Un solo acento, usado con parquedad.'],
    antiPatterns: [...FORBIDDEN_BASE, 'demasiados pesos tipográficos'],
    imagery: 'Producto limpio, fondos amplios', motion: 'Sutil, solo de apoyo',
    layout: { hero: { composition: 'centrado sobrio', scale: 'contenida', ctaDensity: 'baja', imageTreatment: 'sin imagen o discreta', forbidden: ['hero SaaS centrado'] }, section: { composition: 'grid modular', density: 'aireada', forbidden: ['cluster de cards genérico'] }, card: { composition: 'borde fino', forbidden: ['sombras pesadas'] } },
  },
  enterprise: {
    id: 'enterprise', dims: dimsOf({ density: 40, rhythm: 25, surface: 45, imagery: 15, expressive: 20, typography: 40, color: 45, motion: 30, brandPosture: 25, emotionalTemp: 35, conversionTone: 30 }),
    thesis: 'Estructurado, confiable y orientado a la conversión — pulido sin ser genérico.',
    principles: ['La estructura comunica confianza.', 'CTA claro, jerarquía de decisión legible.', 'Densidad controlada, no saturada.'],
    antiPatterns: [...FORBIDDEN_BASE, 'dashboards ficticios con datos sin sentido'],
    imagery: 'Producto / UI real, sin stock', motion: 'Guiado, funcional',
    layout: { hero: { composition: 'asimétrico con preview', scale: 'media', ctaDensity: 'alta', imageTreatment: 'producto', forbidden: ['stock genérico'] }, section: { composition: 'grid de contenido', density: 'media', forbidden: ['cluster de cards genérico'] }, card: { composition: 'elevación baja', forbidden: ['glassmorphism gratuito'] } },
  },
  warm: {
    id: 'warm', dims: dimsOf({ density: 55, rhythm: 40, surface: 40, imagery: 55, expressive: 40, typography: 65, color: 55, motion: 40, brandPosture: 55, emotionalTemp: 85, conversionTone: 45 }),
    thesis: 'Cercano, orgánico y humano — cálido sin volverse infantil.',
    principles: ['Formas suaves, mensaje empático.', 'Fotografía honesta, no diversidad cliché.', 'Copy sencillo, directo, con calidez.'],
    antiPatterns: [...FORBIDDEN_BASE, 'clichés de diversidad en fotos de stock'],
    imagery: 'Humana, candid, cálida', motion: 'Sutil, orgánica',
    layout: { hero: { composition: 'imagen humana + texto', scale: 'media', ctaDensity: 'media', imageTreatment: 'candid cálida', forbidden: ['ilustraciones IA genéricas'] }, section: { composition: 'bloques orgánicos', density: 'media', forbidden: ['cluster de cards genérico'] }, card: { composition: 'radio generoso', forbidden: ['sombras duras'] } },
  },
  editorial: {
    id: 'editorial', dims: dimsOf({ density: 78, rhythm: 64, surface: 25, imagery: 80, expressive: 45, typography: 82, color: 30, motion: 28, brandPosture: 70, emotionalTemp: 60, conversionTone: 70 }),
    thesis: 'Editorial, premium, calmado y curado — más cerca de una publicación boutique que de una landing de startup.',
    principles: ['El espacio crea la jerarquía.', 'Un gesto memorable por página.', 'Tipografía fuerte, no ruido gráfico.', 'CTA visible pero no agresivo.'],
    antiPatterns: [...FORBIDDEN_BASE, 'cards decorativas sin intención', 'exceso de esquinas redondeadas'],
    imagery: 'Editorial, fotografía de autor', motion: 'Sutil: fade y reveal',
    layout: { hero: { composition: 'asimétrico editorial', scale: 'dramática', ctaDensity: 'baja', imageTreatment: 'full-bleed u offset', forbidden: ['hero SaaS centrado', 'cluster de cards genérico'] }, section: { composition: 'grid editorial asimétrico', density: 'aireada', forbidden: ['carrusel innecesario'] }, card: { composition: 'borde fino, mucho aire', forbidden: ['sombras pesadas', 'radios exagerados'] } },
  },
  expressive: {
    id: 'expressive', dims: dimsOf({ density: 45, rhythm: 75, surface: 60, imagery: 60, expressive: 82, typography: 70, color: 75, motion: 60, brandPosture: 80, emotionalTemp: 60, conversionTone: 55 }),
    thesis: 'Audaz, memorable y con dirección de arte — un gancho visual distintivo.',
    principles: ['Contraste fuerte, composición inusual.', 'Tipografía display como protagonista.', 'Un hook visual que se recuerda.'],
    antiPatterns: [...FORBIDDEN_BASE, 'blobs 3D aleatorios'],
    imagery: 'Art-directed, objetos y 3D con intención', motion: 'Guiado, con carácter',
    layout: { hero: { composition: 'asimétrico audaz', scale: 'oversize', ctaDensity: 'media', imageTreatment: 'objeto/3D dirigido', forbidden: ['hero SaaS centrado'] }, section: { composition: 'composición inusual', density: 'contrastada', forbidden: ['cluster de cards genérico'] }, card: { composition: 'contraste fuerte', forbidden: ['plantilla de startup'] } },
  },
  immersive: {
    id: 'immersive', dims: dimsOf({ density: 40, rhythm: 85, surface: 70, imagery: 70, expressive: 75, typography: 60, color: 65, motion: 90, brandPosture: 65, emotionalTemp: 55, conversionTone: 60 }),
    thesis: 'Cinemático e interactivo — narrativa por capas y transiciones dramáticas.',
    principles: ['El movimiento cuenta la historia.', 'Capas y profundidad deliberadas.', 'Scroll como narrativa, no como truco.'],
    antiPatterns: [...FORBIDDEN_BASE, 'animación gratuita que distrae de la conversión'],
    imagery: 'Cinemática, WebGL/3D', motion: 'Inmersivo, por capas',
    layout: { hero: { composition: 'cinemático a pantalla', scale: 'oversize', ctaDensity: 'baja', imageTreatment: 'full-bleed animado', forbidden: ['hero SaaS centrado'] }, section: { composition: 'storytelling por capas', density: 'espaciada', forbidden: ['cluster de cards genérico'] }, card: { composition: 'profundidad', forbidden: ['plantilla de startup'] } },
  },
  // ── House styles curados (vertical × estilo) — parte del scope base del estudio ────────────
  editorialHospitality: {
    id: 'editorialHospitality', dims: dimsOf({ density: 74, rhythm: 60, surface: 28, imagery: 78, expressive: 46, typography: 80, color: 34, motion: 30, brandPosture: 72, emotionalTemp: 80, conversionTone: 68 }),
    thesis: 'Hospitalidad editorial — cálida, curada y premium, como una revista de viaje boutique.',
    principles: ['Fotografía de autor, sentido de lugar.', 'Titulares editoriales con mucho aire.', 'La reserva es un gesto tranquilo, no un grito.'],
    antiPatterns: [...FORBIDDEN_BASE, 'widget de reservas genérico', 'stock de hotel corporativo'],
    imagery: 'Editorial cálida, lugar y detalle', motion: 'Sutil: fade y parallax leve',
    layout: { hero: { composition: 'imagen full-bleed + titular editorial', scale: 'dramática', ctaDensity: 'baja', imageTreatment: 'full-bleed', forbidden: ['hero SaaS centrado'] }, section: { composition: 'bloques asimétricos con foto', density: 'aireada', forbidden: ['cluster de cards genérico'] }, card: { composition: 'borde fino, foto protagonista', forbidden: ['sombras pesadas'] } },
  },
  humanistSaas: {
    id: 'humanistSaas', dims: dimsOf({ density: 50, rhythm: 42, surface: 40, imagery: 55, expressive: 36, typography: 62, color: 46, motion: 36, brandPosture: 55, emotionalTemp: 72, conversionTone: 42 }),
    thesis: 'SaaS con rostro humano — confiable y claro, pero cálido, no corporativo genérico.',
    principles: ['Producto real, no dashboards ficticios.', 'Copy directo y empático.', 'Calidez en las formas, rigor en la jerarquía.'],
    antiPatterns: [...FORBIDDEN_BASE, 'dashboards ficticios', 'ilustraciones IA genéricas'],
    imagery: 'Humana + producto real', motion: 'Guiado, sobrio',
    layout: { hero: { composition: 'asimétrico texto + producto', scale: 'media', ctaDensity: 'media', imageTreatment: 'producto real', forbidden: ['stock genérico'] }, section: { composition: 'grid de contenido cálido', density: 'media', forbidden: ['cluster de cards genérico'] }, card: { composition: 'radio suave, elevación baja', forbidden: ['glassmorphism gratuito'] } },
  },
  luxuryCommerce: {
    id: 'luxuryCommerce', dims: dimsOf({ density: 82, rhythm: 62, surface: 34, imagery: 82, expressive: 50, typography: 82, color: 24, motion: 32, brandPosture: 84, emotionalTemp: 54, conversionTone: 80 }),
    thesis: 'Comercio de lujo silencioso — sofisticado, escaso y muy curado; el producto es el héroe.',
    principles: ['Lujo silencioso: menos es más.', 'Producto en primer plano, fondo que respira.', 'Tipografía de alto contraste, paleta contenida.'],
    antiPatterns: [...FORBIDDEN_BASE, 'descuentos ruidosos', 'grids de producto apretados'],
    imagery: 'Editorial de producto, mucho aire', motion: 'Mínimo: reveal elegante',
    layout: { hero: { composition: 'producto centrado, aire generoso', scale: 'dramática', ctaDensity: 'baja', imageTreatment: 'producto full-bleed u offset', forbidden: ['hero SaaS centrado'] }, section: { composition: 'grid editorial espacioso', density: 'muy aireada', forbidden: ['grid de producto apretado'] }, card: { composition: 'sin decoración, foto y precio', forbidden: ['badges de descuento'] } },
  },
  institutionalPremium: {
    id: 'institutionalPremium', dims: dimsOf({ density: 44, rhythm: 34, surface: 38, imagery: 40, expressive: 24, typography: 54, color: 40, motion: 26, brandPosture: 20, emotionalTemp: 46, conversionTone: 55 }),
    thesis: 'Institucional premium — solidez y autoridad, con detalle de acabado que evita lo genérico.',
    principles: ['La estructura comunica autoridad.', 'Detalle fino en tipografía y espaciado.', 'Restraint: nada decorativo sin función.'],
    antiPatterns: [...FORBIDDEN_BASE, 'gradientes corporativos', 'iconos genéricos de stock'],
    imagery: 'Documental, arquitectura, retrato sobrio', motion: 'Estático a sutil',
    layout: { hero: { composition: 'simétrico sobrio, titular firme', scale: 'media', ctaDensity: 'media', imageTreatment: 'documental', forbidden: ['gradientes SaaS'] }, section: { composition: 'grid estructurado', density: 'media', forbidden: ['cluster de cards genérico'] }, card: { composition: 'borde definido, jerarquía clara', forbidden: ['sombras difusas'] } },
  },
  experimentalPortfolio: {
    id: 'experimentalPortfolio', dims: dimsOf({ density: 42, rhythm: 84, surface: 66, imagery: 66, expressive: 86, typography: 70, color: 72, motion: 80, brandPosture: 80, emotionalTemp: 55, conversionTone: 44 }),
    thesis: 'Portafolio experimental — art-directed, con carácter y un gancho visual que se recuerda.',
    principles: ['Un gesto audaz que define la página.', 'Tipografía display como protagonista.', 'Composición inusual, tensión controlada.'],
    antiPatterns: [...FORBIDDEN_BASE, 'plantilla de portafolio', 'blobs 3D aleatorios'],
    imagery: 'Art-directed, mixed media', motion: 'Guiado con carácter, transiciones marcadas',
    layout: { hero: { composition: 'oversize asimétrico, hook visual', scale: 'oversize', ctaDensity: 'baja', imageTreatment: 'objeto/media dirigido', forbidden: ['hero SaaS centrado'] }, section: { composition: 'composición libre con tensión', density: 'contrastada', forbidden: ['cluster de cards genérico'] }, card: { composition: 'contraste fuerte, formato variable', forbidden: ['plantilla de startup'] } },
  },
}
export const FAMILY_IDS = Object.keys(FAMILIES)
// La librería de estilos es GLOBAL (un solo taste corpus del estudio, no por-workspace) → id fijo.
export const STYLE_LIB_ID = 'global'

// ── Derivación (determinista) desde los contratos aguas arriba ───────────────
const bval = (sections: { fields: BriefField[] }[], id: string) => sections.flatMap((s) => s.fields).find((f) => f.id === id)?.value?.trim() ?? ''

export function buildStyleSpec(_brief: BriefSection[], branding: BrandSection[], users: UsersSpec | null, arch: ArchSpec | null, projectName: string, forceFamily?: string, families: Record<string, StyleFamily> = FAMILIES): StyleSpec {
  const brf = (id: string) => bval(branding as unknown as { fields: BriefField[] }[], id)
  const signals = `${brf('td-personality')} ${brf('cd-direction')} ${brf('ap-desired')} ${brf('ap-aatext')}`.toLowerCase()
  const warm = /(cálid|calid|humanist|cercan|orgánic|organic)/.test(signals)
  const premium = /(premium|editorial|boutique|curad|sofist|lujo|autor)/.test(signals)
  const bold = /(audaz|expresiv|distint|memorable|bold)/.test(signals)

  let primary: string, secondary: string | undefined, accent: string | undefined
  if (forceFamily && families[forceFamily]) {
    primary = forceFamily
  } else if (premium) {
    primary = 'editorial'; secondary = warm ? 'warm' : undefined; accent = bold ? 'expressive' : undefined
  } else if (warm) {
    primary = 'warm'; secondary = 'editorial'
  } else if (bold) {
    primary = 'expressive'
  } else {
    primary = 'modern'
  }

  const base = families[primary] ?? FAMILIES.modern
  const dims = dimsOf(base.dims) // normaliza: una familia persistida vieja podría no traer las 11 dims
  // La mezcla "nudgea" el punto del primario (no redefine): acento expresivo sube expresividad/ritmo.
  if (accent === 'expressive') { dims.expressive = Math.min(100, dims.expressive + 16); dims.rhythm = Math.min(100, dims.rhythm + 10) }
  if (secondary === 'warm') { dims.emotionalTemp = Math.min(100, dims.emotionalTemp + 14) }

  const sources: string[] = ['brief']
  if (branding.some((s) => s.fields.some((f) => f.status !== 'empty'))) sources.push('branding')
  if (users && users.segments.length) sources.push('users')
  if (arch && arch.pages.length) sources.push('architecture')

  return {
    meta: { project: projectName || 'Proyecto', generatedFrom: 'Brief + Marca + Usuario + Arquitectura' },
    mix: { primary, secondary, accent },
    dims,
    thesis: base.thesis,
    principles: base.principles,
    imagery: base.imagery,
    motion: base.motion,
    antiPatterns: base.antiPatterns,
    layout: base.layout,
    rationale: { sources, why: whyLine(primary, premium) },
  }
}
function whyLine(primary: string, premium: boolean): string {
  if (primary === 'editorial') return premium ? 'la marca pide sentirse premium y curada, no corporativa ni técnica' : 'dirección editorial por defecto'
  if (primary === 'warm') return 'las señales de marca son cálidas y humanas'
  if (primary === 'expressive') return 'la marca busca un gancho audaz y memorable'
  return 'sin señales fuertes de estilo, se parte de un minimalismo neutro'
}

export function emptyStyleSpec(projectName: string): StyleSpec {
  const base = FAMILIES.modern
  return {
    meta: { project: projectName || 'Proyecto', generatedFrom: 'Desde cero' },
    mix: { primary: 'modern' }, dims: { ...base.dims },
    thesis: base.thesis, principles: base.principles, imagery: base.imagery, motion: base.motion,
    antiPatterns: base.antiPatterns, layout: base.layout, rationale: { sources: [], why: 'construido a mano desde cero' },
  }
}

// ── Aprobación por firma (excluye rationale/patches, que son derivados) ───────
export type StyleStatus = 'pending' | 'approved' | 'outdated'
export function styleSignature(spec: StyleSpec): string {
  return JSON.stringify([spec.mix, spec.dims, spec.thesis, spec.principles, spec.imagery, spec.motion, spec.antiPatterns, spec.layout])
}
export function styleStatus(spec: StyleSpec, approvedSig: string): StyleStatus {
  if (!approvedSig) return 'pending'
  return approvedSig === styleSignature(spec) ? 'approved' : 'outdated'
}

// ── tokenPatchProposal: propone (no muta) cambios al DS cuando la dirección los pide ──
export function stylePatches(dims: Record<DimId, number>): TokenPatch[] {
  const out: TokenPatch[] = []
  if (dims.typography >= 74) out.push({ token: 'typography.heading.scale', current: '1.25', proposed: '1.45', reason: 'la dirección editorial pide jerarquía tipográfica más fuerte' })
  if (dims.motion >= 78) out.push({ token: 'motion.duration.base', current: '160ms', proposed: '320ms', reason: 'la dirección inmersiva pide transiciones más largas' })
  if (dims.surface >= 66) out.push({ token: 'elevation.card', current: '0', proposed: '1', reason: 'la dirección en capas/táctil pide elevación en tarjetas' })
  return out
}

// ── Rúbrica V1: 5 ejes hard-gate (0..5). En el mockup son deterministas y plausibles. ──
export interface StyleRubric { brandFit: number; consistency: number; hierarchy: number; genericRisk: number; a11y: number }
export function styleRubric(spec: StyleSpec): StyleRubric {
  const d = spec.dims
  const clamp = (n: number) => Math.max(2, Math.min(5, Math.round(n)))
  // "riesgo de patrón genérico" invertido: más asimetría/expresividad/superficie ⇒ menos genérico ⇒ mejor score.
  const genericRisk = clamp(2.5 + (d.rhythm + d.expressive + d.surface) / 150)
  const hierarchy = clamp(3 + (d.typography + d.expressive) / 100)
  const brandFit = clamp(spec.mix.secondary || spec.mix.accent ? 5 : 4)
  return { brandFit, consistency: 5, hierarchy, genericRisk, a11y: 5 }
}

// ── Aplicador determinista: dims → estilo concreto para el SPECIMEN (studio-render, sin agente) ──
export interface AppliedStyle {
  bg: string; surface: string; text: string; muted: string; line: string; accent: string
  headlineFamily: string; bodyFamily: string; headlineSize: number; headlineWeight: number; tracking: string
  radius: number; pad: number; gap: number; asym: boolean; ctaStyle: 'solid' | 'outline' | 'text'
}
// tokens = feed plano del DS (buildBookTokens): accent + fuentes reales de la marca. Los neutros base
// se mantienen (viven en el CSS del template DS). Sin tokens → base + heurística.
export function styleFromSpec(spec: StyleSpec, tokens?: Record<string, string>): AppliedStyle {
  const d = spec.dims
  const rawAccent = tokens?.['--accent'] ?? ''
  const accent = /^#[0-9a-f]{6}$/i.test(rawAccent) ? rawAccent : '#8B5E3C'
  const serif = d.typography >= 58
  const sparse = d.density >= 55
  return {
    bg: '#F7F4EE', surface: '#FFFFFF', text: '#1B1712', muted: '#6E675C', line: '#E9E3D8', accent,
    headlineFamily: tokens?.['--font-display'] || (serif ? 'Georgia, "Times New Roman", serif' : 'Inter, system-ui, sans-serif'),
    bodyFamily: tokens?.['--font-text'] || 'Inter, system-ui, sans-serif',
    headlineSize: Math.round(24 + (d.expressive / 100) * 22 + (sparse ? 4 : 0)),
    headlineWeight: serif ? 500 : 600,
    tracking: serif ? '-0.02em' : '-0.01em',
    radius: d.surface < 45 ? 4 : Math.round(6 + (d.surface / 100) * 10),
    pad: Math.round(18 + (d.density / 100) * 22),
    gap: Math.round(10 + (d.density / 100) * 14),
    asym: d.rhythm >= 52,
    // tono de conversión: Directa (bajo)→CTA sólido fuerte · medio→outline · Premium (alto)→text-first mínimo.
    ctaStyle: d.conversionTone >= 66 ? 'text' : d.conversionTone >= 33 ? 'outline' : 'solid',
  }
}

// ── Contenido del specimen: copy + estructura REALES de Arquitectura (fallback canónico) ─────
export interface SpecimenContent { eyebrow: string; headline: string; sub: string; cta: string; sectionHead: string; sectionBody: string; cards: { h: string; p: string }[] }
const CANON_SPECIMEN: SpecimenContent = {
  eyebrow: 'Dirección de arte',
  headline: 'Una web que se siente diseñada, no plantillada.',
  sub: 'El estilo se aplica a secciones reales antes de generar el sitio.',
  cta: 'Empezar',
  sectionHead: 'Origen trazable', sectionBody: 'Cada decisión visual viene del Brief, la Marca y el Usuario — no de un prompt vacío.',
  cards: [{ h: 'Jerarquía', p: 'El espacio y el tipo mandan.' }, { h: 'Ritmo', p: 'Composición con intención.' }, { h: 'Intención', p: 'Un gesto memorable por página.' }],
}
// Contenido AUTO-DESCRIPTIVO para las cards de la librería/picker: el nombre del estilo ES el titular y
// la tesis el párrafo → la card se describe a sí misma dentro del propio specimen.
export function familyCardContent(eyebrow: string, name: string, thesis: string): SpecimenContent {
  return {
    eyebrow, headline: name, sub: thesis || CANON_SPECIMEN.sub, cta: '', // sin CTA: la card se recorta a 200px y un botón a medias se ve como glitch; las acciones viven en la barra

    sectionHead: CANON_SPECIMEN.sectionHead, sectionBody: thesis || CANON_SPECIMEN.sectionBody, cards: CANON_SPECIMEN.cards,
  }
}
export function specimenContent(arch: ArchSpec | null, projectName: string): SpecimenContent {
  if (!arch || !arch.pages.length) return { ...CANON_SPECIMEN, eyebrow: projectName || CANON_SPECIMEN.eyebrow }
  const home = arch.pages.find((p) => p.id === 'home') ?? arch.pages[0]
  const others = arch.pages.filter((p) => p.id !== home.id)
  const sec = others[0]
  const cardPages = others.slice(1, 4)
  return {
    eyebrow: projectName || CANON_SPECIMEN.eyebrow,
    headline: home.copy?.headline || CANON_SPECIMEN.headline,
    sub: home.copy?.sub || CANON_SPECIMEN.sub,
    cta: home.copy?.cta || CANON_SPECIMEN.cta,
    sectionHead: sec?.name || CANON_SPECIMEN.sectionHead,
    sectionBody: sec?.purpose || CANON_SPECIMEN.sectionBody,
    cards: cardPages.length ? cardPages.map((p) => ({ h: p.name, p: p.purpose || '' })) : CANON_SPECIMEN.cards,
  }
}

// ── Librería de estilos (house styles del estudio, nivel workspace = taste corpus) ─────
// Familia en blanco para "Nueva familia" (dims neutras, anti-patterns base, layout por defecto).
export function emptyFamily(id: string, name: string): StyleFamily {
  // structuredClone del layout: nunca aliasar la constante built-in (una familia custom no debe poder mutarla).
  return { id, name, dims: dimsOf({}), thesis: '', principles: [], antiPatterns: [...FORBIDDEN_BASE], imagery: '', motion: '', layout: structuredClone(FAMILIES.modern.layout) }
}
// Envuelve una familia en una StyleSpec para previsualizarla (specimen) fuera de un proyecto.
export function familyToSpec(fam: StyleFamily, projectName = ''): StyleSpec {
  // Backfill como dimsOf: una familia persistida (DURABLE) bajo un shape viejo puede no traer layout/
  // principles/antiPatterns → el render (spec.layout.hero, .map) reventaría. dato deserializado = frontera.
  return {
    meta: { project: projectName || 'Proyecto', generatedFrom: 'Familia' },
    mix: { primary: fam.id }, dims: dimsOf(fam.dims),
    thesis: fam.thesis ?? '', principles: fam.principles ?? [], imagery: fam.imagery ?? '', motion: fam.motion ?? '',
    antiPatterns: fam.antiPatterns ?? [], layout: fam.layout ?? structuredClone(FAMILIES.modern.layout), rationale: { sources: [], why: '' },
  }
}

// DESIGN.md portable de una StyleSpec (para copiar/descargar en la Prueba de dirección — patrón getdesign.md).
export function designMd(spec: StyleSpec, applied: AppliedStyle, name: string): string {
  const L = (id: DimId) => `- ${id}: ${dimValueLabel(id, spec.dims[id])}`
  const sec = (s: LayoutSection) => `${s.composition}${s.forbidden.length ? ` · evita: ${s.forbidden.join(', ')}` : ''}`
  return [
    `# ${name} — DESIGN.md`, '', `> ${spec.thesis || '—'}`, '',
    '## Dirección', `- mezcla: ${[spec.mix.primary, spec.mix.secondary, spec.mix.accent].filter(Boolean).join(' + ')}`,
    ...DIM_IDS.map(L), '',
    '## Color', `- accent: ${applied.accent}`, `- bg: ${applied.bg} · surface: ${applied.surface} · text: ${applied.text} · line: ${applied.line}`, '',
    '## Tipografía', `- display: ${applied.headlineFamily}`, `- body: ${applied.bodyFamily}`, '',
    '## Imagen y motion', `- imagen: ${spec.imagery || '—'}`, `- motion: ${spec.motion || '—'}`, '',
    '## Principios', ...(spec.principles.length ? spec.principles.map((p) => `- ${p}`) : ['- —']), '',
    '## Anti-patterns (no hacer)', ...(spec.antiPatterns.length ? spec.antiPatterns.map((a) => `- ${a}`) : ['- —']), '',
    '## Layout grammar', `- hero: ${sec(spec.layout.hero)}`, `- section: ${sec(spec.layout.section)}`, `- card: ${sec(spec.layout.card)}`, '',
  ].join('\n')
}
