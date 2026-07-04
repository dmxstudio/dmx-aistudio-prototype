import { useEffect, useMemo, useState, useCallback } from 'react'
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, addEdge, type Node, type Edge, type Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { PageNode, type PData } from './PageNode'
import type { ArchSpec, ArchPage } from '../../lib/archData'
import type { CovTargets } from '../../lib/usersData'

const nodeTypes = { page: PageNode }

// F1 — Canvas del Site Map (React Flow, nativo dentro del overlay). Nodos = páginas, aristas =
// relación padre/hijo del árbol. Edita: mover, añadir, renombrar, reconectar (un solo padre),
// borrar. Sincroniza al spec cuando termina el gesto (guarda posiciones al soltar).

// Layout en capas por profundidad del árbol (solo para páginas sin posición guardada).
function layout(pages: ArchPage[]): Record<string, { x: number; y: number }> {
  const depthOf = (p: ArchPage) => {
    let d = 0, cur: ArchPage | undefined = p, guard = 0
    while (cur?.parentId && guard++ < 20) { cur = pages.find((x) => x.id === cur!.parentId); d++ }
    return d
  }
  const rows: Record<number, string[]> = {}
  pages.forEach((p) => { const d = depthOf(p); (rows[d] ||= []).push(p.id) })
  const pos: Record<string, { x: number; y: number }> = {}
  pages.forEach((p) => { if (p.pos) pos[p.id] = p.pos })
  Object.entries(rows).forEach(([d, ids]) => ids.forEach((id, i) => { if (!pos[id]) pos[id] = { x: i * 190 + 60, y: Number(d) * 130 + 40 } }))
  return pos
}

