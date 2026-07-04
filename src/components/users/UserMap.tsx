import { useEffect, useMemo } from 'react'
import { ReactFlow, Background, Controls, Panel, Handle, Position, MarkerType, useNodesState, useEdgesState, type Node, type Edge, type NodeProps } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslation } from 'react-i18next'
import { Check, AlertTriangle, Target, HeartCrack, Users as UsersIcon, X, Network } from 'lucide-react'
import { Button } from '../ui/Button'
import { covKey, type UsersSpec, type Evidence, type GoalKind } from '../../lib/usersData'

// Mapa del usuario — RENDER de solo lectura del grafo de aceptación (segmento→meta→dolor) sembrado
// desde users.json. La edición vive en las facetas del panel (Metas&Dolores / Journey); aquí NO se
// escribe de vuelta (posiciones efímeras) → la cara MÁQUINA queda intacta. Colorea por evidencia y
// marca lo atendido/resuelto aguas abajo (mismo coverage loop que el medidor). Overlay nativo full-screen.

type Covered = { addr: Set<string>; reso: Set<string> }
const evColor = (e: Evidence) => (e === 'fact' ? 'var(--color-success-strong)' : e === 'risk' ? 'var(--color-danger-strong)' : 'var(--color-warning-strong)')

type SegData = { segKind: 'primary' | 'secondary'; name: string; evidence: Evidence; persona: string; quote: string; device: string }
type GoalData = { goalKind: GoalKind; role: string; want: string; acceptance: string; evidence: Evidence; covered: boolean }
type PainData = { text: string; evidence: Evidence; resolved: boolean; orphan: boolean }

function SegmentNode({ data }: NodeProps) {
  const d = data as unknown as SegData
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-line border-l-4 bg-surface shadow-soft px-3.5 py-3 w-[210px]" style={{ borderLeftColor: evColor(d.evidence) }}>
      <Handle type="source" position={Position.Right} className="!bg-accent-strong !w-2 !h-2" />
      <div className="flex items-center gap-1.5">
        <UsersIcon size={13} className="text-accent-strong shrink-0" />
        <span className="text-[13px] font-semibold text-content leading-tight flex-1">{d.name}</span>
      </div>
      {d.persona && <div className="text-[11px] text-muted mt-1 truncate">{d.persona}</div>}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] rounded-full px-2 py-0.5 bg-accent-soft text-accent-strong">{t(`users.kind.${d.segKind}`)}</span>
        <span className="text-[10px] rounded-full px-2 py-0.5" style={{ color: evColor(d.evidence), background: 'color-mix(in srgb, ' + evColor(d.evidence) + ' 12%, transparent)' }}>{t(`users.evidence.${d.evidence}`)}</span>
      </div>
      <div className="text-[10px] text-faint mt-1">{d.device}</div>
    </div>
  )
}

function GoalNode({ data }: NodeProps) {
  const d = data as unknown as GoalData
  const { t } = useTranslation()
  return (
    <div className={`rounded-xl border border-l-4 bg-surface shadow-soft px-3.5 py-2.5 w-[250px] ${d.covered ? 'border-success-strong ring-2 ring-success-soft' : 'border-line'}`} style={{ borderLeftColor: evColor(d.evidence) }}>
      <Handle type="target" position={Position.Left} className="!bg-accent-strong !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-danger-strong !w-2 !h-2" />
      <div className="flex items-start gap-1.5">
        <Target size={13} className="text-accent-strong shrink-0 mt-0.5" />
        <div className="text-[12px] leading-snug text-content flex-1">
          {d.goalKind === 'quality'
            ? <><span className="text-[10px] bg-accent-soft text-accent-strong rounded-full px-1.5 py-0.5 mr-1">{t('users.goalQuality')}</span>{d.want}</>
            : <><span className="text-muted">{t('users.storyAs')}</span> {d.role}, <span className="text-muted">{t('users.storyWant')}</span> {d.want}</>}
        </div>
      </div>
      {d.acceptance && <div className="text-[10px] text-muted bg-raised border border-line rounded-md px-1.5 py-0.5 mt-1.5 inline-block">{d.acceptance}</div>}
      {d.covered && <div className="text-[10px] text-success-strong mt-1 inline-flex items-center gap-1 ml-1"><Check size={10} />{t('users.addressed')}</div>}
    </div>
  )
}

function PainNode({ data }: NodeProps) {
  const d = data as unknown as PainData
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-line border-l-4 bg-surface shadow-soft px-3.5 py-2.5 w-[220px]" style={{ borderLeftColor: evColor(d.evidence) }}>
      <Handle type="target" position={Position.Left} className="!bg-danger-strong !w-2 !h-2" />
      <div className="flex items-start gap-1.5">
        <HeartCrack size={13} className="text-danger-strong shrink-0 mt-0.5" />
        <span className="text-[12px] leading-snug text-content flex-1">{d.text}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {d.resolved && <span className="text-[10px] bg-success-soft text-success-strong rounded-full px-1.5 py-0.5 inline-flex items-center gap-1"><Check size={10} />{t('users.resolved')}</span>}
        {d.orphan && <span className="text-[10px] text-warning-strong inline-flex items-center gap-1"><AlertTriangle size={10} />{t('users.uncovered')}</span>}
      </div>
    </div>
  )
}

