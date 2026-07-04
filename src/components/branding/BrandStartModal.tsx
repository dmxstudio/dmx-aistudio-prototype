import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, Link2, Loader2, GitBranch, X, Info, Sparkles } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export type StartMode = 'brief' | 'ingest' | 'inherit' | null

const taCls =
  'w-full rounded-xl bg-raised border border-line px-3 py-2.5 text-sm text-content placeholder:text-faint outline-none focus:border-accent resize-none'

const BRIEF_READY_AT = 25

export function BrandStartModal({
  mode,
  briefReadiness,
  byomConnected,
  inheritOptions,
  onClose,
  onGenerate,
  onInherit,
}: {
  mode: StartMode
  briefReadiness: number
  byomConnected: boolean
  inheritOptions: { id: string; label: string }[]
  onClose: () => void
  onGenerate: (source: string) => void
  onInherit: (id: string) => void
}) {
  const { t } = useTranslation()
  const [prompt, setPrompt] = useState('')
  const [fileName, setFileName] = useState('')
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [pendingSource, setPendingSource] = useState('')

  useEffect(() => {
    if (!mode) return
    setPrompt('')
    setFileName('')
    setUrl('')
    setAnalyzing(false)
    setPendingSource('')
  }, [mode])

  // Simulated ingestion: a brief "analyzing…" state before the proposal lands.
  useEffect(() => {
    if (!analyzing) return
    const id = setTimeout(() => onGenerate(pendingSource), 1300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzing])

  if (!mode) return null

  const title =
    mode === 'brief'
      ? t('branding.start.briefTitle')
      : mode === 'ingest'
        ? t('branding.start.ingestTitle')
        : t('branding.start.inheritTitle')

  const cleanUrl = url.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  const ingestSource = fileName ? fileName : cleanUrl ? `${t('branding.start.sitePrefix')}: ${cleanUrl}` : ''

  const promptField = (
    <div>
      <label className="block text-[13px] text-muted mb-1.5">{t('branding.start.promptLabel')}</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder={t('branding.start.promptPlaceholder')}
        className={taCls}
      />
    </div>
  )

  const briefReady = briefReadiness >= BRIEF_READY_AT

  // AI generation requires a connected client model — same gate as the kickstart cards that open
  // this modal. Belt-and-suspenders: keep the entry point gated even if a caller forgets to.
  const byomNotice = !byomConnected ? (
    <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft p-3">
      <Info size={16} className="text-warning-strong shrink-0 mt-0.5" />
      <p className="text-[12px] text-warning-strong leading-relaxed">{t('branding.kickstart.byomMissing')}</p>
    </div>
  ) : null

  const footer =
    mode === 'inherit' ? (
      <Button variant="ghost" onClick={onClose}>
        {t('common.cancel')}
      </Button>
    ) : (
      <>
        <Button variant="ghost" onClick={onClose} disabled={analyzing}>
          {t('common.cancel')}
        </Button>
        {mode === 'brief' ? (
          <Button variant="primary" disabled={!byomConnected} onClick={() => onGenerate('Brief')}>
            <Sparkles size={15} />
            {t('branding.start.generate')}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={!byomConnected || !ingestSource || analyzing}
            onClick={() => {
              setPendingSource(ingestSource)
              setAnalyzing(true)
            }}
          >
            {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {t('branding.start.analyze')}
          </Button>
        )}
      </>
    )

  return (
    <Modal open={!!mode} onClose={analyzing ? () => {} : onClose} title={title} footer={footer}>
      {analyzing ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Loader2 size={26} className="text-accent-strong animate-spin" />
          <p className="text-sm text-content">{t('branding.start.analyzing', { source: pendingSource })}</p>
          <p className="text-[12px] text-faint">{t('branding.start.analyzingHint')}</p>
        </div>
      ) : mode === 'brief' ? (
        <div className="space-y-4">
          {byomNotice}
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3 ${
              briefReady ? 'bg-accent-soft' : 'bg-warning-soft'
            }`}
          >
            <Info size={16} className={`shrink-0 mt-0.5 ${briefReady ? 'text-accent-strong' : 'text-warning-strong'}`} />
            <p className={`text-[12px] leading-relaxed ${briefReady ? 'text-accent-strong' : 'text-warning-strong'}`}>
              {briefReady
                ? t('branding.start.briefReady', { n: briefReadiness })
                : t('branding.start.briefThin', { n: briefReadiness })}
            </p>
          </div>
          {promptField}
        </div>
      ) : mode === 'ingest' ? (
        <div className="space-y-4">
          {byomNotice}
          {fileName ? (
            <div className="flex items-center gap-2 bg-raised border border-line rounded-xl px-3 h-11">
              <FileText size={16} className="text-accent-strong shrink-0" />
              <span className="flex-1 text-[13px] text-content truncate">{fileName}</span>
              <button onClick={() => setFileName('')} aria-label={t('common.delete')} className="text-faint hover:text-danger-strong">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setFileName('brand-book.pdf')}
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-6 text-muted hover:text-content hover:border-accent transition-colors"
            >
              <Upload size={20} />
              <span className="text-[13px]">{t('branding.start.uploadPdf')}</span>
            </button>
          )}

          <div>
            <label className="block text-[13px] text-muted mb-1.5">{t('branding.start.urlLabel')}</label>
            <div className="flex items-center gap-2 rounded-xl bg-raised border border-line px-3 h-10 focus-within:border-accent">
              <Link2 size={15} className="text-faint shrink-0" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('branding.start.urlPlaceholder')}
                className="flex-1 bg-transparent text-sm text-content placeholder:text-faint outline-none"
              />
            </div>
          </div>

          {promptField}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[13px] text-muted mb-1">{t('branding.start.inheritPick')}</p>
          {inheritOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => onInherit(o.id)}
              className="w-full flex items-center gap-2.5 rounded-xl border border-line px-3 h-11 hover:bg-raised hover:border-accent transition-colors text-left"
            >
              <GitBranch size={15} className="text-accent shrink-0" />
              <span className="flex-1 text-[13px] text-content truncate">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
