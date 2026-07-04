import type { ReactNode } from 'react'

type Tone = 'success' | 'danger' | 'warning' | 'accent' | 'neutral'

const tones: Record<Tone, string> = {
  success: 'bg-success-soft text-success-strong',
  danger: 'bg-danger-soft text-danger-strong',
  warning: 'bg-warning-soft text-warning-strong',
  accent: 'bg-accent-soft text-accent-strong',
  neutral: 'bg-raised text-muted',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
