import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ArchPage } from '../../lib/archData'

// Nodo compartido por el Site Map (F1) y el User Flow (F2): una página del spec.
export type PData = { page: ArchPage }

export function PageNode({ data, selected }: NodeProps) {
  const p = (data as PData).page
  return (
    <div className={`rounded-lg border px-3 py-2 bg-surface shadow-soft min-w-[130px] ${selected ? 'border-accent ring-2 ring-accent-soft' : 'border-line'}`}>
      <Handle type="target" position={Position.Top} className="!bg-accent-strong !w-2 !h-2" />
      <div className="text-[12px] font-semibold text-content leading-tight">{p.name}</div>
      <div className="text-[10px] text-faint">{p.path}</div>
      {p.from && <div className="text-[9px] text-accent-strong mt-0.5 font-medium">{p.from}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-accent-strong !w-2 !h-2" />
    </div>
  )
}
