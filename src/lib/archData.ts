import type { BriefField, BriefSection } from '../data/brief'
import type { BrandSection } from '../data/branding'

// MOCKUP: deriva la ARQUITECTURA del proyecto (sitemap + flujos + copy + wireframe) desde el Brief,
// El usuario (vía las señales del Brief), Branding (voz) y el Design System. Sin IA real —
// scaffold determinista. Es el CONTRATO que los editores desacoplados (React Flow, Puck) leen y
// escriben. Dos caras: máquina (este spec, → Visualizador/CMS) y humano (los editores/diagramas).
// Ver memoria architecture-approach.

export interface ArchPage {
  id: string
  name: string
  path: string
  purpose: string
  parentId?: string // árbol del sitemap
  from?: string // etiqueta de origen (Shopify / Mailchimp / Journey)
  copy: { headline: string; sub: string; cta?: string }
  pos?: { x: number; y: number } // posición en el canvas del Site Map (F1, árbol)
  flowPos?: { x: number; y: number } // posición en el canvas del User Flow (F2, grafo) — independiente
  addresses?: string[] // U3 cobertura: ids de metas (users.json) que esta página atiende
  resolves?: string[] // U3 cobertura: ids de dolores (users.json) que esta página resuelve
  // Layout de wireframe (Puck data). Lo llena F3; F0 deja los bloques base.
  wireframe?: unknown
}
export interface ArchFlow {
  id: string
  from: string // id de página
  to: string // id de página
  label: string // la acción del usuario
}
export interface ArchSpec {
  meta: { project: string; type: 'website' | 'app'; generatedFrom: string }
  pages: ArchPage[]
  flows: ArchFlow[]
}

const fv = (sections: { fields: BriefField[] }[], id: string) =>
  sections.flatMap((s) => s.fields).find((f) => f.id === id)?.value?.trim() ?? ''
const has = (hay: string, needle: string) => hay.toLowerCase().includes(needle.toLowerCase())

// Bloques de wireframe base por rol de página (baja fidelidad; el Visualizador hace la alta).
const baseWireframe = (role: 'landing' | 'list' | 'detail' | 'form' | 'content') => ({
  role,
  blocks:
    role === 'landing'
      ? ['header', 'hero', 'features', 'testimonial', 'cta', 'footer']
      : role === 'list'
        ? ['header', 'filters', 'grid', 'pagination', 'footer']
        : role === 'detail'
          ? ['header', 'gallery', 'summary', 'cta', 'related', 'footer']
          : role === 'form'
            ? ['header', 'form', 'summary', 'footer']
            : ['header', 'content', 'footer'],
})

// Deriva el spec desde el upstream. Determinista y guiado por señales reales del Brief.
export function buildArchSpec(brief: BriefSection[], branding: BrandSection[], type: 'website' | 'app', projectName: string): ArchSpec {
  const bfv = (id: string) => fv(brief, id)
  const brv = (id: string) => fv(branding as unknown as { fields: BriefField[] }[], id)
  const integrations = bfv('c-integrations')
  const journey = bfv('b-journey')
  const essence = brv('bf-essence') || 'Calidez artesanal'
  const purpose = brv('bf-purpose') || bfv('a-usergoal')
  const nm = projectName || 'Proyecto'

  const pages: ArchPage[] = []
  const page = (id: string, name: string, path: string, purpose: string, role: Parameters<typeof baseWireframe>[0], copy: ArchPage['copy'], from?: string, parentId?: string) =>
    pages.push({ id, name, path, purpose, parentId, from, copy, wireframe: baseWireframe(role) })

  if (type === 'app') {
    page('splash', 'Login / Registro', '/login', 'Autenticación de entrada', 'form', { headline: `Entra a ${nm}`, sub: purpose, cta: 'Continuar' })
    page('onboarding', 'Onboarding', '/onboarding', 'Primeros pasos del usuario', 'content', { headline: 'Empecemos', sub: 'Configura tu experiencia en un minuto.' })
    page('home', 'Home / Dashboard', '/', 'Pantalla principal tras entrar', 'landing', { headline: `Hola de nuevo`, sub: essence })
    page('detail', 'Detalle', '/item/:id', 'Vista de un elemento', 'detail', { headline: 'Detalle', sub: '', cta: 'Acción principal' })
    page('profile', 'Perfil / Ajustes', '/perfil', 'Cuenta y preferencias', 'form', { headline: 'Tu perfil', sub: 'Gestiona tu cuenta.' })
  } else {
    page('home', 'Home', '/', 'Puerta de entrada; propuesta de valor', 'landing', { headline: `${essence}`, sub: purpose, cta: has(journey, 'suscrib') ? 'Suscríbete' : 'Empezar' })
    if (has(integrations, 'shopify')) {
      page('products', 'Productos', '/productos', 'Catálogo navegable', 'list', { headline: 'Nuestro catálogo', sub: 'Café de origen, tostado reciente.', cta: 'Ver todo' }, 'Shopify', 'home')
      page('product', 'Producto', '/productos/:slug', 'Detalle de un producto', 'detail', { headline: '{Nombre del producto}', sub: 'Notas de cata, origen y frescura.', cta: 'Agregar al carrito' }, 'Shopify', 'products')
      page('checkout', 'Checkout', '/checkout', 'Compra sin fricción', 'form', { headline: 'Casi listo', sub: 'Pago seguro en pocos pasos.', cta: 'Pagar' }, 'Shopify')
    }
    if (has(journey, 'suscrib')) {
      page('subscribe', 'Suscripción', '/suscripcion', 'Alta al plan recurrente', 'form', { headline: 'Tu café, siempre fresco', sub: 'Recíbelo en casa a tu ritmo.', cta: 'Suscribirme' }, 'Journey')
    }
    page('about', 'Nosotros', '/nosotros', 'Historia y confianza de marca', 'content', { headline: 'Nuestra historia', sub: purpose })
    if (has(integrations, 'mailchimp')) {
      page('blog', 'Blog / Newsletter', '/blog', 'Contenido y captación de correo', 'content', { headline: 'El diario del café', sub: 'Historias, recetas y novedades.', cta: 'Suscribirme al boletín' }, 'Mailchimp', 'home')
    }
    page('contact', 'Contacto', '/contacto', 'Vías de contacto y soporte', 'form', { headline: 'Hablemos', sub: 'Estamos para ayudarte.', cta: 'Enviar' })
  }

  // Flujos: el journey crítico del Brief mapeado sobre las páginas (+ ramas secundarias).
  const flows: ArchFlow[] = []
  const flow = (from: string, to: string, label: string) => {
    if (pages.some((p) => p.id === from) && pages.some((p) => p.id === to)) flows.push({ id: `${from}-${to}`, from, to, label })
  }
  if (type === 'app') {
    flow('splash', 'onboarding', 'Registrarse')
    flow('onboarding', 'home', 'Terminar setup')
    flow('home', 'detail', 'Abrir elemento')
    flow('home', 'profile', 'Ajustes')
  } else {
    flow('home', 'products', 'Explorar')
    flow('products', 'product', 'Ver producto')
    flow('product', 'subscribe', 'Suscribirse')
    flow('subscribe', 'checkout', 'Confirmar')
    flow('product', 'checkout', 'Comprar suelto')
    flow('home', 'about', 'Conocernos')
    flow('home', 'contact', 'Contactar')
    flow('home', 'blog', 'Leer el blog')
  }

  return {
    meta: { project: nm, type, generatedFrom: 'Brief + Branding + Design System' },
    pages,
    flows,
  }
}

