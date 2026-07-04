import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Maximize2, X, Route } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import type { UserSegment, JourneyStage } from '../../lib/usersData'

// U2 — Facet Journey como stage-map EDITABLE (secuencia de etapas × carriles contexto/emoción/dolores).
// No es un grafo libre: las etapas son columnas ordenadas; los dolores aparecen donde muerden.
// Reordenar es una acción DIRECTA en la grilla (◀ ▶); editar abre el modal — nunca se mezclan.

type T = (k: string, o?: Record<string, unknown>) => string
const EMOS: { v: number; k: string }[] = [{ v: -2, k: 'vlow' }, { v: -1, k: 'low' }, { v: 0, k: 'mid' }, { v: 1, k: 'high' }, { v: 2, k: 'vhigh' }]
const emoColor = (e: number) => (e > 0 ? 'var(--color-success-strong)' : e < 0 ? 'var(--color-danger-strong)' : 'var(--color-faint)')
const emoTop = (e: number) => 50 - (e / 2) * 34 // -2..2 → 84%..16% (más aire vertical, la línea neutra al centro)
const nextId = (items: { id: string }[]) => {
  let max = 0
  items.forEach((x) => { const m = /^stg-(\d+)$/.exec(x.id); if (m) max = Math.max(max, +m[1]) })
  return `stg-${max + 1}`
}
const input = 'w-full text-[13px] rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-content'

