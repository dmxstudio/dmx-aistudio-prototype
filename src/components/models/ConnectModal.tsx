import { useTranslation } from 'react-i18next'
import { Cpu, Bot, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { CONNECTIONS } from '../../data/models'

export function ConnectModal({
  open,
  onClose,
  connectedIds,
  onConnect,
  onDisconnect,
}: {
  open: boolean
  onClose: () => void
  connectedIds: string[]
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
}) {
  const { t } = useTranslation()

  return (
    <Modal open={open} onClose={onClose} title={t('models.connectTitle')}>
      <p className="text-[13px] text-muted mb-4">{t('models.connectSubtitle')}</p>
      <div className="space-y-2">
        {CONNECTIONS.map((c) => {
          const isConn = connectedIds.includes(c.id)
          const Icon = c.kind === 'agent-platform' ? Bot : Cpu
          const count = c.engines.length
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5"
            >
              <Icon size={18} className="text-accent-strong shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-content truncate">{c.name}</p>
                <p className="text-[11px] text-muted">
                  {c.kind === 'agent-platform' ? t('models.agentPlatform') : t('models.provider')} ·{' '}
                  {c.kind === 'agent-platform'
                    ? t('models.agentsCount', { n: count })
                    : t('models.enginesCount', { n: count })}
                </p>
              </div>
              {isConn ? (
                <button
                  onClick={() => onDisconnect(c.id)}
                  className="text-[12px] text-muted hover:text-danger-strong inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-line"
                >
                  <Check size={13} className="text-success-strong" />
                  {t('models.connected')}
                </button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => onConnect(c.id)}>
                  {t('models.connectAction')}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
