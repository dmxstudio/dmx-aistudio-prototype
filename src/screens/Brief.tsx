import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, ArrowRight, Wand2, Plus, History, ListChecks } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { EnginePill } from '../components/models/EnginePill'
import { FieldRow } from '../components/brief/FieldRow'
import { DecisionRow } from '../components/brief/DecisionRow'
import { PendingTray } from '../components/brief/PendingTray'
import { ResolveModal } from '../components/brief/ResolveModal'
import { HistoryDrawer } from '../components/brief/HistoryDrawer'
import { GenerateModal } from '../components/brief/GenerateModal'
import { FieldEditModal } from '../components/brief/FieldEditModal'
import { SectionNav } from '../components/brief/SectionNav'
import { CatalogsModal } from '../components/branding/CatalogsModal'
import { AuditBar } from '../components/brief/AuditBar'
import { useWorkspace } from '../lib/workspace'
import { useAuth } from '../lib/auth'
import { can } from '../lib/permissions'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { usePersistentSections, usePersistentValue } from '../lib/store'
import { nextEditable, prevEditable } from '../lib/fieldFlow'
import { useFieldFlow } from '../lib/useFieldFlow'
import { generateCatalogs, regenerateCatalog, isAiCapable, type BrandCatalog } from '../data/brandCatalogs'
import {
  briefSections,
  briefVersions,
  briefHistory,
  emptyVersions,
  emptyHistory,
  seedBrief,
  type BriefField,
  type BriefSection,
} from '../data/brief'

// Hard facts the AI must never invent — it turns these into questions instead.
const FACT_FIELDS = new Set(['a-name', 'a-client', 'c-budget'])

