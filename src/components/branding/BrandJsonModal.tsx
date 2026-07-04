import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { BrandSection } from '../../data/branding'

export function BrandJsonModal({
  open,
  onClose,
  sections,
  brandSource,
  gateClosed,
  gateTotal,
}: {
  open: boolean
  onClose: () => void
  sections: BrandSection[]
  brandSource: string
  gateClosed: number
  gateTotal: number
}) {
  const { t } = useTranslation()

  const obj: Record<string, unknown> = {
    branding: { brandSource, minViable: `${gateClosed}/${gateTotal}` },
  }
  for (const s of sections) {
    const sec: Record<string, unknown> = {}
    for (const fld of s.fields) {
      sec[fld.id] = {
        value: fld.value,
        status: fld.status,
        ...(fld.origin ? { origin: fld.origin } : {}),
        ...(fld.inherited ? { inherited: true } : {}),
        ...(fld.owner ? { owner: fld.owner } : {}),
        ...(fld.source ? { source: fld.source } : {}),
        ...(fld.taxonomy ? { taxonomy: fld.taxonomy } : {}),
        ...(fld.confidence != null ? { confidence: fld.confidence } : {}),
        ...(fld.blocks ? { blocks: fld.blocks } : {}),
        ...(fld.approval ? { approval: fld.approval } : {}),
      }
    }
    obj[s.id] = sec
  }
  const json = JSON.stringify(obj, null, 2)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('branding.jsonTitle')}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
      }
    >
      <p className="text-[12px] text-muted mb-3">{t('branding.jsonNote')}</p>
      <pre className="text-[11px] font-mono text-content bg-raised border border-line rounded-xl p-3 max-h-[52vh] overflow-auto whitespace-pre leading-relaxed">
        {json}
      </pre>
    </Modal>
  )
}
