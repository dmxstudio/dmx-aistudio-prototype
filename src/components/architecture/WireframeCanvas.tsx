import { useMemo, useState } from 'react'
import { Puck, type Config, type Data } from '@measured/puck'
import '@measured/puck/dist/index.css'
import { useTranslation } from 'react-i18next'
import type { ArchSpec, ArchPage } from '../../lib/archData'

// F3 — Editor Wireframe + Copy (Puck, nativo dentro del overlay, SIN iframe → hereda los tokens del
// Design System). Baja fidelidad: bloques estructurados estilados con var(--color-*). El copy es la
// CAPA de texto del wireframe (campos headline/sub/cta del bloque Hero) → se edita inline aquí y se
// refleja en page.copy del contrato. La alta fidelidad la hará el Visualizador consumiendo el spec.

// ── Bloques low-fi (componentes Puck) ───────────────────────────────────────
const line = (w: string) => ({ height: 8, width: w, borderRadius: 4, background: 'var(--color-line)' })
const box: React.CSSProperties = { background: 'var(--color-raised)', border: '1px solid var(--color-line)', borderRadius: 12 }

type CompProps = {
  Header: Record<string, never>
  Hero: { headline?: string; sub?: string; cta?: string }
  Cards: { count?: number }
  Section: { title?: string }
  Gallery: { count?: number }
  Form: { count?: number }
  CTA: { headline?: string; cta?: string }
  Text: { text?: string }
  Footer: Record<string, never>
}

