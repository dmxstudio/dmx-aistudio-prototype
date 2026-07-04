import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Map as MapIcon, GitBranch, FileText, Upload, Wand2, ArrowRight, Braces, Download, Copy, Check, RotateCcw, RotateCw, AlertTriangle, Network, Workflow, PanelsTopLeft, CircleCheck, ClipboardCheck, Cpu } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EnginePill } from '../components/models/EnginePill'
import { ArchEditorOverlay } from '../components/architecture/ArchEditorOverlay'
import { useWorkspace } from '../lib/workspace'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { loadSections, usePersistentValue, getPersistentValue } from '../lib/store'
import { seedBrief, type BriefSection } from '../data/brief'
import { brandSections, seedMeridianBranding, type BrandSection } from '../data/branding'
import { buildArchSpec, archCounts, blockJson, blockSignature, blockStatus, BLOCK_FILE, ARCH_BLOCKS, type ArchSpec, type ArchPage, type ArchBlock, type ArchApprovals, type ArchStatus } from '../lib/archData'
import { covKey, type UsersSpec, type CovTargets } from '../lib/usersData'

// Arquitectura F0 — HUB generador-primero: deriva el spec (sitemap+flujos+copy+wireframe) desde
// Brief+Branding+DS y expone los 3 bloques (Site Map / User Flow / Wireframe+Copy). Los editores
// desacoplados (overlay nativo con React Flow / Puck) llegan en F1-F3. Ver architecture-approach.
const seedBrandingRead = (id: string): BrandSection[] =>
  id === 'p1' ? brandSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f })) })) : id === 'p4' ? seedMeridianBranding() : brandSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f, value: '', status: 'empty' as const })) }))

