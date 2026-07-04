import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Database, FileText, Upload, GitBranch, Wand2, ArrowRight, Braces, Download, Copy, Check, RotateCcw, RotateCw, AlertTriangle, CircleCheck, Plus, Trash2, Pencil, ClipboardCheck, Cpu, Layers, Boxes, Rocket, Code2, ChevronDown, Settings2, Route } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EnginePill } from '../components/models/EnginePill'
import { useWorkspace } from '../lib/workspace'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { loadSections, usePersistentValue, getPersistentValue } from '../lib/store'
import { seedBrandingRead, type BrandSection } from '../data/branding'
import { buildBookTokens } from '../lib/bookData'
import { buildBindings, vizPages, editedPage, type PageEdit } from '../lib/vizData'
import type { ArchSpec } from '../lib/archData'
import { buildCmsSpec, emptyContentType, cmsCounts, typeSignature, typeStatus, cmsAllApproved, cmsPackage, FIELD_TYPES, CMS_TARGETS, PLATFORMS, PLATFORM_OPTIONS, defaultOptions, type CmsSpec, type ContentType, type CmsField, type CmsTarget, type CmsApprovals, type CmsStatus } from '../lib/cmsData'

// CMS (fase 8) — panel AUTOPORTANTE plataforma-primero: eliges plataforma (Payload/Instatic), la estructura se
// PROPONE desde Arquitectura + los bindings del Visualizador, ajustas opciones, y se arma el PAQUETE para
// Publicar. El CRUD tipo-por-tipo queda como modo avanzado. Ver memoria cms-panel.
const nextId = (prefix: string, items: { id: string }[]) => {
  let max = 0
  items.forEach((x) => { const m = new RegExp(`^${prefix}(\\d+)$`).exec(x.id); if (m) max = Math.max(max, +m[1]) })
  return `${prefix}${max + 1}`
}