const config: Config<CompProps> = {
  root: { render: ({ children }) => <div style={{ background: 'var(--color-canvas)', minHeight: '100%', padding: 0 }}>{children}</div> },
  components: {
    Header: {
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid var(--color-line)', background: 'var(--color-surface)' }}>
          <div style={{ width: 90, height: 20, borderRadius: 6, background: 'var(--color-accent-soft)' }} />
          <div style={{ flex: 1 }} />
          {[64, 64, 48].map((w, i) => <div key={i} style={line(w + 'px')} />)}
        </div>
      ),
    },
    Hero: {
      fields: { headline: { type: 'text' }, sub: { type: 'textarea' }, cta: { type: 'text' } },
      defaultProps: { headline: 'Titular principal', sub: 'Subtítulo que explica la propuesta de valor.', cta: 'Empezar' },
      render: ({ headline, sub, cta }) => (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--color-surface)' }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--color-content)', lineHeight: 1.15, maxWidth: 640, margin: '0 auto' }}>{headline}</div>
          <div style={{ fontSize: 16, color: 'var(--color-muted)', marginTop: 12, maxWidth: 520, marginInline: 'auto' }}>{sub}</div>
          {cta ? <div style={{ display: 'inline-block', marginTop: 24, padding: '10px 22px', borderRadius: 999, background: 'var(--color-accent)', color: '#fff', fontWeight: 600, fontSize: 14 }}>{cta}</div> : null}
        </div>
      ),
    },
    Cards: {
      fields: { count: { type: 'number' } },
      defaultProps: { count: 3 },
      render: ({ count = 3 }) => (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, count))}, 1fr)`, gap: 16, padding: '40px 24px' }}>
          {Array.from({ length: Math.max(1, Math.min(6, count)) }).map((_, i) => (
            <div key={i} style={{ ...box, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-accent-soft)' }} />
              <div style={line('80%')} /><div style={line('60%')} />
            </div>
          ))}
        </div>
      ),
    },
    Section: {
      fields: { title: { type: 'text' } },
      defaultProps: { title: 'Sección' },
      render: ({ title }) => (
        <div style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>{title}</div>
          <div style={{ ...box, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-faint)', fontSize: 13 }}>{title}</div>
        </div>
      ),
    },
    Gallery: {
      fields: { count: { type: 'number' } },
      defaultProps: { count: 6 },
      render: ({ count = 6 }) => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '40px 24px' }}>
          {Array.from({ length: Math.max(1, Math.min(12, count)) }).map((_, i) => (
            <div key={i} style={{ ...box, aspectRatio: '4/3' }} />
          ))}
        </div>
      ),
    },
    Form: {
      fields: { count: { type: 'number' } },
      defaultProps: { count: 3 },
      render: ({ count = 3 }) => (
        <div style={{ maxWidth: 420, margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: Math.max(1, Math.min(8, count)) }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={line('40%')} />
              <div style={{ height: 38, ...box }} />
            </div>
          ))}
          <div style={{ height: 40, borderRadius: 999, background: 'var(--color-accent)', marginTop: 4 }} />
        </div>
      ),
    },
    CTA: {
      fields: { headline: { type: 'text' }, cta: { type: 'text' } },
      defaultProps: { headline: '¿Listo para empezar?', cta: 'Empezar ahora' },
      render: ({ headline, cta }) => (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--color-accent-soft)' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-content)' }}>{headline}</div>
          {cta ? <div style={{ display: 'inline-block', marginTop: 18, padding: '10px 22px', borderRadius: 999, background: 'var(--color-accent)', color: '#fff', fontWeight: 600, fontSize: 14 }}>{cta}</div> : null}
        </div>
      ),
    },
    Text: {
      fields: { text: { type: 'textarea' } },
      defaultProps: { text: 'Bloque de texto. Edita el contenido desde el panel de la derecha.' },
      render: ({ text }) => (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px', fontSize: 15, color: 'var(--color-content)', lineHeight: 1.7 }}>{text}</div>
      ),
    },
    Footer: {
      render: () => (
        <div style={{ display: 'flex', gap: 24, padding: '32px 24px', borderTop: '1px solid var(--color-line)', background: 'var(--color-surface)' }}>
          {[0, 1, 2, 3].map((c) => (
            <div key={c} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={line('50%')} /><div style={line('70%')} /><div style={line('60%')} />
            </div>
          ))}
        </div>
      ),
    },
  },
}

// Convierte los bloques por-rol de F0 en data de Puck (inyecta el copy en el Hero). Si la página ya
// tiene data de Puck (editada antes), la usa tal cual.
const BLOCK_MAP: Record<string, string> = {
  header: 'Header', hero: 'Hero', features: 'Cards', testimonial: 'Section', cta: 'CTA', footer: 'Footer',
  filters: 'Section', grid: 'Gallery', pagination: 'Section', gallery: 'Gallery', summary: 'Section', related: 'Cards', form: 'Form', content: 'Text',
}
const SECTION_TITLE: Record<string, string> = { testimonial: 'Testimonios', filters: 'Filtros', pagination: 'Paginación', summary: 'Resumen' }

function seedData(page: ArchPage): Data {
  const wf = page.wireframe as { content?: unknown[]; blocks?: string[] } | undefined
  if (wf && Array.isArray(wf.content)) return wf as unknown as Data // ya es data de Puck
  const blocks = (wf?.blocks && wf.blocks.length ? wf.blocks : ['header', 'hero', 'footer'])
  const content = blocks.map((b, i) => {
    const type = BLOCK_MAP[b] ?? 'Section'
    let props: Record<string, unknown> = { id: `${type}-${i}` }
    if (type === 'Hero') props = { ...props, headline: page.copy.headline, sub: page.copy.sub, cta: page.copy.cta ?? '' }
    else if (type === 'Section') props = { ...props, title: SECTION_TITLE[b] ?? page.name }
    return { type, props }
  })
  return { content, root: { props: {} } } as Data
}

// Extrae el copy editado (primer Hero) de la data de Puck.
function extractCopy(data: Data, fallback: ArchPage['copy']): ArchPage['copy'] {
  const hero = (data.content as Array<{ type: string; props: Record<string, unknown> }>).find((c) => c.type === 'Hero')
  if (!hero) return fallback
  // nullish (no truthy): un CTA vaciado a '' es intención de borrarlo → se respeta, no revierte.
  return { headline: String(hero.props.headline ?? fallback.headline), sub: String(hero.props.sub ?? fallback.sub), cta: hero.props.cta != null ? String(hero.props.cta) : fallback.cta }
}

export function WireframeCanvas({ spec, onChange }: { spec: ArchSpec; onChange: (s: ArchSpec) => void }) {
  const { t } = useTranslation()
  const [pageId, setPageId] = useState(spec.pages[0]?.id ?? '')
  const page = spec.pages.find((p) => p.id === pageId) ?? spec.pages[0]
  // Semilla estable por página (no se recalcula en cada re-render del padre → Puck no se resetea).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => (page ? seedData(page) : ({ content: [], root: { props: {} } } as Data)), [pageId])

  const sync = (d: Data) => {
    onChange({ ...spec, pages: spec.pages.map((p) => (p.id === pageId ? { ...p, wireframe: d, copy: extractCopy(d, p.copy) } : p)) })
  }

  if (!page) return null

  return (
    <div className="w-full h-full flex flex-col">
      {/* Selector de página (el wireframe es por-página) */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-line bg-surface overflow-x-auto">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wide shrink-0">{t('arch.wire.page')}</span>
        {spec.pages.map((p) => (
          <button key={p.id} onClick={() => setPageId(p.id)} className={`shrink-0 text-[12px] rounded-full px-3 py-1 border transition-colors ${p.id === pageId ? 'bg-accent text-white border-accent' : 'border-line text-muted hover:bg-raised'}`}>{p.name}</button>
        ))}
      </div>
      <div className="flex-1 min-h-0 arch-puck">
        <Puck key={pageId} config={config} data={data} onChange={sync} iframe={{ enabled: false }} overrides={{ header: () => <></> }} />
      </div>
    </div>
  )
}
