import type { ReactNode } from 'react'
import type { AppliedStyle } from '../../lib/styleData'
import type { VizPage } from '../../lib/vizData'

// Render DETERMINISTA del estudio POR ROL de página — NO un clon del hero. Cada bloque del wireframe se
// resuelve a un componente real con el copy real de la página. Las imágenes son placeholders TIPADOS con
// la instrucción de imagery (no stock); los items de colección son de muestra deterministas. Es el "render
// real" honesto del mockup; en producción lo escribe el agente BYOM. Sin dependencias: estilos inline
// derivados del AppliedStyle (mismo lenguaje visual que SpecimenPreview, pero compuesto por rol).

function Btn({ s, label, variant = 'primary' }: { s: AppliedStyle; label: string; variant?: 'primary' | 'outline' | 'text' }) {
  const base = { fontSize: 12.5, padding: '7px 15px', borderRadius: s.radius, display: 'inline-block', fontFamily: s.bodyFamily, whiteSpace: 'nowrap' as const, lineHeight: 1 }
  if (variant === 'primary') return <span style={{ ...base, background: s.accent, color: '#fff' }}>{label}</span>
  if (variant === 'text') return <span style={{ ...base, padding: '7px 2px', color: s.accent, borderBottom: `1.5px solid ${s.accent}`, borderRadius: 0 }}>{label} →</span>
  return <span style={{ ...base, border: `1px solid ${s.accent}`, color: s.accent }}>{label}</span>
}
const heroVariant = (s: AppliedStyle): 'primary' | 'outline' | 'text' => (s.ctaStyle === 'solid' ? 'primary' : s.ctaStyle)
const brandOf = (name: string) => (name || 'Marca').split(' ')[0]
const sample = (base: string, n: number) => Array.from({ length: n }, (_, i) => ({ h: `${base} ${i + 1}`, p: 'Descripción breve de muestra.' }))
const formFields = (page: VizPage): string[] =>
  /checkout|pago/i.test(page.pageId + page.route) ? ['Nombre', 'Correo', 'Dirección', 'Tarjeta']
    : /contact/i.test(page.pageId + page.route) ? ['Nombre', 'Correo', 'Mensaje']
      : /login|splash/i.test(page.pageId) ? ['Correo', 'Contraseña']
        : ['Nombre', 'Correo']

interface Ctx { s: AppliedStyle; page: VizPage; brand: string; imagery: string; compact: boolean }

// Slot de imagen TIPADO: no stock, no blob — el rectángulo lleva escrita la instrucción de imagery.
function ImgSlot({ s, imagery, h = 120, label }: { s: AppliedStyle; imagery: string; h?: number; label?: string }) {
  return (
    <div style={{ height: h, background: s.surface, border: `0.5px dashed ${s.line}`, borderRadius: s.radius, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 8 }}>
      <span style={{ fontSize: 10.5, color: s.muted, opacity: 0.8, lineHeight: 1.3 }}>{label ?? `imagen · ${imagery || 'editorial'}`}</span>
    </div>
  )
}