export function Cms() {
  const { t } = useTranslation()
  const { activeProject, to } = useWorkspace()
  const navigate = useNavigate()
  const projectId = activeProject?.id ?? 'p1'
  const projectName = activeProject?.name ?? ''
  const engineLabel = useWorkspaceModels().effectiveEngine('cms')?.label

  const [cmsSpec, setCmsSpec] = usePersistentValue<CmsSpec | null>('cmsSpec', projectId, null)
  const [, setCmsSource] = usePersistentValue<string>('cmsSource', projectId, 'arch')
  const [cmsApproved, setCmsApproved] = usePersistentValue<CmsApprovals>('cmsApproved', projectId, {})
  const [selId, setSelId] = useState<string>('')
  const [fieldDraft, setFieldDraft] = useState<{ typeId: string; field: CmsField } | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [packageOpen, setPackageOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const arch = getPersistentValue<ArchSpec | null>('archSpec', projectId, null)
  const archReady = !!arch && arch.pages.length > 0
  const branding = useMemo(() => loadSections<BrandSection>('branding', projectId, () => seedBrandingRead(projectId)), [projectId])
  const tokens = useMemo(() => buildBookTokens(branding), [branding])
  // Bindings del Visualizador (sección↔contenido). Derivados de la Arquitectura pero HONRANDO las ediciones
  // del owner (bloques ocultados en el cockpit) — el conteo refleja lo avalado, no la arquitectura cruda.
  const vizPageEdits = getPersistentValue<Record<string, PageEdit>>('vizPageEdits', projectId, {})
  const bindings = useMemo(
    () => (arch ? buildBindings(vizPages(arch).map((p) => editedPage(p, vizPageEdits[p.pageId]))) : []),
    [arch, vizPageEdits],
  )

  const counts = cmsSpec ? cmsCounts(cmsSpec) : { types: 0, fields: 0, collections: 0 }

  const generate = (source: string) => {
    setCmsSource(source)
    setCmsApproved({})
    const full = buildCmsSpec(arch, projectName, 'payload')
    setCmsSpec(source === 'scratch' ? { ...full, types: [{ id: 'ct-settings', name: t('cms.settings'), kind: 'single', fields: [{ id: 'siteName', name: t('cms.siteName'), type: 'text', required: true }] }] } : full)
  }
  const downloadObj = (data: string, filename: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const copyText = (text: string) => navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }).catch(() => {})

  const statusOf = (id: string): CmsStatus => (cmsSpec ? typeStatus(cmsSpec, cmsApproved, id) : 'pending')
  const approveType = (id: string) => { if (cmsSpec) setCmsApproved({ ...cmsApproved, [id]: typeSignature(cmsSpec, id) }) }
  const approveAll = () => { if (cmsSpec) setCmsApproved(Object.fromEntries(cmsSpec.types.map((tp) => [tp.id, typeSignature(cmsSpec, tp.id)]))) }
  const approvedCount = cmsSpec ? cmsSpec.types.filter((tp) => statusOf(tp.id) === 'approved').length : 0

  const updateType = (id: string, fn: (t: ContentType) => ContentType) => { if (cmsSpec) setCmsSpec({ ...cmsSpec, types: cmsSpec.types.map((tp) => (tp.id === id ? fn(tp) : tp)) }) }
  const addType = () => {
    if (!cmsSpec) return
    const id = nextId('ct-x', cmsSpec.types)
    setCmsSpec({ ...cmsSpec, types: [...cmsSpec.types, emptyContentType(id, t('cms.newType'))] })
    setSelId(id)
  }
  const deleteType = (id: string) => {
    if (!cmsSpec) return
    const rest = cmsSpec.types.filter((tp) => tp.id !== id).map((tp) => ({ ...tp, fields: tp.fields.map((f) => (f.ref === id ? { ...f, ref: undefined } : f)) }))
    setCmsSpec({ ...cmsSpec, types: rest })
    if (cmsApproved[id] != null) { const next = { ...cmsApproved }; delete next[id]; setCmsApproved(next) }
    if (selId === id) setSelId(rest[0]?.id ?? '')
  }
  const saveField = (typeId: string, field: CmsField) => {
    updateType(typeId, (tp) => ({ ...tp, fields: tp.fields.some((f) => f.id === field.id) ? tp.fields.map((f) => (f.id === field.id ? field : f)) : [...tp.fields, field] }))
    setFieldDraft(null)
  }
  const deleteField = (typeId: string, fieldId: string) => updateType(typeId, (tp) => ({ ...tp, fields: tp.fields.filter((f) => f.id !== fieldId) }))

  // ── Kickstart ──────────────────────────────────────────────────────────────
  const kcard = (icon: ReactNode, title: string, desc: string, foot: ReactNode, onClick: () => void, recommended?: boolean, footTone: 'accent' | 'muted' = 'muted') => (
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

  if (!cmsSpec) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="cms" /></div>
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 lg:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3"><Database size={22} className="text-accent-strong" /></div>
            <h2 className="font-display text-xl font-bold text-content">{t('cms.kickstart.title')}</h2>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('cms.kickstart.subtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {kcard(<FileText size={20} />, t('cms.kickstart.fromArch'), t('cms.kickstart.fromArchDesc'), <><CircleCheck size={14} />{archReady ? t('cms.kickstart.archReady', { n: arch!.pages.length }) : t('cms.kickstart.archThin')}</>, () => generate('arch'), true, archReady ? 'accent' : 'muted')}
            {kcard(<Upload size={20} />, t('cms.kickstart.import'), t('cms.kickstart.importDesc'), <><ArrowRight size={14} />{t('cms.kickstart.importFoot')}</>, () => generate('import'))}
            {kcard(<GitBranch size={20} />, t('cms.kickstart.inherit'), t('cms.kickstart.inheritDesc'), <><ArrowRight size={14} />{t('cms.kickstart.inheritFoot')}</>, () => generate('inherit'))}
            {kcard(<Wand2 size={20} />, t('cms.kickstart.scratch'), t('cms.kickstart.scratchDesc'), <><ArrowRight size={14} />{t('cms.kickstart.scratchFoot')}</>, () => generate('scratch'))}
          </div>
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-[12px] text-muted"><ClipboardCheck size={15} className="text-accent-strong shrink-0" />{t('cms.kickstart.footHint')}</span>
            <span className="inline-flex items-center gap-2 text-[12px] text-faint sm:ml-auto"><Cpu size={15} className="shrink-0" />{t('cms.kickstart.engine', { model: engineLabel ?? '—' })}</span>
          </div>
        </div>
      </div>
    )
  }

  // Normaliza contra un spec persistido viejo (target anterior / sin options).
  const target: CmsTarget = (CMS_TARGETS as string[]).includes(cmsSpec.target) ? cmsSpec.target : 'payload'
  const options = cmsSpec.options ?? defaultOptions(target)
  const platform = PLATFORMS[target]
  const pkgJson = JSON.stringify(cmsPackage({ ...cmsSpec, target, options }, tokens), null, 2)
  const setTarget = (tg: CmsTarget) => setCmsSpec({ ...cmsSpec, target: tg, options: defaultOptions(tg) })
  const toggleOption = (o: string) => setCmsSpec({ ...cmsSpec, target, options: { ...options, [o]: !options[o] } })
  const type: ContentType | undefined = cmsSpec.types.find((tp) => tp.id === selId) ?? cmsSpec.types[0]

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <EnginePill phase="cms" />
        <Button size="sm" variant="ghost" onClick={() => setCmsSpec(null)}><RotateCcw size={14} />{t('cms.regenerate')}</Button>
      </div>

      {/* 1 · Plataforma (autoportante: eliges primero — mueve la frontera CMS↔Publicar) */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="text-[11px] font-medium text-muted uppercase tracking-wide inline-flex items-center gap-1.5 mb-1"><Database size={13} className="text-accent-strong" />{t('cms.platform')}</div>
        <p className="text-[12px] text-faint mb-3">{t('cms.platformSub')}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {CMS_TARGETS.map((tg) => {
            const sel = target === tg
            const info = PLATFORMS[tg]
            return (
              <button key={tg} onClick={() => setTarget(tg)} className={`text-left rounded-xl p-4 border-2 transition-colors ${sel ? 'border-accent bg-accent-soft/40' : 'border-line hover:bg-raised'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-accent-strong">{info.kind === 'publisher' ? <Rocket size={18} /> : <Code2 size={18} />}</span>
                  <span className="text-[15px] font-medium text-content">{t(`cms.provider.${tg}`)}</span>
                  <span className="ml-auto text-[10px] rounded-full px-2 py-0.5 bg-raised border border-line text-muted">{t(`cms.platformKind.${info.kind}`)}</span>
                </div>
                <p className="text-[12px] text-muted mt-1.5 leading-snug">{t(`cms.platformNote.${tg}`)}</p>
                <div className="mt-2 text-[11px] font-mono text-faint inline-flex items-center gap-1"><Braces size={11} />{info.file}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 2 · Estructura propuesta (desde Arq + bindings) + opciones */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="font-display text-lg font-bold text-content">{t('cms.proposalFor', { name: projectName || t('cms.untitled') })}</div>
            <div className="text-[12px] text-faint mt-0.5">{t('cms.summary', { types: counts.types, fields: counts.fields, collections: counts.collections })}</div>
            <div className="text-[12px] text-muted mt-1 inline-flex items-center gap-1.5"><Route size={13} className="text-accent-strong" />{t('cms.derivedNote', { n: bindings.length })}</div>
          </div>
          <span className="flex items-center gap-2 shrink-0">
            {cmsSpec && cmsAllApproved(cmsSpec, cmsApproved)
              ? <Badge tone="success"><Check size={11} />{t('cms.allApproved')}</Badge>
              : <span className="text-[12px] text-faint">{t('cms.approvedCount', { n: approvedCount, total: counts.types })}</span>}
            {approvedCount < counts.types && <button onClick={approveAll} className="text-[12px] text-accent-strong hover:underline">{t('cms.approveAll')}</button>}
          </span>
        </div>
        {/* Tipos propuestos (read-first) */}
        <div className="flex flex-wrap gap-2 mt-4">
          {cmsSpec.types.map((tp) => {
            const st = statusOf(tp.id)
            return (
              <div key={tp.id} className="rounded-xl border border-line bg-raised px-3 py-2 inline-flex items-center gap-2">
                {tp.kind === 'collection' ? <Boxes size={13} className="text-accent-strong" /> : <Layers size={13} className="text-accent-strong" />}
                <span className="text-[13px] text-content">{tp.name}</span>
                <span className="text-[11px] text-faint">{t('cms.nFields', { n: tp.fields.length })}</span>
                {st === 'approved' ? <Check size={12} className="text-success-strong" /> : st === 'outdated' ? <AlertTriangle size={11} className="text-warning-strong" /> : null}
              </div>
            )
          })}
        </div>
        {/* Opciones de la plataforma */}
        <div className="mt-4 pt-4 border-t border-line">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide inline-flex items-center gap-1.5"><Settings2 size={13} className="text-accent-strong" />{t('cms.options', { platform: t(`cms.provider.${target}`) })}</div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PLATFORM_OPTIONS[target].map((o) => {
              const on = !!options[o]
              return <button key={o} onClick={() => toggleOption(o)} className={`text-[12px] rounded-full px-3 py-1 border transition-colors inline-flex items-center gap-1 ${on ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{on && <Check size={12} />}{t(`cms.opt.${o}`)}</button>
            })}
          </div>
        </div>
      </div>

      {/* 3 · Editar estructura (avanzado — el CRUD tipo por tipo) */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft mb-4 overflow-hidden">
        <button onClick={() => setAdvancedOpen(!advancedOpen)} className="w-full px-5 py-3.5 flex items-center gap-2 hover:bg-raised transition-colors">
          <Settings2 size={15} className="text-muted" />
          <span className="text-[13px] font-medium text-content">{t('cms.advanced')}</span>
          <span className="text-[12px] text-faint">{t('cms.advancedSub')}</span>
          <ChevronDown size={16} className={`ml-auto text-muted transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
        </button>
        {advancedOpen && (
          <div className="px-5 pb-5 border-t border-line pt-4">
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
              <div className="border border-line rounded-xl p-3 h-fit">
                <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 px-1">{t('cms.types')}</div>
                <div className="flex flex-col gap-2">
                  {cmsSpec.types.map((tp) => {
                    const active = tp.id === type?.id
                    const st = statusOf(tp.id)
                    return (
                      <button key={tp.id} onClick={() => setSelId(tp.id)} className={`text-left rounded-xl p-3 transition-colors ${active ? 'border-2 border-accent bg-raised' : 'border border-line hover:bg-raised'}`}>
                        <div className="flex items-center gap-1.5">
                          {tp.kind === 'collection' ? <Boxes size={13} className="text-accent-strong shrink-0" /> : <Layers size={13} className="text-accent-strong shrink-0" />}
                          <span className="text-[13px] font-medium text-content flex-1 truncate">{tp.name}</span>
                          {st === 'approved' ? <Check size={13} className="text-success-strong shrink-0" /> : st === 'outdated' ? <AlertTriangle size={12} className="text-warning-strong shrink-0" /> : null}
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">{t(`cms.kind.${tp.kind}`)} · {t('cms.nFields', { n: tp.fields.length })}</div>
                      </button>
                    )
                  })}
                </div>
                <button onClick={addType} className="text-[12px] text-accent-strong hover:bg-accent-soft rounded-lg px-2 py-1.5 mt-2 inline-flex items-center gap-1 w-full"><Plus size={14} />{t('cms.addType')}</button>
              </div>

              {type && (
                <div className="border border-line rounded-xl p-5 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <input value={type.name} onChange={(e) => updateType(type.id, (tp) => ({ ...tp, name: e.target.value }))} className="font-display text-lg font-bold text-content bg-transparent border-b border-transparent hover:border-line focus:border-accent focus:outline-none w-full" />
                      <div className="flex items-center gap-1.5 mt-2">
                        {(['single', 'collection'] as const).map((k) => (
                          <button key={k} onClick={() => updateType(type.id, (tp) => ({ ...tp, kind: k }))} className={`text-[12px] rounded-full px-3 py-1 border transition-colors ${type.kind === k ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{t(`cms.kind.${k}`)}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusOf(type.id) === 'approved'
                        ? <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-success-soft text-success-strong rounded-full px-3 py-1.5"><Check size={14} />{t('cms.approved')}</span>
                        : <Button size="sm" variant="primary" onClick={() => approveType(type.id)}>{statusOf(type.id) === 'outdated' ? <><RotateCw size={14} />{t('cms.reapprove')}</> : <><Check size={14} />{t('cms.approve')}</>}</Button>}
                      <Button size="sm" variant="ghost" className="text-danger-strong" onClick={() => deleteType(type.id)} aria-label={t('cms.deleteType')} title={t('cms.deleteType')}><Trash2 size={15} /></Button>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-muted uppercase tracking-wide mt-4 mb-2">{t('cms.fields')}</div>
                  <div className="space-y-1.5">
                    {type.fields.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 group">
                        <span className="text-[13px] text-content flex-1 truncate">{f.name}</span>
                        <span className="text-[11px] rounded-full px-2 py-0.5 bg-raised border border-line text-muted">{t(`cms.ftype.${f.type}`)}</span>
                        {f.required && <span className="text-[11px] text-danger-strong">{t('cms.required')}</span>}
                        <button onClick={() => setFieldDraft({ typeId: type.id, field: f })} className="text-muted hover:text-accent-strong p-1" aria-label={t('cms.editField')}><Pencil size={13} /></button>
                        <button onClick={() => deleteField(type.id, f.id)} className="text-muted hover:text-danger-strong p-1" aria-label={t('cms.delete')}><Trash2 size={13} /></button>
                      </div>
                    ))}
                    {type.fields.length === 0 && <p className="text-[13px] text-faint">{t('cms.noFields')}</p>}
                  </div>
                  <Button size="sm" variant="secondary" className="mt-2" onClick={() => setFieldDraft({ typeId: type.id, field: { id: nextId('fx-', type.fields), name: '', type: 'text', required: false } })}><Plus size={14} />{t('cms.addField')}</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4 · Paquete + handoff a Publicar */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-content inline-flex items-center gap-1.5"><Boxes size={15} className="text-accent-strong" />{t('cms.package', { file: platform.file })}</div>
            <p className="text-[12px] text-muted mt-0.5 leading-snug">{t(`cms.publishNote.${target}`)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setPackageOpen(true)}><Braces size={15} />{t('cms.viewPackage')}</Button>
            <Button size="sm" variant="primary" onClick={() => navigate(to('publish', 'project'))}><Rocket size={14} />{t('cms.toPublish')}</Button>
          </div>
        </div>
      </div>

      {fieldDraft && <FieldModal draft={fieldDraft.field} types={cmsSpec.types} onClose={() => setFieldDraft(null)} onSave={(f) => saveField(fieldDraft.typeId, f)} t={t} />}

      <Modal open={packageOpen} onClose={() => setPackageOpen(false)} title={t('cms.packageTitle', { file: platform.file })} size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => copyText(pkgJson)}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? t('ds.copied') : t('ds.copy')}</Button>
          <Button variant="primary" onClick={() => downloadObj(pkgJson, platform.file)}><Download size={15} />{t('ds.download')}</Button>
        </>}>
        <p className="text-[12px] text-muted mb-3 leading-snug">{t(`cms.packageNote.${target}`)}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[55vh] font-mono">{pkgJson}</pre>
      </Modal>
    </div>
  )
}

