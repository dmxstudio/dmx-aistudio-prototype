import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Button } from '../ui/Button'

export function AuditBar({ enabled }: { enabled: boolean }) {
  const { t } = useTranslation()

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[13px] text-muted mr-1">
        <ShieldCheck size={15} className={enabled ? 'text-accent' : 'text-faint'} />
        {t('brief.auditLabel')}
      </span>
      {(['validate', 'audit', 'improve', 'complement'] as const).map((k) => (
        <Button key={k} size="sm" variant="secondary" disabled={!enabled}>
          {t(`common.${k}`)}
        </Button>
      ))}
      {!enabled && (
        <span className="text-[12px] text-faint w-full sm:w-auto sm:ml-1">{t('brief.auditDisabledHint')}</span>
      )}
    </div>
  )
}