export function Brief() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeProject, to } = useWorkspace()
  const projectId = activeProject?.id ?? 'p1'
  const { user } = useAuth()
  const canEdit = can(user.role, 'edit')
  const canApprove = can(user.role, 'approve')
  const canGenerate = can(user.role, 'generate')
  const canAdvance = can(user.role, 'advance')

  const deepSeed = (): BriefSection[] =>
    briefSections.map((s) => ({ ...s, fields: s.fields.map((f) => ({ ...f })) }))
  const emptySeed = (): BriefSection[] =>
    briefSections.map((s) => ({
      ...s,
      fields: s.fields.map((f): BriefField => ({
        ...f,
        value: '',
        status: 'empty',
        kind: undefined,
        aiValue: undefined,
        humanValue: undefined,
        confidence: undefined,
      })),
    }))
  // Empty-state seed shared with Branding (which reads the brief's readiness) — keep one source of truth.
  const seedForProject = (id: string): BriefSection[] => seedBrief(id)

  const [sections, setSections] = usePersistentSections<BriefSection>('brief', projectId, () =>
    seedForProject(projectId),
  )
  const [activeId, setActiveId] = useState('overview')
  const [modalField, setModalField] = useState<BriefField | null>(null)
  const [optHidden, setOptHidden] = useState<Record<string, boolean>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [editField, setEditField] = useState<BriefField | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [catalogsOpen, setCatalogsOpen] = useState(false)
  const [customCatalogs, setCustomCatalogs] = usePersistentValue<Record<string, BrandCatalog>>(
    'briefCatalogs',
    projectId,
    {},
  )
  const wsModels = useWorkspaceModels()
  const briefEngine = wsModels.effectiveEngine('brief')
  const byomConnected = wsModels.connected

  useEffect(() => {
    if (!flashId) return
    const id = setTimeout(() => setFlashId(null), 1300)
    return () => clearTimeout(id)
  }, [flashId])

  // Reset the view position when the project changes (data persists per project in the store).
  useEffect(() => {
    setActiveId('overview')
    setFlashId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const allFields = useMemo(() => sections.flatMap((s) => s.fields), [sections])
  const allPending = useMemo(() => allFields.filter((f) => f.status === 'decision'), [allFields])
  const required = allFields.filter((f) => f.required)
  const readiness = required.length
    ? Math.round((100 * required.filter((f) => f.status === 'closed').length) / required.length)
    : 100
  const emptyRequired = required.filter((f) => f.status === 'empty').length
  const gateOpen = allPending.length === 0 && emptyRequired === 0
  const hasContent = allFields.some((f) => f.status !== 'empty' && !f.movedTo)
  const versions = projectId === 'p1' ? briefVersions : emptyVersions
  const history = projectId === 'p1' ? briefHistory : emptyHistory

  const active = sections.find((s) => s.id === activeId) ?? sections[0]
  const activeDesc = t(`brief.sectionDescs.${active.id}`, { defaultValue: '' })

  const sectionDecisions = (s: BriefSection) => s.fields.filter((f) => f.status === 'decision').length
  const sectionPct = (s: BriefSection) =>
    Math.round((100 * s.fields.filter((f) => f.status === 'closed').length) / s.fields.length)


  const resolve = (id: string, value: string) => {
    setSections((prev): BriefSection[] =>
      prev.map((s): BriefSection => ({
        ...s,
        fields: s.fields.map((f): BriefField =>
          f.id === id
            ? { ...f, value, status: 'closed', origin: 'human', kind: undefined, aiValue: undefined, humanValue: undefined }
            : f,
        ),
      })),
    )
    setModalField(null)
    setFlashId(id)
  }

  // Approve an AI draft → it becomes "closed" (counts toward Readiness).
  const approve = (id: string) => {
    setSections((prev): BriefSection[] =>
      prev.map((s): BriefSection => ({
        ...s,
        fields: s.fields.map((f): BriefField => (f.id === id ? { ...f, status: 'closed' } : f)),
      })),
    )
    setFlashId(id)
  }

  // Field-flow handlers (save + auto-advance + step) shared with the Branding panel.
  const { edit, editNext, editPrev } = useFieldFlow(sections, setSections, allFields, setEditField, setActiveId)

  // AI generation (mock): drafts only the EMPTY fields of the selected sections from the seed,
  // leaving hard facts as questions and preserving any work the user already did (closed/decision/etc.).
  const generate = (selectedIds: string[]) => {
    setSections((prev): BriefSection[] =>
      prev.map((s): BriefSection => {
        if (!selectedIds.includes(s.id)) return s
        const seed = briefSections.find((x) => x.id === s.id)
        return {
          ...s,
          fields: s.fields.map((f): BriefField => {
            if (f.movedTo || f.status !== 'empty') return f
            if (FACT_FIELDS.has(f.id))
              return {
                ...f,
                value: '',
                status: 'decision',
                kind: 'question',
                origin: 'ai',
                aiValue: undefined,
                humanValue: undefined,
                blocks: f.blocks ?? 'confirmación del equipo',
              }
            const seedField = seed?.fields.find((sf) => sf.id === f.id)
            if (!seedField || !seedField.value) return f
            return {
              ...f,
              value: seedField.value,
              status: 'inProgress',
              origin: 'ai',
              kind: undefined,
              aiValue: undefined,
              humanValue: undefined,
            }
          }),
        }
      }),
    )
    setCustomCatalogs(generateCatalogs()) // "Generar con IA" también deja los catálogos a la medida
    setGenerateOpen(false)
    if (selectedIds.length) setActiveId(selectedIds[0])
  }

  // Regenerate just one field's AI catalog from the modal (keeps the user in the flow).
  const regenerate = (fieldId: string) => {
    const cat = regenerateCatalog(fieldId)
    if (cat) setCustomCatalogs({ ...customCatalogs, [fieldId]: cat })
  }

  const snapshotFor = (id: string): BriefSection[] => {
    if (projectId !== 'p1') return emptySeed()
    const base = deepSeed()
    if (id === 'v2')
      return base.map((s) => ({
        ...s,
        fields: s.fields.map((f): BriefField =>
          f.id === 'a-markets'
            ? { ...f, value: 'MX · US', status: 'closed', origin: 'human', kind: undefined, aiValue: undefined, humanValue: undefined }
            : f.id === 'd-tone'
              ? { ...f, value: 'Cálido y cercano', status: 'closed', origin: 'human', kind: undefined }
              : f,
        ),
      }))
    return base
  }
  const restore = (id: string) => {
    setSections(snapshotFor(id))
    setDrawerOpen(false)
  }

  const visible = active.fields.filter((f) => !f.optional)
  const optional = active.fields.filter((f) => f.optional)
  const decisionCount = active.fields.filter((f) => f.status === 'decision').length

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <EnginePill phase="brief" />
      </div>
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex flex-col gap-3 items-stretch">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('brief.historyTitle')}
              title={t('brief.historyTitle')}
            >
              <History size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCatalogsOpen(true)}
              disabled={!byomConnected || !canGenerate}
            >
              <ListChecks size={15} />
              {t('branding.generateCatalogs')}
            </Button>
            <Button size="sm" variant="primary" onClick={() => setGenerateOpen(true)} disabled={!byomConnected || !canGenerate}>
              <Wand2 size={15} />
              {t('common.generateAI')}
            </Button>
            <Button
              size="sm"
              variant={gateOpen ? 'primary' : 'secondary'}
              disabled={!gateOpen || !canAdvance}
              onClick={() => navigate(to('branding'))}
              title={!gateOpen ? t('brief.gateHint') : undefined}
            >
              {gateOpen ? <ArrowRight size={16} /> : <Lock size={15} />}
              {t('brief.advance')}
            </Button>
          </div>
          <div className="min-w-[260px]">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted">{t('brief.readinessTo')}</span>
              <span className="font-display font-bold text-content">{readiness}%</span>
            </div>
            <div className="h-2 rounded-full bg-raised overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
        <SectionNav
          items={sections.map((s) => ({
            id: s.id,
            code: s.code,
            label: t(`brief.sections.${s.id}`, { defaultValue: s.name }),
            decisions: sectionDecisions(s),
            pct: sectionPct(s),
          }))}
          activeId={active.id}
          onSelect={setActiveId}
        />

        <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 md:p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-medium text-content">
                {active.code} · {t(`brief.sections.${active.id}`, { defaultValue: active.name })}
              </h2>
              {activeDesc && <p className="text-xs text-muted mt-1">{activeDesc}</p>}
            </div>
            {decisionCount > 0 && (
              <span className="text-[11px] bg-danger-soft text-danger-strong rounded-full px-2.5 py-1 shrink-0">
                {decisionCount} {t('brief.decide')}
              </span>
            )}
          </div>

          <div>
            {visible.map((f) =>
              f.status === 'decision' ? (
                <DecisionRow key={f.id} field={f} onOpen={canApprove ? setModalField : undefined} />
              ) : (
                <FieldRow key={f.id} field={f} flash={f.id === flashId} onApprove={canApprove ? approve : undefined} onEditOpen={canEdit ? setEditField : undefined} />
              ),
            )}
          </div>

          {optional.length > 0 && (
            <>
              {!optHidden[active.id] && (
                <div>
                  {optional.map((f) =>
                    f.status === 'decision' ? (
                      <DecisionRow key={f.id} field={f} onOpen={canApprove ? setModalField : undefined} />
                    ) : (
                      <FieldRow key={f.id} field={f} flash={f.id === flashId} onApprove={canApprove ? approve : undefined} onEditOpen={canEdit ? setEditField : undefined} />
                    ),
                  )}
                </div>
              )}
              <button
                onClick={() => setOptHidden((o) => ({ ...o, [active.id]: !o[active.id] }))}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-faint hover:text-muted"
              >
                <Plus size={13} />
                {optHidden[active.id] ? t('brief.showOptional', { n: optional.length }) : t('brief.hideOptional')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <PendingTray pending={allPending} onOpen={canApprove ? setModalField : undefined} />
      </div>

      <div className="mt-4">
        <AuditBar enabled={hasContent} />
      </div>

      <ResolveModal
        field={modalField}
        onClose={() => setModalField(null)}
        onResolve={resolve}
        aiCatalog={modalField ? customCatalogs[modalField.id] : undefined}
        aiCapable={modalField ? isAiCapable(modalField.id) : false}
        onRegenerate={modalField ? () => regenerate(modalField.id) : undefined}
      />
      <HistoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        versions={versions}
        history={history}
        onRestore={restore}
      />
      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        sections={sections}
        onGenerate={generate}
      />
      <FieldEditModal
        field={editField}
        onClose={() => setEditField(null)}
        onSave={edit}
        onNext={editNext}
        hasNext={!!editField && !!nextEditable(sections, editField.id)}
        onPrev={editPrev}
        hasPrev={!!editField && !!prevEditable(sections, editField.id)}
        aiCatalog={editField ? customCatalogs[editField.id] : undefined}
        aiCapable={editField ? isAiCapable(editField.id) : false}
        onRegenerate={editField ? () => regenerate(editField.id) : undefined}
      />
      <CatalogsModal
        open={catalogsOpen}
        onClose={() => setCatalogsOpen(false)}
        engineLabel={briefEngine?.label}
        hasCatalogs={Object.keys(customCatalogs).length > 0}
        onGenerate={() => setCustomCatalogs(generateCatalogs())}
      />
    </div>
  )
}
