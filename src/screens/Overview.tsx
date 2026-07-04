import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, MoreHorizontal } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Avatar } from '../components/ui/Avatar'
import { metrics, studioAgents, studioActivity, trend } from '../data/mock'

// Minimal single-hue gradients from the accent indigo, faded via opacity (theme-robust).
const ACCENT_BAR =
  'linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 55%, transparent), var(--color-accent))'
const ACCENT_COLUMN =
  'linear-gradient(180deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 28%, transparent))'

export function Overview() {
  const { t } = useTranslation()
  const [scope, setScope] = useState('company')
  const [range, setRange] = useState('3d')

  const ranges = [
    { value: '3d', label: t('common.last3days') },
    { value: 'w', label: t('common.lastWeek') },
    { value: 'm', label: t('common.lastMonth') },
  ]

  return (
    <div className="py-2">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <SegmentedControl
          options={[
            { value: 'company', label: t('common.company') },
            { value: 'personal', label: t('common.personal') },
          ]}
          value={scope}
          onChange={setScope}
        />
        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`h-9 px-4 rounded-full text-[13px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                range === r.value
                  ? 'bg-content text-canvas border-content'
                  : 'bg-surface text-muted border-line hover:text-content'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            aria-label={t('common.more')}
            className="w-9 h-9 rounded-full bg-surface border border-line flex items-center justify-center text-muted hover:text-content shrink-0"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <h2 className="text-base font-medium text-content mb-3">{t('overview.teams')}</h2>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-4xl font-bold text-content leading-none">
                {studioActivity.artifacts.toLocaleString('en-US')}
              </div>
              <div className="text-sm text-muted mt-2">{t('overview.trends')}</div>
            </div>
            <div className="text-sm">
              <span className="text-success-strong font-medium">{studioActivity.firstPassRate}%</span>{' '}
              <span className="text-muted">{t('overview.wellPerformed')}</span>
            </div>
          </div>

          <div className="mt-5 relative h-12 rounded-full bg-raised overflow-hidden flex items-center">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${studioActivity.savedFill}%`,
                background: ACCENT_BAR,
              }}
            />
            <span className="relative z-10 pl-5 text-sm font-medium text-content">
              {t('overview.timeTracking')}
            </span>
            <span className="relative z-10 ml-auto pr-5 font-display text-sm font-bold text-content">
              {studioActivity.savedHours}
            </span>
          </div>

          <div className="mt-6 rounded-xl bg-raised p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--color-accent) 35%, transparent)' }}
                  />
                  &lt;500
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--color-accent) 65%, transparent)' }}
                  />
                  ≈1k
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
                  &gt;2k
                </span>
              </div>
              <div className="flex items-center gap-8 text-[11px] text-faint font-mono">
                <span>{t('overview.days.d2')}</span>
                <span>{t('overview.days.d1')}</span>
                <span>{t('overview.days.d0')}</span>
              </div>
            </div>
            <div className="flex items-end gap-[3px] h-28">
              {trend.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${Math.round(h * 100)}%`, background: ACCENT_COLUMN }}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-content">{t('overview.agents')}</h3>
            <button className="text-xs text-accent-strong hover:underline">
              {t('overview.viewAll')}
            </button>
          </div>
          <div className="space-y-3.5">
            {studioAgents.map((e) => (
              <div key={e.name} className="flex items-center gap-3">
                <Avatar name={e.name} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-content truncate">{e.name}</p>
                  <p className="text-xs text-muted">{e.role}</p>
                </div>
                <span className="flex items-center gap-1 text-[13px] font-medium text-content">
                  <Star size={13} className="text-warning fill-warning" />
                  {e.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <h2 className="text-base font-medium text-content mb-3">{t('overview.metrics')}</h2>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <StatCard
            key={m.key}
            label={t(`overview.metric.${m.key}`)}
            value={m.value}
            delta={{ value: m.delta, tone: m.tone }}
            progress={m.progress}
          />
        ))}
      </div>
    </div>
  )
}
