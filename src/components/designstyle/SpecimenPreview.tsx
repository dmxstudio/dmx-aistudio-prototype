import type { AppliedStyle, SpecimenContent } from '../../lib/styleData'

// SPECIMEN — render DETERMINISTA (studio, sin agente) del estilo aplicado a una página de muestra. Es un
// PROOF de solo-lectura. `full` = showcase de sistema de diseño (nav + hero + cards + componentes + paleta
// + footer), fiel al patrón getdesign.md. `mini` (cards) = hero limpio con mucho aire. NO es el sitio real.

function Btn({ s, label, variant }: { s: AppliedStyle; label: string; variant: 'primary' | 'outline' | 'text' }) {
  const base = { fontSize: 12.5, padding: '7px 15px', borderRadius: s.radius, display: 'inline-block', fontFamily: s.bodyFamily, whiteSpace: 'nowrap' as const, lineHeight: 1 }
  if (variant === 'primary') return <span style={{ ...base, background: s.accent, color: '#fff' }}>{label}</span>
  if (variant === 'text') return <span style={{ ...base, padding: '7px 2px', color: s.accent, borderBottom: `1.5px solid ${s.accent}`, borderRadius: 0 }}>{label} →</span>
  return <span style={{ ...base, border: `1px solid ${s.accent}`, color: s.accent }}>{label}</span>
}
const heroVariant = (s: AppliedStyle): 'primary' | 'outline' | 'text' => (s.ctaStyle === 'solid' ? 'primary' : s.ctaStyle)

export function SpecimenPreview({ style: s, content: c, full = false, compact = false }: { style: AppliedStyle; content: SpecimenContent; full?: boolean; compact?: boolean }) {
  const heroAlign = s.asym ? 'left' : 'center'
  const center = heroAlign === 'center'
  const heroMax = s.asym ? '80%' : '92%'
  const brand = (c.eyebrow || 'Brand').split(' ')[0]

  return (
    <div style={{ background: s.bg, color: s.text, fontFamily: s.bodyFamily, border: `0.5px solid ${s.line}`, borderRadius: 8, overflow: 'hidden' }}>
      {/* Nav (solo showcase) */}
      {full && (
        <div style={{ padding: `${Math.round(s.pad * 0.55)}px ${s.pad}px`, borderBottom: `0.5px solid ${s.line}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: s.headlineFamily, fontWeight: s.headlineWeight, fontSize: 14 }}>
            <span style={{ width: 15, height: 15, borderRadius: Math.min(4, s.radius), background: s.accent, display: 'inline-block' }} />{brand}
          </div>
          {compact ? (
            // A ancho de teléfono la nav de escritorio no cabe → colapsa a hamburguesa (como un sitio real),
            // en vez de recortar los links + botón contra el overflow:hidden del specimen.
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 18, height: 1.5, borderRadius: 1, background: s.text }} />)}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: s.muted, marginLeft: 8 }}>
                <span>Producto</span><span>Precios</span><span>Docs</span>
              </div>
              <div style={{ marginLeft: 'auto' }}><Btn s={s} label="Empezar" variant={heroVariant(s)} /></div>
            </>
          )}
        </div>
      )}

      {/* Hero */}
      <div style={{ padding: full ? `${s.pad + 6}px ${s.pad}px` : s.pad, textAlign: heroAlign }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.accent, marginBottom: s.gap }}>{c.eyebrow}</div>
        <div style={{ fontFamily: s.headlineFamily, fontSize: s.headlineSize, fontWeight: s.headlineWeight, letterSpacing: s.tracking, lineHeight: 1.08, maxWidth: heroMax, margin: center ? '0 auto' : undefined }}>{c.headline}</div>
        <div style={{ fontSize: 13.5, color: s.muted, marginTop: 11, maxWidth: center ? '70%' : '62%', marginLeft: center ? 'auto' : undefined, marginRight: center ? 'auto' : undefined, lineHeight: 1.55 }}>{c.sub}</div>
        {(c.cta || full) && (
          <div style={{ marginTop: s.gap + 8, display: 'flex', gap: 10, justifyContent: center ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
            {c.cta && <Btn s={s} label={c.cta} variant={heroVariant(s)} />}
            {full && <Btn s={s} label="Ver demo" variant={s.ctaStyle === 'text' ? 'text' : 'outline'} />}
          </div>
        )}
      </div>

      {full && (
        <>
          {/* Sección de contenido (asimétrica si el ritmo lo pide) */}
          <div style={{ borderTop: `0.5px solid ${s.line}`, padding: s.pad, display: 'flex', gap: s.gap + 8, alignItems: 'flex-start', flexDirection: s.asym ? 'row' : 'column' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: s.headlineFamily, fontSize: Math.round(s.headlineSize * 0.5) + 4, fontWeight: s.headlineWeight, marginBottom: 6 }}>{c.sectionHead}</div>
              <div style={{ fontSize: 13, color: s.muted, lineHeight: 1.6, maxWidth: 420 }}>{c.sectionBody}</div>
            </div>
            <div style={{ width: s.asym ? 160 : '100%', height: 96, flex: 'none', background: s.surface, border: `0.5px solid ${s.line}`, borderRadius: s.radius }} />
          </div>

          {/* Grid de cards */}
          <div style={{ borderTop: `0.5px solid ${s.line}`, padding: s.pad, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: s.gap }}>
            {c.cards.map((card, i) => (
              <div key={`${card.h}-${i}`} style={{ background: s.surface, border: `0.5px solid ${s.line}`, borderRadius: s.radius, padding: 16 }}>
                <div style={{ width: 26, height: 26, borderRadius: Math.min(6, s.radius), background: s.accent, opacity: 0.14, marginBottom: 10 }} />
                <div style={{ fontFamily: s.headlineFamily, fontSize: 15, fontWeight: s.headlineWeight, marginBottom: 5 }}>{card.h}</div>
                <div style={{ fontSize: 12.5, color: s.muted, lineHeight: 1.5 }}>{card.p}</div>
              </div>
            ))}
          </div>

          {/* Componentes + paleta (showcase de sistema de diseño) */}
          <div style={{ borderTop: `0.5px solid ${s.line}`, padding: s.pad }}>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.muted, marginBottom: 12 }}>Componentes</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
              <Btn s={s} label="Primario" variant="primary" />
              <Btn s={s} label="Secundario" variant="outline" />
              <Btn s={s} label="Enlace" variant="text" />
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: s.accent, opacity: 0.9, color: '#fff' }}>Nuevo</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px', minWidth: 150, height: 34, borderRadius: s.radius, border: `1px solid ${s.line}`, background: s.surface, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 12.5, color: s.muted }}>tu@correo.com</div>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                {[s.accent, s.text, s.muted, s.line].map((col, i) => <span key={i} style={{ width: 20, height: 20, borderRadius: 5, background: col, border: `0.5px solid ${s.line}` }} />)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: `0.5px solid ${s.line}`, padding: `${Math.round(s.pad * 0.75)}px ${s.pad}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: s.muted, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: Math.min(3, s.radius), background: s.accent, display: 'inline-block' }} />{brand}</span>
            <span style={{ display: 'flex', gap: 14 }}><span>Privacidad</span><span>Términos</span><span>Contacto</span></span>
          </div>
        </>
      )}
    </div>
  )
}
