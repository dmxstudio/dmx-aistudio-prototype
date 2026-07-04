import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Users as UsersIcon, FileText, Upload, GitBranch, Wand2, ArrowRight, Braces, Download, Copy, Check, RotateCcw, RotateCw, AlertTriangle, CircleCheck, Plus, Trash2, Target, HeartCrack, Route, ClipboardCheck, Cpu, Network } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EnginePill } from '../components/models/EnginePill'
import { NeedsFacet } from '../components/users/NeedsFacet'
import { JourneyFacet } from '../components/users/JourneyFacet'
import { UserMap } from '../components/users/UserMap'
import { useWorkspace } from '../lib/workspace'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { loadSections, usePersistentValue } from '../lib/store'
import { seedBrief, type BriefSection } from '../data/brief'
import { brandSections, seedMeridianBranding, brandGateIds, type BrandSection } from '../data/branding'
import { buildUsersSpec, emptySegment, usersCounts, segmentSignature, segmentStatus, covKey, type UsersSpec, type UserSegment, type UsersApprovals, type UserStatus, type Evidence } from '../lib/usersData'
import type { ArchSpec } from '../lib/archData'

// El usuario (U0) — HUB generador-primero + master-detail por segmento. La médula es el grafo de
// aceptación segmento→meta→dolor (users.json). Facetas Metas&Dolores / Journey son la cara humana.
const seedBrandingRead = (id: string): BrandSection[] =>
  id === 'p1' ? brandSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f })) })) : id === 'p4' ? seedMeridianBranding() : brandSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f, value: '', status: 'empty' as const, rows: undefined })) }))

const EV_TONE: Record<Evidence, 'success' | 'warning' | 'danger'> = { fact: 'success', assumption: 'warning', risk: 'danger' }

