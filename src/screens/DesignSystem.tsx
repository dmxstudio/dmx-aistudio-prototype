import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, ExternalLink, Lock, Braces, Download, Copy, Check, Cpu, Palette, RotateCcw, ShieldCheck, CircleCheck, CircleX, ClipboardCheck, GitMerge } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { EnginePill } from '../components/models/EnginePill'
import { DsKickstart } from '../components/designsystem/DsKickstart'
import { DsStartModal, type DsStartMode, type ImportVals } from '../components/designsystem/DsStartModal'
import { DsKnobs } from '../components/designsystem/DsKnobs'
import { useWorkspace } from '../lib/workspace'
import { loadSections, usePersistentValue, getPersistentValue } from '../lib/store'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { seedBrandingRead, brandGateIds, type BrandSection } from '../data/branding'
import { dsPayload, buildDesignTokens, countTokens, brandVersion, withOverrides, DEFAULT_KNOBS, type DsKnobs as Knobs, type DsOverrides } from '../lib/dsData'
import { validateDesignTokens, tokenGroups } from '../lib/dsValidate'
import { fontRolesOf } from '../lib/bookData'

const fvOf = (sections: BrandSection[], id: string) =>
  sections.flatMap((s) => s.fields).find((f) => f.id === id)?.value?.trim() ?? ''
// Grupos de la revisión (grano grueso, no 129 campos): apruebas bloques del sistema.
const GROUP_KEYS = ['color', 'type', 'space', 'components'] as const

// Fase 1 — vista GENERADORA del Design System (kickstart 3 entradas) + Fase 0 (derivación + dos caras).
// El DS se deriva de la Marca; no hay grid de campos. Revisión por grupos y perillas → Fases 2-3.

// Lee la Marca de un proyecto RESOLVIENDO su herencia igual que Branding: si el proyecto hereda
// (brandSource='inherit:Y'), toma la Marca de Y con los campos marcados heredados+cerrados. Sin esto
// el DS derivaba de la Marca cruda (vacía) mientras Branding mostraba la heredada (divergencia).
const resolveBranding = (projectId: string): BrandSection[] => {
  const bs = getPersistentValue<string>('brandSource', projectId, 'own')
  if (!bs.startsWith('inherit:')) return loadSections('branding', projectId, () => seedBrandingRead(projectId))
  const srcId = bs.slice('inherit:'.length)
  return loadSections<BrandSection>('branding', srcId, () => seedBrandingRead(srcId)).map((s) => ({
    ...s,
    fields: s.fields.map((ff) => (ff.status === 'empty' ? ff : { ...ff, inherited: true, status: 'closed' as const, kind: undefined, aiValue: undefined, humanValue: undefined })),
  }))
}

// Mínimo viable de Branding + un color de marca válido: TODA la rampa deriva del hex.
function readiness(sections: BrandSection[]) {
  const f = sections.flatMap((s) => s.fields)
  const gc = f.filter((x) => brandGateIds.includes(x.id) && x.status === 'closed').length
  const hexOk = /^#?[0-9a-f]{6}$/i.test(f.find((x) => x.id === 'cd-brand-hex')?.value?.trim() ?? '')
  const gateMet = gc === brandGateIds.length
  return { gc, total: brandGateIds.length, gateMet, hexOk, ready: gateMet && hexOk }
}

