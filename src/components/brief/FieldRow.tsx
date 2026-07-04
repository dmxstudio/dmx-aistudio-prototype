import { useTranslation } from 'react-i18next'
import { Check, Sparkles, User, ArrowRight, GitBranch, Pencil, FileText, Languages } from 'lucide-react'
import type { BriefField, FieldStatus, Origin } from '../../data/brief'
import { getEditor } from '../../data/fieldEditors'
import { bookFieldHref } from '../../lib/bookAnchors'
import { useWorkspace } from '../../lib/workspace'
import { FieldVisual } from './FieldVisual'
import type { TransState } from '../../lib/translation'

// Indicador de traducción por campo (mockup): se muestra solo cuando Branding lo pasa en modo
// "ver estado por campo". Ver docs/spec-traduccion-contenido.md.
function TransBadge({ state }: { state: TransState }) {
  const { t } = useTranslation()
  const cls =
    state === 'revisado'
      ? 'bg-success-soft text-success-strong'
      : state === 'ia'
        ? 'bg-accent-soft text-accent-strong'
        : 'bg-raised text-faint'
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${cls}`}>
      <Languages size={10} />
      {t(`translation.badge.${state}`)}
    </span>
  )
}

export function StatusChip({ status, origin }: { status: FieldStatus; origin: Origin }) {
  const { t } = useTranslation()
  if (status === 'closed')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] bg-success-soft text-success-strong px-2.5 py-1 rounded-full whitespace-nowrap">
        <Check size={12} />
        {t('brief.statusClosed')}
      </span>
    )
  if (status === 'empty')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] bg-raised text-faint px-2.5 py-1 rounded-full whitespace-nowrap">
        {t('brief.statusEmpty')}
      </span>
    )
  if (origin === 'ai')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] bg-warning-soft text-warning-strong px-2.5 py-1 rounded-full whitespace-nowrap">
        <Sparkles size={12} />
        {t('brief.originAi')} · {t('brief.statusInProgress')}
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] bg-raised text-muted px-2.5 py-1 rounded-full whitespace-nowrap">
      <User size={12} />
      {t('brief.statusInProgress')}
    </span>
  )
}

export function FieldRow({
  field,
  flash = false,
  onApprove,
  onEditOpen,
  transState,
  guideLinkable = true,
}: {
  field: BriefField
  flash?: boolean
  onApprove?: (id: string) => void
  onEditOpen?: (field: BriefField) => void
  // Estado de traducción del campo para el idioma en vista (mockup, solo Branding).
  transState?: TransState
  // El deep-link del label al brand-book solo se ofrece cuando el libro está disponible
  // (mismo gate que el botón "Ver brand-book"); false → label en texto plano.
  guideLinkable?: boolean
}) {
  const { t } = useTranslation()
  // Los hooks van ANTES de cualquier return temprano (rules-of-hooks): el label de un campo movido
  // no usa el deep-link, pero useWorkspace debe llamarse en todos los renders o el orden se rompe.
  const { activeWorkspace } = useWorkspace()
  const isDraft = field.status === 'inProgress' && field.origin === 'ai'
  const editable = !!onEditOpen && !field.inherited && !field.movedTo

  if (field.movedTo)
    return (
      <div className="flex items-start justify-between gap-3 py-2.5 border-t border-line">
        <span className="text-[13px] text-faint w-44 shrink-0 pt-0.5">{t(`fields.${field.id}`, { defaultValue: field.label })}</span>
        <span className="flex-1" />
        <span className="inline-flex items-center gap-1 text-[11px] text-accent-strong bg-accent-soft px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
          <ArrowRight size={12} />
          {t('brief.movedHint', { x: field.movedTo })}
        </span>
      </div>
    )

  const open = () => editable && onEditOpen!(field)

  // Group (repeatable) fields store their content in `rows`; the bare `value` is just the joined
  // summary, so surface a count cue (Brief has no groups, so this only affects Branding).
  const groupRows = getEditor(field.id).type === 'group' ? (field as { rows?: unknown[] }).rows : undefined
  const rowCount = groupRows?.length ?? 0
  // Image fields show only their FieldVisual thumbnail — never the raw data-URL / <svg> markup.
  const imageOnly = getEditor(field.id).type === 'image'

  // Richer BrandField metadata (Brief fields don't carry these, so the chips simply never render there).
  const taxonomy = (field as { taxonomy?: 'fact' | 'assumption' | 'risk' }).taxonomy
  const approval = (field as { approval?: { human: boolean; client: boolean } }).approval
  const owner = (field as { owner?: string }).owner

  // Deep link from the field label to where it renders in the brand book (Branding fields with a
  // visible guide slot only — Brief/export-only ids resolve to null). Underline is the ONLY visual cue.
  const guideHref = activeWorkspace ? bookFieldHref(field.id, activeWorkspace.id) : null

  // Provenance of an AI draft proposed by the kickstart (e.g. "Brief", "brand-book.pdf").
  // Skip it for inherited fields (they already show a "Heredado" chip) and for the generic
  // "IA" generate path (that's already conveyed by the "IA · en curso" status chip).
  const provenance =
    field.origin === 'ai' &&
    field.status === 'inProgress' &&
    field.source &&
    field.source !== 'IA' &&
    !field.inherited
      ? field.source.startsWith('brief.')
        ? 'Brief'
        : field.source
      : null

  return (
    <div
      className={`flex flex-col gap-0.5 lg:flex-row lg:items-start lg:justify-between lg:gap-3 py-2.5 border-t border-line rounded-md ${
        flash ? 'brief-flash' : ''
      }`}
    >
      <span
        className="text-[13px] text-muted lg:w-44 lg:shrink-0 lg:pt-0.5"
        title={owner ? t('brief.ownerTitle', { owner }) : undefined}
      >
        {guideHref && guideLinkable ? (
          <a href={guideHref} target="_blank" rel="noopener" className="underline">
            {t(`fields.${field.id}`, { defaultValue: field.label })}
          </a>
        ) : (
          t(`fields.${field.id}`, { defaultValue: field.label })
        )}
        {field.required && <span className="text-accent-strong" aria-hidden="true"> *</span>}
      </span>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5 lg:flex-nowrap lg:justify-between lg:flex-1 min-w-0">
        <span
          onClick={editable ? open : undefined}
          className={`basis-full lg:basis-auto flex-1 text-[13px] min-w-0 break-words lg:pt-0.5 ${editable ? 'cursor-pointer' : ''} ${
            field.value || rowCount ? 'text-content' : 'text-faint'
          }`}
        >
          <span className="inline-flex items-center gap-1 mr-2 align-middle empty:hidden">
            <FieldVisual field={field} />
          </span>
          {groupRows ? (
            rowCount ? (
              <>
                <span className="inline-flex items-center text-[11px] font-medium text-muted bg-raised rounded-full px-2 py-0.5 mr-1.5 align-middle">
                  {rowCount} {t(rowCount === 1 ? 'branding.rowCountOne' : 'branding.rowCountMany')}
                </span>
                {field.value}
              </>
            ) : (
              '—'
            )
          ) : imageOnly ? (
            field.value ? null : '—'
          ) : (
            field.value || '—'
          )}
        </span>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 lg:pt-px">
          {editable && (
            <button
              onClick={open}
              aria-label={t('brief.editField')}
              title={t('brief.editField')}
              className="w-7 h-7 rounded-full flex items-center justify-center text-faint hover:text-accent-strong hover:bg-accent-soft transition-colors"
            >
              <Pencil size={13} />
            </button>
          )}
          {provenance && (
            <span
              title={t('brief.aiProposalTitle')}
              className="inline-flex items-center gap-1 text-[11px] text-faint bg-raised px-2 py-1 rounded-full whitespace-nowrap max-w-[160px]"
            >
              <Sparkles size={10} className="shrink-0" />
              <span className="truncate">{provenance}</span>
            </span>
          )}
          {isDraft && !field.inherited && onApprove && (
            <button
              onClick={() => onApprove(field.id)}
              className="text-[11px] text-accent-strong hover:bg-accent-soft rounded-full px-2 py-1 inline-flex items-center gap-1 transition-colors"
            >
              <Check size={12} />
              {t('brief.approve')}
            </button>
          )}
          {taxonomy && (
            <span
              className={`inline-flex items-center text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${
                taxonomy === 'risk'
                  ? 'bg-danger-soft text-danger-strong'
                  : taxonomy === 'assumption'
                    ? 'bg-warning-soft text-warning-strong'
                    : 'bg-raised text-muted'
              }`}
            >
              {t(`brief.taxonomy_${taxonomy}`)}
            </span>
          )}
          {approval && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap" title={t('brief.approvalTitle')}>
              {([['human', approval.human], ['client', approval.client]] as const).map(([who, ok]) => (
                <span
                  key={who}
                  className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    ok ? 'bg-success-soft text-success-strong' : 'bg-raised text-faint'
                  }`}
                >
                  {ok && <Check size={9} />}
                  {t(who === 'human' ? 'brief.apprHuman' : 'brief.apprClient')}
                </span>
              ))}
            </span>
          )}
          {transState && <TransBadge state={transState} />}
          {field.inherited &&
            (field.source?.startsWith('brief.') ? (
              // Locked because it comes from THIS project's Brief (edit it there) — not a cross-project copy.
              <span
                title={t('brief.fromBriefHint')}
                className="inline-flex items-center gap-1 text-[11px] bg-raised text-muted px-2.5 py-1 rounded-full whitespace-nowrap"
              >
                <FileText size={11} />
                {t('brief.statusFromBrief')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] bg-accent-soft text-accent-strong px-2.5 py-1 rounded-full whitespace-nowrap">
                <GitBranch size={11} />
                {t('brief.statusInherited')}
              </span>
            ))}
          <StatusChip status={field.status} origin={field.origin} />
        </div>
      </div>
    </div>
  )
}
