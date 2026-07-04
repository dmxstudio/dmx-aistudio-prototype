import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, Bot, Info, Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function CatalogsModal({
  open,
  onClose,
  engineLabel,
  hasCatalogs,
  onGenerate,
}: {
  open: boolean
  onClose: () => void
  engineLabel?: string
  hasCatalogs: boolean
  onGenerate: () => void
}) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (open) {
      setPrompt('')
      setGenerating(false)
    }
  }, [open])

  // Simulated generation: a brief "Generando…" then the catalogs land and the modal closes.
  useEffect(() => {
    if (!generating) return
    const id = setTimeout(() => {
      onGenerate()
      onClose()
    }, 1300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generating])

  return (
    <Modal
      open={open}
      onClose={generating ? () => {} : onClose}
      title={t('branding.catalogs.title')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={generating}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={() => setGenerating(true)} disabled={generating}>
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {generating ? t('branding.catalogs.generating') : t('branding.catalogs.generate')}
          </Button>
        </>
      }
    >
      {generating ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Loader2 size={26} className="text-accent-strong animate-spin" />
          <p className="text-sm text-content">{t('branding.catalogs.generating')}</p>
          {engineLabel && (
            <p className="text-[12px] text-faint">{t('branding.catalogs.willGenerateWith', { engine: engineLabel })}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] text-muted leading-relaxed">{t('branding.catalogs.intro')}</p>

          {engineLabel && (
            <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft text-accent-strong text-[12px] px-3 py-1.5">
              <Bot size={14} />
              {t('branding.catalogs.willGenerateWith', { engine: engineLabel })}
            </div>
          )}

          <div>
            <label className="block text-[13px] text-muted mb-1.5">{t('branding.catalogs.promptLabel')}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder={t('branding.catalogs.promptPlaceholder')}
              className="w-full rounded-xl bg-raised border border-line px-3 py-2.5 text-sm text-content placeholder:text-faint outline-none focus:border-accent resize-none"
            />
          </div>

          {hasCatalogs && (
            <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft p-3">
              <Info size={16} className="text-warning-strong shrink-0 mt-0.5" />
              <p className="text-[12px] text-warning-strong leading-relaxed">{t('branding.catalogs.replaceWarning')}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
