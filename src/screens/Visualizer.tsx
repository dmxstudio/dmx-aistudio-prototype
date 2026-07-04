import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Monitor, Smartphone, Braces, Copy, Download, Check, RotateCcw, RotateCw, Sparkles, ArrowRight, Fingerprint, FileCode2, ShieldCheck, AlertTriangle, CircleAlert, Route, Lock, Layers, BadgeCheck, History, GitCompareArrows, Wand2, FlaskConical, Bot, CircleDashed, Gem, Send, Link2, Database, Rocket } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EnginePill } from '../components/models/EnginePill'
import { PageRender } from '../components/visualizer/PageRender'
import { useWorkspace } from '../lib/workspace'
import { loadSections, usePersistentValue, getPersistentValue } from '../lib/store'
import { brandSections, seedMeridianBranding, type BrandSection } from '../data/branding'
import { buildBookTokens } from '../lib/bookData'
import { styleFromSpec, styleStatus, type StyleSpec } from '../lib/styleData'
import type { ArchSpec } from '../lib/archData'
import type { UsersSpec } from '../lib/usersData'
import { buildVizSpec, buildGenerationPlan, vizPages, vizCounts, auditClassA, auditClassB, tasteEvidence, PENDING_CHECKS, buildChangeRequest, compileSkillMd, criticalPageId, applyOverride, appliedDiff, toBuild, NOTE_CHIPS, needsCms, buildBindings, type VizSpec, type VizPage, type VizBuild, type Finding, type AppliedOverride } from '../lib/vizData'

// Visualizador (fase 7) — Candidate Workbench. Sala de revisión: ejecuta la StyleSpec APROBADA sobre la
// Arquitectura, la audita (Clase A real) y prepara un DesignBuild. Frontera dura por construcción: aquí NO
// hay ningún control que edite la dirección; si algo falla por dirección, se vuelve a Estilo de diseño.
const seedBrandingRead = (id: string): BrandSection[] =>
  id === 'p1' ? brandSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f })) })) : id === 'p4' ? seedMeridianBranding() : brandSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f, value: '', status: 'empty' as const, rows: undefined })) }))

const CAUSE_ICON = { execution: RotateCcw, direction: Sparkles, contract: Route } as const

