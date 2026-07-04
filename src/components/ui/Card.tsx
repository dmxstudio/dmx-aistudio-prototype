import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`bg-surface border border-line rounded-2xl shadow-soft ${className}`}>
      {children}
    </div>
  )
}
