import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { FieldEditor } from './FieldEditor'
import { GroupEditor } from './GroupEditor'
import { getEditor } from '../../data/fieldEditors'
import type { BrandCatalog } from '../../data/brandCatalogs'
import type { BriefField } from '../../data/brief'

type Row = Record<string, string>

// Thin Modal wrapper. Routes repeatable-group fields to <GroupEditor> (rows) and everything else
// to the shared <FieldEditor> (string value). ResolveModal is unaffected — groups aren't decisions.
export function FieldEditModal({
  field,
  onClose,
  onSave,
  onSaveRows,
  onNext,
  hasNext,
  onPrev,
  hasPrev,
  onStepRows,
  aiCatalog,
  aiCapable,
  onRegenerate,
  systemOptions,
}: {
  field: BriefField | null
  onClose: () => void
  onSave: (id: string, value: string) => void
  onSaveRows?: (id: string, rows: Row[]) => void
  // Step to the next/previous editable field without closing (saves the current value if it changed).
  onNext?: (id: string, value: string) => void
  hasNext?: boolean
  onPrev?: (id: string, value: string) => void
  hasPrev?: boolean
  // Group fields: persist the rows and step to the next/previous editable field.
  onStepRows?: (id: string, rows: Row[], dir: 'next' | 'prev') => void
  aiCatalog?: BrandCatalog
  aiCapable?: boolean
  onRegenerate?: () => void
  systemOptions?: string[]
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<{ value: string; valid: boolean }>({ value: '', valid: false })
  const [groupDraft, setGroupDraft] = useState<{ rows: Row[]; valid: boolean }>({ rows: [], valid: false })
  const handleChange = useCallback((value: string, valid: boolean) => setDraft({ value, valid }), [])
  const handleGroupChange = useCallback((rows: Row[], valid: boolean) => setGroupDraft({ rows, valid }), [])

  if (!field) return null

  const editor = getEditor(field.id)
  const isGroup = editor.type === 'group'
  const fid = field.id

  // Field-stepping arrows work for both: groups persist rows via onStepRows, others save the value.
  // An INVALID draft (required multiselect emptied, group with zero rows) must never persist via
  // the arrows — Save is disabled for it, so stepping falls back to the original value/rows (no-op).
  const origRows = (field as { rows?: Row[] }).rows ?? []
  const canPrev = !!hasPrev && (isGroup ? !!onStepRows : !!onPrev)
  const canNext = !!hasNext && (isGroup ? !!onStepRows : !!onNext)
  const goPrev = () =>
    isGroup
      ? onStepRows?.(fid, groupDraft.valid ? groupDraft.rows : origRows, 'prev')
      : onPrev?.(fid, draft.valid ? draft.value : (field.value ?? ''))
  const goNext = () =>
    isGroup
      ? onStepRows?.(fid, groupDraft.valid ? groupDraft.rows : origRows, 'next')
      : onNext?.(fid, draft.valid ? draft.value : (field.value ?? ''))

  return (
    <Modal
      open={!!field}
      onClose={onClose}
      title={t(`fields.${field.id}`, { defaultValue: field.label })}
      footer={
        <>
          {/* Back to the previous field — icon-only, pinned to the far left. */}
          {canPrev && (
            <Button
              variant="secondary"
              onClick={goPrev}
              aria-label={t('common.back')}
              title={t('common.back')}
              className="mr-auto"
            >
              <ArrowLeft size={16} />
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {isGroup ? (
            <Button variant="primary" onClick={() => onSaveRows?.(field.id, groupDraft.rows)} disabled={!groupDraft.valid}>
              {t('common.save')}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => onSave(field.id, draft.value)} disabled={!draft.valid}>
              {t('common.save')}
            </Button>
          )}
          {/* Advance to the next field — icon-only, sits after Save. */}
          {canNext && (
            <Button
              variant="secondary"
              onClick={goNext}
              aria-label={t('common.next')}
              title={t('common.next')}
            >
              <ArrowRight size={16} />
            </Button>
          )}
        </>
      }
    >
      {isGroup ? (
        <>
          {/* FieldEditor renders its own help line; group fields use GroupEditor, so show it here too. */}
          {t(`fieldHelp.${fid}`, { defaultValue: '' }) && (
            <p className="text-[12px] text-muted mb-3 leading-snug">{t(`fieldHelp.${fid}`, { defaultValue: '' })}</p>
          )}
          <GroupEditor
            key={fid}
            fieldId={fid}
            initialRows={(field as { rows?: Row[] }).rows ?? []}
            groupFields={editor.groupFields ?? []}
            onChange={handleGroupChange}
            newRow={editor.newRow}
          />
        </>
      ) : (
        <FieldEditor
          systemOptions={systemOptions}
          field={field}
          aiCatalog={aiCatalog}
          aiCapable={aiCapable}
          onRegenerate={onRegenerate}
          onChange={handleChange}
        />
      )}
    </Modal>
  )
}