export function Visualizer() {
  const { t } = useTranslation()
  const { activeProject, to } = useWorkspace()
  const navigate = useNavigate()
  const projectId = activeProject?.id ?? 'p1'
  const projectName = activeProject?.name ?? ''

  const [vizSpec, setVizSpec] = usePersistentValue<VizSpec | null>('vizSpec', projectId, null)
  const [, setVizSource] = usePersistentValue<string>('vizSource', projectId, 'style')
  const [vizApproved, setVizApproved] = usePersistentValue<string>('vizApproved', projectId, '')
  const [vizBuilds, setVizBuilds] = usePersistentValue<VizBuild[]>('vizBuilds', projectId, [])
  const [cmsMode, setCmsMode] = usePersistentValue<'auto' | 'yes' | 'no'>('vizCmsMode', projectId, 'auto')
  const [selId, setSelId] = useState('')
  const [bindingsOpen, setBindingsOpen] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [machineTab, setMachineTab] = useState<'plan' | 'skill'>('plan')
  const [machineOpen, setMachineOpen] = useState(false)
  const [diffAgainst, setDiffAgainst] = useState<VizBuild | null>(null)
  const [crFinding, setCrFinding] = useState<Finding | null>(null)
  const [copied, setCopied] = useState(false)

  const branding = useMemo(() => loadSections<BrandSection>('branding', projectId, () => seedBrandingRead(projectId)), [projectId])
  const styleSpec = getPersistentValue<StyleSpec | null>('styleSpec', projectId, null)
  const styleApproved = getPersistentValue<string>('styleApproved', projectId, '')
  const arch = getPersistentValue<ArchSpec | null>('archSpec', projectId, null)
  const users = getPersistentValue<UsersSpec | null>('usersSpec', projectId, null)

  const styleSt = styleSpec ? styleStatus(styleSpec, styleApproved) : 'pending'
  const archReady = !!arch && arch.pages.length > 0
  const canGenerate = styleSt === 'approved' && archReady

  const dsTokens = useMemo(() => buildBookTokens(branding), [branding])
  const dsSig = useMemo(() => JSON.stringify(dsTokens), [dsTokens])
  const baseApplied = useMemo(() => (styleSpec ? styleFromSpec(styleSpec, dsTokens) : null), [styleSpec, dsTokens])
  // override de EJECUCIÓN del candidato (no toca la StyleSpec) → estilo efectivo del render.
  const applied = useMemo(() => (baseApplied ? applyOverride(baseApplied, vizSpec?.override) : null), [baseApplied, vizSpec])
  // home + el rol crítico se renderizan real; el resto son fichas de plan.
  const realIds = useMemo(() => { const c = arch ? criticalPageId(arch) : null; return c ? [c] : [] }, [arch])
  const pages = useMemo(() => (arch ? vizPages(arch, realIds) : []), [arch, realIds])
  const findingsA = useMemo(() => (styleSpec && applied && pages.length ? auditClassA(pages, styleSpec, applied, users) : []), [pages, styleSpec, applied, users])
  const findingsB = useMemo(() => (applied && pages.length ? auditClassB(pages, applied) : []), [pages, applied])
  const taste = useMemo(() => (styleSpec && applied ? tasteEvidence(styleSpec, applied) : []), [styleSpec, applied])
  const counts = vizCounts(pages)
  const imagery = styleSpec?.imagery ?? ''

  // V4: CMS opcional. Auto-detecta por roles de colección; el humano puede forzar sí/no.
  const autoCms = arch ? needsCms(arch) : false
  const withCms = cmsMode === 'auto' ? autoCms : cmsMode === 'yes'
  const bindings = useMemo(() => (withCms ? buildBindings(pages) : []), [withCms, pages])
  const bindingsJson = useMemo(() => JSON.stringify({ needsCms: withCms, bindings }, null, 2), [withCms, bindings])

  const planJson = useMemo(() => (vizSpec ? JSON.stringify(vizSpec.plan, null, 2) : ''), [vizSpec])
  const skillMd = useMemo(() => (vizSpec && styleSpec ? compileSkillMd(vizSpec.plan, styleSpec, projectName) : ''), [vizSpec, styleSpec, projectName])

  // Cascada outdated multi-firma: el planId encapsula style+arch+users+ds. Si el vigente difiere del del
  // candidato, aguas arriba cambió desde que se generó.
  const currentPlanId = useMemo(() => (arch && styleSpec ? buildGenerationPlan(pages, styleSpec, arch, users, dsSig).planId : ''), [pages, styleSpec, arch, users, dsSig])
  const upstreamDrifted = !!vizSpec && !!currentPlanId && currentPlanId !== vizSpec.plan.planId

  // DesignCandidate (sin firmar) → DesignBuild (firmado). Solo la Clase A (real) bloquea/cuenta; la B es estimación.
  const reds = findingsA.filter((f) => f.severity === 'red').length
  const ambers = findingsA.filter((f) => f.severity === 'amber').length
  const buildStatus: 'candidate' | 'build' | 'outdated' = upstreamDrifted || (vizApproved && vizSpec && vizApproved !== vizSpec.fingerprint) ? (vizApproved ? 'outdated' : 'candidate') : !vizApproved ? 'candidate' : 'build'

  const generate = (override?: AppliedOverride, note?: string) => {
    if (!canGenerate || !arch || !styleSpec) return
    setVizSource('style')
    setVizApproved('')
    setVizSpec(buildVizSpec(arch, styleSpec, users, { projectName, source: 'style', realIds, dsSig, override, note }))
  }
  const regenerate = () => { setVizSpec(null); setVizApproved('') }
  // Iterar: cada chip es un transform PURO del estilo BASE (no del ya-overrideado) → idempotente y componible;
  // se compone sobre el override actual y produce un candidato nuevo (verificable, acotado).
  const iterate = (chipId: string) => {
    const chip = NOTE_CHIPS.find((c) => c.id === chipId)
    if (!chip || !baseApplied) return
    generate({ ...vizSpec?.override, ...chip.delta(baseApplied) }, chipId)
  }
  const sign = () => {
    if (!vizSpec || reds > 0 || upstreamDrifted) return
    setVizApproved(vizSpec.fingerprint)
    const b = toBuild(vizSpec, Date.now())
    setVizBuilds(vizBuilds.some((x) => x.fingerprint === b.fingerprint) ? vizBuilds : [b, ...vizBuilds].slice(0, 12))
  }
  // Restaurar: re-materializa los ajustes del build (override/note) contra el upstream ACTUAL como CANDIDATO
  // a re-firmar. NO reusa b.fingerprint (colgaría si el upstream cambió) — el gate de firma decide de nuevo.
  const restore = (b: VizBuild) => { if (arch && styleSpec) { setVizSpec(buildVizSpec(arch, styleSpec, users, { projectName, source: b.source, realIds, dsSig, override: b.override, note: b.note })); setVizApproved('') } }
  const copyText = (text: string) => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  const download = (data: string, filename: string, mime: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type: mime }))
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // ── Kickstart (gateado por la frontera: solo con la StyleSpec aprobada) ──────
  if (!vizSpec) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="visualizer" /></div>
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 lg:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3"><Monitor size={22} className="text-accent-strong" /></div>
            <h2 className="font-display text-xl font-bold text-content">{t('viz.kickstart.title')}</h2>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('viz.kickstart.subtitle')}</p>
          </div>

          {/* Gates de la frontera */}
          <div className="max-w-md mx-auto mb-5 flex flex-col gap-2">
            <GateRow ok={styleSt === 'approved'} label={t('viz.gate.style')} hint={styleSt === 'approved' ? t('viz.gate.styleOk') : styleSt === 'outdated' ? t('viz.gate.styleOutdated') : t('viz.gate.stylePending')} />
            <GateRow ok={archReady} label={t('viz.gate.arch')} hint={archReady ? t('viz.gate.archOk', { n: arch!.pages.length }) : t('viz.gate.archThin')} />
          </div>

          <div className="max-w-md mx-auto">
            {canGenerate ? (
              <button onClick={() => generate()} className="w-full text-left rounded-xl p-4 border-2 border-accent hover:bg-raised transition-colors flex flex-col gap-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-accent-strong"><Sparkles size={20} /></span>
                  <span className="text-[15px] font-medium text-content">{t('viz.kickstart.generate')}</span>
                  <span className="ml-auto text-[11px] font-medium bg-accent-soft text-accent-strong rounded-full px-2 py-0.5">{t('branding.kickstart.recommended')}</span>
                </div>
                <p className="text-[13px] leading-snug text-muted">{t('viz.kickstart.generateDesc')}</p>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] rounded-full px-2.5 py-1 w-fit bg-accent-soft text-accent-strong"><ArrowRight size={14} />{t('viz.kickstart.generateFoot', { n: counts.pages })}</div>
              </button>
            ) : (
              <div className="w-full rounded-xl p-4 border border-line bg-raised flex flex-col gap-2">
                <div className="flex items-center gap-2"><Lock size={18} className="text-faint" /><span className="text-[15px] font-medium text-muted">{t('viz.kickstart.blocked')}</span></div>
                <p className="text-[13px] leading-snug text-muted">{t('viz.kickstart.blockedDesc')}</p>
                <Link to={to('style', 'project')} className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-accent-strong hover:underline w-fit"><ArrowRight size={14} />{t('viz.kickstart.goStyle')}</Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-md mx-auto">
            <span className="inline-flex items-center gap-2 text-[12px] text-muted"><ShieldCheck size={15} className="text-accent-strong shrink-0" />{t('viz.kickstart.footHint')}</span>
          </div>
        </div>
      </div>
    )
  }

  const page: VizPage | undefined = pages.find((p) => p.pageId === selId) ?? pages[0]

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="visualizer" /></div>

      {/* Resumen del candidato */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[13px] text-muted inline-flex items-center gap-1.5"><Check size={13} className="text-success-strong" />{t('viz.sourceStyle')}</div>
            <div className="font-display text-lg font-bold text-content">{t('viz.titleFor', { name: projectName || t('viz.untitled') })}</div>
            <div className="text-[12px] text-faint mt-0.5 inline-flex items-center gap-1.5 flex-wrap">
              <span>{t('viz.summary', { real: counts.real, planned: counts.planned })}</span>
              <span className="inline-flex items-center gap-1"><Fingerprint size={12} />{vizSpec.fingerprint}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={regenerate}><RotateCcw size={14} />{t('viz.regenerate')}</Button>
            <Button size="sm" variant="secondary" onClick={() => setMachineOpen(true)}><Braces size={15} />{t('viz.machine')}</Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line flex-wrap text-[12px]">
          <span className="text-muted inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-accent-strong" />{t('viz.frontierNote')}</span>
          <span className="ml-auto inline-flex items-center gap-2 flex-wrap">
            {reds > 0 && <Badge tone="danger"><CircleAlert size={11} />{t('viz.reds', { n: reds })}</Badge>}
            {ambers > 0 && <Badge tone="warning"><AlertTriangle size={11} />{t('viz.ambers', { n: ambers })}</Badge>}
            {reds === 0 && ambers === 0 && <Badge tone="success"><Check size={11} />{t('viz.clean')}</Badge>}
            {buildStatus === 'build'
              ? <span className="inline-flex items-center gap-1 font-medium bg-success-soft text-success-strong rounded-full px-3 py-1"><BadgeCheck size={13} />{t('viz.signed')}</span>
              : <Button size="sm" variant="primary" onClick={sign} disabled={reds > 0 || upstreamDrifted} title={reds > 0 ? t('viz.signBlocked') : upstreamDrifted ? t('viz.driftBlocked') : undefined}>{buildStatus === 'outdated' ? <><RotateCw size={13} />{t('viz.resign')}</> : <><BadgeCheck size={13} />{t('viz.sign')}</>}</Button>}
          </span>
        </div>
        {upstreamDrifted && (
          <div className="mt-3 rounded-xl border border-warning-soft bg-warning-soft/40 px-3 py-2 flex items-center gap-2 text-[12px]">
            <AlertTriangle size={14} className="text-warning-strong shrink-0" />
            <span className="text-content flex-1">{t('viz.drift')}</span>
            <button onClick={regenerate} className="text-accent-strong hover:underline inline-flex items-center gap-1"><RotateCcw size={12} />{t('viz.regenerate')}</button>
          </div>
        )}
      </div>

      {/* Handoff (solo con un DesignBuild firmado): CMS opcional o directo a Publicar */}
      {buildStatus === 'build' && vizSpec && (
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[13px] font-medium text-content inline-flex items-center gap-2"><BadgeCheck size={15} className="text-success-strong" />{t('viz.handoff')}</div>
            <button onClick={() => copyText(`https://studio.dmx/review/${vizSpec.fingerprint}`)} className="text-[12px] text-accent-strong hover:underline inline-flex items-center gap-1">{copied ? <Check size={12} /> : <Link2 size={12} />}{t('viz.shareLink')}</button>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap text-[12px]">
            <span className="text-muted inline-flex items-center gap-1.5"><Database size={13} className="text-accent-strong" />{t('viz.cmsQuestion')}</span>
            {(['auto', 'yes', 'no'] as const).map((m) => (
              <button key={m} onClick={() => setCmsMode(m)} className={`rounded-full px-3 py-1 border transition-colors ${cmsMode === m ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{t(`viz.cms.${m}`)}{m === 'auto' ? ` · ${autoCms ? t('viz.cms.detYes') : t('viz.cms.detNo')}` : ''}</button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-line flex items-center gap-2 flex-wrap text-[13px]">
            {withCms ? (
              <>
                <span className="text-muted inline-flex items-center gap-1.5"><ArrowRight size={13} className="text-accent-strong" />{t('viz.routeCms', { n: bindings.length })}</span>
                <button onClick={() => setBindingsOpen(true)} className="text-[12px] text-accent-strong hover:underline">{t('viz.viewBindings')}</button>
                <Button size="sm" variant="primary" className="ml-auto" onClick={() => navigate(to('cms', 'project'))}><Database size={14} />{t('viz.toCms')}</Button>
              </>
            ) : (
              <>
                <span className="text-muted inline-flex items-center gap-1.5"><ArrowRight size={13} className="text-accent-strong" />{t('viz.routeDirect')}</span>
                <Button size="sm" variant="primary" className="ml-auto" onClick={() => navigate(to('publish', 'project'))}><Rocket size={14} />{t('viz.toPublish')}</Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Master-detail: inspector de páginas · preview / ficha · auditoría */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-3 h-fit">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 px-1">{t('viz.pages')}</div>
          <div className="flex flex-col gap-2">
            {pages.map((p) => {
              const active = p.pageId === page?.pageId
              return (
                <button key={p.pageId} onClick={() => setSelId(p.pageId)} className={`text-left rounded-xl p-3 transition-colors ${active ? 'border-2 border-accent bg-raised' : 'border border-line hover:bg-raised'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-content flex-1 truncate">{p.name}</span>
                    {p.renderMode === 'real'
                      ? <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-accent-soft text-accent-strong shrink-0">{t('viz.real')}</span>
                      : <span className="text-[10px] rounded-full px-1.5 py-0.5 bg-raised border border-line text-muted shrink-0">{t('viz.plan')}</span>}
                  </div>
                  <div className="text-[11px] text-faint mt-0.5 font-mono truncate">{p.route}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-w-0 flex flex-col gap-4">
          {page && (
            <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="text-[13px] font-medium text-content inline-flex items-center gap-2">{page.name}<span className="text-[11px] text-faint font-mono">{page.route}</span></div>
                {page.renderMode === 'real' && (
                  <div className="inline-flex border border-line rounded-lg overflow-hidden text-[12px]">
                    <button onClick={() => setDevice('desktop')} className={`px-2.5 py-1 inline-flex items-center gap-1 ${device === 'desktop' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`}><Monitor size={13} />{t('viz.desktop')}</button>
                    <button onClick={() => setDevice('mobile')} className={`px-2.5 py-1 inline-flex items-center gap-1 ${device === 'mobile' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`}><Smartphone size={13} />{t('viz.mobile')}</button>
                  </div>
                )}
              </div>
              {page.renderMode === 'real' && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap text-[12px]">
                  <span className="text-muted inline-flex items-center gap-1.5"><Wand2 size={13} className="text-accent-strong" />{t('viz.iterate')}</span>
                  {NOTE_CHIPS.map((c) => {
                    const on = vizSpec?.note === c.id
                    return <button key={c.id} onClick={() => iterate(c.id)} className={`rounded-full px-2.5 py-1 border transition-colors ${on ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{t(`viz.chip.${c.id}`)}</button>
                  })}
                  {vizSpec?.override && <button onClick={() => generate()} className="text-faint hover:text-content inline-flex items-center gap-1 ml-1"><RotateCcw size={11} />{t('viz.chipReset')}</button>}
                </div>
              )}
              {page.renderMode === 'real' && applied ? (
                <div className="flex justify-center bg-raised border border-line rounded-2xl p-4">
                  <div style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: device === 'mobile' ? 375 : 900 }}>
                    <PageRender style={applied} page={page} brand={projectName} imagery={imagery} compact={device === 'mobile'} />
                  </div>
                </div>
              ) : (
                <PlanCard page={page} t={t} />
              )}
            </div>
          )}

          {/* Auditoría honesta — A real · B estimación · C requiere agente · D no evaluado */}
          <div className="bg-surface border border-line rounded-2xl shadow-soft p-4">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-3 inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-accent-strong" />{t('viz.audit')}</div>

            {/* Clase A — real hoy */}
            <ClassHead icon={<ShieldCheck size={12} />} label={t('viz.classA')} tone="accent" />
            {findingsA.length === 0
              ? <p className="text-[13px] text-success-strong inline-flex items-center gap-1.5 mb-3"><Check size={14} />{t('viz.noFindings')}</p>
              : <div className="flex flex-col gap-2 mb-3">{findingsA.map((f) => <FindingRow key={f.id} f={f} t={t} onRequest={setCrFinding} />)}</div>}

            {/* Clase B — estimación determinista */}
            <ClassHead icon={<FlaskConical size={12} />} label={t('viz.classB')} tone="muted" />
            {findingsB.length === 0
              ? <p className="text-[12px] text-faint mb-3">{t('viz.noEstimates')}</p>
              : <div className="flex flex-col gap-2 mb-3">{findingsB.map((f) => <FindingRow key={f.id} f={f} t={t} onRequest={setCrFinding} estimate />)}</div>}

            {/* Clase C/D — no computadas, etiquetadas */}
            <ClassHead icon={<CircleDashed size={12} />} label={t('viz.classCD')} tone="muted" />
            <div className="flex flex-wrap gap-1.5">
              {PENDING_CHECKS.map((c) => (
                <span key={c.key} className="text-[11px] rounded-full px-2.5 py-1 border border-line bg-raised text-muted inline-flex items-center gap-1">
                  {c.cls === 'C' ? <Bot size={11} className="text-faint" /> : <CircleDashed size={11} className="text-faint" />}
                  {t(`viz.pending.${c.key}`)}
                  <span className="text-faint">· {c.cls === 'C' ? t('viz.needsAgent') : t('viz.notEvaluated')}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Taste Evidence — reglas del estudio con evidencia (no un score de distancia) */}
          <div className="bg-surface border border-line rounded-2xl shadow-soft p-4">
            <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-1 inline-flex items-center gap-1.5"><Gem size={13} className="text-accent-strong" />{t('viz.taste')}</div>
            <p className="text-[12px] text-faint mb-3 leading-snug">{t('viz.tasteNote')}</p>
            <div className="flex flex-col gap-1.5">
              {taste.map((e, i) => (
                <div key={i} className={`rounded-xl border px-3 py-2 flex items-start gap-2 ${e.status === 'violate' ? 'border-danger-soft bg-danger-soft/30' : 'border-line'}`}>
                  <span className={`shrink-0 mt-0.5 ${e.status === 'violate' ? 'text-danger-strong' : 'text-success-strong'}`}>{e.status === 'violate' ? <CircleAlert size={14} /> : <Check size={14} />}</span>
                  <span className="text-[13px] text-content flex-1">{e.rule}</span>
                  <span className="text-[10px] rounded-full px-2 py-0.5 bg-raised border border-line text-muted shrink-0">{t(`viz.tasteKind.${e.kind}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de builds firmados (event-log + snapshots, no Git) */}
      {vizBuilds.length > 0 && (
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 mt-4">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 inline-flex items-center gap-1.5"><History size={13} className="text-accent-strong" />{t('viz.history')} <span className="text-faint normal-case tracking-normal">· {t('viz.historyN', { n: vizBuilds.length })}</span></div>
          <div className="flex flex-col gap-2">
            {vizBuilds.map((b) => {
              const current = vizSpec?.fingerprint === b.fingerprint
              return (
                <div key={b.id} className="rounded-xl border border-line bg-raised px-3 py-2 flex items-center gap-2.5 flex-wrap">
                  <BadgeCheck size={14} className={current ? 'text-success-strong shrink-0' : 'text-faint shrink-0'} />
                  <span className="font-mono text-[12px] text-content">{b.fingerprint}</span>
                  {b.note && <span className="text-[11px] rounded-full px-2 py-0.5 bg-surface border border-line text-muted">{t(`viz.chip.${b.note}`)}</span>}
                  <span className="text-[11px] text-faint">{new Date(b.ts).toLocaleString()}</span>
                  {current && <span className="text-[11px] text-success-strong">{t('viz.current')}</span>}
                  <span className="ml-auto flex items-center gap-2">
                    <button onClick={() => setDiffAgainst(diffAgainst?.id === b.id ? null : b)} className="text-[12px] text-muted hover:text-content inline-flex items-center gap-1"><GitCompareArrows size={12} />{t('viz.diff')}</button>
                    {!current && <button onClick={() => restore(b)} className="text-[12px] text-accent-strong hover:underline inline-flex items-center gap-1"><History size={12} />{t('viz.restore')}</button>}
                  </span>
                  {diffAgainst?.id === b.id && baseApplied && applied && (
                    <div className="w-full mt-1 pt-2 border-t border-line">
                      {(() => { const d = appliedDiff(applyOverride(baseApplied, b.override), applied); return d.length === 0
                        ? <span className="text-[12px] text-faint">{t('viz.diffNone')}</span>
                        : <div className="flex flex-wrap gap-1.5">{d.map((x) => <span key={x.field} className="text-[11px] font-mono rounded-full px-2 py-0.5 bg-surface border border-line text-muted">{x.field}: {x.from} → <span className="text-accent-strong">{x.to}</span></span>)}</div> })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Visor máquina: GenerationPlan + SKILL.md */}
      <Modal open={machineOpen} onClose={() => setMachineOpen(false)} title={t('viz.machineTitle')} size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => copyText(machineTab === 'plan' ? planJson : skillMd)}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('ds.copied') : t('ds.copy')}</Button>
          <Button variant="primary" onClick={() => (machineTab === 'plan' ? download(planJson, 'generation-plan.json', 'application/json') : download(skillMd, 'SKILL.md', 'text/markdown'))}><Download size={15} />{t('ds.download')}</Button>
        </>}>
        <div className="inline-flex border border-line rounded-lg overflow-hidden text-[12px] mb-3">
          <button onClick={() => setMachineTab('plan')} className={`px-3 py-1.5 inline-flex items-center gap-1.5 ${machineTab === 'plan' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`}><Braces size={13} />{t('viz.planTab')}</button>
          <button onClick={() => setMachineTab('skill')} className={`px-3 py-1.5 inline-flex items-center gap-1.5 ${machineTab === 'skill' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`}><FileCode2 size={13} />SKILL.md</button>
        </div>
        <p className="text-[12px] text-muted mb-3 leading-snug">{machineTab === 'plan' ? t('viz.planNote') : t('viz.skillNote')}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[55vh] font-mono whitespace-pre-wrap">{machineTab === 'plan' ? planJson : skillMd}</pre>
      </Modal>

      {/* Bindings sección↔campo para CMS */}
      <Modal open={bindingsOpen} onClose={() => setBindingsOpen(false)} title={t('viz.bindingsTitle')} size="md"
        footer={<>
          <Button variant="ghost" onClick={() => copyText(bindingsJson)}>{copied ? <Check size={15} /> : <Copy size={15} />}{t('ds.copy')}</Button>
          <Button variant="primary" onClick={() => download(bindingsJson, 'bindings.json', 'application/json')}><Download size={15} />{t('ds.download')}</Button>
        </>}>
        <p className="text-[12px] text-muted mb-3 leading-snug">{t('viz.bindingsNote')}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[50vh] font-mono whitespace-pre-wrap">{bindingsJson}</pre>
      </Modal>

      {/* ChangeRequest: el Visualizador no edita dirección; emite una solicitud estructurada aguas arriba */}
      {crFinding && (() => {
        const cr = buildChangeRequest(crFinding)
        const crJson = JSON.stringify(cr, null, 2)
        const dir = cr.to === 'estilo_de_diseno'
        return (
          <Modal open onClose={() => setCrFinding(null)} title={t('viz.crTitle')} size="md"
            footer={<>
              <Button variant="ghost" onClick={() => copyText(crJson)}>{copied ? <Check size={15} /> : <Copy size={15} />}{t('ds.copy')}</Button>
              <Button variant="primary" onClick={() => { setCrFinding(null); navigate(to(dir ? 'style' : 'architecture', 'project')) }}><ArrowRight size={15} />{dir ? t('viz.toStyle') : t('viz.toArch')}</Button>
            </>}>
            <p className="text-[12px] text-muted mb-3 leading-snug">{t('viz.crNote')}</p>
            <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[45vh] font-mono whitespace-pre-wrap">{crJson}</pre>
          </Modal>
        )
      })()}
    </div>
  )
}

type T = (k: string, o?: Record<string, unknown>) => string

function GateRow({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-success-soft text-success-strong' : 'bg-raised border border-line text-faint'}`}>{ok ? <Check size={13} /> : <Lock size={11} />}</span>
      <span className="text-content font-medium">{label}</span>
      <span className="text-faint">·</span>
      <span className="text-muted">{hint}</span>
    </div>
  )
}

function PlanCard({ page, t }: { page: VizPage; t: T }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-raised p-5">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={16} className="text-faint" />
        <span className="text-[13px] font-medium text-muted">{t('viz.planCardTitle')}</span>
        <span className="ml-auto text-[11px] rounded-full px-2 py-0.5 bg-surface border border-line text-muted">{t(`viz.role.${page.role}`)}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
        <Field label={t('viz.pfRoute')} value={page.route} mono />
        <Field label={t('viz.pfHeadline')} value={page.copy.headline || '—'} />
        <Field label={t('viz.pfBlocks')} value={page.blocks.join(' › ')} />
        <Field label={t('viz.pfCoverage')} value={page.coverage.length ? page.coverage.join(', ') : t('viz.pfNoCoverage')} />
      </div>
      <p className="text-[12px] text-faint mt-3 inline-flex items-center gap-1.5"><CircleAlert size={12} />{t('viz.planCardNote')}</p>
    </div>
  )
}
function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium text-faint uppercase tracking-wide">{label}</div>
      <div className={`text-content truncate ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</div>
    </div>
  )
}

function ClassHead({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: 'accent' | 'muted' }) {
  return <div className={`text-[11px] font-medium mb-1.5 inline-flex items-center gap-1.5 ${tone === 'accent' ? 'text-accent-strong' : 'text-muted'}`}>{icon}{label}</div>
}

function FindingRow({ f, t, onRequest, estimate }: { f: Finding; t: T; onRequest: (f: Finding) => void; estimate?: boolean }) {
  const CauseIcon = CAUSE_ICON[f.cause]
  const routable = !estimate && (f.cause === 'direction' || f.cause === 'contract')
  return (
    <div className={`rounded-xl border px-3 py-2.5 flex items-start gap-2.5 ${f.severity === 'red' ? 'border-danger-soft bg-danger-soft/40' : estimate ? 'border-line' : 'border-line bg-raised'}`}>
      <span className={`shrink-0 mt-0.5 ${f.severity === 'red' ? 'text-danger-strong' : estimate ? 'text-faint' : 'text-warning-strong'}`}>{estimate ? <FlaskConical size={14} /> : f.severity === 'red' ? <CircleAlert size={15} /> : <AlertTriangle size={15} />}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-content">{f.message}</div>
        <div className="text-[11px] text-faint mt-0.5 inline-flex items-center gap-1.5 flex-wrap">
          <span className="font-mono">{f.rule}</span>
          {f.scope.pageId && <span>· {f.scope.pageId}{f.scope.block ? `/${f.scope.block}` : ''}</span>}
          <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 bg-surface border border-line"><CauseIcon size={10} />{t(`viz.cause.${f.cause}`)}</span>
        </div>
      </div>
      {routable
        ? <button onClick={() => onRequest(f)} className="shrink-0 text-[12px] text-accent-strong hover:underline inline-flex items-center gap-1"><Send size={11} />{t('viz.request')}</button>
        : <Badge tone={estimate ? 'neutral' : 'warning'}>{estimate ? t('viz.estimate') : t('viz.cause.execution')}</Badge>}
    </div>
  )
}
