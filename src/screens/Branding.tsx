import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Lock, ArrowRight, Wand2, History, GitBranch, Braces, ListChecks, ExternalLink, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { FieldRow } from '../components/brief/FieldRow'
import { DecisionRow } from '../components/brief/DecisionRow'
import { PendingTray } from '../components/brief/PendingTray'
import { ResolveModal } from '../components/brief/ResolveModal'
import { HistoryDrawer } from '../components/brief/HistoryDrawer'
import { GenerateModal } from '../components/brief/GenerateModal'
import { AuditBar } from '../components/brief/AuditBar'
import { PersonalityScales } from '../components/branding/PersonalityScales'
import { BrandSourceSelector, type BrandSourceOption } from '../components/branding/BrandSourceSelector'
import { BrandJsonModal } from '../components/branding/BrandJsonModal'
import { SectionNav } from '../components/brief/SectionNav'
import { BrandKickstart } from '../components/branding/BrandKickstart'
import { BrandStartModal, type StartMode } from '../components/branding/BrandStartModal'
import { FieldEditModal } from '../components/brief/FieldEditModal'
import { EnginePill } from '../components/models/EnginePill'
import { useWorkspace } from '../lib/workspace'
import { bookPayload } from '../lib/bookData'
import { useAuth } from '../lib/auth'
import { can } from '../lib/permissions'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { usePersistentSections, usePersistentValue, loadSections } from '../lib/store'
import { nextEditable, prevEditable, sectionIdOf } from '../lib/fieldFlow'
import { useFieldFlow } from '../lib/useFieldFlow'
import { brandSections, personalityScales, brandGateIds, seedMeridianBranding, brandVersions, brandHistory, type BrandSection, type BrandField } from '../data/branding'
import { getEditor, MULTI_SEP } from '../data/fieldEditors'
import { generateCatalogs, regenerateCatalog, isAiCapable, type BrandCatalog } from '../data/brandCatalogs'
import { CatalogsModal } from '../components/branding/CatalogsModal'
import { TranslationStatus, TranslationPanel } from '../components/branding/TranslationMock'
import { parseLocales, summarizeTranslation, fakeTransState, langLabel, langShort, type TransState } from '../lib/translation'
import { emptyVersions, emptyHistory, seedBrief, type BriefField, type BriefSection } from '../data/brief'