type T = (k: string, o?: Record<string, unknown>) => string

function FieldModal({ draft, types, onClose, onSave, t }: { draft: CmsField; types: ContentType[]; onClose: () => void; onSave: (f: CmsField) => void; t: T }) {
  const [f, setF] = useState<CmsField>(draft)
  const set = (patch: Partial<CmsField>) => setF((p) => ({ ...p, ...patch }))
  return (
    <Modal open onClose={onClose} title={t('cms.editField')} size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>{t('cms.cancel')}</Button><Button variant="primary" onClick={() => onSave(f)}><Check size={15} />{t('cms.save')}</Button></>}>
      <label className="block mb-3"><span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('cms.fieldName')}</span>
        <input value={f.name} onChange={(e) => set({ name: e.target.value })} className="w-full text-[13px] rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-content" /></label>
      <div className="mb-3"><span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('cms.fieldType')}</span>
        <div className="flex flex-wrap gap-1.5">
          {FIELD_TYPES.map((ty) => (
            <button key={ty} type="button" onClick={() => set({ type: ty, ref: ty === 'reference' ? f.ref : undefined })} className={`text-[12px] rounded-full px-3 py-1 border transition-colors ${f.type === ty ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{t(`cms.ftype.${ty}`)}</button>
          ))}
        </div>
      </div>
      {f.type === 'reference' && (
        <label className="block mb-3"><span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('cms.refTo')}</span>
          <select value={f.ref ?? ''} onChange={(e) => set({ ref: e.target.value || undefined })} className="w-full text-[13px] rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-content">
            <option value="">{t('cms.pickType')}</option>
            {types.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
          </select></label>
      )}
      <button type="button" onClick={() => set({ required: !f.required })} className={`text-[13px] rounded-lg border px-2.5 py-1.5 inline-flex items-center gap-2 ${f.required ? 'border-accent bg-accent-soft' : 'border-line hover:bg-raised'}`}>
        <span className={`w-4 h-4 rounded border flex items-center justify-center ${f.required ? 'bg-accent border-accent text-white' : 'border-line'}`}>{f.required && <Check size={11} />}</span>
        <span className="text-content">{t('cms.requiredField')}</span>
      </button>
    </Modal>
  )
}
