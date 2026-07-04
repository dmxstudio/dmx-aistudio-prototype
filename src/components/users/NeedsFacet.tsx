import { useState, type ReactNode } from 'react'
import { Target, HeartCrack, AlertTriangle, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { covKey, type UserSegment, type UserGoal, type PainPoint, type GoalKind, type Evidence } from '../../lib/usersData'

// U1 — Facet Metas & Dolores (editable). Metas en historia de usuario (persona) o calidad; dolores
// como lista propia con ids; el enlace meta→dolor es muchos-a-muchos (co-ubicado + bandeja sin-cubrir).

const EVS: Evidence[] = ['fact', 'assumption', 'risk']

// id incremental colisión-proof (lee los ids actuales del segmento).
const nextId = (prefix: string, items: { id: string }[]) => {
  let max = 0
  items.forEach((x) => { const m = new RegExp(`^${prefix}(\\d+)$`).exec(x.id); if (m) max = Math.max(max, +m[1]) })
  return `${prefix}${max + 1}`
}

type T = (k: string, o?: Record<string, unknown>) => string

function Chips<V extends string>({ value, options, label, onPick }: { value: V; options: V[]; label: (v: V) => string; onPick: (v: V) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onPick(o)} className={`text-[12px] rounded-full px-3 py-1 border transition-colors ${value === o ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{label(o)}</button>
      ))}
    </div>
  )
}
const field = (label: string, node: ReactNode) => (
  <label className="block mb-3"><span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{label}</span>{node}</label>
)
const input = 'w-full text-[13px] rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-content'

function GoalModal({ seg, draft, onClose, onSave, t }: { seg: UserSegment; draft: UserGoal; onClose: () => void; onSave: (g: UserGoal) => void; t: T }) {
  const [g, setG] = useState<UserGoal>(draft)
  const set = (patch: Partial<UserGoal>) => setG((p) => ({ ...p, ...patch }))
  const setStory = (patch: Partial<UserGoal['story']>) => setG((p) => ({ ...p, story: { ...p.story, ...patch } }))
  const togglePain = (pid: string) => set({ resolvesPainIds: g.resolvesPainIds.includes(pid) ? g.resolvesPainIds.filter((x) => x !== pid) : [...g.resolvesPainIds, pid] })
  return (
    <Modal open onClose={onClose} title={t('users.editGoal')} size="md"
      footer={<><Button variant="ghost" onClick={onClose}>{t('users.cancel')}</Button><Button variant="primary" onClick={() => onSave(g)}><Check size={15} />{t('users.save')}</Button></>}>
      {field(t('users.goalKind'), <Chips value={g.kind} options={['persona', 'quality'] as GoalKind[]} label={(v) => t(`users.kind${v === 'persona' ? 'Persona' : 'Quality'}`)} onPick={(v) => set({ kind: v })} />)}
      {g.kind === 'persona' ? (
        <>
          {field(t('users.role'), <input className={input} value={g.story.role} onChange={(e) => setStory({ role: e.target.value })} />)}
          {field(t('users.want'), <input className={input} value={g.story.want} onChange={(e) => setStory({ want: e.target.value })} />)}
          {field(t('users.soFar'), <input className={input} value={g.story.soFar} onChange={(e) => setStory({ soFar: e.target.value })} />)}
        </>
      ) : (
        field(t('users.qualityGoalLabel'), <input className={input} value={g.story.want} onChange={(e) => setStory({ want: e.target.value })} />)
      )}
      {field(t('users.acceptanceLabel'), <input className={input} value={g.acceptance} onChange={(e) => set({ acceptance: e.target.value })} />)}
      {field(t('users.evidenceLabel'), <Chips value={g.evidence} options={EVS} label={(v) => t(`users.evidence.${v}`)} onPick={(v) => set({ evidence: v })} />)}
      {seg.pains.length > 0 && field(t('users.linkedPains'), (
        <div className="flex flex-col gap-1.5">
          {seg.pains.map((p) => (
            <button key={p.id} type="button" onClick={() => togglePain(p.id)} className={`text-left text-[13px] rounded-lg border px-2.5 py-1.5 inline-flex items-center gap-2 ${g.resolvesPainIds.includes(p.id) ? 'border-accent bg-accent-soft' : 'border-line hover:bg-raised'}`}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${g.resolvesPainIds.includes(p.id) ? 'bg-accent border-accent text-white' : 'border-line'}`}>{g.resolvesPainIds.includes(p.id) && <Check size={11} />}</span>
              <span className="text-content">{p.text}</span>
            </button>
          ))}
        </div>
      ))}
    </Modal>
  )
}