const nodeTypes = { segment: SegmentNode, goal: GoalNode, pain: PainNode }

const COL_SEG = 0, COL_GOAL = 340, COL_PAIN = 720, ROW_H = 128, BAND_GAP = 64

function buildGraph(spec: UsersSpec, covered: Covered, resolvesLabel: string): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let top = 0
  for (const s of spec.segments) {
    const linked = new Set(s.goals.flatMap((g) => g.resolvesPainIds))
    const rows = Math.max(s.goals.length, s.pains.length, 1)
    const bandH = (rows - 1) * ROW_H
    nodes.push({ id: s.id, type: 'segment', position: { x: COL_SEG, y: top + bandH / 2 }, data: { segKind: s.kind, name: s.name, evidence: s.evidence, persona: s.persona.handle, quote: s.persona.quote, device: s.context.device } as unknown as Record<string, unknown> })
    s.goals.forEach((g, i) => {
      const gid = `${s.id}~${g.id}`
      nodes.push({ id: gid, type: 'goal', position: { x: COL_GOAL, y: top + i * ROW_H }, data: { goalKind: g.kind, role: g.story.role, want: g.story.want, acceptance: g.acceptance, evidence: g.evidence, covered: covered.addr.has(covKey(s.id, g.id)) } as unknown as Record<string, unknown> })
      edges.push({ id: `e-${s.id}-${gid}`, source: s.id, target: gid, type: 'smoothstep', style: { stroke: 'var(--color-accent-strong)', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-accent-strong)' } })
      g.resolvesPainIds.forEach((pid) => {
        edges.push({ id: `e-${gid}-${pid}`, source: gid, target: `${s.id}~${pid}`, type: 'smoothstep', label: resolvesLabel, labelStyle: { fontSize: 10, fill: 'var(--color-danger-strong)' }, labelBgStyle: { fill: 'var(--color-surface)' }, style: { stroke: 'var(--color-danger-strong)', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-danger-strong)' } })
      })
    })
    s.pains.forEach((p, i) => {
      const pid = `${s.id}~${p.id}`
      const orphan = !linked.has(p.id)
      nodes.push({ id: pid, type: 'pain', position: { x: COL_PAIN, y: top + i * ROW_H }, data: { text: p.text, evidence: p.evidence, resolved: covered.reso.has(covKey(s.id, p.id)), orphan } as unknown as Record<string, unknown> })
      // Dolor sin meta que lo cubra → arista punteada desde el segmento (no queda flotando; riesgo visible).
      if (orphan) edges.push({ id: `e-${s.id}-${pid}`, source: s.id, target: pid, type: 'smoothstep', style: { stroke: 'var(--color-warning-strong)', strokeWidth: 1.5, strokeDasharray: '4 4' }, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color-warning-strong)' } })
    })
    top += bandH + 128 + BAND_GAP
  }
  return { nodes, edges }
}

function Canvas({ spec, covered }: { spec: UsersSpec; covered: Covered }) {
  const { t } = useTranslation()
  // Semilla única desde el spec al montar; arrastrar es exploración efímera (no se persiste).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seed = useMemo(() => buildGraph(spec, covered, t('users.resolves')), [])
  const [nodes, , onNodesChange] = useNodesState<Node>(seed.nodes)
  const [edges, , onEdgesChange] = useEdgesState<Edge>(seed.edges)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      nodesConnectable={false}
      edgesFocusable={false}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="var(--color-line)" gap={22} />
      <Controls showInteractive={false} />
      <Panel position="bottom-right">
        <div className="bg-surface/95 border border-line rounded-xl shadow-soft px-3 py-2.5 text-[11px] space-y-1.5">
          <div className="font-medium text-muted uppercase tracking-wide text-[10px]">{t('users.map.legend')}</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: evColor('fact') }} />{t('users.evidence.fact')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: evColor('assumption') }} />{t('users.evidence.assumption')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: evColor('risk') }} />{t('users.evidence.risk')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-success-strong"><Check size={11} />{t('users.map.legendCovered')}</div>
        </div>
      </Panel>
    </ReactFlow>
  )
}

export function UserMap({ open, spec, covered, onClose }: { open: boolean; spec: UsersSpec | null; covered: Covered; onClose: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open || !spec) return null

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col animate-in fade-in duration-150">
      <header className="h-14 shrink-0 border-b border-line bg-surface px-4 flex items-center gap-3">
        <span className="text-accent-strong"><Network size={18} /></span>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold text-content">{t('users.map.title')}</span>
          <span className="text-[11px] text-faint">{t('users.map.readonly')} · {spec.meta.project}</span>
        </div>
        <div className="ml-auto">
          <Button size="sm" variant="ghost" onClick={onClose} aria-label={t('users.map.close')} title={t('users.map.close')}><X size={16} /></Button>
        </div>
      </header>
      <div className="flex-1 min-h-0 relative">
        {spec.segments.length === 0
          ? <div className="absolute inset-0 flex items-center justify-center"><p className="text-[14px] text-muted">{t('users.map.empty')}</p></div>
          : <Canvas spec={spec} covered={covered} />}
      </div>
    </div>
  )
}
