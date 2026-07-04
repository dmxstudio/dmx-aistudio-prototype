import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-12 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent-strong flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold text-content">{title}</h3>
      {description && <p className="text-sm text-muted mt-1.5 max-w-md leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