export function SiteMapCanvas({ spec, onChange, covTargets }: { spec: ArchSpec; onChange: (s: ArchSpec) => void; covTargets?: CovTargets }) {
  const { t } = useTranslation()
  // Semilla única desde el spec al montar (los cambios se escriben de vuelta, no se re-leen).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const seed = useMemo(() => layout(spec.pages), [])
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    spec.pages.map((p) => ({ id: p.id, type: 'page', position: seed[p.id], data: { page: p } })),
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    spec.pages.filter((p) => p.parentId).map((p) => ({ id: `e-${p.parentId}-${p.id}`, source: p.parentId!, target: p.id })),
  )
  const [sel, setSel] = useState<string | null>(null)
  // Siembra el contador desde los ids pg-N ya existentes → no colisiona al reabrir el editor.
  const [counter, setCounter] = useState(() => {
    let max = 0
    spec.pages.forEach((p) => { const m = /^pg-(\d+)$/.exec(p.id); if (m) max = Math.max(max, +m[1]) })
    return max + 1
  })

  // Reconstruye el spec desde el grafo y lo persiste (padre = arista entrante). Poda flujos que
  // apunten a páginas ya inexistentes (evita referencias colgantes al borrar).
  useEffect(() => {
    if (nodes.some((n) => n.dragging)) return // espera a soltar
    const parentOf: Record<string, string | undefined> = {}
    edges.forEach((e) => { parentOf[e.target] = e.source })
    const pages: ArchPage[] = nodes.map((n) => ({ ...(n.data as PData).page, parentId: parentOf[n.id], pos: { x: Math.round(n.position.x), y: Math.round(n.position.y) } }))
    const ids = new Set(pages.map((p) => p.id))
    const flows = spec.flows.filter((f) => ids.has(f.from) && ids.has(f.to))
    onChange({ ...spec, pages, flows })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges])

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return // sin auto-loop
    // Rechaza si crearía un ciclo (el destino ya es ancestro del origen).
    const parentOf: Record<string, string | undefined> = {}
    edges.forEach((e) => { parentOf[e.target] = e.source })
    let cur: string | undefined = c.source, guard = 0
    while (cur && guard++ < 50) { if (cur === c.target) return; cur = parentOf[cur] }
    setEdges((es) => addEdge({ ...c, id: `e-${c.source}-${c.target}` }, es.filter((e) => e.target !== c.target))) // un solo padre
  }, [edges, setEdges])

  const addPage = () => {
    const id = `pg-${counter}`
    setCounter((n) => n + 1)
    const parent = sel ? nodes.find((n) => n.id === sel) : null
    const page: ArchPage = { id, name: t('arch.sitemap.newPage'), path: '/nueva', purpose: '', copy: { headline: t('arch.sitemap.newPage'), sub: '' } }
    setNodes((ns) => [...ns, { id, type: 'page', position: { x: (parent?.position.x ?? 60) + 40, y: (parent?.position.y ?? 40) + 130 }, data: { page } }])
    if (sel) setEdges((es) => addEdge({ id: `e-${sel}-${id}`, source: sel, target: id }, es))
    setSel(id)
  }

  const patchSel = (patch: Partial<ArchPage>) => {
    if (!sel) return
    setNodes((ns) => ns.map((n) => (n.id === sel ? { ...n, data: { page: { ...(n.data as PData).page, ...patch } } } : n)))
  }
  const delSel = () => {
    if (!sel) return
    setNodes((ns) => ns.filter((n) => n.id !== sel))
    setEdges((es) => es.filter((e) => e.source !== sel && e.target !== sel))
    setSel(null)
  }

  const selPage = sel ? (nodes.find((n) => n.id === sel)?.data as PData | undefined)?.page : undefined

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => setSel(n.id)}
        onPaneClick={() => setSel(null)}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--color-line)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Barra de acciones */}
      <div className="absolute top-3 left-3 flex gap-2">
        <Button size="sm" variant="primary" onClick={addPage}><Plus size={14} />{t('arch.sitemap.addPage')}</Button>
      </div>

      {/* Panel de la página seleccionada */}
      {selPage && (
        <div className="absolute bottom-3 left-3 w-64 bg-surface border border-line rounded-xl shadow-soft p-3">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{t('arch.sitemap.editPage')}</div>
          <label className="block text-[11px] text-muted mb-1">{t('arch.sitemap.name')}</label>
          <input value={selPage.name} onChange={(e) => patchSel({ name: e.target.value })} className="w-full text-[13px] rounded-lg border border-line bg-canvas px-2 py-1.5 mb-2 text-content" />
          <label className="block text-[11px] text-muted mb-1">{t('arch.sitemap.path')}</label>
          <input value={selPage.path} onChange={(e) => patchSel({ path: e.target.value })} className="w-full text-[13px] rounded-lg border border-line bg-canvas px-2 py-1.5 mb-3 text-content font-mono" />
          {covTargets && (covTargets.goals.length > 0 || covTargets.pains.length > 0) && (
            <div className="mb-3 pt-2 border-t border-line max-h-44 overflow-y-auto">
              <div className="text-[10px] font-medium text-muted uppercase tracking-wide mb-1.5">{t('arch.coverage')}</div>
              {covTargets.goals.length > 0 && <>
                <div className="text-[10px] text-faint mb-1">{t('arch.addresses')}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {covTargets.goals.map((g) => {
                    const on = (selPage.addresses ?? []).includes(g.key)
                    return <button key={g.key} title={g.label} onClick={() => patchSel({ addresses: on ? (selPage.addresses ?? []).filter((x) => x !== g.key) : [...(selPage.addresses ?? []), g.key] })} className={`text-[10px] rounded-full px-2 py-0.5 border max-w-full truncate ${on ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{g.label}</button>
                  })}
                </div>
              </>}
              {covTargets.pains.length > 0 && <>
                <div className="text-[10px] text-faint mb-1">{t('arch.resolvesPains')}</div>
                <div className="flex flex-wrap gap-1">
                  {covTargets.pains.map((p) => {
                    const on = (selPage.resolves ?? []).includes(p.key)
                    return <button key={p.key} title={p.label} onClick={() => patchSel({ resolves: on ? (selPage.resolves ?? []).filter((x) => x !== p.key) : [...(selPage.resolves ?? []), p.key] })} className={`text-[10px] rounded-full px-2 py-0.5 border max-w-full truncate ${on ? 'border-danger-strong bg-danger-soft text-danger-strong' : 'border-line text-muted hover:bg-raised'}`}>{p.label}</button>
                  })}
                </div>
              </>}
            </div>
          )}
          <Button size="sm" variant="ghost" className="text-danger-strong w-full justify-center" onClick={delSel}><Trash2 size={14} />{t('arch.sitemap.delete')}</Button>
        </div>
      )}
    </div>
  )
}
