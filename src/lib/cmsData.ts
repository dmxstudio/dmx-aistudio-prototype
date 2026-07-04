import type { ArchSpec } from './archData'

// MOCKUP: CMS (fase 8) — capa de CONTENIDO. Deriva un MODELO de contenido (tipos + campos) desde la
// Arquitectura (páginas → tipos; copy/propósito → campos) para un headless CMS destino. Cara MÁQUINA =
// cms.json (el esquema). NO guarda contenido real (eso vive en el CMS); define la estructura + el export.

export type FieldType = 'text' | 'richtext' | 'image' | 'number' | 'boolean' | 'date' | 'reference' | 'select'
export const FIELD_TYPES: FieldType[] = ['text', 'richtext', 'image', 'number', 'boolean', 'date', 'reference', 'select']
export type CmsTarget = 'contentful' | 'storyblok' | 'sanity' | 'payload'
export const CMS_TARGETS: CmsTarget[] = ['contentful', 'storyblok', 'sanity', 'payload']

export interface CmsField { id: string; name: string; type: FieldType; required: boolean; ref?: string }
export interface ContentType { id: string; name: string; kind: 'single' | 'collection'; fromPage?: string; fields: CmsField[] }
export interface CmsSpec { meta: { project: string; generatedFrom: string }; target: CmsTarget; types: ContentType[] }

const field = (id: string, name: string, type: FieldType, required = false): CmsField => ({ id, name, type, required })
// Una página es "colección" (muchas entradas) si su NOMBRE/RUTA la delata (blog, productos, tienda…).
// NO se usa `from` (integrador): 'Shopify' contiene 'shop' pero el Checkout no es una colección.
const isCollection = (name: string, path: string) =>
  /blog|noticia|journal|art[íi]culo|post|product|tienda|shop|cat[áa]logo|catalog|caso|proyecto|evento/i.test(`${name} ${path}`)

export function buildCmsSpec(arch: ArchSpec | null, projectName: string, target: CmsTarget = 'contentful'): CmsSpec {
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
  return { meta: { project: projectName || 'Proyecto', generatedFrom: 'Arquitectura' }, target, types }
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
