import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, X, Monitor, Smartphone, Copy, Download, Check, Sun, Moon, Ban } from 'lucide-react'
import { Button } from '../ui/Button'
import { SpecimenPreview } from './SpecimenPreview'
import { designMd, dimValueLabel, DIM_IDS, type AppliedStyle, type SpecimenContent, type StyleSpec } from '../../lib/styleData'

// "Abrir prueba" — página de DETALLE del estilo (patrón getdesign.md): preview light/dark + el DESIGN.md
// desglosado (paleta, tipografía, dimensiones, principios, anti-patterns, layout) + copiar/descargar.
// Render determinista del estudio (no agente). Solo-lectura: prueba la dirección, no genera el sitio.

// Variante oscura: mismos accent + fuentes, neutros invertidos (para el toggle light/dark).
const darkOf = (s: AppliedStyle): AppliedStyle => ({ ...s, bg: '#141210', surface: '#201C18', text: '#F2EEE6', muted: '#9E978B', line: '#2E2A25' })

const H = ({ children }: { children: React.ReactNode }) => <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{children}</div>

export function StyleProofOverlay({ open, spec, style, content, title, onClose }: { open: boolean; spec: StyleSpec | null; style: AppliedStyle | null; content: SpecimenContent; title: string; onClose: () => void }) {
  const { t } = useTranslation()
  const [dark, setDark] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open || !style || !spec) return null

  const shown = dark ? darkOf(style) : style
  const md = designMd(spec, style, title)
  const copy = () => navigator.clipboard?.writeText(md).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
    a.download = 'DESIGN.md'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const swatch = (label: string, hex: string) => (
    <div className="flex items-center gap-2">
      <span className="w-7 h-7 rounded-lg border border-line shrink-0" style={{ background: hex }} />
      <div className="leading-tight"><div className="text-[12px] text-content">{label}</div><div className="text-[11px] text-faint font-mono">{hex}</div></div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col animate-in fade-in duration-150">
      <header className="h-14 shrink-0 border-b border-line bg-surface px-4 flex items-center gap-3">
        <span className="text-accent-strong"><Eye size={18} /></span>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[14px] font-semibold text-content truncate">{title}</span>
          <span className="text-[11px] text-faint">{t('style.proof.sub')}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{t('style.proof.copyMd')}</Button>
          <Button size="sm" variant="secondary" onClick={download}><Download size={14} />DESIGN.md</Button>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label={t('style.proof.close')} title={t('style.proof.close')}><X size={16} /></Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="max-w-[1000px] mx-auto">
          {/* Encabezado */}
          <h1 className="font-display text-2xl font-bold text-content">{title}</h1>
          {spec.thesis && <p className="text-[15px] text-muted mt-1.5 leading-relaxed max-w-2xl italic">“{spec.thesis}”</p>}

          {/* Preview con toggles Desktop/Móvil + Claro/Oscuro */}
          <div className="flex items-center justify-between gap-3 mt-6 mb-3 flex-wrap">
            <H>{t('style.proof.preview')}</H>
            <div className="flex items-center gap-2">
              <div className="inline-flex border border-line rounded-lg overflow-hidden text-[12px]">
                <button onClick={() => setDevice('desktop')} className={`px-2.5 py-1 inline-flex items-center gap-1 ${device === 'desktop' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`} aria-label={t('style.proof.desktop')}><Monitor size={13} />{t('style.proof.desktop')}</button>
                <button onClick={() => setDevice('mobile')} className={`px-2.5 py-1 inline-flex items-center gap-1 ${device === 'mobile' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`} aria-label={t('style.proof.mobile')}><Smartphone size={13} />{t('style.proof.mobile')}</button>
              </div>
              <div className="inline-flex border border-line rounded-lg overflow-hidden text-[12px]">
                <button onClick={() => setDark(false)} className={`px-2.5 py-1 inline-flex items-center gap-1 ${!dark ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`} aria-label={t('style.proof.light')}><Sun size={13} />{t('style.proof.light')}</button>
                <button onClick={() => setDark(true)} className={`px-2.5 py-1 inline-flex items-center gap-1 ${dark ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`} aria-label={t('style.proof.dark')}><Moon size={13} />{t('style.proof.dark')}</button>
              </div>
            </div>
          </div>
          <div className="flex justify-center bg-raised border border-line rounded-2xl p-5">
            <div style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: device === 'mobile' ? 375 : 900 }}>
              <SpecimenPreview style={shown} content={content} full compact={device === 'mobile'} />
            </div>
          </div>

          {/* DESIGN.md desglosado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div>
              <H>{t('style.proof.palette')}</H>
              <div className="grid grid-cols-2 gap-2.5">
                {swatch(t('style.proof.accent'), style.accent)}
                {swatch('bg', style.bg)}
                {swatch('surface', style.surface)}
                {swatch('text', style.text)}
                {swatch('line', style.line)}
              </div>
            </div>
            <div>
              <H>{t('style.proof.typography')}</H>
              <div style={{ fontFamily: style.headlineFamily }} className="text-[22px] text-content leading-tight">Aa Bb Cc</div>
              <div className="text-[11px] text-faint font-mono mt-0.5 truncate">{style.headlineFamily}</div>
              <div style={{ fontFamily: style.bodyFamily }} className="text-[14px] text-muted mt-2">Texto de cuerpo — {style.bodyFamily.split(',')[0]}</div>
            </div>
          </div>

          <div className="mt-6">
            <H>{t('style.proof.dims')}</H>
            <div className="flex flex-wrap gap-1.5">
              {DIM_IDS.map((id) => (
                <span key={id} className="text-[12px] rounded-full border border-line px-2.5 py-1 text-muted">{t(`style.dim.${id}`)}: <span className="text-content">{dimValueLabel(id, spec.dims[id])}</span></span>
              ))}
            </div>
          </div>

          {spec.principles.length > 0 && (
            <div className="mt-6">
              <H>{t('style.proof.principles')}</H>
              <div className="flex flex-col gap-1.5">
                {spec.principles.map((p, i) => <span key={i} className="text-[13px] text-muted flex items-start gap-2"><span className="w-1 h-1 rounded-full shrink-0 mt-2" style={{ background: 'var(--color-muted)' }} />{p}</span>)}
              </div>
            </div>
          )}

          <div className="mt-6">
            <H>{t('style.antiTitle')}</H>
            <div className="flex flex-wrap gap-1.5">
              {spec.antiPatterns.map((a, i) => <span key={i} className="text-[12px] rounded-full px-2.5 py-0.5 bg-danger-soft text-danger-strong inline-flex items-center gap-1"><Ban size={11} />{a}</span>)}
            </div>
          </div>

          <div className="mt-6 mb-4">
            <H>{t('style.proof.layout')}</H>
            <div className="space-y-1.5">
              {([['hero', spec.layout.hero], ['section', spec.layout.section], ['card', spec.layout.card]] as const).map(([k, s]) => (
                <div key={k} className="text-[12px] text-muted"><span className="text-content font-medium">{k}:</span> {s.composition}{s.forbidden.length > 0 && <span className="text-danger-strong"> · evita {s.forbidden.join(', ')}</span>}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
