import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Cpu, Bot, Check } from 'lucide-react'
import { Popover } from '../ui/Popover'
import { useWorkspaceModels } from '../../lib/useWorkspaceModels'
import { useWorkspace } from '../../lib/workspace'
import { getEngine } from '../../data/models'

// In-context engine selector for a phase's hero. Shows the effective engine and lets you
// override it (or fall back to the workspace default).
export function EnginePill({ phase }: { phase: string }) {
  const { t } = useTranslation()
  const { connections, defaultEngineId, phaseEngines, setPhaseEngine, effectiveEngine, connected } =
    useWorkspaceModels()
  const { to } = useWorkspace()

  const eng = effectiveEngine(phase)
  const isOverride = phase in phaseEngines
  const def = getEngine(defaultEngineId)

  if (!connected) {
    return (
      <Link
        to={to('models', 'workspace')}
        className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-raised border border-line text-[13px] text-muted hover:text-content"
      >
        <Cpu size={14} className="text-faint" />
        {t('models.connectAction')}
      </Link>
    )
  }

  const Icon = eng?.kind === 'agent' ? Bot : Cpu

  return (
    <Popover
      menuClassName="w-72"
      button={
        <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-raised border border-line text-[13px] text-content">
          <Icon size={14} className="text-accent" />
          <span className="text-muted">{t('models.engine')}:</span>
          <span className="font-medium truncate max-w-[140px]">{eng?.label ?? '—'}</span>
          <ChevronDown size={13} className="text-faint" />
        </span>
      }
    >
      {(close) => (
        <div className="bg-surface border border-line rounded-xl shadow-soft p-1.5 max-h-[60vh] overflow-y-auto">
          <button
            onClick={() => {
              setPhaseEngine(phase, null)
              close()
            }}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-raised text-left"
          >
            <span className="flex-1 text-[13px] text-content truncate">
              {t('models.useDefaultWith', { label: def?.label ?? '—' })}
            </span>
            {!isOverride && <Check size={14} className="text-accent shrink-0" />}
          </button>
          {connections.map((c) => (
            <div key={c.id}>
              <p className="px-2 pt-2 pb-1 text-[11px] tracking-wide text-faint">{c.name}</p>
              {c.engines.map((e) => {
                const EIcon = e.kind === 'agent' ? Bot : Cpu
                const active = isOverride && phaseEngines[phase] === e.id
                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      setPhaseEngine(phase, e.id)
                      close()
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-raised text-left"
                  >
                    <EIcon size={14} className="text-faint shrink-0" />
                    <span className="flex-1 text-[13px] text-content truncate">{e.label}</span>
                    {active && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}