export function Architecture() {
  const { t } = useTranslation()
  const { activeProject } = useWorkspace()
  const engineLabel = useWorkspaceModels().effectiveEngine('architecture')?.label
  const projectId = activeProject?.id ?? 'p1'
  const projectType: 'website' | 'app' = activeProject?.type ?? 'website'
  const projectName = activeProject?.name ?? ''

  const [archSpec, setArchSpec] = usePersistentValue<ArchSpec | null>('archSpec', projectId, null)
  const [archSource, setArchSource] = usePersistentValue<string>('archSource', projectId, 'brief')
  const [archApproved, setArchApproved] = usePersistentValue<ArchApprovals>('archApproved', projectId, {})
  const [editorBlock, setEditorBlock] = useState<ArchBlock | null>(null)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const brief = useMemo(() => loadSections<BriefSection>('brief', projectId, () => seedBrief(projectId)), [projectId])
  const branding = useMemo(() => loadSections<BrandSection>('branding', projectId, () => seedBrandingRead(projectId)), [projectId])
  // Gate vivo: % de campos requeridos del Brief ya cerrados (listo ≥ 25%, como Branding).
  const briefReadiness = useMemo(() => {
    const req = brief.flatMap((s) => s.fields).filter((f) => f.required)
    return req.length ? Math.round((100 * req.filter((f) => f.status === 'closed').length) / req.length) : 0
  }, [brief])

  const counts = archSpec ? archCounts(archSpec) : { pages: 0, flows: 0, copyPages: 0 }
  const jsonText = useMemo(() => (archSpec ? JSON.stringify(archSpec, null, 2) : ''), [archSpec])

  // U3 cobertura: metas/dolores de El usuario (users.json) que una página puede atender/resolver.
  const usersSpec = getPersistentValue<UsersSpec | null>('usersSpec', projectId, null)
  const covTargets: CovTargets = useMemo(() => ({
    goals: usersSpec ? usersSpec.segments.flatMap((s) => s.goals.map((g) => ({ key: covKey(s.id, g.id), label: (g.kind === 'quality' ? g.story.want : g.story.want) || g.acceptance || g.id }))) : [],
    pains: usersSpec ? usersSpec.segments.flatMap((s) => s.pains.map((p) => ({ key: covKey(s.id, p.id), label: p.text || p.id }))) : [],
  }), [usersSpec])

  const generate = (source: string) => {
    setArchSource(source)
    setArchApproved({}) // nuevo origen → nada aprobado aún (coherente con DS)
    const full = buildArchSpec(brief, branding, projectType, projectName)
    // "Desde cero" arranca solo con el Home (o la 1ª página), sin padre y sin flujos.
    const home = full.pages.find((p) => p.id === 'home') ?? full.pages[0]
    setArchSpec(source === 'scratch' ? { ...full, pages: [{ ...home, parentId: undefined }], flows: [] } : full)
  }
  // Descarga un objeto/texto como .json (usado por el JSON general y los aislados por bloque).
  const downloadObj = (data: object | string, filename: string) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const copy = () => {
    navigator.clipboard?.writeText(jsonText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})
  }
  // Aprobación por bloque (firma de contenido; se reabre sola si editas después — cascada).
  const statusOf = (b: ArchBlock): ArchStatus => (archSpec ? blockStatus(archSpec, archApproved, b) : 'pending')
  const approveBlock = (b: ArchBlock) => { if (archSpec) setArchApproved({ ...archApproved, [b]: blockSignature(archSpec, b) }) }
  const approveAll = () => { if (archSpec) setArchApproved(Object.fromEntries(ARCH_BLOCKS.map((b) => [b, blockSignature(archSpec, b)]))) }
  const approvedCount = ARCH_BLOCKS.filter((b) => statusOf(b) === 'approved').length

  // ── Kickstart (empty-state, generador-primero) ────────────────────────────
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

  if (!archSpec) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="architecture" /></div>
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 lg:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3"><Network size={22} className="text-accent-strong" /></div>
            <h2 className="font-display text-xl font-bold text-content">{t('arch.kickstart.title')}</h2>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('arch.kickstart.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {card(<FileText size={20} />, t('arch.kickstart.fromBrief'), t('arch.kickstart.fromBriefDesc'), <><CircleCheck size={14} />{briefReadiness >= 25 ? t('arch.kickstart.briefReady', { n: briefReadiness }) : t('arch.kickstart.briefThin', { n: briefReadiness })}</>, () => generate('brief'), true, briefReadiness >= 25 ? 'accent' : 'muted')}
            {card(<Upload size={20} />, t('arch.kickstart.import'), t('arch.kickstart.importDesc'), <><ArrowRight size={14} />{t('arch.kickstart.importFoot')}</>, () => generate('import'))}
            {card(<GitBranch size={20} />, t('arch.kickstart.inherit'), t('arch.kickstart.inheritDesc'), <><ArrowRight size={14} />{t('arch.kickstart.inheritFoot')}</>, () => generate('inherit'))}
            {card(<Wand2 size={20} />, t('arch.kickstart.scratch'), t('arch.kickstart.scratchDesc'), <><ArrowRight size={14} />{t('arch.kickstart.scratchFoot')}</>, () => generate('scratch'))}
          </div>
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-[12px] text-muted"><ClipboardCheck size={15} className="text-accent-strong shrink-0" />{t('arch.kickstart.footHint')}</span>
            <span className="inline-flex items-center gap-2 text-[12px] text-faint sm:ml-auto"><Cpu size={15} className="shrink-0" />{t('arch.kickstart.engine', { model: engineLabel ?? '—' })}</span>
          </div>
        </div>
      </div>
    )
  }

  // ── HUB (generado) ────────────────────────────────────────────────────────
  const statusBadge = (st: ArchStatus) =>
    st === 'approved' ? <Badge tone="success"><Check size={11} />{t('arch.status.approved')}</Badge>
      : st === 'outdated' ? <Badge tone="warning"><AlertTriangle size={11} />{t('arch.status.outdated')}</Badge>
        : <Badge tone="neutral">{t('arch.status.pending')}</Badge>

  const blockCard = (block: ArchBlock, icon: ReactNode, name: string, sub: string) => {
    const st = statusOf(block)
    return (
      <div className="rounded-xl border border-line bg-raised p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-accent-strong">{icon}</span>
          <span className="text-[14px] font-medium text-content flex-1">{name}</span>
          {statusBadge(st)}
        </div>
        <p className="text-[12px] text-muted leading-snug">{sub}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Button size="sm" variant="secondary" onClick={() => setEditorBlock(block)}><ArrowRight size={14} />{t('arch.openEditor')}</Button>
          <Button size="sm" variant="ghost" onClick={() => archSpec && downloadObj(blockJson(archSpec, block), BLOCK_FILE[block])} aria-label={`${t('arch.exportBlock')} — ${BLOCK_FILE[block]}`} title={BLOCK_FILE[block]}><Download size={15} /></Button>
          {st !== 'approved' && (
            <Button size="sm" variant="ghost" className="text-accent-strong" onClick={() => approveBlock(block)}>
              {st === 'outdated' ? <><RotateCw size={14} />{t('arch.reapprove')}</> : <><Check size={14} />{t('arch.approve')}</>}
            </Button>
          )}
        </div>
      </div>
    )
  }

  const sourceLabel = archSource === 'import' ? t('arch.sourceImport') : archSource === 'inherit' ? t('arch.sourceInherit') : archSource === 'scratch' ? t('arch.sourceScratch') : t('arch.sourceBrief')
  // Árbol del sitemap para el preview humano (recursivo; visited evita ciclos por si acaso).
  const roots = archSpec.pages.filter((p) => !p.parentId || !archSpec.pages.some((q) => q.id === p.parentId))
  const childrenOf = (id: string) => archSpec.pages.filter((p) => p.parentId === id)
  const pageName = (id: string) => archSpec.pages.find((p) => p.id === id)?.name ?? id
  const renderNode = (p: ArchPage, seen: Set<string>): ReactNode => {
    if (seen.has(p.id)) return null
    seen.add(p.id)
    const kids = childrenOf(p.id)
    return (
      <li key={p.id}>
        <span className="text-[13px] text-content font-medium">{p.name}</span>
        <span className="text-[11px] text-faint ml-1.5">{p.path}</span>
        {kids.length > 0 && <ul className="ml-4 mt-0.5 border-l border-line pl-3 space-y-0.5">{kids.map((c) => renderNode(c, seen))}</ul>}
      </li>
    )
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="architecture" /></div>

      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[13px] text-muted inline-flex items-center gap-1.5"><Check size={13} className="text-success-strong" />{sourceLabel}</div>
            <div className="font-display text-lg font-bold text-content">{t('arch.titleFor', { name: projectName || 'Proyecto' })}</div>
            <div className="text-[12px] text-faint mt-0.5">{t('arch.summary', { pages: counts.pages, flows: counts.flows, type: t(`arch.type.${projectType}`) })}</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={() => setArchSpec(null)}><RotateCcw size={14} />{t('arch.regenerate')}</Button>
            <Button size="sm" variant="secondary" onClick={() => setJsonOpen(true)} aria-label="architecture.json" title="architecture.json"><Braces size={15} /></Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line flex-wrap">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide inline-flex items-center gap-1.5"><CircleCheck size={13} className="text-accent-strong" />{t('arch.review')}</span>
          {approvedCount === ARCH_BLOCKS.length
            ? <Badge tone="success"><Check size={11} />{t('arch.allApproved')}</Badge>
            : <span className="text-[12px] text-faint">{t('arch.approvedCount', { n: approvedCount, total: ARCH_BLOCKS.length })}</span>}
          {approvedCount < ARCH_BLOCKS.length && <button onClick={approveAll} className="text-[12px] text-accent-strong hover:underline ml-auto">{t('arch.approveAll')}</button>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          {blockCard('sitemap', <MapIcon size={16} />, t('arch.block.sitemap'), t('arch.block.sitemapSub', { n: counts.pages }))}
          {blockCard('flow', <Workflow size={16} />, t('arch.block.flow'), t('arch.block.flowSub', { n: counts.flows }))}
          {blockCard('wireframe', <PanelsTopLeft size={16} />, t('arch.block.wireframe'), t('arch.block.wireframeSub', { n: counts.copyPages }))}
        </div>
      </div>

      {/* Preview humano: árbol del sitemap + flujos (los editores visuales llegan en F1-F3) */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5"><MapIcon size={13} />{t('arch.block.sitemap')}</div>
            <ul className="space-y-1">
              {(() => { const seen = new Set<string>(); return roots.map((p) => renderNode(p, seen)) })()}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5"><Workflow size={13} />{t('arch.block.flow')}</div>
            <ul className="space-y-1">
              {archSpec.flows.map((f) => (
                <li key={f.id} className="text-[12px] text-muted flex items-center gap-1.5 flex-wrap">
                  <span className="text-content">{pageName(f.from)}</span>
                  <ArrowRight size={11} className="text-faint shrink-0" />
                  <span className="text-content">{pageName(f.to)}</span>
                  <span className="text-[11px] text-accent-strong bg-accent-soft rounded-full px-1.5">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ArchEditorOverlay block={editorBlock} spec={archSpec} onChange={setArchSpec} onClose={() => setEditorBlock(null)} status={editorBlock ? statusOf(editorBlock) : undefined} onApprove={() => editorBlock && approveBlock(editorBlock)} covTargets={covTargets} />

      <Modal open={jsonOpen} onClose={() => setJsonOpen(false)} title="architecture.json" size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('ds.copied') : t('ds.copy')}</Button>
            <Button variant="primary" onClick={() => downloadObj(jsonText, 'architecture.json')}><Download size={15} />{t('ds.download')}</Button>
          </>
        }>
        <p className="text-[12px] text-muted mb-3 leading-snug">{t('arch.jsonNote')}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[55vh] font-mono">{jsonText}</pre>
      </Modal>
    </div>
  )
}
