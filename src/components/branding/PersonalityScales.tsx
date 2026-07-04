import { useTranslation } from 'react-i18next'
import type { BrandScale } from '../../data/branding'

export function PersonalityScales({ scales }: { scales: BrandScale[] }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-line bg-raised p-4 space-y-3">
      {scales.map((s) => (
        <div key={s.key} className="grid grid-cols-[84px_1fr_84px] items-center gap-3">
          <span className="text-[12px] text-muted text-right">{t(`branding.scales.${s.key}.left`, { defaultValue: s.left })}</span>
          <div className="relative h-1.5 rounded-full bg-surface border border-line">
            <span
              className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-accent ring-2 ring-surface"
              style={{ left: `${((s.value - 1) / 4) * 100}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <span className="text-[12px] text-content font-medium">{t(`branding.scales.${s.key}.right`, { defaultValue: s.right })}</span>
        </div>
      ))}
    </div>
  )
}