function PainModal({ draft, onClose, onSave, t }: { draft: PainPoint; onClose: () => void; onSave: (p: PainPoint) => void; t: T }) {
  const [p, setP] = useState<PainPoint>(draft)
  return (
    <Modal open onClose={onClose} title={t('users.editPain')} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>{t('users.cancel')}</Button><Button variant="primary" onClick={() => onSave(p)}><Check size={15} />{t('users.save')}</Button></>}>
      {field(t('users.painText'), <input className={input} value={p.text} onChange={(e) => setP((x) => ({ ...x, text: e.target.value }))} />)}
      {field(t('users.evidenceLabel'), <Chips value={p.evidence} options={EVS} label={(v) => t(`users.evidence.${v}`)} onPick={(v) => setP((x) => ({ ...x, evidence: v }))} />)}
    </Modal>
  )
}

export function NeedsFacet({ seg, updateSeg, coverage, onPruneCov, t }: { seg: UserSegment; updateSeg: (fn: (s: UserSegment) => UserSegment) => void; coverage?: { goals: Set<string>; pains: Set<string> }; onPruneCov?: (keys: string[]) => void; t: T }) {
  const [goalDraft, setGoalDraft] = useState<UserGoal | null>(null)
  const [painDraft, setPainDraft] = useState<PainPoint | null>(null)

  const painText = (id: string) => seg.pains.find((p) => p.id === id)?.text ?? id
  const linked = new Set(seg.goals.flatMap((g) => g.resolvesPainIds))
  const orphanPains = seg.pains.filter((p) => !linked.has(p.id))

  const saveGoal = (g: UserGoal) => {
    updateSeg((s) => ({ ...s, goals: s.goals.some((x) => x.id === g.id) ? s.goals.map((x) => (x.id === g.id ? g : x)) : [...s.goals, g] }))
    setGoalDraft(null)
  }
  const delGoal = (id: string) => { onPruneCov?.([covKey(seg.id, id)]); updateSeg((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })) }
  const savePain = (p: PainPoint) => {
    updateSeg((s) => ({ ...s, pains: s.pains.some((x) => x.id === p.id) ? s.pains.map((x) => (x.id === p.id ? p : x)) : [...s.pains, p] }))
    setPainDraft(null)
  }
  // Borrar un dolor limpia su id en las metas (resolvesPainIds) Y en el journey (painIds) Y en las
  // etiquetas de cobertura de Arquitectura — sin refs colgantes.
  const delPain = (id: string) => { onPruneCov?.([covKey(seg.id, id)]); updateSeg((s) => ({
    ...s,
    pains: s.pains.filter((p) => p.id !== id),
    goals: s.goals.map((g) => ({ ...g, resolvesPainIds: g.resolvesPainIds.filter((x) => x !== id) })),
    journey: s.journey.map((st) => ({ ...st, painIds: st.painIds.filter((x) => x !== id) })),
  })) }

  const newGoal = (kind: GoalKind): UserGoal => ({ id: nextId('gl-u', seg.goals), kind, story: { role: kind === 'persona' ? (seg.persona.handle || t('users.someone')) : '', want: '', soFar: '' }, acceptance: '', resolvesPainIds: [], evidence: 'assumption' })

  return (
    <div className="space-y-2.5">
      {seg.goals.length === 0 && <p className="text-[13px] text-faint">{t('users.noGoals')}</p>}
      {seg.goals.map((g) => (
        <div key={g.id} className="border border-line rounded-xl p-3 group">
          <div className="flex items-start gap-2">
            <div className="text-[14px] leading-relaxed text-content flex-1">
              {g.kind === 'quality'
                ? <span><span className="text-[11px] bg-accent-soft text-accent-strong rounded-full px-2 py-0.5 mr-1.5">{t('users.goalQuality')}</span>{g.story.want || <span className="text-faint">{t('users.emptyGoal')}</span>}</span>
                : <span><span className="text-muted">{t('users.storyAs')}</span> {g.story.role}, <span className="text-muted">{t('users.storyWant')}</span> {g.story.want || <span className="text-faint">…</span>}, <span className="text-muted">{t('users.storySo')}</span> {g.story.soFar || <span className="text-faint">…</span>}.</span>}
            </div>
            <div className="flex gap-0.5 shrink-0">
              <button onClick={() => setGoalDraft(g)} className="text-muted hover:text-accent-strong p-1" aria-label={t('users.editGoal')}><Pencil size={13} /></button>
              <button onClick={() => delGoal(g.id)} className="text-muted hover:text-danger-strong p-1" aria-label={t('users.delete')}><Trash2 size={13} /></button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {g.acceptance && <span className="text-[12px] text-muted bg-raised border border-line rounded-full px-2.5 py-0.5 inline-flex items-center gap-1"><Target size={11} />{t('users.acceptance')}: {g.acceptance}</span>}
            {coverage?.goals.has(g.id) && <span className="text-[12px] bg-success-soft text-success-strong rounded-full px-2.5 py-0.5 inline-flex items-center gap-1"><Check size={11} />{t('users.addressed')}</span>}
            {g.resolvesPainIds.map((pid) => <span key={pid} className="text-[12px] bg-danger-soft text-danger-strong rounded-full px-2.5 py-0.5 inline-flex items-center gap-1"><HeartCrack size={11} />{t('users.resolves')} · {painText(pid)}</span>)}
          </div>
        </div>
      ))}

      <div className="flex gap-2 flex-wrap pt-1">
        <Button size="sm" variant="secondary" onClick={() => setGoalDraft(newGoal('persona'))}><Plus size={14} />{t('users.addGoalPersona')}</Button>
        <Button size="sm" variant="ghost" onClick={() => setGoalDraft(newGoal('quality'))}><Plus size={14} />{t('users.addGoalQuality')}</Button>
        <Button size="sm" variant="ghost" onClick={() => setPainDraft({ id: nextId('pn-u', seg.pains), text: '', evidence: 'assumption' })}><Plus size={14} />{t('users.addPain')}</Button>
      </div>

      {/* Bandeja de dolores sin meta que los cubra + edición de dolores */}
      {seg.pains.length > 0 && (
        <div className="border border-line rounded-xl p-3 mt-1">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 inline-flex items-center gap-1.5"><HeartCrack size={12} className="text-danger-strong" />{t('users.painsTitle')}</div>
          <div className="flex flex-col gap-1.5">
            {seg.pains.map((p) => {
              const covered = linked.has(p.id)
              const resolved = coverage?.pains.has(p.id)
              return (
                <div key={p.id} className={`flex items-center gap-2 text-[13px] rounded-lg px-2.5 py-1.5 ${covered ? 'bg-raised' : 'bg-warning-soft/50 border border-warning-soft'}`}>
                  {!covered && <AlertTriangle size={12} className="text-warning-strong shrink-0" />}
                  <span className="text-content flex-1">{p.text || <span className="text-faint">{t('users.emptyPain')}</span>}</span>
                  {resolved && <span className="text-[10px] bg-success-soft text-success-strong rounded-full px-1.5 py-0.5 inline-flex items-center gap-0.5"><Check size={10} />{t('users.resolved')}</span>}
                  {!covered && <span className="text-[10px] text-warning-strong">{t('users.uncovered')}</span>}
                  <button onClick={() => setPainDraft(p)} className="text-muted hover:text-accent-strong p-0.5" aria-label={t('users.editPain')}><Pencil size={12} /></button>
                  <button onClick={() => delPain(p.id)} className="text-muted hover:text-danger-strong p-0.5" aria-label={t('users.delete')}><Trash2 size={12} /></button>
                </div>
              )
            })}
          </div>
          {orphanPains.length > 0 && <div className="text-[11px] text-warning-strong mt-2">{t('users.uncoveredHint', { n: orphanPains.length })}</div>}
        </div>
      )}

      {goalDraft && <GoalModal seg={seg} draft={goalDraft} onClose={() => setGoalDraft(null)} onSave={saveGoal} t={t} />}
      {painDraft && <PainModal draft={painDraft} onClose={() => setPainDraft(null)} onSave={savePain} t={t} />}
    </div>
  )
}
