import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { SwatchBook, X, Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { SpecimenPreview } from './SpecimenPreview'
import { DIM_IDS, FAMILY_IDS, dimValueLabel, styleFromSpec, familyToSpec, specimenContent, type StyleFamily, type DimId, type LayoutSection } from '../../lib/styleData'

const LAYOUT_KEYS = ['hero', 'section', 'card'] as const

// Editor de una FAMILIA (house style) — overlay full-screen (patrón Abrir-editor). Izquierda: campos
// (nombre, tesis, 11 dimensiones, principios, anti-patterns, imagen, motion). Derecha: SPECIMEN en vivo
// (mismo render determinista del cockpit). Es autoría de la librería a nivel workspace (taste corpus).

const INPUT = 'w-full text-[13px] rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-content'

function ChipList({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('')
  const add = () => { const v = draft.trim(); if (v && !items.includes(v)) onChange([...items, v]); setDraft('') }
  return (
    <div>
      <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((it, i) => (
          <span key={`${it}-${i}`} className="inline-flex items-center gap-1.5 text-[12px] rounded-full border border-line px-2.5 py-1 text-content">
            {it}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-muted hover:text-danger-strong" aria-label="×"><Trash2 size={12} /></button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} placeholder={placeholder} className={INPUT} />
        <Button size="sm" variant="ghost" onClick={add}><Plus size={14} /></Button>
      </div>
    </div>
  )
}

export function FamilyEditor({ family, onClose, onSave }: { family: StyleFamily | null; onClose: () => void; onSave: (f: StyleFamily) => void }) {
  const { t } = useTranslation()
  // Se remonta por `key={editing?.id}` en el padre → useState re-inicializa al cambiar de familia.
  const [f, setF] = useState<StyleFamily | null>(family)
  useEffect(() => {
    if (!family) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [family, onClose])
  if (!family || !f) return null

  const set = (patch: Partial<StyleFamily>) => setF((p) => (p ? { ...p, ...patch } : p))
  const setDim = (id: DimId, v: number) => setF((p) => (p ? { ...p, dims: { ...p.dims, [id]: v } } : p))
  const setLayout = (key: (typeof LAYOUT_KEYS)[number], patch: Partial<LayoutSection>) =>
    setF((p) => (p ? { ...p, layout: { ...p.layout, [key]: { ...p.layout[key], ...patch } } } : p))
  const applied = styleFromSpec(familyToSpec(f))
  const canon = specimenContent(null, '')
  // El nombre de una base es su identidad (vive en i18n) → fijo aquí; se renombra duplicando. Su Guardar
  // no depende del campo nombre (siempre ok). Un custom sí requiere nombre no vacío.
  const isBase = FAMILY_IDS.includes(f.id)
  const nameOk = isBase || (f.name ?? '').trim().length > 0

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col animate-in fade-in duration-150">
      <header className="h-14 shrink-0 border-b border-line bg-surface px-4 flex items-center gap-3">
        <span className="text-accent-strong"><SwatchBook size={18} /></span>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold text-content">{t('styleLib.editorTitle')}</span>
          <span className="text-[11px] text-faint">{t('styleLib.editorSub')}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span title={!nameOk ? t('styleLib.needName') : undefined}>
            <Button size="sm" variant="primary" onClick={() => nameOk && onSave(f)} disabled={!nameOk}><Check size={14} />{t('styleLib.save')}</Button>
          </span>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label={t('styleLib.close')} title={t('styleLib.close')}><X size={16} /></Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Campos */}
          <div className="space-y-4">
            <label className="block">
              <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1.5">{t('styleLib.name')}</span>
              {isBase ? (
                <>
                  <input value={t(`style.family.${f.id}`)} disabled className={`${INPUT} opacity-60 cursor-not-allowed`} />
                  <span className="block text-[11px] text-faint mt-1">{t('styleLib.baseNameLocked')}</span>
                </>
              ) : (
                <input value={f.name ?? ''} onChange={(e) => set({ name: e.target.value })} placeholder={t('styleLib.namePh')} className={INPUT} />
              )}
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1.5">{t('styleLib.thesis')}</span>
              <textarea value={f.thesis} onChange={(e) => set({ thesis: e.target.value })} rows={2} placeholder={t('styleLib.thesisPh')} className={INPUT} />
            </label>

            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{t('styleLib.dims')}</div>
              {DIM_IDS.map((id) => (
                <div key={id} className="flex items-center gap-3 my-2">
                  <label className="text-[13px] text-muted w-24 shrink-0">{t(`style.dim.${id}`)}</label>
                  <input type="range" min={0} max={100} value={f.dims[id] ?? 50} onChange={(e) => setDim(id, +e.target.value)} className="flex-1" />
                  <span className="text-[12px] w-20 shrink-0 text-right text-content">{dimValueLabel(id, f.dims[id] ?? 50)}</span>
                </div>
              ))}
            </div>

            <ChipList label={t('styleLib.principles')} items={f.principles} onChange={(v) => set({ principles: v })} placeholder={t('styleLib.addPrinciple')} />
            <ChipList label={t('styleLib.antiPatterns')} items={f.antiPatterns} onChange={(v) => set({ antiPatterns: v })} placeholder={t('styleLib.addAnti')} />

            <label className="block">
              <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1.5">{t('styleLib.imagery')}</span>
              <input value={f.imagery} onChange={(e) => set({ imagery: e.target.value })} className={INPUT} />
            </label>
            <label className="block">
              <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1.5">{t('styleLib.motion')}</span>
              <input value={f.motion} onChange={(e) => set({ motion: e.target.value })} className={INPUT} />
            </label>

            <div>
              <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{t('styleLib.layout')}</div>
              <div className="space-y-3">
                {LAYOUT_KEYS.map((key) => (
                  <div key={key} className="border border-line rounded-xl p-3">
                    <div className="text-[12px] font-medium text-content mb-1.5">{key}</div>
                    <input value={f.layout[key].composition} onChange={(e) => setLayout(key, { composition: e.target.value })} placeholder={t('styleLib.compositionPh')} className={`${INPUT} mb-2`} />
                    <ChipList label={t('styleLib.forbidden')} items={f.layout[key].forbidden} onChange={(v) => setLayout(key, { forbidden: v })} placeholder={t('styleLib.addForbidden')} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Specimen en vivo */}
          <div className="lg:sticky lg:top-0 h-fit">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{t('styleLib.preview')}</div>
            <SpecimenPreview style={applied} content={canon} full />
            <p className="text-[11px] text-faint mt-2">{t('styleLib.previewNote')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
