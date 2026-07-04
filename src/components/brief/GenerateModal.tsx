import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Info } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { BriefSection } from '../../data/brief'

export function GenerateModal({
  open,
  onClose,
  sections,
  onGenerate,
  ns = 'brief',
}: {
  open: boolean
  onClose: () => void
  sections: BriefSection[]
  onGenerate: (ids: string[]) => void
  ns?: 'brief' | 'branding'
}) {
  const { t } = useTranslation()
  const [desc, setDesc] = useState('')
  const [selected, setSelected] = useState<string[]>(() => sections.map((s) => s.id))

  useEffect(() => {
    if (open) {
      setSelected(sections.map((s) => s.id))
      setDesc('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const allSelected = selected.length === sections.length
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const toggleAll = () => setSelected(allSelected ? [] : sections.map((s) => s.id))

  const chip = (isOn: boolean) =>
    `px-3 h-8 rounded-full text-[13px] border transition-colors ${
      isOn ? 'bg-accent text-accent-ink border-accent' : 'bg-surface text-muted border-line hover:text-content'
    }`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('common.generateAI')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => onGenerate(selected)} disabled={selected.length === 0}>
            <Sparkles size={15} />
            {t('common.generateAI')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[13px] text-muted mb-1.5">{t('brief.generateContextLabel')}</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder={t('brief.generateContextPlaceholder')}
            className="w-full rounded-xl bg-raised border border-line px-3 py-2.5 text-sm text-content placeholder:text-faint outline-none focus:border-accent resize-none"
          />
        </div>

        <div>
          <label className="block text-[13px] text-muted mb-2">{t('brief.generateSectionsLabel')}</label>
          <div className="flex flex-wrap gap-2">
            <button onClick={toggleAll} className={chip(allSelected)}>
              {t('brief.allSections')}
            </button>
            {sections.map((s) => (
              <button key={s.id} onClick={() => toggle(s.id)} className={chip(selected.includes(s.id))}>
                {s.code} · {t(`${ns}.sections.${s.id}`, { defaultValue: s.name })}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft p-3">
          <Info size={16} className="text-warning-strong shrink-0 mt-0.5" />
          <p className="text-[12px] text-warning-strong leading-relaxed">{t(`${ns}.factsDisclaimer`)}</p>
        </div>
      </div>
    </Modal>
  )
}