// Resumen por bloque para el HUB.
export function archCounts(spec: ArchSpec) {
  return {
    pages: spec.pages.length,
    flows: spec.flows.length,
    copyPages: spec.pages.filter((p) => p.copy?.headline).length,
  }
}

// Los 3 bloques internos de la sección (concepto de datos, compartido por HUB y editores).
export type ArchBlock = 'sitemap' | 'flow' | 'wireframe'
export const ARCH_BLOCKS: ArchBlock[] = ['sitemap', 'flow', 'wireframe']

// Estado de aprobación por bloque. 'approved' = firma vigente; 'outdated' = aprobado pero editado
// después (la revisión se reabre); 'pending' = nunca aprobado.
export type ArchStatus = 'pending' | 'approved' | 'outdated'
// Mapa persistido: bloque → firma de contenido al momento de aprobar.
export type ArchApprovals = Partial<Record<ArchBlock, string>>
export function blockStatus(spec: ArchSpec, approvals: ArchApprovals, block: ArchBlock): ArchStatus {
  const sig = approvals[block]
  if (sig == null) return 'pending'
  return sig === blockSignature(spec, block) ? 'approved' : 'outdated'
}

// JSON AISLADO por bloque (exportar solo esa capa). El de 'wireframe' es SOLO el copy (capa de texto).
export function blockJson(spec: ArchSpec, block: ArchBlock): object {
  if (block === 'sitemap') return { meta: spec.meta, pages: spec.pages.map((p) => ({ id: p.id, name: p.name, path: p.path, purpose: p.purpose, parentId: p.parentId, from: p.from })) }
  if (block === 'flow') return { meta: spec.meta, flows: spec.flows }
  return { meta: spec.meta, copy: spec.pages.map((p) => ({ id: p.id, name: p.name, headline: p.copy.headline, sub: p.copy.sub, cta: p.copy.cta ?? '' })) }
}
export const BLOCK_FILE: Record<ArchBlock, string> = { sitemap: 'site-map.json', flow: 'user-flow.json', wireframe: 'copy.json' }

// Firma de CONTENIDO de un bloque (ignora posición/layout) → detecta ediciones para invalidar la
// aprobación (cascada "desactualizado"). Usa JSON.stringify (estructural, escapa separadores → no se
// puede forjar la firma con texto libre en name/path/label/copy). Robusta al montaje de los editores:
// React Flow no persiste al montar (guarda solo pos, que aquí se ignora) y Puck escribe SOLO al editar
// (no al abrir), así que abrir un editor nunca reabre la aprobación; cualquier edición real sí.
export function blockSignature(spec: ArchSpec, block: ArchBlock): string {
  if (block === 'sitemap') return JSON.stringify(spec.pages.map((p) => [p.id, p.name, p.path, p.parentId ?? '']))
  if (block === 'flow') return JSON.stringify(spec.flows.map((f) => [f.from, f.to, f.label]))
  // Wireframe + Copy: copy (headline/sub/cta) + el layout del wireframe (bloques y sus props).
  return JSON.stringify(spec.pages.map((p) => [p.id, p.copy.headline, p.copy.sub, p.copy.cta ?? '', p.wireframe ?? 0]))
}
