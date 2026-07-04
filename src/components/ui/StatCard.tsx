import type { ReactNode } from 'react'
import { Card } from './Card'
import { Badge } from './Badge'
import { ProgressBar } from './ProgressBar'

interface Props {
  label: string
  value: string
  delta?: { value: string; tone: 'success' | 'danger' }
  progress?: number
  icon?: ReactNode
}

export function StatCard({ label, value, delta, progress, icon }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        {icon && <span className="text-faint">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl text-content leading-none">{value}</span>
        {delta && <Badge tone={delta.tone}>{delta.value}</Badge>}
      </div>
      {progress != null && <ProgressBar value={progress} className="mt-4" />}
    </Card>
  )
}
