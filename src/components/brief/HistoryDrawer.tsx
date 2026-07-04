import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, GitBranch, History, RotateCcw, Download, Lock, Sparkles, User } from 'lucide-react'
import type { BriefVersion, FieldEvent } from '../../data/brief'

export function HistoryDrawer({
  open,
  onClose,
  versions,
  history,
  onRestore,
}: {
  open: boolean
  onClose: () => void
  versions: BriefVersion[]
  history: FieldEvent[]
  onRestore: (id: string) => void
}) {
  const { t } = useTranslation()
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(id)
  }, [toast])

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-[420px] max-w-[90vw] bg-surface border-l border-line flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-14 px-5 flex items-center justify-between border-b border-line shrink-0">
          <div className="flex items-center gap-2">
            <History size={17} className="text-accent" />
            <span className="font-display text-base font-bold text-content">{t('brief.historyTitle')}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-raised hover:text-content"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch size={15} className="text-accent" />
              <span className="text-sm font-medium text-content">{t('brief.versionsTitle')}</span>
              <span className="text-[11px] text-muted">{t('brief.versionsHint')}</span>
            </div>
            {versions.map((v) => (
              <div key={v.id} className="flex items-center gap-3 py-3 border-t border-line">
                <span className="font-display font-bold text-[13px] text-content w-7 shrink-0">{v.id}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-content flex items-center gap-1.5">
                    {v.label}
                    {v.sealed && <Lock size={12} className="text-warning-strong" />}
                    {v.origin === 'ai' && (
                      <span className="text-[10px] bg-accent-soft text-accent-strong px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Sparkles size={10} />
                        IA
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted">
                    {v.when} · {v.author}
                    {v.sealed ? ` · ${t('brief.signed')}` : ''}
                  </div>
                </div>
                {v.current ? (
                  <span className="text-[11px] bg-success-soft text-success-strong px-2.5 py-1 rounded-full whitespace-nowrap">
                    {t('brief.current')}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {v.sealed && (
                      <button
                        onClick={() => setToast(t('brief.exported'))}
                        className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-[11px] text-content hover:bg-raised inline-flex items-center gap-1"
                      >
                        <Download size={12} />
                        {t('brief.export')}
                      </button>
                    )}
                    <button
                      onClick={() => onRestore(v.id)}
                      className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-[11px] text-content hover:bg-raised inline-flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      {t('brief.restore')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <History size={15} className="text-accent" />
              <span className="text-sm font-medium text-content">{t('brief.activityTitle')}</span>
              <span className="text-[11px] text-muted">{t('brief.activityHint')}</span>
            </div>
            {history.map((h) => (
              <div key={h.id} className="flex items-start gap-3 py-2.5 border-t border-line">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    h.origin === 'ai' ? 'bg-accent-soft' : 'bg-raised'
                  }`}
                >
                  {h.origin === 'ai' ? (
                    <Sparkles size={12} className="text-accent" />
                  ) : (
                    <User size={12} className="text-muted" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-content">{h.field}</div>
                  <div className="text-[12px] text-muted">{h.detail}</div>
                </div>
                <span className="text-[11px] text-faint whitespace-nowrap">{h.when}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-raised border border-line p-3 flex items-start gap-3">
            <GitBranch size={18} className="text-muted shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-content">{t('brief.githubTitle')}</div>
              <div className="text-[11px] text-muted mt-0.5">{t('brief.githubBody')}</div>
              <button
                onClick={() => setToast(t('brief.exported'))}
                className="mt-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] text-content hover:bg-raised inline-flex items-center gap-1.5"
              >
                <Download size={12} />
                {t('brief.exportSnapshot')}
              </button>
            </div>
          </div>
        </div>

        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-content text-canvas text-xs px-3 py-2 rounded-full">
            {toast}
          </div>
        )}
      </aside>
    </div>
  )
}
