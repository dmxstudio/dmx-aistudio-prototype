import type { ArchSpec } from './archData'

// MOCKUP: CMS (fase 8) — capa de CONTENIDO. Deriva un MODELO de contenido (tipos + campos) desde la
// Arquitectura (páginas → tipos; copy/propósito → campos) para un headless CMS destino. Cara MÁQUINA =
// cms.json (el esquema). NO guarda contenido real (eso vive en el CMS); define la estructura + el export.

export type FieldType = 'text' | 'richtext' | 'image' | 'number' | 'boolean' | 'date' | 'reference' | 'select'
export const FIELD_TYPES: FieldType[] = ['text', 'richtext', 'image', 'number', 'boolean', 'date', 'reference', 'select']
export type CmsTarget = 'payload' | 'instatic'
export const CMS_TARGETS: CmsTarget[] = ['payload', 'instatic']

// Payload = headless code-first (modela contenido, el sitio lo consume por API → CMS y Publish SEPARADOS).
// Instatic = CMS visual + PUBLISHER (hornea HTML estático con tokens → CMS y deploy casi FUSIONADOS, Publish
// delgado). La plataforma mueve la frontera CMS↔Publicar. Ver memoria cms-panel.
export const PLATFORMS: Record<CmsTarget, { kind: 'headless' | 'publisher'; file: string }> = {
  payload: { kind: 'headless', file: 'payload.config.json' },
  instatic: { kind: 'publisher', file: 'instatic.package.json' },
}
export const PLATFORM_OPTIONS: Record<CmsTarget, string[]> = {
  payload: ['auth', 'localization', 'versions'],
  instatic: ['staticBake', 'seo', 'mediaLocal'],
}
export const defaultOptions = (target: CmsTarget): Record<string, boolean> => Object.fromEntries(PLATFORM_OPTIONS[target].map((o) => [o, true]))

export interface CmsField { id: string; name: string; type: FieldType; required: boolean; ref?: string }
export interface ContentType { id: string; name: string; kind: 'single' | 'collection'; fromPage?: string; fields: CmsField[] }
export interface CmsSpec { meta: { project: string; generatedFrom: string }; target: CmsTarget; types: ContentType[]; options: Record<string, boolean> }

const field = (id: string, name: string, type: FieldType, required = false): CmsField => ({ id, name, type, required })
// Una página es "colección" (muchas entradas) si su NOMBRE/RUTA la delata (blog, productos, tienda…).
// NO se usa `from` (integrador): 'Shopify' contiene 'shop' pero el Checkout no es una colección.
const isCollection = (name: string, path: string) =>
  /blog|noticia|journal|art[íi]culo|post|product|tienda|shop|cat[áa]logo|catalog|caso|proyecto|evento/i.test(`${name} ${path}`)

export function buildCmsSpec(arch: ArchSpec | null, projectName: string, target: CmsTarget = 'payload'): CmsSpec {
  const types: ContentType[] = [
    { id: 'ct-settings', name: 'Configuración del sitio', kind: 'single', fields: [
      field('siteName', 'Nombre del sitio', 'text', true), field('logo', 'Logo', 'image'), field('nav', 'Navegación', 'text'), field('footer', 'Pie de página', 'richtext'),
    ] },
  ]
  const seen = new Set(types.map((t) => t.id))
  ;(arch?.pages ?? []).forEach((p) => {
    const id = `ct-${p.id}`
    if (seen.has(id)) return
    seen.add(id)
    const coll = isCollection(p.name, p.path)
    const product = /product|tienda|cat[áa]logo|catalog/i.test(p.name)
    types.push({
      id, name: p.name, kind: coll ? 'collection' : 'single', fromPage: p.id,
      fields: coll
        ? [field('title', 'Título', 'text', true), field('slug', 'Slug', 'text', true), field('excerpt', 'Extracto', 'text'), field('body', 'Contenido', 'richtext'), field('cover', 'Portada', 'image'), field('date', 'Fecha', 'date'), ...(product ? [field('price', 'Precio', 'number', true)] : [])]
        : [field('title', 'Título', 'text', true), field('subtitle', 'Subtítulo', 'text'), field('body', 'Contenido', 'richtext'), field('image', 'Imagen', 'image'), field('seoDesc', 'SEO — descripción', 'text')],
    })
  })
  return { meta: { project: projectName || 'Proyecto', generatedFrom: 'Arquitectura' }, target, types, options: defaultOptions(target) }
}

