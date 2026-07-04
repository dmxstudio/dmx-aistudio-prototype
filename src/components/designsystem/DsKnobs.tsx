import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { InfoTip } from '../ui/InfoTip'
import type { DsKnobs as Knobs } from '../../lib/dsData'

// Perillas de alto nivel que RE-DERIVAN el sistema (densidad del espaciado, escala de radios).
// Selección por CHIPS con "i" explicativa por opción — mismo patrón que los selects del admin.
// Cambiarlas re-genera tokens + guía y re-abre la revisión por grupos.
const chipCls = (on: boolean) =>
  `px-3 py-1.5 rounded-2xl text-[13px] leading-snug border transition-colors ${
    on ? 'bg-accent text-accent-ink border-accent' : 'bg-surface text-muted border-line hover:text-content'
  }`

export function DsKnobs({ knobs, onChange }: { knobs: Knobs; onChange: (k: Knobs) => void }) {
  const { t } = useTranslation()

  const row = (label: string, value: string, opts: string[], onPick: (v: string) => void, optKey: string, infoKey: string) => (
    <div className="flex items-start gap-3 flex-wrap">
      <span className="text-[12px] text-muted w-20 shrink-0 pt-1.5">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {opts.map((o) => (
          <span key={o} className="inline-flex items-center gap-1">
            <button onClick={() => onPick(o)} className={chipCls(value === o)}>
              {t(`${optKey}.${o}`)}
            </button>
            <InfoTip text={t(`${infoKey}.${o}`)} />
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <div className="mt-4 pt-4 border-t border-line">
      <div className="flex items-center gap-1.5 mb-2.5">
        <SlidersHorizontal size={14} className="text-accent-strong" />
        <span className="text-[11px] font-medium text-muted uppercase tracking-wide">{t('ds.knobs')}</span>
      </div>
      <div className="space-y-2.5">
        {row(t('ds.knobDensity'), knobs.density, ['compact', 'comfortable', 'spacious'], (v) => onChange({ ...knobs, density: v as Knobs['density'] }), 'ds.density', 'ds.densityInfo')}
        {row(t('ds.knobRadius'), knobs.radius, ['sharp', 'soft', 'rounded'], (v) => onChange({ ...knobs, radius: v as Knobs['radius'] }), 'ds.radiusOpt', 'ds.radiusInfo')}
      </div>
    </div>
  )
}