export function Branding() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { activeProject, activeWorkspace, workspaceProjects, to } = useWorkspace()
  const projectId = activeProject?.id ?? 'p1'
  const { user } = useAuth()
  const canEdit = can(user.role, 'edit')
  const canApprove = can(user.role, 'approve')
  const canGenerate = can(user.role, 'generate')
  const canAdvance = can(user.role, 'advance')

  const deepSeed = (): BrandSection[] =>
    brandSections.map((s) => ({ ...s, fields: s.fields.map((ff) => ({ ...ff })) }))
  const emptySeed = (): BrandSection[] =>
    brandSections.map((s) => ({
      ...s,
      fields: s.fields.map((ff): BrandField => ({
        ...ff,
        value: '',
        rows: undefined, // seed rows (cd-semantic, cd-palette…) must not leak into empty projects
        status: 'empty',
        kind: undefined,
        aiValue: undefined,
        humanValue: undefined,
        inherited: undefined,
        confidence: undefined,
        owner: undefined,
        source: undefined,
        taxonomy: undefined,
        approval: undefined,
      })),
    }))
  const seedForBranding = (id: string): BrandSection[] =>
    id === 'p1' ? deepSeed() : id === 'p4' ? seedMeridianBranding() : emptySeed()
  const [sections, setSections] = usePersistentSections<BrandSection>('branding', projectId, () =>
    seedForBranding(projectId),
  )

  const [activeId, setActiveId] = useState('foundation')
  const [brandSource, setBrandSource] = usePersistentValue('brandSource', projectId, 'own')
  const [modalField, setModalField] = useState<BriefField | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [editField, setEditField] = useState<BriefField | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [optHidden, setOptHidden] = useState<Record<string, boolean>>({})
  const [startMode, setStartMode] = useState<StartMode>(null)
  const [kickstartDone, setKickstartDone] = usePersistentValue('brandKickstartDone', projectId, false)
  const [customCatalogs, setCustomCatalogs] = usePersistentValue<Record<string, BrandCatalog>>(
    'brandCatalogs',
    projectId,
    {},
  )
  const [catalogsOpen, setCatalogsOpen] = useState(false)

  useEffect(() => {
    if (!flashId) return
    const id = setTimeout(() => setFlashId(null), 1300)
    return () => clearTimeout(id)
  }, [flashId])

  // Feed the standalone brand-book (public/book) with this brand's panel data so /book?brand=<id>
  // renders faithfully. Same-origin localStorage; the book's i18n.js merges it over the demo.
  // Uploaded files (EPS/PDF/imágenes) can push the payload past the ~5MB localStorage quota;
  // a failed write must never crash the screen — the book just keeps its previous feed.
  // GUARD: la clave es por WORKSPACE pero los seeds son por PROYECTO — un proyecto hermano vacío
  // (emptySeed) NO debe pisar el feed poblado de la marca; sin contenido no se publica nada y la
  // guía muestra la plantilla demo completa. ponytail: el feed es de quien tiene contenido; si dos
  // proyectos del mismo workspace llenan marcas propias distintas, el último en renderizar gana.
  const writeBookFeed = () => {
    const brandId = activeWorkspace?.id ?? '1'
    const hasAny = sections.some((s) => s.fields.some((ff) => ff.status !== 'empty' && !ff.movedTo))
    if (!hasAny) return brandId
    try {
      localStorage.setItem('dmxbook:' + brandId, bookPayload(sections, activeWorkspace?.name))
    } catch {
      /* quota exceeded — keep the stale feed */
    }
    return brandId
  }
  useEffect(() => {
    writeBookFeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, activeWorkspace])

  // Open this brand's personalized brand-book in a new tab (writes a fresh feed first, then passes
  // ?brand=<id> so the book reads it — without the param the template shows its Meridian default).
  const openBook = () => {
    if (!bookReady) return // el botón está disabled; guarda defensiva por si se llama de otro lado
    const brandId = writeBookFeed()
    window.open(`/book/index.html?brand=${brandId}`, '_blank', 'noopener')
  }


  useEffect(() => {
    setActiveId('foundation')
    setFlashId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const sourceOptions: BrandSourceOption[] = [
    { id: 'own', label: t('branding.ownBrand') },
    ...workspaceProjects
      .filter((p) => p.id !== activeProject?.id)
      .map((p) => ({ id: `inherit:${p.id}`, label: t('branding.inheritFrom', { name: p.name }) })),
  ]
  const inheritedFrom =
    brandSource === 'own'
      ? null
      : workspaceProjects.find((p) => `inherit:${p.id}` === brandSource)?.name ?? '—'
  const isInherited = brandSource !== 'own'

  const displaySections: BrandSection[] = useMemo(() => {
    const base: BrandSection[] = (() => {
      if (brandSource === 'own') return sections
      const sourceId = brandSource.slice('inherit:'.length)
      const sourceSections = loadSections<BrandSection>('branding', sourceId, () => seedForBranding(sourceId))
      return sourceSections.map((s) => ({
        ...s,
        fields: s.fields.map((ff): BrandField =>
          ff.status === 'empty'
            ? ff
            : { ...ff, inherited: true, status: 'closed', kind: undefined, aiValue: undefined, humanValue: undefined },
        ),
      }))
    })()
    // Dirección tipográfica cura los roles: cada rol seleccionado ACTIVA su campo de fuente
    // (visible + obligatorio); un rol no seleccionado se oculta aquí y en la guía.
    const FONT_ROLE: Record<string, string> = { 'font-display': 'Display', 'font-text': 'Texto', 'font-mono': 'Mono' }
    const dirParts = (base.flatMap((s) => s.fields).find((ff) => ff.id === 'td-direction')?.value ?? '')
      .split(/\s*·\s*|\s*,\s*/)
      .map((p) => p.trim())
    // Las fotos de §3.9 se nombran por su estilo: los labels siguen a los 3 primeros Estilos
    // fotográficos seleccionados (sin estilo → label genérico del seed).
    const imgStyles = (base.flatMap((s) => s.fields).find((ff) => ff.id === 'img-style')?.value ?? '')
      .split(/\s*·\s*|\s*,\s*/)
      .map((p) => p.trim())
      .filter(Boolean)
    const PHOTO_SLOT: Record<string, number> = { 'img-photo': 0, 'img-photo-2': 1, 'img-photo-3': 2 }
    return base.map((s) =>
      s.id === 'typography'
        ? {
            ...s,
            fields: s.fields
              .filter((ff) => !FONT_ROLE[ff.id] || dirParts.includes(FONT_ROLE[ff.id]))
              .map((ff): BrandField => (FONT_ROLE[ff.id] ? { ...ff, required: true, optional: undefined } : ff)),
          }
        : s.id === 'imagery'
          ? {
              ...s,
              fields: s.fields.map((ff): BrandField =>
                ff.id in PHOTO_SLOT
                  ? {
                      ...ff,
                      label:
                        imgStyles[PHOTO_SLOT[ff.id]] ??
                        t('branding.photoSlot', { defaultValue: 'Fotografía {{n}}', n: PHOTO_SLOT[ff.id] + 1 }),
                    }
                  : ff,
              ),
            }
          : s.id === 'applications'
            ? (() => {
                // Slots de imagen de 04: uno por pieza impresa / red seleccionada, con su nombre;
                // los slots sin pieza/red se ocultan.
                const listOf = (id: string) =>
                  (s.fields.find((ff) => ff.id === id)?.value ?? '')
                    .split(/\s*·\s*|\s*,\s*/)
                    .map((x) => x.trim())
                    .filter(Boolean)
                // Tabla de slots: cada familia de imágenes cuelga de su multiselect de piezas.
                // El label es la pieza tal cual (sin prefijo de familia): el multiselect vive
                // justo arriba de sus slots, el contexto ya es visible. Si la MISMA pieza está
                // seleccionada en dos familias (p. ej. «Etiqueta» en Impresos y Packaging), solo
                // esas duplicadas se sufijan con su familia para poder distinguirlas.
                const SLOT_DEFS: Array<{ re: RegExp; list: string[]; fam: string }> = [
                  { re: /^print-img-(\d)$/, list: listOf('print-pieces'), fam: 'Impresos' },
                  { re: /^social-img-(\d)$/, list: listOf('social-networks'), fam: 'Social' },
                  { re: /^pres-img-(\d)$/, list: listOf('pres-pieces'), fam: 'Presentaciones' },
                  { re: /^pack-img-(\d)$/, list: listOf('pack-pieces'), fam: 'Packaging' },
                  { re: /^sign-img-(\d)$/, list: listOf('sign-pieces'), fam: 'Señalética' },
                  { re: /^env-img-(\d)$/, list: listOf('env-pieces'), fam: 'Espacial' },
                  { re: /^merch-img-(\d)$/, list: listOf('merch-pieces'), fam: 'Merch' },
                  { re: /^veh-img-(\d)$/, list: listOf('veh-pieces'), fam: 'Vehículos' },
                ]
                const famOf: Record<string, string> = {}
                const mapped = s.fields
                  .map((ff): BrandField | null => {
                    for (const d of SLOT_DEFS) {
                      const m = ff.id.match(d.re)
                      if (m) {
                        const n = +m[1] - 1
                        if (!d.list[n]) return null
                        famOf[ff.id] = d.fam
                        return { ...ff, label: d.list[n] }
                      }
                    }
                    return ff
                  })
                  .filter((ff): ff is BrandField => ff !== null)
                const dupes: Record<string, number> = {}
                mapped.forEach((ff) => {
                  if (famOf[ff.id]) dupes[ff.label] = (dupes[ff.label] ?? 0) + 1
                })
                return {
                  ...s,
                  fields: mapped.map((ff) =>
                    famOf[ff.id] && dupes[ff.label] > 1 ? { ...ff, label: `${ff.label} (${famOf[ff.id]})` } : ff,
                  ),
                }
              })()
            : s,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, brandSource, t])

  const allFields = useMemo(() => displaySections.flatMap((s) => s.fields), [displaySections])
  const allPending = useMemo(() => allFields.filter((ff) => ff.status === 'decision'), [allFields])
  const gateClosed = allFields.filter((ff) => brandGateIds.includes(ff.id) && ff.status === 'closed').length
  const gateTotal = brandGateIds.length
  const gateOpen = gateClosed === gateTotal && allPending.length === 0
  const hasContent = allFields.some((ff) => ff.status !== 'empty' && !ff.movedTo)
  // El brand-book solo se ve una vez cubierto el mínimo viable de la sección.
  const bookReady = gateClosed === gateTotal

  // ── Traducción (MOCKUP visual, sin funcionalidad real — docs/spec-traduccion-contenido.md) ──
  const [transOpen, setTransOpen] = useState(false)
  const [transView, setTransView] = useState(false)
  const locales = parseLocales(allFields.find((ff) => ff.id === 'fmt-locales')?.value ?? '')
  const targetLang = locales.targets[0] // el mockup muestra un idioma de entrega (el primero)
  // Universo traducible = campos de PROSA con contenido finalizado. Un solo predicado para que el
  // chip agregado y los indicadores por campo SIEMPRE coincidan (invariante de translation.ts):
  //  · se excluyen 'decision' (contenido sin resolver, no se traduce a medias) y 'empty'/movedTo;
  //  · se excluyen tipos no-texto (imagen/enlaces/rango), hex de color y config de formato (fmt-*).
  const isTranslatable = (ff: BrandField): boolean => {
    if (ff.status === 'empty' || ff.status === 'decision' || ff.movedTo) return false
    if (!(ff.value || (ff.rows?.length ?? 0) > 0)) return false
    if (ff.id.startsWith('fmt-')) return false
    const ed = getEditor(ff.id)
    return ed.type !== 'image' && ed.type !== 'links' && ed.type !== 'range' && !ed.colorHex
  }
  const transContentIds = useMemo(() => allFields.filter(isTranslatable).map((ff) => ff.id), [allFields])
  const transSummary = targetLang ? summarizeTranslation(transContentIds, targetLang) : null
  const sourceIncomplete = gateClosed < gateTotal // origen a medias → recomendar completar antes

  // Brand kickstart (empty-state): only when this project owns its brand and has no content yet.
  const briefReadiness = useMemo(() => {
    const secs = loadSections<BriefSection>('brief', projectId, () => seedBrief(projectId))
    const req = secs.flatMap((s) => s.fields).filter((ff) => ff.required)
    return req.length ? Math.round((100 * req.filter((ff) => ff.status === 'closed').length) / req.length) : 0
  }, [projectId])
  const wsModels = useWorkspaceModels()
  const brandingEngine = wsModels.effectiveEngine('branding')
  const transEngineLabel = wsModels.effectiveTranslationEngine()?.label ?? t('translation.engineNone')
  const byomConnected = wsModels.connected
  const inheritProjects = workspaceProjects.filter((p) => p.id !== activeProject?.id)
  const showKickstart = brandSource === 'own' && !hasContent && !kickstartDone

  const active = displaySections.find((s) => s.id === activeId) ?? displaySections[0]
  const visibleFields = active.fields.filter((ff) => !ff.optional)
  const optionalFields = active.fields.filter((ff) => ff.optional)
  const activeDesc = t(`branding.sectionDescs.${active.id}`, { defaultValue: '' })
  const sectionPct = (s: BrandSection) =>
    Math.round((100 * s.fields.filter((ff) => ff.status === 'closed' || ff.inherited).length) / s.fields.length)
  const sectionDecisions = (s: BrandSection) => s.fields.filter((ff) => ff.status === 'decision').length

  // Estado de traducción por campo — MISMO predicado que el agregado (isTranslatable), solo en
  // modo "ver por campo". Así los badges visibles suman exactamente el total del chip.
  const transStateOf = (ff: BrandField): TransState | undefined =>
    transView && targetLang && isTranslatable(ff) ? fakeTransState(ff.id + ':' + targetLang) : undefined
  // Panel "Ir a completar": salta a la primera sección con un campo del mínimo sin cerrar.
  const goCompleteSource = () => {
    setTransOpen(false)
    const target = displaySections.find((s) => s.fields.some((ff) => brandGateIds.includes(ff.id) && ff.status !== 'closed'))
    if (target) setActiveId(target.id)
  }

  const resolve = (id: string, value: string) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        fields: s.fields.map((ff): BrandField =>
          ff.id === id ? { ...ff, value, status: 'closed', origin: 'human', kind: undefined } : ff,
        ),
      })),
    )
    setModalField(null)
    setFlashId(id)
  }
  const approve = (id: string) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        fields: s.fields.map((ff): BrandField => (ff.id === id ? { ...ff, status: 'closed' } : ff)),
      })),
    )
    setFlashId(id)
  }

  // Field-flow handlers (save + auto-advance + step) shared with the Brief panel.
  // Navigation reads displaySections (what the user sees), but since the typography gating that
  // array is a FILTERED copy of sections — persisting it verbatim would delete hidden font fields.
  // So writes MERGE back into real state: only fields apply() actually replaced (new reference vs
  // the display copy) land by id; everything else — hidden fields included — stays untouched.
  const mergeIntoSections = (updated: BrandSection[]) => {
    const before = new Map(displaySections.flatMap((s) => s.fields).map((ff) => [ff.id, ff]))
    const changed = new Map(
      updated.flatMap((s) => s.fields).filter((ff) => before.get(ff.id) !== ff).map((ff) => [ff.id, ff]),
    )
    if (!changed.size) return
    // El label puede ser dinámico (fotos nombradas por estilo): al persistir se conserva el
    // label ALMACENADO — el display lo recalcula en cada render.
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        fields: s.fields.map((ff) => {
          const ch = changed.get(ff.id)
          return ch ? { ...ch, label: ff.label } : ff
        }),
      })),
    )
  }
  const flow = useFieldFlow(displaySections, mergeIntoSections, allFields, setEditField, setActiveId)
  const { editNext, editPrev } = flow
  // Saving a field that the gating just hid (its role was deselected while the modal was open):
  // apply() over displaySections can't find it — persist directly so the typed value isn't lost.
  const edit = (id: string, value: string) => {
    if (displaySections.some((s) => s.fields.some((ff) => ff.id === id))) return flow.edit(id, value)
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        fields: s.fields.map((ff): BrandField =>
          ff.id === id ? { ...ff, value, status: value.trim() ? 'closed' : 'empty', origin: 'human', kind: undefined } : ff,
        ),
      })),
    )
    setEditField(null)
  }

  // System-derived options for the edit modal: cd-print gets its CMYK computed from the brand
  // hex (deterministic RGB→CMYK), so "generar" is one click; Pantone stays manual via "Otro".
  const systemOptionsFor = (id: string): string[] | undefined => {
    if (id === 'legal-notice') {
      const nm = activeWorkspace?.name?.trim()
      return nm ? [`© ${new Date().getFullYear()} ${nm}. Todos los derechos reservados.`] : undefined
    }
    if (id !== 'cd-print') return undefined
    const hex = allFields.find((ff) => ff.id === 'cd-brand-hex')?.value?.trim() ?? ''
    const m = /^#?([0-9a-f]{6})$/i.exec(hex)
    if (!m) return undefined
    const n = parseInt(m[1], 16)
    const r = ((n >> 16) & 255) / 255
    const g = ((n >> 8) & 255) / 255
    const b = (n & 255) / 255
    const mx = Math.max(r, g, b)
    if (!mx) return ['CMYK 0/0/0/100']
    const pc = (x: number) => Math.round(((mx - x) / mx) * 100)
    return [`CMYK ${pc(r)}/${pc(g)}/${pc(b)}/${Math.round((1 - mx) * 100)}`]
  }

  // Repeatable-group save: store the rows + derive the flat summary value (first column joined,
  // or the editor's rowSummary — e.g. el changelog resume a la versión de la última entrada).
  const applyRows = (id: string, rows: Record<string, string>[]): BrandSection[] => {
    const ed = getEditor(id)
    const key = ed.groupFields?.[0]?.key
    const updated = sections.map((s) => ({
      ...s,
      fields: s.fields.map((ff): BrandField =>
        ff.id === id
          ? {
              ...ff,
              rows,
              value: ed.rowSummary ? ed.rowSummary(rows) : key ? rows.map((r) => r[key]).filter(Boolean).join(MULTI_SEP) : ff.value,
              status: rows.length ? 'closed' : 'empty',
              origin: 'human' as const,
            }
          : ff,
      ),
    }))
    setSections(updated)
    return updated
  }
  const saveRows = (id: string, rows: Record<string, string>[]) => {
    applyRows(id, rows)
    setEditField(null)
    setFlashId(id)
  }
  // Group modal ←/→: persist rows (solo si CAMBIARON — navegar sobre una propuesta IA intacta no
  // debe re-firmarla como humana/cerrada), luego avanza al campo editable siguiente/anterior.
  // La navegación corre sobre lo que el usuario VE: los campos que el gating oculta (roles de
  // fuente, slots sin pieza) se filtran del array actualizado — guardar un grupo nunca cambia el
  // conjunto oculto (ningún campo grupo alimenta el gating), así que los ids visibles siguen válidos.
  const stepRows = (id: string, rows: Record<string, string>[], dir: 'next' | 'prev') => {
    const orig = sections.flatMap((s) => s.fields).find((ff) => ff.id === id)?.rows ?? []
    const updated = JSON.stringify(rows) !== JSON.stringify(orig) ? applyRows(id, rows) : sections
    const visible = new Set(allFields.map((ff) => ff.id))
    const navSections = updated.map((s) => ({ ...s, fields: s.fields.filter((ff) => visible.has(ff.id)) }))
    const next = dir === 'next' ? nextEditable(navSections, id) : prevEditable(navSections, id)
    setEditField(next)
    if (next) {
      const sid = sectionIdOf(navSections, next.id)
      if (sid) setActiveId(sid)
    }
  }
  // The AI fills empty fields as drafts (proposals) using the rich seed as sample content,
  // each tagged with its provenance (source). The user reviews and approves field by field.
  const generateProposal = (source: string, sectionIds?: string[]) => {
    setSections((prev) =>
      prev.map((s) => {
        if (sectionIds && !sectionIds.includes(s.id)) return s
        const seed = brandSections.find((x) => x.id === s.id)
        return {
          ...s,
          fields: s.fields.map((ff): BrandField => {
            if (ff.status !== 'empty') return ff
            const sf = seed?.fields.find((x) => x.id === ff.id)
            if (!sf || !sf.value) return ff
            // Group fields (cd-semantic, cd-palette…) carry their content in rows — a proposal
            // without them would desync the flat summary from an empty editor.
            return { ...ff, value: sf.value, rows: sf.rows, status: 'inProgress', origin: 'ai', source, kind: undefined }
          }),
        }
      }),
    )
    setKickstartDone(true)
  }

  const generate = (selectedIds: string[]) => {
    generateProposal('IA', selectedIds)
    setCustomCatalogs(generateCatalogs()) // "Generar con IA" también deja los catálogos a la medida
    setGenerateOpen(false)
    if (selectedIds.length) setActiveId(selectedIds[0])
  }

  // Regenerate just one field's AI catalog from the modal (keeps the user in the flow).
  const regenerate = (fieldId: string) => {
    const cat = regenerateCatalog(fieldId)
    if (cat) setCustomCatalogs({ ...customCatalogs, [fieldId]: cat })
  }

  const onKickstartGenerate = (source: string) => {
    generateProposal(source)
    setStartMode(null)
    setActiveId('foundation')
  }
  const onKickstartInherit = (id: string) => {
    setBrandSource(`inherit:${id}`)
    setStartMode(null)
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <EnginePill phase="branding" />
        <BrandSourceSelector value={brandSource} options={sourceOptions} onChange={setBrandSource} />
      </div>
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 flex items-start justify-between gap-4 flex-wrap mb-4">
        <div className="flex flex-col gap-3 items-stretch">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {transSummary && transSummary.total > 0 && (
              <TranslationStatus
                targetShort={langShort(targetLang)}
                summary={transSummary}
                view={transView}
                onOpen={() => setTransOpen(true)}
                onToggleView={() => setTransView((v) => !v)}
              />
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setJsonOpen(true)}
              disabled={!hasContent}
              aria-label={t('branding.jsonTitle')}
              title={t('branding.jsonTitle')}
            >
              <Braces size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('brief.historyTitle')}
              title={t('brief.historyTitle')}
            >
              <History size={16} />
            </Button>
            {/* Wrapper span: el tooltip (la "alerta") se muestra al hover aunque el botón esté disabled.
                El icono cambia a candado cuando está bloqueado — señal inline para táctil (sin hover),
                igual que el botón Avanzar. */}
            <span title={!bookReady ? t('branding.bookGate', { n: gateClosed, total: gateTotal }) : undefined}>
              <Button size="sm" variant="secondary" onClick={openBook} disabled={!bookReady}>
                {bookReady ? <ExternalLink size={15} /> : <Lock size={14} />}
                {t('branding.viewBook')}
              </Button>
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setCatalogsOpen(true)}
              disabled={isInherited || !byomConnected || !canGenerate}
            >
              <ListChecks size={15} />
              {t('branding.generateCatalogs')}
            </Button>
            <Button size="sm" variant="primary" onClick={() => setGenerateOpen(true)} disabled={isInherited || !byomConnected || !canGenerate}>
              <Wand2 size={15} />
              {t('common.generateAI')}
            </Button>
            <Button
              size="sm"
              variant={gateOpen ? 'primary' : 'secondary'}
              disabled={!gateOpen || !canAdvance}
              onClick={() => navigate(to('system'))}
              title={!gateOpen ? t('branding.gate', { n: gateClosed, total: gateTotal }) : undefined}
            >
              {gateOpen ? <ArrowRight size={16} /> : <Lock size={15} />}
              {t('branding.advance')}
            </Button>
          </div>
          <div className="min-w-[200px]">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted">{t('branding.minViable')}</span>
              <span className="font-display font-bold text-content">{gateClosed}/{gateTotal}</span>
            </div>
            <div className="h-2 rounded-full bg-raised overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                style={{ width: `${(gateClosed / gateTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {isInherited && (
        <div className="mb-4 rounded-2xl border border-accent-soft bg-accent-soft p-3 flex items-center gap-3 flex-wrap">
          <GitBranch size={16} className="text-accent shrink-0" />
          <span className="text-[13px] text-accent-strong flex-1">
            {t('branding.inheritedBanner', { name: inheritedFrom })}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setBrandSource('own')
              setKickstartDone(true)
            }}
          >
            {t('branding.customize')}
          </Button>
        </div>
      )}

      {showKickstart ? (
        <BrandKickstart
          briefReadiness={briefReadiness}
          byomConnected={byomConnected}
          modelName={brandingEngine?.label}
          canInherit={inheritProjects.length > 0}
          onFromBrief={() => setStartMode('brief')}
          onIngest={() => setStartMode('ingest')}
          onInherit={() => setStartMode('inherit')}
          onScratch={() => setKickstartDone(true)}
        />
      ) : (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr] gap-4">
        <SectionNav
          items={displaySections.map((s) => ({
            id: s.id,
            code: s.code,
            label: t(`branding.sections.${s.id}`, { defaultValue: s.name }),
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
                {active.code} · {t(`branding.sections.${active.id}`, { defaultValue: active.name })}
              </h2>
              {activeDesc && <p className="text-xs text-muted mt-1">{activeDesc}</p>}
            </div>
            {sectionDecisions(active) > 0 && (
              <span className="text-[11px] bg-danger-soft text-danger-strong rounded-full px-2.5 py-1 shrink-0">
                {sectionDecisions(active)} {t('brief.decide')}
              </span>
            )}
          </div>

          {active.id === 'personality' && (
            <div className="mb-4">
              <PersonalityScales scales={personalityScales} />
            </div>
          )}

          <div>
            {visibleFields.map((ff) =>
              ff.status === 'decision' ? (
                <DecisionRow key={ff.id} field={ff} onOpen={canApprove ? setModalField : undefined} />
              ) : (
                <FieldRow key={ff.id} field={ff} flash={ff.id === flashId} onApprove={canApprove ? approve : undefined} onEditOpen={canEdit ? setEditField : undefined} transState={transStateOf(ff)} guideLinkable={bookReady} />
              ),
            )}
          </div>

          {optionalFields.length > 0 && (
            <>
              {!optHidden[active.id] && (
                <div>
                  {optionalFields.map((ff) =>
                    ff.status === 'decision' ? (
                      <DecisionRow key={ff.id} field={ff} onOpen={canApprove ? setModalField : undefined} />
                    ) : (
                      <FieldRow key={ff.id} field={ff} flash={ff.id === flashId} onApprove={canApprove ? approve : undefined} onEditOpen={canEdit ? setEditField : undefined} transState={transStateOf(ff)} guideLinkable={bookReady} />
                    ),
                  )}
                </div>
              )}
              <button
                onClick={() => setOptHidden((o) => ({ ...o, [active.id]: !o[active.id] }))}
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-faint hover:text-muted"
              >
                <Plus size={13} />
                {optHidden[active.id] ? t('brief.showOptional', { n: optionalFields.length }) : t('brief.hideOptional')}
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
        </>
      )}

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
        versions={projectId === 'p1' || projectId === 'p4' ? brandVersions : emptyVersions}
        history={projectId === 'p1' || projectId === 'p4' ? brandHistory : emptyHistory}
        onRestore={() => setDrawerOpen(false)}
      />
      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        sections={sections}
        onGenerate={generate}
        ns="branding"
      />
      <BrandJsonModal
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        sections={displaySections}
        brandSource={brandSource}
        gateClosed={gateClosed}
        gateTotal={gateTotal}
      />
      <FieldEditModal
        field={editField}
        onClose={() => setEditField(null)}
        onSave={edit}
        onSaveRows={saveRows}
        onStepRows={stepRows}
        systemOptions={editField ? systemOptionsFor(editField.id) : undefined}
        onNext={editNext}
        hasNext={!!editField && !!nextEditable(displaySections, editField.id)}
        onPrev={editPrev}
        hasPrev={!!editField && !!prevEditable(displaySections, editField.id)}
        aiCatalog={editField ? customCatalogs[editField.id] : undefined}
        aiCapable={editField ? isAiCapable(editField.id) : false}
        onRegenerate={editField ? () => regenerate(editField.id) : undefined}
      />
      <CatalogsModal
        open={catalogsOpen}
        onClose={() => setCatalogsOpen(false)}
        engineLabel={brandingEngine?.label}
        hasCatalogs={Object.keys(customCatalogs).length > 0}
        onGenerate={() => setCustomCatalogs(generateCatalogs())}
      />
      <BrandStartModal
        mode={startMode}
        briefReadiness={briefReadiness}
        byomConnected={byomConnected}
        inheritOptions={inheritProjects.map((p) => ({ id: p.id, label: p.name }))}
        onClose={() => setStartMode(null)}
        onGenerate={onKickstartGenerate}
        onInherit={onKickstartInherit}
      />
      {transSummary && (
        <TranslationPanel
          open={transOpen}
          onClose={() => setTransOpen(false)}
          sourceLabel={langLabel(locales.source, i18n.language)}
          targetLabel={targetLang ? langLabel(targetLang, i18n.language) : ''}
          summary={transSummary}
          sourceIncomplete={sourceIncomplete}
          remainingSource={gateTotal - gateClosed}
          engineLabel={transEngineLabel}
          onGoComplete={goCompleteSource}
          onShowByField={() => {
            setTransOpen(false)
            setTransView(true)
          }}
        />
      )}
    </div>
  )
}
