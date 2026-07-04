import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { FieldEditor } from './FieldEditor'
import type { BrandCatalog } from '../../data/brandCatalogs'
import type { BriefField } from '../../data/brief'

// Resolving a decision IS editing the field, with decision context on top. It reuses the same
// <FieldEditor> as FieldEditModal so the base + AI catalog (and "Otro") stay homogeneous.
export function ResolveModal({
  field,
  onClose,
  onResolve,
  aiCatalog,
  aiCapable,
  onRegenerate,
}: {
  field: BriefField | null
  onClose: () => void
  onResolve: (id: string, value: string) => void
  aiCatalog?: BrandCatalog
  aiCapable?: boolean
  onRegenerate?: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<{ value: string; valid: boolean }>({ value: '', valid: false })
  // Seeds the editor: a conflict pre-fills the AI value, a review the suggested value, a question stays blank.
  const [seed, setSeed] = useState('')
  const handleChange = useCallback((value: string, valid: boolean) => setDraft({ value, valid }), [])

  useEffect(() => {
    if (!field) return
    setSeed(
      field.kind === 'conflict'
        ? (field.aiValue ?? '')
        : field.kind === 'review'
          ? field.value.replace(' (sugerido)', '')
          : '',
    )
  }, [field])

  if (!field) return null

  const confirmLabel =
    field.kind === 'conflict'
      ? t('brief.saveDecision')
      : field.kind === 'question'
        ? t('brief.respond')
        : t('brief.approve')

  return (
    <Modal
      open={!!field}
      onClose={onClose}
      title={t(`fields.${field.id}`, { defaultValue: field.label })}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => onResolve(field.id, draft.value)} disabled={!draft.valid}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {field.kind === 'conflict' && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { lab: t('brief.aiProposes'), val: field.aiValue ?? '' },
              { lab: t('brief.youWrote'), val: field.humanValue ?? '' },
            ].map((o) => (
              <button
                key={o.lab}
                onClick={() => setSeed(o.val)}
                className={`text-left rounded-xl border p-3 ${
                  draft.value === o.val ? 'border-accent bg-accent-soft' : 'border-line bg-raised'
                }`}
              >
                <div className="text-[11px] text-muted mb-1">{o.lab}</div>
                <div className="text-sm text-content">{o.val}</div>
              </button>
            ))}
          </div>
        )}

        {field.kind === 'review' && (
          <p className="text-[13px] text-muted">
            {t('brief.originAi')} · {Math.round((field.confidence || 0) * 100)}%
          </p>
        )}

        {field.kind === 'question' && (
          <label className="block text-[13px] text-muted">{t('brief.yourAnswer')}</label>
        )}

        <FieldEditor
          field={field}
          initialValue={seed}
          aiCatalog={aiCatalog}
          aiCapable={aiCapable}
          onRegenerate={onRegenerate}
          onChange={handleChange}
        />
      </div>
    </Modal>
  )
}