const BLOCKS: Record<string, (c: Ctx) => ReactNode> = {
  header: ({ s, brand, compact }) => (
    <div style={{ padding: `${Math.round(s.pad * 0.55)}px ${s.pad}px`, borderBottom: `0.5px solid ${s.line}`, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: s.headlineFamily, fontWeight: s.headlineWeight, fontSize: 14 }}>
        <span style={{ width: 15, height: 15, borderRadius: Math.min(4, s.radius), background: s.accent, display: 'inline-block' }} />{brand}
      </div>
      {compact ? (
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 18, height: 1.5, borderRadius: 1, background: s.text }} />)}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: s.muted, marginLeft: 8 }}><span>Inicio</span><span>Productos</span><span>Nosotros</span></div>
          <div style={{ marginLeft: 'auto' }}><Btn s={s} label="Empezar" variant={heroVariant(s)} /></div>
        </>
      )}
    </div>
  ),
  hero: ({ s, page }) => {
    const center = !s.asym
    return (
      <div style={{ padding: `${s.pad + 6}px ${s.pad}px`, textAlign: center ? 'center' : 'left' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.accent, marginBottom: s.gap }}>{page.name}</div>
        <div style={{ fontFamily: s.headlineFamily, fontSize: s.headlineSize, fontWeight: s.headlineWeight, letterSpacing: s.tracking, lineHeight: 1.08, maxWidth: center ? '92%' : '80%', margin: center ? '0 auto' : undefined }}>{page.copy.headline}</div>
        {page.copy.sub && <div style={{ fontSize: 13.5, color: s.muted, marginTop: 11, maxWidth: center ? '70%' : '62%', marginLeft: center ? 'auto' : undefined, marginRight: center ? 'auto' : undefined, lineHeight: 1.55 }}>{page.copy.sub}</div>}
        {page.copy.cta && <div style={{ marginTop: s.gap + 8, display: 'flex', gap: 10, justifyContent: center ? 'center' : 'flex-start' }}><Btn s={s} label={page.copy.cta} variant={heroVariant(s)} /><Btn s={s} label="Ver más" variant={s.ctaStyle === 'text' ? 'text' : 'outline'} /></div>}
      </div>
    )
  },
  features: ({ s }) => (
    <div style={{ borderTop: `0.5px solid ${s.line}`, padding: s.pad, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: s.gap }}>
      {sample('Beneficio', 3).map((c, i) => (
        <div key={i} style={{ background: s.surface, border: `0.5px solid ${s.line}`, borderRadius: s.radius, padding: 16 }}>
          <div style={{ width: 26, height: 26, borderRadius: Math.min(6, s.radius), background: s.accent, opacity: 0.14, marginBottom: 10 }} />
          <div style={{ fontFamily: s.headlineFamily, fontSize: 15, fontWeight: s.headlineWeight, marginBottom: 5 }}>{c.h}</div>
          <div style={{ fontSize: 12.5, color: s.muted, lineHeight: 1.5 }}>{c.p}</div>
        </div>
      ))}
    </div>
  ),
  testimonial: ({ s }) => (
    <div style={{ borderTop: `0.5px solid ${s.line}`, padding: `${s.pad + 6}px ${s.pad}px`, textAlign: 'center' }}>
      <div style={{ fontFamily: s.headlineFamily, fontSize: Math.round(s.headlineSize * 0.62), fontWeight: s.headlineWeight, lineHeight: 1.3, maxWidth: '80%', margin: '0 auto', color: s.text }}>“Cambió por completo nuestra forma de trabajar.”</div>
      <div style={{ fontSize: 12, color: s.muted, marginTop: 10 }}>— Cliente satisfecho</div>
    </div>
  ),
  cta: ({ s, page }) => (
    <div style={{ borderTop: `0.5px solid ${s.line}`, padding: `${s.pad + 4}px ${s.pad}px`, textAlign: 'center', background: s.surface }}>
      <div style={{ fontFamily: s.headlineFamily, fontSize: Math.round(s.headlineSize * 0.66), fontWeight: s.headlineWeight, marginBottom: 12 }}>¿Listo para empezar?</div>
      <Btn s={s} label={page.copy.cta || 'Empezar'} variant={heroVariant(s)} />
    </div>
  ),
  footer: ({ s, brand }) => (
    <div style={{ borderTop: `0.5px solid ${s.line}`, padding: `${Math.round(s.pad * 0.75)}px ${s.pad}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: s.muted, flexWrap: 'wrap', gap: 8 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: Math.min(3, s.radius), background: s.accent }} />{brand}</span>
      <span style={{ display: 'flex', gap: 14 }}><span>Privacidad</span><span>Términos</span><span>Contacto</span></span>
    </div>
  ),
  filters: ({ s }) => (
    <div style={{ borderTop: `0.5px solid ${s.line}`, padding: `${Math.round(s.pad * 0.7)}px ${s.pad}px`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 160px', minWidth: 120, height: 30, borderRadius: s.radius, border: `1px solid ${s.line}`, background: s.surface, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12, color: s.muted }}>Buscar…</div>
      {['Todos', 'Novedades', 'Populares'].map((f, i) => <span key={i} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid ${i === 0 ? s.accent : s.line}`, color: i === 0 ? s.accent : s.muted }}>{f}</span>)}
    </div>
  ),
  grid: ({ s, page, imagery }) => (
    <div style={{ padding: s.pad, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: s.gap }}>
      {sample(page.name.replace(/s$/, ''), 6).map((c, i) => (
        <div key={i} style={{ border: `0.5px solid ${s.line}`, borderRadius: s.radius, overflow: 'hidden' }}>
          <ImgSlot s={s} imagery={imagery} h={84} />
          <div style={{ padding: 10 }}>
            <div style={{ fontSize: 13, fontFamily: s.headlineFamily, fontWeight: s.headlineWeight }}>{c.h}</div>
            <div style={{ fontSize: 12, color: s.accent, marginTop: 3 }}>$—</div>
          </div>
        </div>
      ))}
    </div>
  ),
  pagination: ({ s }) => (
    <div style={{ padding: `${Math.round(s.pad * 0.5)}px ${s.pad}px`, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
      {['‹', '1', '2', '3', '›'].map((p, i) => <span key={i} style={{ width: 26, height: 26, borderRadius: s.radius, border: `1px solid ${p === '1' ? s.accent : s.line}`, color: p === '1' ? s.accent : s.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{p}</span>)}
    </div>
  ),
  gallery: ({ s, imagery }) => (
    <div style={{ padding: s.pad, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: s.gap }}>
      <ImgSlot s={s} imagery={imagery} h={200} />
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: s.gap }}><ImgSlot s={s} imagery={imagery} h={94} /><ImgSlot s={s} imagery={imagery} h={94} /></div>
    </div>
  ),
  // summary es consciente del ROL: comercio (detail / checkout) muestra precio + "Agregar"; un form no-comercio
  // (login/perfil/contacto) muestra un recap neutro — NO precio ni carrito (evita chrome de producto fuera de lugar).
  summary: ({ s, page }) => {
    const commerce = page.role === 'detail' || /checkout|carrito|pago|pedido/i.test(page.pageId + page.route)
    return (
      <div style={{ borderTop: `0.5px solid ${s.line}`, padding: s.pad, display: 'flex', gap: s.gap + 8, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ fontFamily: s.headlineFamily, fontSize: Math.round(s.headlineSize * 0.72), fontWeight: s.headlineWeight, lineHeight: 1.15 }}>{page.copy.headline}</div>
          {commerce && <div style={{ fontSize: 20, color: s.accent, margin: '8px 0', fontWeight: 600 }}>$—</div>}
          <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6, margin: '8px 0 12px' }}>{page.copy.sub || (commerce ? 'Detalle del elemento, con sus características y notas.' : 'Resumen de lo que sigue en este paso.')}</div>
          {(commerce ? ['Detalle uno', 'Detalle dos', 'Detalle tres'] : ['Paso confirmado', 'Datos revisados']).map((li, i) => <div key={i} style={{ fontSize: 12.5, color: s.text, display: 'flex', gap: 6, marginBottom: 4 }}><span style={{ color: s.accent }}>✓</span>{li}</div>)}
          <div style={{ marginTop: 12 }}><Btn s={s} label={page.copy.cta || (commerce ? 'Agregar' : 'Continuar')} variant={heroVariant(s)} /></div>
        </div>
      </div>
    )
  },
  related: ({ s, page, imagery }) => (
    <div style={{ borderTop: `0.5px solid ${s.line}`, padding: s.pad }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.muted, marginBottom: 10 }}>También te puede gustar</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: s.gap }}>
        {sample(page.name.replace(/s$/, ''), 3).map((c, i) => (
          <div key={i}><ImgSlot s={s} imagery={imagery} h={72} /><div style={{ fontSize: 12, marginTop: 5, fontFamily: s.headlineFamily }}>{c.h}</div></div>
        ))}
      </div>
    </div>
  ),
  form: ({ s, page }) => (
    <div style={{ padding: `${s.pad + 4}px ${s.pad}px`, maxWidth: 440, margin: '0 auto' }}>
      <div style={{ fontFamily: s.headlineFamily, fontSize: Math.round(s.headlineSize * 0.66), fontWeight: s.headlineWeight, marginBottom: 4 }}>{page.copy.headline}</div>
      {page.copy.sub && <div style={{ fontSize: 13, color: s.muted, marginBottom: 14 }}>{page.copy.sub}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {formFields(page).map((f, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: s.muted, marginBottom: 4 }}>{f}</div>
            <div style={{ height: f === 'Mensaje' ? 64 : 34, borderRadius: s.radius, border: `1px solid ${s.line}`, background: s.surface }} />
          </div>
        ))}
        <div style={{ marginTop: 4 }}><Btn s={s} label={page.copy.cta || 'Enviar'} variant={heroVariant(s)} /></div>
      </div>
    </div>
  ),
  content: ({ s, page }) => (
    <div style={{ padding: `${s.pad + 4}px ${s.pad}px`, maxWidth: 620, margin: '0 auto' }}>
      <div style={{ fontFamily: s.headlineFamily, fontSize: Math.round(s.headlineSize * 0.78), fontWeight: s.headlineWeight, letterSpacing: s.tracking, lineHeight: 1.15, marginBottom: 10 }}>{page.copy.headline}</div>
      {page.copy.sub && <div style={{ fontSize: 14, color: s.muted, lineHeight: 1.65, marginBottom: 12 }}>{page.copy.sub}</div>}
      {[0, 1].map((i) => <div key={i} style={{ fontSize: 13.5, color: s.text, lineHeight: 1.7, marginBottom: 10, opacity: 0.9 }}>Párrafo de contenido de muestra que ilustra el ritmo tipográfico y el ancho de medida de la dirección aplicada a esta página.</div>)}
    </div>
  ),
}

export function PageRender({ style: s, page, brand = 'Marca', imagery = '', compact = false }: { style: AppliedStyle; page: VizPage; brand?: string; imagery?: string; compact?: boolean }) {
  const ctx: Ctx = { s, page, brand: brandOf(brand), imagery, compact }
  return (
    <div style={{ background: s.bg, color: s.text, fontFamily: s.bodyFamily, border: `0.5px solid ${s.line}`, borderRadius: 8, overflow: 'hidden' }}>
      {page.blocks.map((b, i) => {
        const Block = BLOCKS[b] ?? BLOCKS.content
        return <div key={`${b}-${i}`}>{Block(ctx)}</div>
      })}
    </div>
  )
}
