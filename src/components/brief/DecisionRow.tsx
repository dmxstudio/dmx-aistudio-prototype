import { useTranslation } from 'react-i18next'
import { AlertTriangle, Eye, MessageCircleQuestion, ArrowRight } from 'lucide-react'
import type { BriefField } from '../../data/brief'

export function DecisionRow({
  field,
  onOpen,
}: {
  field: BriefField
  onOpen?: (f: BriefField) => void
}) {
  const { t } = useTranslation()

  const cfg =
    field.kind === 'conflict'
      ? { bg: 'bg-danger-soft', border: 'border-danger-soft', text: 'text-danger-strong', Icon: AlertTriangle, action: t('brief.resolve') }
      : field.kind === 'question'
        ? { bg: 'bg-accent-soft', border: 'border-accent-soft', text: 'text-accent-strong', Icon: MessageCircleQuestion, action: t('brief.respond') }
        : { bg: 'bg-warning-soft', border: 'border-warning-soft', text: 'text-warning-strong', Icon: Eye, action: t('brief.approve') }

  return (
    <div className={`my-2.5 rounded-xl border ${cfg.border} ${cfg.bg} p-3`}>
      <div className="flex items-center gap-2 mb-2">
        <cfg.Icon size={14} className={cfg.text} />
        <span className={`text-[12px] font-medium ${cfg.text} flex-1`}>
          {t(`fields.${field.id}`, { defaultValue: field.label })} — {t('brief.statusDecision')}
        </span>
        {field.blocks && (
          <span className="text-[11px] text-muted whitespace-nowrap">{t('brief.blocks', { x: field.blocks })}</span>
        )}
      </div>

      {field.kind === 'conflict' && (
        <div className="flex gap-2 mb-2.5">
          <div className="flex-1 bg-surface rounded-lg px-3 py-2">
            <div className="text-[10px] text-accent-strong mb-0.5">{t('brief.aiProposes')}</div>
            <div className="text-[13px] text-content">{field.aiValue}</div>
          </div>
          <div className="flex-1 bg-surface rounded-lg px-3 py-2">
            <div className="text-[10px] text-muted mb-0.5">{t('brief.youWrote')}</div>
            <div className="text-[13px] text-content">{field.humanValue}</div>
          </div>
        </div>
      )}
      {field.kind === 'review' && (
        <div className="text-[12px] text-muted mb-2.5">
          {field.value} · {t('brief.originAi')} {Math.round((field.confidence || 0) * 100)}%
        </div>
      )}

      {onOpen && (
        <button
          onClick={() => onOpen(field)}
          className="inline-flex items-center gap-1.5 rounded-full bg-content text-canvas px-3.5 py-1.5 text-xs font-medium hover:opacity-90"
        >
          {cfg.action}
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  )
}
