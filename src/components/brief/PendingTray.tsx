import { useTranslation } from 'react-i18next'
import { Inbox, Check } from 'lucide-react'
import type { BriefField } from '../../data/brief'

export function PendingTray({
  pending,
  onOpen,
}: {
  pending: BriefField[]
  onOpen?: (f: BriefField) => void
}) {
  const { t } = useTranslation()

  const dot = (k?: string) => (k === 'conflict' ? '#d6453f' : k === 'review' ? '#e0a019' : '#5b4bd6')
  const action = (k?: string) =>
    k === 'conflict' ? t('brief.resolve') : k === 'question' ? t('brief.respond') : t('brief.approve')

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <Inbox size={16} className="text-accent" />
        <span className="text-sm font-medium text-content">{t('brief.trayTitle')}</span>
        <span className="text-xs text-muted">{t('brief.trayHint')}</span>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-muted flex items-center gap-2 py-2">
          <Check size={15} className="text-success" />
          {t('brief.trayEmpty')}
        </p>
      ) : (
        pending.map((f) => (
          <div key={f.id} className="flex items-center gap-3 py-2.5 border-t border-line">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot(f.kind) }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-content truncate">{t(`fields.${f.id}`, { defaultValue: f.label })}</div>
              <div className="text-[11px] text-muted">
                {f.blocks ? t('brief.blocks', { x: f.blocks }) : ''}
                {f.kind === 'review' && f.confidence
                  ? ` · ${t('brief.originAi')} ${Math.round(f.confidence * 100)}%`
                  : ''}
              </div>
            </div>
            {onOpen && (
              <button
                onClick={() => onOpen(f)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-content hover:bg-raised whitespace-nowrap"
              >
                {action(f.kind)}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  )
}
