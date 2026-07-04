import { useEffect, useMemo, useState, useCallback } from 'react'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, MarkerType, type Node, type Edge, type Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { PageNode, type PData } from './PageNode'
import type { ArchSpec, ArchPage, ArchFlow } from '../../lib/archData'

const nodeTypes = { page: PageNode }

// F2 — Canvas del User Flow (React Flow). Reusa las mismas páginas (nodos) pero edita la lista
// SEPARADA de flujos: aristas dirigidas y etiquetadas (la acción del usuario). Conecta dos páginas
// para crear un flujo, edita su etiqueta, o bórralo. No toca el árbol padre/hijo del Site Map.

const EDGE_STYLE = { markerEnd: { type: MarkerType.ArrowClosed }, animated: true, style: { stroke: 'var(--color-accent-strong)' } }
const flowEdge = (f: ArchFlow): Edge => ({ id: f.id, source: f.from, target: f.to, label: f.label, data: { label: f.label }, labelBgPadding: [6, 3] as [number, number], labelBgBorderRadius: 8, ...EDGE_STYLE })

// Posición del grafo de flujo (independiente del árbol del Site Map): usa la propia (flowPos), si no
// arranca desde la del Site Map como layout inicial, si no una grid de respaldo.
function seedPos(pages: ArchPage[]): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {}
  pages.forEach((p, i) => { pos[p.id] = p.flowPos ?? p.pos ?? { x: (i % 4) * 200 + 60, y: Math.floor(i / 4) * 150 + 40 } })
  return pos
}

export function FlowCanvas({ spec, onChange }: { spec: ArchSpec; onChange: (s: ArchSpec) => void }) {
  const { t } = useTranslation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pos = useMemo(() => seedPos(spec.pages), [])
  const [nodes, , onNodesChange] = useNodesState<Node>(
    spec.pages.map((p) => ({ id: p.id, type: 'page', position: pos[p.id], data: { page: p } })),
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(spec.flows.map(flowEdge))
  const [sel, setSel] = useState<string | null>(null)
  // Siembra el contador desde los ids flow-N existentes → no colisiona al reabrir el editor.
  const [counter, setCounter] = useState(() => {
    let max = 0
    spec.flows.forEach((f) => { const m = /^flow-(\d+)$/.exec(f.id); if (m) max = Math.max(max, +m[1]) })
    return max + 1
  })

  // Reconstruye flujos desde las aristas y persiste la posición del GRAFO en flowPos (nunca pos, que
  // pertenece al Site Map). Conserva todos los demás campos de la página.
  useEffect(() => {
    if (nodes.some((n) => n.dragging)) return
    const pages: ArchPage[] = nodes.map((n) => ({ ...(n.data as PData).page, flowPos: { x: Math.round(n.position.x), y: Math.round(n.position.y) } }))
    const flows: ArchFlow[] = edges.map((e) => ({ id: e.id, from: e.source, to: e.target, label: String((e.data as { label?: string })?.label ?? e.label ?? '') }))
    onChange({ ...spec, pages, flows })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges])

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return // sin auto-loops
    // Si ya existe un flujo entre ese par, selecciónalo (para editar su etiqueta) en vez de descartar
    // silenciosamente el nuevo (addEdge deduplica por source+target). Evita perder la acción sin feedback.
    const existing = edges.find((e) => e.source === c.source && e.target === c.target)
    if (existing) { setSel(existing.id); return }
    const id = `flow-${counter}`
    setCounter((n) => n + 1)
    setEdges((es) => [...es, { id, source: c.source!, target: c.target!, label: t('arch.flow.newFlow'), data: { label: t('arch.flow.newFlow') }, labelBgPadding: [6, 3] as [number, number], labelBgBorderRadius: 8, ...EDGE_STYLE }])
    setSel(id)
  }, [edges, counter, setEdges, t])

  const patchLabel = (label: string) => {
    if (!sel) return
    setEdges((es) => es.map((e) => (e.id === sel ? { ...e, label, data: { label } } : e)))
  }
  const delSel = () => {
    if (!sel) return
    setEdges((es) => es.filter((e) => e.id !== sel))
    setSel(null)
  }

  const selEdge = sel ? edges.find((e) => e.id === sel) : undefined
  const selLabel = selEdge ? String((selEdge.data as { label?: string })?.label ?? selEdge.label ?? '') : ''
  const nameOf = (id?: string) => (id ? (spec.pages.find((p) => p.id === id)?.name ?? id) : '')

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={(_, e) => setSel(e.id)}
        onPaneClick={() => setSel(null)}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--color-line)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="absolute top-3 left-3 bg-surface border border-line rounded-lg px-3 py-2 text-[12px] text-muted max-w-[220px]">{t('arch.flow.hint')}</div>

      {selEdge && (
        <div className="absolute bottom-3 left-3 w-64 bg-surface border border-line rounded-xl shadow-soft p-3">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('arch.flow.editFlow')}</div>
          <div className="text-[12px] text-content mb-2">{nameOf(selEdge.source)} → {nameOf(selEdge.target)}</div>
          <label className="block text-[11px] text-muted mb-1">{t('arch.flow.label')}</label>
          <input value={selLabel} onChange={(e) => patchLabel(e.target.value)} className="w-full text-[13px] rounded-lg border border-line bg-canvas px-2 py-1.5 mb-3 text-content" />
          <Button size="sm" variant="ghost" className="text-danger-strong w-full justify-center" onClick={delSel}><Trash2 size={14} />{t('arch.flow.delete')}</Button>
        </div>
      )}
    </div>
  )
}
