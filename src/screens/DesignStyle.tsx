import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Palette, Sparkles, LayoutTemplate, Link2, Wand2, ArrowRight, Braces, Download, Copy, Check, RotateCcw, RotateCw, CircleCheck, ClipboardCheck, Cpu, Target, GitPullRequest, Ban, Eye, Route, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EnginePill } from '../components/models/EnginePill'
import { SpecimenPreview } from '../components/designstyle/SpecimenPreview'
import { StyleProofOverlay } from '../components/designstyle/StyleProofOverlay'
import { useWorkspace } from '../lib/workspace'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { loadSections, usePersistentValue, getPersistentValue } from '../lib/store'
import { seedBrief, type BriefSection } from '../data/brief'
import { seedBrandingRead, brandGateIds, type BrandSection } from '../data/branding'
import { buildBookTokens } from '../lib/bookData'
import type { UsersSpec } from '../lib/usersData'
import type { ArchSpec } from '../lib/archData'
import { buildStyleSpec, emptyStyleSpec, styleFromSpec, familyToSpec, specimenContent, familyCardContent, styleSignature, styleStatus, stylePatches, styleRubric, dimValueLabel, FAMILY_IDS, FAMILIES, STYLE_LIB_ID, EDITABLE_DIMS, NONEDIT_DIMS, OWNERSHIP, DERIVED_FROM, type StyleSpec, type DimId, type StyleStatus, type StyleFamily } from '../lib/styleData'

