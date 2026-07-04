import { useEffect, useMemo, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Link } from 'react-router-dom'
import { Sparkles, X, Monitor, Smartphone, ExternalLink, BadgeCheck, Check, Send, Pencil, Eye, EyeOff, ArrowRight, AlertTriangle, CircleAlert, Bot, ShieldCheck, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { PageRender } from './PageRender'
import { auditClassA, editedPage, editedStyle, pageSig, pageStatus, parsePrompt, applyIntent, type VizPage, type PageEdit, type ChatMsg } from '../../lib/vizData'
import type { StyleSpec, AppliedStyle } from '../../lib/styleData'
import type { UsersSpec } from '../../lib/usersData'

// V5 — Cockpit del OWNER. Sala de refinamiento a pantalla completa: el portador del criterio termina el sitio
// con CONTROL TOTAL (chat + edición directa + costura de agente), avala página a página, y abre el sitio en el
// navegador para auditarlo. Sin muro. Honestidad intacta: lo determinista es real; el salto libre = agente.

type T = (k: string, o?: Record<string, unknown>) => string

export function RefineWorkbench({
  open, onClose, pages, baseApplied, styleSpec, users, brand, imagery, styleLink,
  pageEdits, setPageEdits, approvedPages, setApprovedPages, chat, setChat, sealReady, sealed, onSeal, t,
}: {
  open: boolean; onClose: () => void; pages: VizPage[]; baseApplied: AppliedStyle; styleSpec: StyleSpec; users: UsersSpec | null
  brand: string; imagery: string; styleLink: string
  pageEdits: Record<string, PageEdit>; setPageEdits: (v: Record<string, PageEdit>) => void
  approvedPages: Record<string, string>; setApprovedPages: (v: Record<string, string>) => void
  chat: ChatMsg[]; setChat: (v: ChatMsg[]) => void
  sealReady: boolean; sealed: boolean; onSeal: () => void; t: T
}) {
  const real = useMemo(() => pages.filter((p) => p.renderMode === 'real'), [pages])
  const [selId, setSelId] = useState('')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [prompt, setPrompt] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  // A11y como el Modal: overlay a pantalla completa cierra con Escape y bloquea el scroll del fondo.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  const page = real.find((p) => p.pageId === selId) ?? real[0]
  const edit = page ? pageEdits[page.pageId] : undefined
  const ep = page ? editedPage(page, edit) : undefined
  const es = editedStyle(baseApplied, edit)

  // Auditoría ASESORA (no gate): refleja las ediciones. Se muestra la de esta página + las globales.
  const findings = useMemo(() => {
    if (!page) return []
    const editedAll = real.map((p) => editedPage(p, pageEdits[p.pageId]))
    return auditClassA(editedAll, styleSpec, es, users).filter((f) => !f.scope.pageId || f.scope.pageId === page.pageId)
  }, [real, pageEdits, styleSpec, es, users, page])

  const approvedCount = real.filter((p) => pageStatus(p, pageEdits[p.pageId], approvedPages[p.pageId]) === 'approved').length
  const setEdit = (pid: string, e: PageEdit) => setPageEdits({ ...pageEdits, [pid]: e })
  const stamp = () => `m${Date.now()}` // Date.now permitido en runtime de la app (no en scripts de workflow)

  const send = () => {
    if (!prompt.trim() || !page) return
    const id = stamp()
    const owner: ChatMsg = { id, role: 'owner', text: prompt.trim(), kind: 'note' }
    const intent = parsePrompt(prompt, page.blocks)
    let studio: ChatMsg
    if (intent.kind === 'direction') {
      studio = { id: id + 'r', role: 'studio', kind: 'direction', text: t('viz.refine.directionReply') }
    } else if (intent.kind === 'agent') {
      studio = { id: id + 'r', role: 'studio', kind: 'agent', text: t('viz.refine.agentReply') }
    } else {
      const next = applyIntent(edit, intent, baseApplied)
      if (next) { setEdit(page.pageId, next); studio = { id: id + 'r', role: 'studio', kind: 'applied', text: t('viz.refine.applied', { what: t(`viz.refine.intent.${intent.kind}`) }) } }
      else studio = { id: id + 'r', role: 'studio', kind: 'agent', text: t('viz.refine.agentReply') }
    }
    setChat([...chat, owner, studio])
    setPrompt('')
  }

  const setCopy = (field: 'headline' | 'sub' | 'cta', value: string) => page && setEdit(page.pageId, { ...edit, copy: { ...edit?.copy, [field]: value } })
  const toggleBlock = (b: string) => {
    if (!page) return
    const hidden = edit?.hidden ?? []
    setEdit(page.pageId, { ...edit, hidden: hidden.includes(b) ? hidden.filter((x) => x !== b) : [...hidden, b] })
  }
  const resetPage = () => { if (page) { const next = { ...pageEdits }; delete next[page.pageId]; setPageEdits(next) } }
  const avalar = () => { if (page) setApprovedPages({ ...approvedPages, [page.pageId]: pageSig(page, edit) }) }

  const openInBrowser = () => {
    if (!ep) return
    // renderToStaticMarkup escapa el body, pero NO estos slots → escapar el título (HTML) y sanear los valores
    // CSS (un font-token malicioso o un nombre con </style><script> se inyectaría fuera del body).
    const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c))
    const css = (s: string) => s.replace(/[<>{};\\]/g, '')
    const body = renderToStaticMarkup(<PageRender style={es} page={ep} brand={brand} imagery={imagery} />)
    const doc = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(ep.name)} — ${esc(brand)}</title><style>*{box-sizing:border-box}body{margin:0;background:${css(es.bg)};font-family:${css(es.bodyFamily)}}</style></head><body>${body}</body></html>`
    const url = URL.createObjectURL(new Blob([doc], { type: 'text/html' }))
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  if (!open || !page || !ep) return null
  const st = pageStatus(page, edit, approvedPages[page.pageId])

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col animate-in fade-in duration-150" role="dialog" aria-modal="true">
      <header className="h-14 shrink-0 border-b border-line bg-surface px-4 flex items-center gap-3">
        <span className="text-accent-strong"><Sparkles size={18} /></span>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[14px] font-semibold text-content truncate">{t('viz.refine.title')}</span>
          <span className="text-[11px] text-faint">{t('viz.refine.sub')}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-muted inline-flex items-center gap-1.5"><BadgeCheck size={13} className={approvedCount === real.length ? 'text-success-strong' : 'text-faint'} />{t('viz.refine.rollup', { n: approvedCount, total: real.length })}</span>
          {sealed
            ? <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-success-soft text-success-strong rounded-full px-3 py-1.5"><BadgeCheck size={13} />{t('viz.signed')}</span>
            : <Button size="sm" variant="primary" onClick={onSeal} disabled={!sealReady} title={!sealReady ? t('viz.refine.sealBlocked') : undefined}><BadgeCheck size={14} />{t('viz.refine.seal')}</Button>}
          <Button size="sm" variant="ghost" onClick={onClose} aria-label={t('style.proof.close')} title={t('style.proof.close')}><X size={16} /></Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Preview (protagonista) */}
        <div className="flex-1 min-h-0 flex flex-col min-w-0">
          <div className="shrink-0 border-b border-line bg-surface px-4 py-2 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {real.map((p) => {
                const pst = pageStatus(p, pageEdits[p.pageId], approvedPages[p.pageId])
                return (
                  <button key={p.pageId} onClick={() => setSelId(p.pageId)} className={`text-[12px] rounded-full px-2.5 py-1 border inline-flex items-center gap-1 ${p.pageId === page.pageId ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>
                    {pst === 'approved' && <Check size={11} className="text-success-strong" />}{p.name}
                  </button>
                )
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="inline-flex border border-line rounded-lg overflow-hidden text-[12px]">
                <button onClick={() => setDevice('desktop')} className={`px-2.5 py-1 inline-flex items-center gap-1 ${device === 'desktop' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`}><Monitor size={13} />{t('viz.desktop')}</button>
                <button onClick={() => setDevice('mobile')} className={`px-2.5 py-1 inline-flex items-center gap-1 ${device === 'mobile' ? 'bg-accent-soft text-accent-strong' : 'text-muted'}`}><Smartphone size={13} />{t('viz.mobile')}</button>
              </div>
              <Button size="sm" variant="secondary" onClick={openInBrowser}><ExternalLink size={14} />{t('viz.refine.openBrowser')}</Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-6 bg-raised flex justify-center">
            <div style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: device === 'mobile' ? 375 : 1000, height: 'fit-content' }}>
              <PageRender style={es} page={ep} brand={brand} imagery={imagery} compact={device === 'mobile'} />
            </div>
          </div>
        </div>

        {/* Chat + edición directa + avalar */}
        <aside className="w-full lg:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-line bg-surface flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-auto p-4 flex flex-col gap-2.5">
            {chat.length === 0 && <p className="text-[13px] text-faint leading-relaxed">{t('viz.refine.empty')}</p>}
            {chat.map((m) => <ChatBubble key={m.id} m={m} t={t} styleLink={styleLink} />)}
          </div>

          <div className="shrink-0 border-t border-line p-3">
            <div className="flex items-end gap-2">
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={2} placeholder={t('viz.refine.placeholder')} className="flex-1 text-[13px] rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-content resize-none" />
              <Button size="sm" variant="primary" onClick={send} aria-label={t('viz.refine.send')} title={t('viz.refine.send')}><Send size={15} /></Button>
            </div>

            {/* Edición directa (control total, sin chat) */}
            <button onClick={() => setEditOpen(!editOpen)} className="mt-2 text-[12px] text-muted hover:text-content inline-flex items-center gap-1"><Pencil size={12} />{t('viz.refine.direct')}</button>
            {editOpen && (
              <div className="mt-2 rounded-xl border border-line bg-raised p-3 flex flex-col gap-2">
                {(['headline', 'sub', 'cta'] as const).map((f) => (
                  <label key={f} className="block">
                    <span className="text-[10px] uppercase tracking-wide text-faint">{t(`viz.refine.copy.${f}`)}</span>
                    <input value={ep.copy[f] ?? ''} onChange={(e) => setCopy(f, e.target.value)} className="w-full text-[12px] rounded-md border border-line bg-canvas px-2 py-1 text-content" />
                  </label>
                ))}
                <div>
                  <span className="text-[10px] uppercase tracking-wide text-faint">{t('viz.refine.blocks')}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {page.blocks.map((b) => {
                      const on = !(edit?.hidden ?? []).includes(b)
                      return <button key={b} onClick={() => toggleBlock(b)} className={`text-[11px] rounded-full px-2 py-0.5 border inline-flex items-center gap-1 ${on ? 'border-line text-content' : 'border-line text-faint line-through'}`}>{on ? <Eye size={10} /> : <EyeOff size={10} />}{b}</button>
                    })}
                  </div>
                </div>
                {edit && <button onClick={resetPage} className="text-[11px] text-faint hover:text-content inline-flex items-center gap-1 w-fit"><RotateCcw size={11} />{t('viz.refine.resetPage')}</button>}
              </div>
            )}
          </div>

          {/* Auditoría asesora + avalar página */}
          <div className="shrink-0 border-t border-line p-3">
            {findings.length > 0 && (
              <div className="mb-2 flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-faint inline-flex items-center gap-1"><ShieldCheck size={11} className="text-accent-strong" />{t('viz.refine.advisory')}</span>
                {findings.slice(0, 3).map((f) => (
                  <div key={f.id} className="text-[12px] inline-flex items-start gap-1.5 text-muted">{f.severity === 'red' ? <CircleAlert size={13} className="text-danger-strong shrink-0 mt-0.5" /> : <AlertTriangle size={13} className="text-warning-strong shrink-0 mt-0.5" />}{f.message}</div>
                ))}
              </div>
            )}
            {st === 'approved'
              ? <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-success-soft text-success-strong rounded-full px-3 py-1.5"><Check size={14} />{t('viz.refine.pageApproved')}</span><button onClick={() => { const n = { ...approvedPages }; delete n[page.pageId]; setApprovedPages(n) }} className="text-[12px] text-faint hover:text-content">{t('viz.refine.unapprove')}</button></div>
              : <Button size="sm" variant="primary" className="w-full justify-center" onClick={avalar}><BadgeCheck size={15} />{st === 'outdated' ? t('viz.refine.reavalar') : t('viz.refine.avalar')}</Button>}
          </div>
        </aside>
      </div>
    </div>
  )
}

function ChatBubble({ m, t, styleLink }: { m: ChatMsg; t: T; styleLink: string }) {
  if (m.role === 'owner') return <div className="self-end max-w-[85%] rounded-2xl rounded-br-sm bg-accent-soft text-accent-strong px-3 py-2 text-[13px]">{m.text}</div>
  const Icon = m.kind === 'applied' ? Check : m.kind === 'direction' ? Sparkles : Bot
  const tone = m.kind === 'applied' ? 'text-success-strong' : m.kind === 'direction' ? 'text-accent-strong' : 'text-muted'
  return (
    <div className="self-start max-w-[90%] rounded-2xl rounded-bl-sm border border-line bg-raised px-3 py-2 text-[13px] text-content">
      <span className={`inline-flex items-start gap-1.5 ${tone}`}><Icon size={14} className="shrink-0 mt-0.5" /><span className="text-content">{m.text}</span></span>
      {m.kind === 'direction' && <Link to={styleLink} className="mt-1.5 text-[12px] text-accent-strong hover:underline inline-flex items-center gap-1"><ArrowRight size={12} />{t('viz.refine.toStyle')}</Link>}
    </div>
  )
}