export function DesignSystem() {
  const { t } = useTranslation()
  const { activeProject, activeWorkspace, workspaceProjects } = useWorkspace()
  const projectId = activeProject?.id ?? 'p1'
  const wsId = activeWorkspace?.id ?? '1'
  const brandName = activeWorkspace?.name ?? ''
  const engineLabel = useWorkspaceModels().effectiveEngine('designSystem')?.label

  const [dsGenerated, setDsGenerated] = usePersistentValue<boolean>('dsGenerated', projectId, false)
  const [dsSource, setDsSource] = usePersistentValue<string>('dsSource', projectId, 'brand')
  // Fase 3: perillas, revisión por grupos, y reconciliación de import (todo por proyecto, volátil).
  const [dsKnobs, setDsKnobs] = usePersistentValue<Knobs>('dsKnobs', projectId, DEFAULT_KNOBS)
  const [dsApproved, setDsApproved] = usePersistentValue<string[]>('dsApproved', projectId, [])
  const [dsImportVals, setDsImportVals] = usePersistentValue<ImportVals>('dsImportVals', projectId, {})
  const [dsResolutions, setDsResolutions] = usePersistentValue<Record<string, string>>('dsResolutions', projectId, {})
  const [startMode, setStartMode] = useState<DsStartMode>(null)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // La Marca del PROYECTO actual (gate de la tarjeta "Desde la Marca"), resolviendo su herencia.
  const ownBranding = useMemo(() => resolveBranding(projectId), [projectId])
  const own = readiness(ownBranding)
  const ownReason = own.ready
    ? t('ds.kickstart.brandReady', { n: own.gc, total: own.total })
    : !own.gateMet
      ? t('ds.kickstart.brandThin', { n: own.gc, total: own.total })
      : t('ds.kickstart.brandNoHex')

  // Origen efectivo del DS ya generado (heredar lee la Marca de OTRO proyecto).
  const srcProjectId = dsSource.startsWith('inherit:') ? dsSource.slice('inherit:'.length) : projectId
  const srcBranding = useMemo(
    () => (srcProjectId === projectId ? ownBranding : resolveBranding(srcProjectId)),
    [srcProjectId, projectId, ownBranding],
  )

  // Reconciliación de import. Distingue CONFLICTO (la Marca ya tiene un valor válido y el import
  // trae otro) de RELLENO (la Marca no lo tiene → el import lo aporta, sin nada que decidir). Solo
  // aplica a los tokens de marca que chocan (color + fuente display, esta última si el rol Display
  // está declarado). Normaliza ambos lados (mayúsculas/espacios/#) para no marcar diferencias falsas.
  const norm = (s: string) => s.trim().toLowerCase().replace(/^#/, '')
  const bHexRaw = fvOf(ownBranding, 'cd-brand-hex')
  const bHexOk = /^#?[0-9a-f]{6}$/i.test(bHexRaw)
  const bFont = fvOf(ownBranding, 'font-display')
  const displayRole = fontRolesOf(ownBranding).includes('display')
  const conflicts = useMemo(() => {
    if (dsSource !== 'import') return []
    const out: { key: 'brandHex' | 'fontDisplay'; brand: string; imp: string }[] = []
    if (dsImportVals.brandHex && bHexOk && norm(dsImportVals.brandHex) !== norm(bHexRaw)) out.push({ key: 'brandHex', brand: bHexRaw, imp: dsImportVals.brandHex })
    if (dsImportVals.fontDisplay && displayRole && bFont && norm(dsImportVals.fontDisplay) !== norm(bFont)) out.push({ key: 'fontDisplay', brand: bFont, imp: dsImportVals.fontDisplay })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsSource, ownBranding, dsImportVals])
  // Override efectivo = RELLENO (la Marca no tiene el valor) + RESOLUCIÓN (conflicto → "usar Import").
  const overrides = useMemo<DsOverrides | undefined>(() => {
    if (dsSource !== 'import') return undefined
    const ov: DsOverrides = {}
    if (dsImportVals.brandHex && !bHexOk) ov.brandHex = dsImportVals.brandHex
    if (dsImportVals.fontDisplay && displayRole && !bFont) ov.fontDisplay = dsImportVals.fontDisplay
    for (const c of conflicts) if (dsResolutions[c.key] === 'import') ov[c.key] = c.imp
    return Object.keys(ov).length ? ov : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsSource, conflicts, dsResolutions, dsImportVals])

  // Readiness sobre la Marca EFECTIVA (con los overrides de import): un import que aporta el hex que
  // faltaba desbloquea el panel — si no, la reconciliación quedaría atrapada tras el gate (deadlock).
  const effBranding = dsSource === 'import' && overrides ? withOverrides(srcBranding, overrides) : srcBranding
  const src = readiness(effBranding)
  const srcReason = !src.gateMet ? t('ds.gate', { n: src.gc, total: src.total }) : t('ds.gateHex')

  const designTokens = useMemo(() => buildDesignTokens(srcBranding, brandName, dsKnobs, overrides), [srcBranding, brandName, dsKnobs, overrides])
  const counts = useMemo(() => countTokens(designTokens), [designTokens])
  const validation = useMemo(() => validateDesignTokens(designTokens), [designTokens])
  const groups = useMemo(() => tokenGroups(designTokens), [designTokens])
  const jsonText = useMemo(() => JSON.stringify(designTokens, null, 2), [designTokens])
  const version = brandVersion(srcBranding)

  const inheritOptions = workspaceProjects.filter((p) => p.id !== projectId).map((p) => ({ id: p.id, label: p.name }))
  const inheritName = workspaceProjects.find((p) => p.id === srcProjectId)?.name ?? ''
  const sourceLabel = dsSource.startsWith('inherit:')
    ? t('ds.sourceInherit', { name: inheritName })
    : dsSource === 'import'
      ? t('ds.sourceImport')
      : t('ds.sourceBrand')

  // Feed que lee el template (dmxds:<wsId>). Se escribe SOLO al abrir la guía (openDs, abajo), no en
  // un efecto: un efecto disparado al cambiar de proyecto corría con el `dsGenerated` viejo (lag de
  // usePersistentValue) y pisaba el feed del workspace con los tokens del proyecto equivocado.
  const writeFeed = () => {
    try {
      localStorage.setItem('dmxds:' + wsId, dsPayload(srcBranding, brandName, dsKnobs, overrides))
    } catch {
      /* quota — mantiene el feed anterior */
    }
    return wsId
  }

  // Generar re-arranca el estado de revisión/reconciliación: nuevo origen = nada aprobado aún.
  const generate = (source: string, importVals: ImportVals = {}) => {
    setDsSource(source)
    setDsImportVals(source === 'import' ? importVals : {})
    setDsResolutions({})
    setDsApproved([])
    setDsGenerated(true)
    setStartMode(null)
  }
  // Cambiar una perilla o resolver un conflicto RE-DERIVA el sistema → la revisión se re-abre.
  const changeKnobs = (k: Knobs) => {
    setDsKnobs(k)
    setDsApproved([])
  }
  const resolve = (key: string, choice: 'brand' | 'import') => {
    setDsResolutions({ ...dsResolutions, [key]: choice })
    setDsApproved([])
  }
  const approve = (g: string) => setDsApproved([...new Set([...dsApproved, g])])
  const approveAll = () => setDsApproved([...GROUP_KEYS])

  const openDs = () => {
    if (!src.ready) return
    const id = writeFeed()
    window.open(`/ds/index.html?brand=${id}`, '_blank', 'noopener')
  }
  const download = () => {
    const blob = new Blob([jsonText], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'design-tokens.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const copy = () => {
    navigator.clipboard
      ?.writeText(jsonText)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  const layer = (icon: React.ReactNode, label: string, n: number) => (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-raised px-3 py-2">
      <span className="text-accent-strong">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] text-muted leading-none">{label}</div>
        <div className="font-display font-bold text-content text-[15px] leading-tight">{n}</div>
      </div>
    </div>
  )

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="designSystem" /></div>

      {!dsGenerated ? (
        <DsKickstart
          dsReady={own.ready}
          brandReason={ownReason}
          canInherit={inheritOptions.length > 0}
          modelName={engineLabel}
          onFromBrand={() => generate('brand')}
          onInherit={() => setStartMode('inherit')}
          onImport={() => setStartMode('import')}
        />
      ) : (
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[13px] text-muted inline-flex items-center gap-1.5">
                <Check size={13} className="text-success-strong" />
                {sourceLabel}
              </div>
              <div className="font-display text-lg font-bold text-content">{brandName || 'Meridian'} Design System</div>
              {/* Los números/artefacto solo cuando el origen es COHERENTE (marca + hex válidos);
                  si no, sería anunciar "129 tokens" y un JSON mal-marcado para un origen vacío. */}
              {src.ready && (
                <div className="text-[12px] text-faint mt-0.5">
                  v{version} · {counts.total} {t('ds.tokens')} · {t('ds.layers')}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => setDsGenerated(false)}>
                <RotateCcw size={14} />
                {t('ds.regenerate')}
              </Button>
              {src.ready && (
                <Button size="sm" variant="secondary" onClick={() => setJsonOpen(true)} aria-label="design-tokens.json" title="design-tokens.json">
                  <Braces size={15} />
                </Button>
              )}
              <span title={!src.ready ? srcReason : undefined}>
                <Button size="sm" variant="primary" onClick={openDs} disabled={!src.ready}>
                  {src.ready ? <ExternalLink size={15} /> : <Lock size={14} />}
                  {t('ds.view')}
                </Button>
              </span>
            </div>
          </div>

          {src.ready ? (
            <>
              {/* Reconciliación con la Marca: conflictos import↔Marca resolubles por token. */}
              {dsSource === 'import' && conflicts.length > 0 && (
                <div className="mt-4 rounded-xl border border-warning-soft bg-warning-soft p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <GitMerge size={14} className="text-warning-strong" />
                    <span className="text-[12px] font-medium text-warning-strong">{t('ds.reconcileTitle', { n: conflicts.length })}</span>
                  </div>
                  <p className="text-[11px] text-warning-strong mb-2.5 leading-snug">{t('ds.reconcileNote')}</p>
                  <div className="space-y-2">
                    {conflicts.map((c) => {
                      const choice = dsResolutions[c.key] === 'import' ? 'import' : 'brand'
                      return (
                        <div key={c.key} className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] text-content w-24 shrink-0">{t(`ds.conflict.${c.key}`)}</span>
                          {(['brand', 'import'] as const).map((side) => (
                            <button
                              key={side}
                              onClick={() => resolve(c.key, side)}
                              className={`inline-flex items-center gap-1.5 text-[12px] rounded-full px-2.5 py-1 border transition-colors ${
                                choice === side ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'
                              }`}
                            >
                              {c.key === 'brandHex' && (
                                <span className="w-3 h-3 rounded-full border border-line shrink-0" style={{ background: side === 'brand' ? c.brand : c.imp }} />
                              )}
                              <span className="font-medium">{t(side === 'brand' ? 'ds.useMarca' : 'ds.useImport')}</span>
                              <span className="text-faint truncate max-w-[120px]">{side === 'brand' ? c.brand : c.imp}</span>
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Las 3 capas DTCG (arquitectura) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {layer(<Palette size={16} />, t('ds.layerPrimitive'), counts.primitive)}
                {layer(<Layers size={16} />, t('ds.layerSemantic'), counts.semantic)}
                {layer(<Cpu size={16} />, t('ds.layerComponent'), counts.component)}
              </div>

              {/* Cobertura por categoría */}
              <div className="mt-4">
                <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{t('ds.coverage')}</div>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => (
                    <span key={g.key} className="inline-flex items-center gap-1.5 text-[12px] rounded-full border border-line px-2.5 py-1 text-muted">
                      {t(`ds.cat.${g.key}`)}
                      <span className="font-display font-bold text-content">{g.n}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Perillas de alto nivel que re-derivan el sistema */}
              <DsKnobs knobs={dsKnobs} onChange={changeKnobs} />

              {/* Gate de validación (mismos checks que el validador del template) */}
              <div className="mt-4 pt-4 border-t border-line">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} className={validation.ok ? 'text-success-strong' : 'text-warning-strong'} />
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wide">{t('ds.validation')}</span>
                  <span className="text-[11px] text-faint ml-auto">{t('ds.validated', { n: validation.tokenCount })}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {validation.checks.map((c) => (
                    <span
                      key={c.key}
                      className={`inline-flex items-center gap-1 text-[12px] rounded-full px-2.5 py-1 ${
                        c.ok ? 'bg-success-soft text-success-strong' : 'bg-danger-soft text-danger-strong'
                      }`}
                    >
                      {c.ok ? <CircleCheck size={12} /> : <CircleX size={12} />}
                      {t(`ds.check.${c.key}`)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Revisión por GRUPOS (grano grueso): apruebas bloques, no 129 campos. */}
              <div className="mt-4 pt-4 border-t border-line">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ClipboardCheck size={14} className="text-accent-strong" />
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wide">{t('ds.review')}</span>
                  <span className="text-[11px] text-faint ml-auto">
                    {dsApproved.length}/{GROUP_KEYS.length}
                  </span>
                  {dsApproved.length < GROUP_KEYS.length && (
                    <button onClick={approveAll} className="text-[11px] text-accent-strong hover:underline">
                      {t('ds.approveAll')}
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {GROUP_KEYS.map((g) => {
                    const ok = dsApproved.includes(g)
                    return (
                      <div key={g} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                        <span className="text-[13px] text-content flex-1">{t(`ds.group.${g}`)}</span>
                        {ok ? (
                          <span className="inline-flex items-center gap-1 text-[11px] bg-success-soft text-success-strong px-2.5 py-1 rounded-full">
                            <Check size={11} />
                            {t('ds.approved')}
                          </span>
                        ) : (
                          <button onClick={() => approve(g)} className="text-[12px] text-accent-strong hover:bg-accent-soft rounded-full px-2.5 py-1 transition-colors">
                            {t('ds.approve')}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-warning-strong mt-3 flex items-center gap-1.5">
              <Lock size={12} className="shrink-0" />
              {srcReason}
            </p>
          )}
        </div>
      )}

      <DsStartModal
        mode={startMode}
        inheritOptions={inheritOptions}
        onClose={() => setStartMode(null)}
        onInherit={(id) => generate('inherit:' + id)}
        onImport={(vals) => generate('import', vals)}
      />

      <Modal open={jsonOpen} onClose={() => setJsonOpen(false)} title="design-tokens.json" size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? t('ds.copied') : t('ds.copy')}
            </Button>
            <Button variant="primary" onClick={download}>
              <Download size={15} />
              {t('ds.download')}
            </Button>
          </>
        }
      >
        <p className="text-[12px] text-muted mb-3 leading-snug">{t('ds.jsonNote')}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[55vh] font-mono">
          {jsonText}
        </pre>
      </Modal>
    </div>
  )
}