export function emptyContentType(id: string, name = 'Nuevo tipo'): ContentType {
  return { id, name, kind: 'single', fields: [field('title', 'Título', 'text', true)] }
}

export function cmsCounts(spec: CmsSpec) {
  const fields = spec.types.reduce((n, t) => n + t.fields.length, 0)
  const collections = spec.types.filter((t) => t.kind === 'collection').length
  return { types: spec.types.length, fields, collections }
}

// ── Aprobación por tipo (firma de contenido; mismo mecanismo que Arquitectura/El usuario) ─────
export type CmsApprovals = Partial<Record<string, string>> // typeId → firma
export type CmsStatus = 'pending' | 'approved' | 'outdated'
export function typeSignature(spec: CmsSpec, typeId: string): string {
  const t = spec.types.find((x) => x.id === typeId)
  if (!t) return ''
  return JSON.stringify([t.name, t.kind, t.fields.map((f) => [f.name, f.type, f.required, f.ref ?? ''])])
}
export function typeStatus(spec: CmsSpec, approvals: CmsApprovals, typeId: string): CmsStatus {
  const sig = approvals[typeId]
  if (sig == null) return 'pending'
  return sig === typeSignature(spec, typeId) ? 'approved' : 'outdated'
}

// Todos los tipos aprobados (y hay al menos uno). Lo usa el CMS (badge "Todo aprobado") y el gate de Publicar.
export const cmsAllApproved = (spec: CmsSpec, approvals: CmsApprovals): boolean =>
  spec.types.length > 0 && spec.types.every((tp) => typeStatus(spec, approvals, tp.id) === 'approved')

// ── Paquete por plataforma: el output "autoportante" que se arma para Publicar. DISTINTO por plataforma —
// Payload = config de colecciones (contrato de schema, el sitio lo consume por API); Instatic = content model
// + los design tokens (casi el deploy: Instatic es su propio publisher). ─────
export interface PayloadCollection { slug: string; kind: 'collection' | 'single'; fields: { name: string; type: string; required: boolean; relationTo?: string }[] }
const PAYLOAD_FIELD: Record<FieldType, string> = { text: 'text', richtext: 'richText', image: 'upload', number: 'number', boolean: 'checkbox', date: 'date', reference: 'relationship', select: 'select' }
export function buildPayloadConfig(spec: CmsSpec): { collections: PayloadCollection[]; options: Record<string, boolean> } {
  return {
    collections: spec.types.map((t) => ({ slug: t.id, kind: t.kind, fields: t.fields.map((f) => ({ name: f.id, type: PAYLOAD_FIELD[f.type], required: f.required, ...(f.type === 'reference' && f.ref ? { relationTo: f.ref } : {}) })) })),
    options: spec.options,
  }
}
export interface InstaticPackage { dataTables: { name: string; kind: 'collection' | 'single'; columns: string[] }[]; tokens: Record<string, string>; options: Record<string, boolean>; publishReady: boolean }
export function buildInstaticPackage(spec: CmsSpec, tokens: Record<string, string>): InstaticPackage {
  return { dataTables: spec.types.map((t) => ({ name: t.id, kind: t.kind, columns: t.fields.map((f) => f.id) })), tokens, options: spec.options, publishReady: true }
}
// El paquete efectivo según la plataforma (Instatic recibe los tokens del DS; Payload no los necesita).
export const cmsPackage = (spec: CmsSpec, tokens: Record<string, string>): object =>
  spec.target === 'instatic' ? buildInstaticPackage(spec, tokens) : buildPayloadConfig(spec)
