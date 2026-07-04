import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6 pt-2">
      <div className="w-full">
        <h1 className="font-display text-2xl font-bold text-content leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-muted mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