function StageModal({ seg, draft, onClose, onSave, onDelete, t }: { seg: UserSegment; draft: JourneyStage; onClose: () => void; onSave: (s: JourneyStage) => void; onDelete: () => void; t: T }) {
  const [s, setS] = useState<JourneyStage>(draft)
  const set = (patch: Partial<JourneyStage>) => setS((p) => ({ ...p, ...patch }))
  const togglePain = (pid: string) => set({ painIds: s.painIds.includes(pid) ? s.painIds.filter((x) => x !== pid) : [...s.painIds, pid] })
  return (
    <Modal open onClose={onClose} title={t('users.editStage')} size="sm"
      footer={<>
        <Button variant="ghost" className="text-danger-strong mr-auto" onClick={onDelete}><Trash2 size={15} />{t('users.delete')}</Button>
        <Button variant="ghost" onClick={onClose}>{t('users.cancel')}</Button>
        <Button variant="primary" onClick={() => onSave(s)}><Check size={15} />{t('users.save')}</Button>
      </>}>
      <label className="block mb-3"><span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('users.stageLabel')}</span><input className={input} value={s.label} onChange={(e) => set({ label: e.target.value })} /></label>
      <label className="block mb-3"><span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('users.laneContext')}</span><input className={input} value={s.context} onChange={(e) => set({ context: e.target.value })} /></label>
      <div className="mb-3">
        <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('users.laneEmotion')}</span>
        <div className="flex gap-1.5 flex-wrap">
          {EMOS.map((e) => (
            <button key={e.v} type="button" onClick={() => set({ emotion: e.v })} className={`text-[12px] rounded-full px-3 py-1 border transition-colors ${s.emotion === e.v ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{t(`users.emo.${e.k}`)}</button>
          ))}
        </div>
      </div>
      {seg.pains.length > 0 && (
        <div className="mb-1">
          <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('users.stagePains')}</span>
          <div className="flex flex-col gap-1.5">
            {seg.pains.map((p) => (
              <button key={p.id} type="button" onClick={() => togglePain(p.id)} className={`text-left text-[13px] rounded-lg border px-2.5 py-1.5 inline-flex items-center gap-2 ${s.painIds.includes(p.id) ? 'border-accent bg-accent-soft' : 'border-line hover:bg-raised'}`}>
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${s.painIds.includes(p.id) ? 'bg-accent border-accent text-white' : 'border-line'}`}>{s.painIds.includes(p.id) && <Check size={11} />}</span>
                <span className="text-content">{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

export function JourneyFacet({ seg, updateSeg, t }: { seg: UserSegment; updateSeg: (fn: (s: UserSegment) => UserSegment) => void; t: T }) {
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const stages = seg.journey
  const painText = (id: string) => seg.pains.find((p) => p.id === id)?.text ?? id
  const n = stages.length

  const addStage = () => updateSeg((s) => ({ ...s, journey: [...s.journey, { id: nextId(s.journey), label: t('users.newStage'), context: s.context.device, emotion: 0, painIds: [] }] }))
  const saveStage = (i: number, st: JourneyStage) => { updateSeg((s) => ({ ...s, journey: s.journey.map((x, idx) => (idx === i ? st : x)) })); setEditIdx(null) }
  const delStage = (i: number) => { updateSeg((s) => ({ ...s, journey: s.journey.filter((_, idx) => idx !== i) })); setEditIdx(null) }
  // Reordenar directo (no en el modal): intercambia con la etapa vecina.
  const moveStage = (i: number, dir: -1 | 1) => updateSeg((s) => { const j = i + dir; if (j < 0 || j >= s.journey.length) return s; const arr = [...s.journey];[arr[i], arr[j]] = [arr[j], arr[i]]; return { ...s, journey: arr } })

  const [full, setFull] = useState(false)
  useEffect(() => {
    if (!full) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [full])
  const emoLabel = (e: number) => t(`users.emo.${EMOS.find((x) => x.v === e)?.k ?? 'mid'}`)
  const pts = stages.map((s, i) => `${((i + 0.5) / n) * 100},${emoTop(s.emotion)}`).join(' ')

  // El stage-map, reutilizable inline y a pantalla completa.
  const grid = n === 0 ? (
    <p className="text-[13px] text-faint">{t('users.noJourney')}</p>
  ) : (
    <div className="overflow-x-auto pb-1">
      <div className="grid gap-x-2 gap-y-2" style={{ gridTemplateColumns: `70px repeat(${n}, minmax(190px, 1fr))` }}>
        {/* etapas (encabezado, editable, con reorden) */}
        <div />
        {stages.map((s, i) => (
          <div key={s.id} className="bg-raised rounded-lg flex items-center gap-1 px-1.5 py-1.5 min-h-[40px]">
            <button onClick={() => moveStage(i, -1)} disabled={i === 0} className="text-faint hover:text-accent-strong disabled:opacity-30 shrink-0" aria-label={t('users.moveLeft')}><ChevronLeft size={14} /></button>
            <button onClick={() => setEditIdx(i)} className="text-[12px] font-medium text-content hover:text-accent-strong flex-1 text-center leading-tight min-w-0" title={t('users.editStage')}>{s.label}</button>
            <button onClick={() => moveStage(i, 1)} disabled={i === n - 1} className="text-faint hover:text-accent-strong disabled:opacity-30 shrink-0" aria-label={t('users.moveRight')}><ChevronRight size={14} /></button>
          </div>
        ))}
        {/* contexto (envuelve) */}
        <div className="text-[11px] text-muted uppercase tracking-wide self-start pt-1">{t('users.laneContext')}</div>
        {stages.map((s) => <div key={s.id} className="text-[12px] text-muted leading-snug self-start pt-1 px-1.5 break-words">{s.context}</div>)}
        {/* emoción: puntos HTML redondos (no se deforman) + línea + baseline, con aire vertical */}
        <div className="text-[11px] text-muted uppercase tracking-wide self-center">{t('users.laneEmotion')}</div>
        <div style={{ gridColumn: `2 / span ${n}` }} className="relative h-32">
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-line" />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={pts} fill="none" stroke="var(--color-accent-strong)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {stages.map((s, i) => (
            <div key={s.id} title={emoLabel(s.emotion)} className="absolute w-2.5 h-2.5 rounded-full ring-2 ring-surface" style={{ left: `${((i + 0.5) / n) * 100}%`, top: `${emoTop(s.emotion)}%`, transform: 'translate(-50%, -50%)', background: emoColor(s.emotion) }} />
          ))}
        </div>
        {/* dolores (bloques que envuelven) */}
        <div className="text-[11px] text-muted uppercase tracking-wide self-start pt-1">{t('users.laneP')}</div>
        {stages.map((s) => (
          <div key={s.id} className="flex flex-col gap-1 px-0.5">
            {s.painIds.map((pid) => <span key={pid} className="text-[11px] bg-danger-soft text-danger-strong rounded-lg px-2 py-1 leading-tight break-words">{painText(pid)}</span>)}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <span className="text-[12px] text-muted">{t('users.journeyHint')}</span>
        <div className="flex gap-2">
          {n > 0 && <Button size="sm" variant="ghost" onClick={() => setFull(true)} aria-label={t('users.fullscreen')} title={t('users.fullscreen')}><Maximize2 size={14} /></Button>}
          <Button size="sm" variant="secondary" onClick={addStage}><Plus size={14} />{t('users.addStage')}</Button>
        </div>
      </div>
      {grid}

      {/* Pantalla completa: mismo stage-map con todo el ancho (menos scroll, más aire) */}
      {full && (
        <div className="fixed inset-0 z-40 bg-canvas flex flex-col animate-in fade-in duration-150">
          <header className="h-14 shrink-0 border-b border-line bg-surface px-4 flex items-center gap-3">
            <span className="text-accent-strong"><Route size={18} /></span>
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold text-content">{t('users.facetJourney')} · {seg.name}</span>
              <span className="text-[11px] text-faint">{t('users.journeyHint')}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={addStage}><Plus size={14} />{t('users.addStage')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setFull(false)} aria-label={t('users.exitFullscreen')} title={t('users.exitFullscreen')}><X size={16} /></Button>
            </div>
          </header>
          <div className="flex-1 min-h-0 overflow-auto p-6">{grid}</div>
        </div>
      )}

      {editIdx != null && stages[editIdx] && (
        <StageModal seg={seg} draft={stages[editIdx]} onClose={() => setEditIdx(null)} onSave={(st) => saveStage(editIdx, st)} onDelete={() => delStage(editIdx)} t={t} />
      )}
    </div>
  )
}