// Estilo de diseño (fase 6) — compilador de dirección de arte. Kickstart 4 orígenes + cockpit
// (rationale + familia/mezcla + dims por ownership + mini specimen VIVO + token-patch soft-gate +
// anti-patterns + rúbrica 5 ejes + aprobar→handoff). Genera el sitio: el Visualizador, no aquí.
export function DesignStyle() {
  const { t } = useTranslation()
  const { activeProject } = useWorkspace()
  const projectId = activeProject?.id ?? 'p1'
  const projectName = activeProject?.name ?? ''
  const engineLabel = useWorkspaceModels().effectiveEngine('designStyle')?.label

  const [styleSpec, setStyleSpec] = usePersistentValue<StyleSpec | null>('styleSpec', projectId, null)
  const [styleSource, setStyleSource] = usePersistentValue<string>('styleSource', projectId, 'ai')
  const [styleApproved, setStyleApproved] = usePersistentValue<string>('styleApproved', projectId, '')
  const [proofOpen, setProofOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [pickOpen, setPickOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const brief = useMemo(() => loadSections<BriefSection>('brief', projectId, () => seedBrief(projectId)), [projectId])
  const branding = useMemo(() => loadSections<BrandSection>('branding', projectId, () => seedBrandingRead(projectId)), [projectId])
  const users = getPersistentValue<UsersSpec | null>('usersSpec', projectId, null)
  const arch = getPersistentValue<ArchSpec | null>('archSpec', projectId, null)
  const dsGenerated = getPersistentValue<boolean>('dsGenerated', projectId, false)
  // Librería de estilos del workspace (base + house styles del estudio) — alimenta el picker y la derivación.
  const customFamilies = getPersistentValue<StyleFamily[]>('styleLibrary', STYLE_LIB_ID, [])
  const families = useMemo(() => ({ ...FAMILIES, ...Object.fromEntries(customFamilies.map((f) => [f.id, f])) }), [customFamilies])
  // Tokens reales del DS (accent + fuentes de marca) + copy/estructura reales de Arquitectura para el specimen.
  const dsTokens = useMemo(() => buildBookTokens(branding), [branding])
  const specimen = useMemo(() => specimenContent(arch, projectName), [arch, projectName])

  const briefReadiness = useMemo(() => {
    const req = brief.flatMap((s) => s.fields).filter((f) => f.required)
    return req.length ? Math.round((100 * req.filter((f) => f.status === 'closed').length) / req.length) : 0
  }, [brief])
  const brandReady = useMemo(() => branding.flatMap((s) => s.fields).filter((x) => brandGateIds.includes(x.id) && x.status === 'closed').length === brandGateIds.length, [branding])
  const upstreamReady = briefReadiness >= 25 && brandReady

  // Derivados (excluidos de la firma; se recalculan en vivo al mover dims).
  const applied = useMemo(() => (styleSpec ? styleFromSpec(styleSpec, dsTokens) : null), [styleSpec, dsTokens])
  const patches = styleSpec ? stylePatches(styleSpec.dims) : []
  const rubric = styleSpec ? styleRubric(styleSpec) : null
  const goalsN = users ? users.segments.reduce((n, s) => n + s.goals.length, 0) : 0
  const status: StyleStatus = styleSpec ? styleStatus(styleSpec, styleApproved) : 'pending'
  const jsonText = useMemo(() => (styleSpec ? JSON.stringify(styleSpec, null, 2) : ''), [styleSpec])

  const generate = (source: string, family?: string) => {
    setStyleSource(source)
    setStyleApproved('')
    setStyleSpec(source === 'scratch' ? emptyStyleSpec(projectName) : buildStyleSpec(brief, branding, users, arch, projectName, family, families))
    setPickOpen(false)
    setProofOpen(false) // overlays/modales no deben sobrevivir a un cambio de spec
    setJsonOpen(false)
  }
  const regenerate = () => { setStyleSpec(null); setProofOpen(false); setJsonOpen(false) }
  // Solo las dimensiones EDITABLE se mueven aquí; derivadas/patch son de contrato (no se mutan desde el panel).
  const setDim = (id: DimId, value: number) => { if (styleSpec && OWNERSHIP[id] === 'editable') setStyleSpec({ ...styleSpec, dims: { ...styleSpec.dims, [id]: value } }) }
  const approve = () => { if (styleSpec) setStyleApproved(styleSignature(styleSpec)) }
  const download = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([jsonText], { type: 'application/json' }))
    a.download = 'style.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const copy = () => navigator.clipboard?.writeText(jsonText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})

  // ── Kickstart ────────────────────────────────────────────────────────────
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

  if (!styleSpec) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="designStyle" /></div>
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 lg:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3"><Palette size={22} className="text-accent-strong" /></div>
            <h2 className="font-display text-xl font-bold text-content">{t('style.kickstart.title')}</h2>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('style.kickstart.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {card(<Sparkles size={20} />, t('style.kickstart.ai'), t('style.kickstart.aiDesc'), <><CircleCheck size={14} />{upstreamReady ? t('style.kickstart.aiReady', { n: briefReadiness }) : t('style.kickstart.aiThin', { n: briefReadiness })}</>, () => generate('ai'), true, upstreamReady ? 'accent' : 'muted')}
            {card(<LayoutTemplate size={20} />, t('style.kickstart.family'), t('style.kickstart.familyDesc'), <><ArrowRight size={14} />{t('style.kickstart.familyFoot')}</>, () => setPickOpen(true))}
            {card(<Link2 size={20} />, t('style.kickstart.reference'), t('style.kickstart.referenceDesc'), <><ArrowRight size={14} />{t('style.kickstart.referenceFoot')}</>, () => generate('reference'))}
            {card(<Wand2 size={20} />, t('style.kickstart.scratch'), t('style.kickstart.scratchDesc'), <><ArrowRight size={14} />{t('style.kickstart.scratchFoot')}</>, () => generate('scratch'))}
          </div>
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-[12px] text-muted"><ClipboardCheck size={15} className="text-accent-strong shrink-0" />{t('style.kickstart.footHint')}</span>
            <span className="inline-flex items-center gap-2 text-[12px] text-faint sm:ml-auto"><Cpu size={15} className="shrink-0" />{t('style.kickstart.engine', { model: engineLabel ?? '—' })}</span>
          </div>
        </div>
        <FamilyPicker open={pickOpen} onClose={() => setPickOpen(false)} onPick={(id) => generate('family', id)} families={families} t={t} />
      </div>
    )
  }

  const sourceLabel = styleSource === 'family' ? t('style.sourceFamily') : styleSource === 'reference' ? t('style.sourceReference') : styleSource === 'scratch' ? t('style.sourceScratch') : t('style.sourceAi')
  const mixLabel = (id?: string) => (!id ? '' : FAMILY_IDS.includes(id) ? t(`style.family.${id}`) : (families[id]?.name ?? id))

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="designStyle" /></div>

      {/* Resumen */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[13px] text-muted inline-flex items-center gap-1.5"><Check size={13} className="text-success-strong" />{sourceLabel}</div>
            <div className="font-display text-lg font-bold text-content">{t('style.titleFor', { name: projectName || t('style.untitled') })}</div>
            <p className="text-[14px] text-content leading-relaxed italic mt-1 max-w-2xl">“{styleSpec.thesis}”</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={regenerate}><RotateCcw size={14} />{t('style.regenerate')}</Button>
            <Button size="sm" variant="secondary" onClick={() => setJsonOpen(true)} aria-label="style.json" title="style.json"><Braces size={15} /></Button>
            {status === 'approved'
              ? <span className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-success-soft text-success-strong rounded-full px-3 py-1.5"><Check size={14} />{t('style.approved')}</span>
              : <Button size="sm" variant="primary" onClick={approve}>{status === 'outdated' ? <><RotateCw size={14} />{t('style.reapprove')}</> : <><Check size={14} />{t('style.approve')}</>}</Button>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line flex-wrap">
          <span className="flex items-center gap-1.5 flex-wrap">
            <Badge tone={dsGenerated ? 'success' : 'neutral'}><Palette size={11} />{dsGenerated ? t('style.usesTokens') : t('style.tokensPending')}</Badge>
            <Badge tone={goalsN > 0 ? 'success' : 'neutral'}><Target size={11} />{t('style.considersGoals', { n: goalsN })}</Badge>
            {patches.length > 0 && <Badge tone="warning"><GitPullRequest size={11} />{t('style.patchPending', { n: patches.length })}</Badge>}
          </span>
        </div>
      </div>

      {/* Trazabilidad (moat visible) */}
      <div className="flex items-center gap-2 flex-wrap bg-raised border border-line rounded-xl px-3 py-2 mb-4">
        <span className="text-[12px] text-muted inline-flex items-center gap-1.5"><Route size={14} className="text-accent-strong" />{t('style.chosenBy')}</span>
        {styleSpec.rationale.sources.length ? styleSpec.rationale.sources.map((s) => <Badge key={s} tone="neutral"><Check size={11} />{t(`style.src.${s}`)}</Badge>) : <span className="text-[12px] text-faint">{t('style.chosenByNone')}</span>}
        <span className="text-[12px] text-faint w-full sm:w-auto sm:ml-2">— {styleSpec.rationale.why}</span>
      </div>

      {/* Cockpit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Controles */}
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 min-w-0">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-3">{t('style.adjust')}</div>
          <div className="flex flex-wrap gap-1.5 items-center mb-4">
            <span className="text-[12px] rounded-full px-2.5 py-1 bg-accent-soft text-accent-strong">{mixLabel(styleSpec.mix.primary)}</span>
            {styleSpec.mix.secondary && <span className="text-[12px] rounded-full px-2.5 py-1 border border-line text-muted">+ {mixLabel(styleSpec.mix.secondary)}</span>}
            {styleSpec.mix.accent && <span className="text-[12px] rounded-full px-2.5 py-1 border border-line text-muted">+ {mixLabel(styleSpec.mix.accent)} <span className="text-faint">{t('style.accentTag')}</span></span>}
            <button onClick={() => setPickOpen(true)} className="text-[12px] text-accent-strong hover:underline ml-1">{t('style.change')}</button>
          </div>

          {EDITABLE_DIMS.map((id) => (
            <div key={id} className="flex items-center gap-3 my-2.5">
              <label className="text-[13px] text-secondary w-20 shrink-0 text-muted">{t(`style.dim.${id}`)}</label>
              <input type="range" min={0} max={100} value={styleSpec.dims[id]} onChange={(e) => setDim(id, +e.target.value)} className="flex-1" />
              <span className="text-[12px] w-20 shrink-0 text-right text-content">{dimValueLabel(id, styleSpec.dims[id])}</span>
            </div>
          ))}

          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-[11px] text-muted mb-2">{t('style.inheritedDims')}</div>
            <div className="flex flex-col gap-1.5">
              {NONEDIT_DIMS.map((id) => {
                const patch = OWNERSHIP[id] === 'patch'
                return (
                  <div key={id} className="flex items-center gap-2 text-[12px]">
                    <span className="text-muted w-20 shrink-0">{t(`style.dim.${id}`)}</span>
                    <span className="text-content flex-1">{dimValueLabel(id, styleSpec.dims[id])}</span>
                    {patch
                      ? <span className="text-[11px] rounded-full px-2 py-0.5 bg-accent-soft text-accent-strong inline-flex items-center gap-1"><GitPullRequest size={10} />{t('style.tagPatch')}</span>
                      : <span className="text-[11px] rounded-full px-2 py-0.5 border border-line text-muted">{t(`style.from.${DERIVED_FROM[id]}`)}</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {patches.length > 0 && (
            <div className="mt-3 pt-3 border-t border-line">
              <div className="text-[12px] text-warning-strong inline-flex items-center gap-1.5 mb-1.5"><GitPullRequest size={14} />{t('style.patchTitle')}</div>
              {patches.map((p) => (
                <div key={p.token} className="mb-1.5">
                  <div className="text-[12px] text-content font-mono">{p.token} &nbsp;{p.current} → {p.proposed}</div>
                  <div className="text-[11px] text-muted leading-snug">{p.reason} · {t('style.patchApprovedIn')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prueba de dirección */}
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wide">{t('style.proofTitle')}</span>
            <Button size="sm" variant="secondary" onClick={() => setProofOpen(true)}><Eye size={14} />{t('style.openProof')}</Button>
          </div>
          {applied && <SpecimenPreview style={applied} content={specimen} />}
          <p className="text-[11px] text-faint mt-2">{t('style.proofCaption')}</p>
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-[11px] text-muted mb-2">{t('style.antiTitle')}</div>
            <div className="flex flex-wrap gap-1.5">
              {styleSpec.antiPatterns.slice(0, 5).map((a) => (
                <span key={a} className="text-[12px] rounded-full px-2.5 py-0.5 bg-danger-soft text-danger-strong inline-flex items-center gap-1"><Ban size={11} />{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rúbrica (hard gates) */}
      {rubric && (
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 mt-4 flex items-center gap-x-6 gap-y-2 flex-wrap">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide inline-flex items-center gap-1.5"><ClipboardCheck size={13} className="text-accent-strong" />{t('style.rubric')}</span>
          {([['brandFit', rubric.brandFit], ['consistency', rubric.consistency], ['hierarchy', rubric.hierarchy], ['genericRisk', rubric.genericRisk], ['a11y', rubric.a11y]] as const).map(([k, n]) => (
            <span key={k} className="text-[12px] text-secondary inline-flex items-center gap-1.5">
              <span className="text-muted">{t(`style.axis.${k}`)}</span>
              <span className="text-accent-strong tracking-tight">{'●'.repeat(n)}<span className="text-line">{'○'.repeat(5 - n)}</span></span>
            </span>
          ))}
        </div>
      )}

      {/* Handoff (la aprobación vive en la cabecera; aquí solo la nota de qué hace) */}
      <div className="flex items-center gap-3 flex-wrap mt-4">
        <span className="text-[13px] text-muted inline-flex items-center gap-1.5"><ArrowRight size={15} className="shrink-0" />{status === 'approved' ? t('style.approvedHandoff') : t('style.handoffNote')}</span>
      </div>

      <FamilyPicker open={pickOpen} onClose={() => setPickOpen(false)} onPick={(id) => generate('family', id)} families={families} t={t} />
      <StyleProofOverlay open={proofOpen} spec={styleSpec} style={applied} content={specimen} title={mixLabel(styleSpec?.mix.primary) || t('style.untitled')} onClose={() => setProofOpen(false)} />

      <Modal open={jsonOpen} onClose={() => setJsonOpen(false)} title="style.json" size="lg"
        footer={<>
          <Button variant="ghost" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('ds.copied') : t('ds.copy')}</Button>
          <Button variant="primary" onClick={download}><Download size={15} />{t('ds.download')}</Button>
        </>}>
        <p className="text-[12px] text-muted mb-3 leading-snug">{t('style.jsonNote')}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[55vh] font-mono">{jsonText}</pre>
      </Modal>
    </div>
  )
}

// Selector de familia — overlay FULLSCREEN con cards visuales (thumbnail = abstract del estilo). Cada card
// es un SpecimenPreview determinista de la familia. Base + house styles del estudio (tag "estudio").
function FamilyPicker({ open, onClose, onPick, families, t }: { open: boolean; onClose: () => void; onPick: (id: string) => void; families: Record<string, StyleFamily>; t: (k: string) => string }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col animate-in fade-in duration-150">
      <header className="h-14 shrink-0 border-b border-line bg-surface px-4 flex items-center gap-3">
        <span className="text-accent-strong"><LayoutTemplate size={18} /></span>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold text-content">{t('style.pickTitle')}</span>
          <span className="text-[11px] text-faint">{t('style.pickSub')}</span>
        </div>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={onClose} aria-label={t('styleLib.close')} title={t('styleLib.close')}><X size={16} /></Button>
      </header>
      <div className="flex-1 min-h-0 overflow-auto p-6">
        <div className="max-w-[1120px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(families).map((id) => {
            const fam = families[id]
            const builtin = FAMILY_IDS.includes(id)
            const name = builtin ? t(`style.family.${id}`) : (fam.name ?? id)
            // Card auto-descriptiva: el nombre ES el titular y la tesis el párrafo dentro del propio specimen.
            const content = familyCardContent(builtin ? t('styleLib.base') : t('styleLib.studioTag'), name, fam.thesis)
            return (
              <button key={id} onClick={() => onPick(id)} className="text-left rounded-2xl border border-line bg-surface shadow-soft overflow-hidden hover:border-accent transition-colors">
                <div className="h-[200px] overflow-hidden bg-raised"><SpecimenPreview style={styleFromSpec(familyToSpec(fam))} content={content} /></div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