export function Users() {
  const { t } = useTranslation()
  const { activeProject } = useWorkspace()
  const engineLabel = useWorkspaceModels().effectiveEngine('users')?.label
  const projectId = activeProject?.id ?? 'p1'
  const projectName = activeProject?.name ?? ''

  const [usersSpec, setUsersSpec] = usePersistentValue<UsersSpec | null>('usersSpec', projectId, null)
  const [usersSource, setUsersSource] = usePersistentValue<string>('usersSource', projectId, 'brief')
  const [usersApproved, setUsersApproved] = usePersistentValue<UsersApprovals>('usersApproved', projectId, {})
  const [selId, setSelId] = useState<string>('')
  const [facet, setFacet] = useState<'needs' | 'journey'>('needs')
  const [jsonOpen, setJsonOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const brief = useMemo(() => loadSections<BriefSection>('brief', projectId, () => seedBrief(projectId)), [projectId])
  const branding = useMemo(() => loadSections<BrandSection>('branding', projectId, () => seedBrandingRead(projectId)), [projectId])
  // Gate vivo del kickstart: readiness real del Brief (% requeridos cerrados) + de la Marca (gate).
  const briefReadiness = useMemo(() => {
    const req = brief.flatMap((s) => s.fields).filter((f) => f.required)
    return req.length ? Math.round((100 * req.filter((f) => f.status === 'closed').length) / req.length) : 0
  }, [brief])
  const brandReady = useMemo(() => {
    const f = branding.flatMap((s) => s.fields)
    return f.filter((x) => brandGateIds.includes(x.id) && x.status === 'closed').length === brandGateIds.length
  }, [branding])

  const ev = (label: string, ev: Evidence) => <Badge tone={EV_TONE[ev]}>{t(`users.evidence.${ev}`)} · {label}</Badge>
  const jsonText = useMemo(() => (usersSpec ? JSON.stringify(usersSpec, null, 2) : ''), [usersSpec])
  const counts = usersSpec ? usersCounts(usersSpec) : { segments: 0, goals: 0, pains: 0 }

  // U3 cobertura: lee (y poda) el spec de Arquitectura (productor) y mide qué metas/dolores están atendidos.
  const [archSpec, setArchSpec] = usePersistentValue<ArchSpec | null>('archSpec', projectId, null)
  const covered = useMemo(() => {
    const addr = new Set<string>(); const reso = new Set<string>()
    ;(archSpec?.pages ?? []).forEach((p) => { (p.addresses ?? []).forEach((k) => addr.add(k)); (p.resolves ?? []).forEach((k) => reso.add(k)) })
    return { addr, reso }
  }, [archSpec])
  const coverage = usersSpec
    ? usersSpec.segments.reduce((acc, s) => {
      s.goals.forEach((g) => { if (covered.addr.has(covKey(s.id, g.id))) acc.goalsAddressed++ })
      s.pains.forEach((p) => { if (covered.reso.has(covKey(s.id, p.id))) acc.painsResolved++ })
      return acc
    }, { goalsAddressed: 0, painsResolved: 0 })
    : { goalsAddressed: 0, painsResolved: 0 }

  const generate = (source: string) => {
    setUsersSource(source)
    setUsersApproved({})
    const full = buildUsersSpec(brief, branding, projectName)
    setUsersSpec(source === 'scratch' ? { ...full, segments: [emptySegment('seg-1', t('users.firstSegment'))] } : full)
  }
  const downloadObj = (data: object | string, filename: string) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const copy = () => navigator.clipboard?.writeText(jsonText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})

  // Aprobación por segmento (firma de contenido; se reabre si editas después — cascada).
  const statusOf = (id: string): UserStatus => (usersSpec ? segmentStatus(usersSpec, usersApproved, id) : 'pending')
  const approveSeg = (id: string) => { if (usersSpec) setUsersApproved({ ...usersApproved, [id]: segmentSignature(usersSpec, id) }) }
  const approveAll = () => { if (usersSpec) setUsersApproved(Object.fromEntries(usersSpec.segments.map((s) => [s.id, segmentSignature(usersSpec, s.id)]))) }
  const approvedCount = usersSpec ? usersSpec.segments.filter((s) => statusOf(s.id) === 'approved').length : 0

  const addSegment = () => {
    if (!usersSpec) return
    // id colisión-proof desde los seg-N existentes (evita chocar con el 'seg-1' de "Desde cero").
    let max = 0
    usersSpec.segments.forEach((s) => { const m = /^seg-(\d+)$/.exec(s.id); if (m) max = Math.max(max, +m[1]) })
    const id = `seg-${max + 1}`
    setUsersSpec({ ...usersSpec, segments: [...usersSpec.segments, emptySegment(id, t('users.firstSegment'))] })
    setSelId(id)
  }
  // Poda las claves de cobertura de Arquitectura que ya no existen en El usuario (sin refs colgantes
  // ni falso-cubierto al reciclar un id). El productor (Arquitectura) queda consistente.
  const pruneArchCov = (keys: string[]) => {
    if (!archSpec || keys.length === 0) return
    const drop = new Set(keys)
    let changed = false
    const pages = archSpec.pages.map((p) => {
      const a = (p.addresses ?? []).filter((k) => !drop.has(k))
      const r = (p.resolves ?? []).filter((k) => !drop.has(k))
      if (a.length !== (p.addresses ?? []).length || r.length !== (p.resolves ?? []).length) { changed = true; return { ...p, addresses: a, resolves: r } }
      return p
    })
    if (changed) setArchSpec({ ...archSpec, pages })
  }
  const deleteSegment = (id: string) => {
    if (!usersSpec) return
    const seg = usersSpec.segments.find((s) => s.id === id)
    if (seg) pruneArchCov([...seg.goals.map((g) => covKey(id, g.id)), ...seg.pains.map((p) => covKey(id, p.id))])
    setUsersSpec({ ...usersSpec, segments: usersSpec.segments.filter((s) => s.id !== id) })
    // Limpia la aprobación del segmento borrado → un id seg-N reutilizado no hereda una firma vieja.
    if (usersApproved[id] != null) { const next = { ...usersApproved }; delete next[id]; setUsersApproved(next) }
  }
  const updateSegment = (id: string, fn: (s: UserSegment) => UserSegment) => {
    if (!usersSpec) return
    setUsersSpec({ ...usersSpec, segments: usersSpec.segments.map((s) => (s.id === id ? fn(s) : s)) })
  }

  // ── Kickstart ──────────────────────────────────────────────────────────────
  const card = (icon: ReactNode, title: string, desc: string, foot: ReactNode, onClick: () => void, recommended?: boolean, footTone: 'accent' | 'muted' = 'muted') => (
    <button onClick={onClick} className={`text-left rounded-xl p-4 transition-colors flex flex-col gap-2 ${recommended ? 'border-2 border-accent' : 'border border-line'} hover:bg-raised cursor-pointer`}>
      <div className="flex items-center gap-2">
        <span className="text-accent-strong">{icon}</span>
        <span className="text-[15px] font-medium text-content">{title}</span>
        {recommended && <span className="ml-auto text-[11px] font-medium bg-accent-soft text-accent-strong rounded-full px-2 py-0.5">{t('branding.kickstart.recommended')}</span>}
      </div>
      <p className="text-[13px] leading-snug text-muted">{desc}</p>
      <div className={`mt-0.5 inline-flex items-center gap-1.5 text-[12px] rounded-full px-2.5 py-1 w-fit ${footTone === 'accent' ? 'bg-accent-soft text-accent-strong' : 'border border-line text-muted'}`}>{foot}</div>
    </button>
  )
  const briefOk = briefReadiness >= 25
  const upstreamReady = briefOk && brandReady

  if (!usersSpec) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="users" /></div>
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 lg:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3"><UsersIcon size={22} className="text-accent-strong" /></div>
            <h2 className="font-display text-xl font-bold text-content">{t('users.kickstart.title')}</h2>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('users.kickstart.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {card(<FileText size={20} />, t('users.kickstart.fromBrief'), t('users.kickstart.fromBriefDesc'), <><CircleCheck size={14} />{upstreamReady ? t('users.kickstart.upstreamReady', { n: briefReadiness }) : t('users.kickstart.upstreamThin', { n: briefReadiness, marca: brandReady ? t('users.kickstart.marcaOk') : t('users.kickstart.marcaThin') })}</>, () => generate('brief'), true, upstreamReady ? 'accent' : 'muted')}
            {card(<Upload size={20} />, t('users.kickstart.import'), t('users.kickstart.importDesc'), <><ArrowRight size={14} />{t('users.kickstart.importFoot')}</>, () => generate('import'))}
            {card(<GitBranch size={20} />, t('users.kickstart.inherit'), t('users.kickstart.inheritDesc'), <><ArrowRight size={14} />{t('users.kickstart.inheritFoot')}</>, () => generate('inherit'))}
            {card(<Wand2 size={20} />, t('users.kickstart.scratch'), t('users.kickstart.scratchDesc'), <><ArrowRight size={14} />{t('users.kickstart.scratchFoot')}</>, () => generate('scratch'))}
          </div>
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-[12px] text-muted"><ClipboardCheck size={15} className="text-accent-strong shrink-0" />{t('users.kickstart.footHint')}</span>
            <span className="inline-flex items-center gap-2 text-[12px] text-faint sm:ml-auto"><Cpu size={15} className="shrink-0" />{t('users.kickstart.engine', { model: engineLabel ?? '—' })}</span>
          </div>
        </div>
      </div>
    )
  }

  const seg: UserSegment | undefined = usersSpec.segments.find((s) => s.id === selId) ?? usersSpec.segments[0]
  const sourceLabel = usersSource === 'import' ? t('users.sourceImport') : usersSource === 'inherit' ? t('users.sourceInherit') : usersSource === 'scratch' ? t('users.sourceScratch') : t('users.sourceBrief')
  const segCoverage = seg
    ? { goals: new Set(seg.goals.filter((g) => covered.addr.has(covKey(seg.id, g.id))).map((g) => g.id)), pains: new Set(seg.pains.filter((p) => covered.reso.has(covKey(seg.id, p.id))).map((p) => p.id)) }
    : { goals: new Set<string>(), pains: new Set<string>() }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="users" /></div>

      {/* Resumen + revisión */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[13px] text-muted inline-flex items-center gap-1.5"><Check size={13} className="text-success-strong" />{sourceLabel}</div>
            <div className="font-display text-lg font-bold text-content">{t('users.titleFor', { name: projectName || t('users.untitledProject') })}</div>
            <div className="text-[12px] text-faint mt-0.5">{t('users.summary', { segments: counts.segments, goals: counts.goals, pains: counts.pains })}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={() => setUsersSpec(null)}><RotateCcw size={14} />{t('arch.regenerate')}</Button>
            <Button size="sm" variant="secondary" onClick={() => setMapOpen(true)}><Network size={15} />{t('users.map.open')}</Button>
            <Button size="sm" variant="secondary" onClick={() => setJsonOpen(true)} aria-label="users.json" title="users.json"><Braces size={15} /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line flex-wrap">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide inline-flex items-center gap-1.5"><CircleCheck size={13} className="text-accent-strong" />{t('arch.review')}</span>
          {approvedCount === counts.segments && counts.segments > 0
            ? <Badge tone="success"><Check size={11} />{t('users.allApproved')}</Badge>
            : <span className="text-[12px] text-faint">{t('users.approvedCount', { n: approvedCount, total: counts.segments })}</span>}
          {approvedCount < counts.segments && <button onClick={approveAll} className="text-[12px] text-accent-strong hover:underline">{t('arch.approveAll')}</button>}
          <span className="ml-auto flex items-center gap-1.5 flex-wrap">
            <Badge tone={coverage.goalsAddressed >= counts.goals && counts.goals > 0 ? 'success' : 'neutral'}><Target size={11} />{t('users.covGoals', { n: coverage.goalsAddressed, total: counts.goals })}</Badge>
            {counts.pains === 0
              ? <Badge tone="neutral"><HeartCrack size={11} />{t('users.noPainsYet')}</Badge>
              : <Badge tone={counts.pains - coverage.painsResolved > 0 ? 'danger' : 'success'}><HeartCrack size={11} />{counts.pains - coverage.painsResolved > 0 ? t('users.covPainsOpen', { n: counts.pains - coverage.painsResolved }) : t('users.covPainsDone')}</Badge>}
          </span>
        </div>
      </div>

      {/* Master-detail */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        {/* Riel de segmentos */}
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-3 h-fit">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 px-1">{t('users.segments')}</div>
          <div className="flex flex-col gap-2">
            {usersSpec.segments.map((s) => {
              const active = s.id === seg?.id
              const st = statusOf(s.id)
              return (
                <button key={s.id} onClick={() => setSelId(s.id)} className={`text-left rounded-xl p-3 transition-colors ${active ? 'border-2 border-accent bg-raised' : 'border border-line hover:bg-raised'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-content flex-1 truncate">{s.name}</span>
                    {st === 'approved' ? <Check size={13} className="text-success-strong shrink-0" /> : st === 'outdated' ? <AlertTriangle size={12} className="text-warning-strong shrink-0" /> : null}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 truncate">{s.persona.handle || t(`users.kind.${s.kind}`)} · {s.context.device}</div>
                  <div className="mt-1.5"><Badge tone={EV_TONE[s.evidence]}>{t(`users.evidence.${s.evidence}`)}</Badge></div>
                </button>
              )
            })}
          </div>
          <button onClick={addSegment} className="text-[12px] text-accent-strong hover:bg-accent-soft rounded-lg px-2 py-1.5 mt-2 inline-flex items-center gap-1 w-full"><Plus size={14} />{t('users.addSegment')}</button>
        </div>

        {/* Detalle del segmento */}
        {seg && (
          <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-lg font-bold text-content">{seg.name}</span>
                  {ev(t(`users.kind.${seg.kind}`), seg.evidence)}
                </div>
                {seg.persona.handle && <div className="text-[13px] text-content mt-1">{seg.persona.handle}{seg.persona.quote && <span className="text-muted italic"> — “{seg.persona.quote}”</span>}</div>}
                <div className="text-[12px] text-faint mt-0.5">{t('users.device')}: {seg.context.device}</div>
              </div>
              <div className="flex items-center gap-2">
                {statusOf(seg.id) === 'approved'
                  ? <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-success-soft text-success-strong rounded-full px-3 py-1.5"><Check size={14} />{t('arch.status.approved')}</span>
                  : <Button size="sm" variant="primary" onClick={() => approveSeg(seg.id)}>{statusOf(seg.id) === 'outdated' ? <><RotateCw size={14} />{t('arch.editor.reapprove')}</> : <><Check size={14} />{t('arch.editor.approve')}</>}</Button>}
                <Button size="sm" variant="ghost" className="text-danger-strong" onClick={() => deleteSegment(seg.id)} aria-label={t('users.deleteSegment')} title={t('users.deleteSegment')}><Trash2 size={15} /></Button>
              </div>
            </div>

            {/* Facet tabs */}
            <div className="flex gap-1.5 mt-4 mb-3 text-[13px]">
              <button onClick={() => setFacet('needs')} className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${facet === 'needs' ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:bg-raised'}`}><Target size={14} />{t('users.facetNeeds')}</button>
              <button onClick={() => setFacet('journey')} className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${facet === 'journey' ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:bg-raised'}`}><Route size={14} />{t('users.facetJourney')}</button>
            </div>

            {facet === 'needs'
              ? <NeedsFacet key={seg.id} seg={seg} updateSeg={(fn) => updateSegment(seg.id, fn)} coverage={segCoverage} onPruneCov={pruneArchCov} t={t} />
              : <JourneyFacet key={seg.id} seg={seg} updateSeg={(fn) => updateSegment(seg.id, fn)} t={t} />}
          </div>
        )}
      </div>

      <UserMap open={mapOpen} spec={usersSpec} covered={covered} onClose={() => setMapOpen(false)} />

      <Modal open={jsonOpen} onClose={() => setJsonOpen(false)} title="users.json" size="lg"
        footer={<>
          <Button variant="ghost" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('ds.copied') : t('ds.copy')}</Button>
          <Button variant="primary" onClick={() => downloadObj(jsonText, 'users.json')}><Download size={15} />{t('ds.download')}</Button>
        </>}>
        <p className="text-[12px] text-muted mb-3 leading-snug">{t('users.jsonNote')}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[55vh] font-mono">{jsonText}</pre>
      </Modal>
    </div>
  )
}
