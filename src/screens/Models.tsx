import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Cpu, Bot, Star, ArrowUpRight, Languages } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { ConnectModal } from '../components/models/ConnectModal'
import { useWorkspaceModels } from '../lib/useWorkspaceModels'
import { PHASES, getEngine, getConnection } from '../data/models'

export function Models() {
  const { t } = useTranslation()
  const {
    connections,
    connectedIds,
    connected,
    defaultEngineId,
    setDefaultEngineId,
    phaseEngines,
    setPhaseEngine,
    effectiveEngine,
    translationEngineId,
    setTranslationEngineId,
    connect,
    disconnect,
  } = useWorkspaceModels()
  const [connectOpen, setConnectOpen] = useState(false)

  const activeConnId = getEngine(defaultEngineId)?.connectionId

  const engineOptions = (includeDefault: boolean) => (
    <>
      {includeDefault && <option value="">{t('models.useDefault')}</option>}
      {connections.map((c) => (
        <optgroup key={c.id} label={c.name}>
          {c.engines.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  )

  return (
    <div className="py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {connections.map((c) => {
          const Icon = c.kind === 'agent-platform' ? Bot : Cpu
          const isActive = c.id === activeConnId
          return (
            <Card key={c.id} className={`p-4 ${isActive ? 'ring-1 ring-accent' : ''}`}>
              <div className="flex items-center gap-2.5">
                <Icon size={18} className="text-accent-strong" />
                <span className="text-sm font-medium text-content">{c.name}</span>
                {isActive && (
                  <span className="ml-auto text-[11px] font-medium bg-accent-soft text-accent-strong rounded-full px-2 py-0.5">
                    {t('models.active')}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted mt-2">
                {c.kind === 'agent-platform' ? t('models.agentPlatform') : t('models.provider')} ·{' '}
                {c.kind === 'agent-platform'
                  ? t('models.agentsCount', { n: c.engines.length })
                  : t('models.enginesCount', { n: c.engines.length })}
              </p>
            </Card>
          )
        })}
        <button
          onClick={() => setConnectOpen(true)}
          className="rounded-2xl border border-dashed border-line p-4 flex items-center justify-center gap-2 text-[13px] text-muted hover:text-content hover:border-accent transition-colors"
        >
          <Plus size={16} />
          {t('models.connect')}
        </button>
      </div>

      {connected ? (
        <>
          <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Star size={16} className="text-accent-strong" />
              <span className="text-sm text-muted">{t('models.defaultEngine')}</span>
              <Select value={defaultEngineId} onChange={(e) => setDefaultEngineId(e.target.value)} pill>
                {engineOptions(false)}
              </Select>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-2xl shadow-soft p-5">
            <h2 className="text-base font-medium text-content mb-1">{t('models.perPhase')}</h2>

            <div className="divide-y divide-line">
              {PHASES.map((p) => {
                const Icon = p.icon
                const eng = effectiveEngine(p.key)
                const conn = eng ? getConnection(eng.connectionId) : undefined
                const isAgent = eng?.kind === 'agent'
                return (
                  <div key={p.key} className="flex items-center gap-3 py-3 flex-wrap">
                    <Icon size={16} className="text-faint shrink-0" />
                    <span className="text-[13px] text-content w-40 shrink-0">{t(p.labelKey)}</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      {isAgent && conn && (
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-[11px] text-muted hover:text-accent-strong inline-flex items-center gap-1"
                          title={t('models.configureIn', { platform: conn.name })}
                        >
                          {t('models.agent')}
                          <ArrowUpRight size={12} />
                        </a>
                      )}
                      <Select
                        value={phaseEngines[p.key] ?? ''}
                        onChange={(e) => setPhaseEngine(p.key, e.target.value || null)}
                        pill
                      >
                        {engineOptions(true)}
                      </Select>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
              <Bot size={14} className="text-accent-strong shrink-0" />
              <span className="text-[12px] text-muted">{t('models.agentNote')}</span>
            </div>
          </div>

          {/* Traducción: capacidad TRANSVERSAL (aplica a Brief, Branding y toda fase con contenido),
              por eso vive fuera de la lista de fases. Ver docs/spec-traduccion-contenido.md. */}
          <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mt-6">
            <div className="flex items-center gap-3 flex-wrap">
              <Languages size={16} className="text-accent-strong shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base font-medium text-content">{t('models.translationTitle')}</h2>
                <p className="text-[12px] text-muted mt-0.5">{t('models.translationNote')}</p>
              </div>
              <div className="flex-1" />
              <Select
                value={translationEngineId}
                onChange={(e) => setTranslationEngineId(e.target.value)}
                pill
              >
                {engineOptions(true)}
              </Select>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-12 text-center">
          <p className="text-sm text-muted">{t('models.noConnections')}</p>
        </div>
      )}

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        connectedIds={connectedIds}
        onConnect={connect}
        onDisconnect={disconnect}
      />
    </div>
  )
}
