import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Map as MapIcon, Workflow, PanelsTopLeft, Check, RotateCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { SiteMapCanvas } from './SiteMapCanvas'
import { FlowCanvas } from './FlowCanvas'
import { WireframeCanvas } from './WireframeCanvas'
import type { ArchSpec, ArchBlock, ArchStatus } from '../../lib/archData'
import type { CovTargets } from '../../lib/usersData'

// "Modo editor": overlay NATIVO a pantalla completa (NO iframe) que hospeda el canvas de cada bloque.
// Renderiza en el mismo árbol React → lee/escribe el mismo spec, hereda tokens/tema/i18n del admin.
export type { ArchBlock }

const META: Record<ArchBlock, { icon: typeof MapIcon; key: string }> = {
  sitemap: { icon: MapIcon, key: 'sitemap' },
  flow: { icon: Workflow, key: 'flow' },
  wireframe: { icon: PanelsTopLeft, key: 'wireframe' },
}

export function ArchEditorOverlay({ block, spec, onChange, onClose, status, onApprove, covTargets }: { block: ArchBlock | null; spec: ArchSpec; onChange: (s: ArchSpec) => void; onClose: () => void; status?: ArchStatus; onApprove?: () => void; covTargets?: CovTargets }) {
  const { t } = useTranslation()
  // Esc cierra el modo editor.
  useEffect(() => {
    if (!block) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [block, onClose])

  if (!block) return null
  const Icon = META[block].icon

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col animate-in fade-in duration-150">
      {/* Toolbar persistente */}
      <header className="h-14 shrink-0 border-b border-line bg-surface px-4 flex items-center gap-3">
        <span className="text-accent-strong"><Icon size={18} /></span>
        <div className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold text-content">{t(`arch.block.${META[block].key}`)}</span>
          <span className="text-[11px] text-faint">{t('arch.editor.mode')} · {spec.meta.project}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {status === 'approved' ? (
            <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-success-soft text-success-strong rounded-full px-3 py-1.5"><Check size={14} />{t('arch.editor.approved')}</span>
          ) : status === 'outdated' ? (
            <Button size="sm" variant="primary" onClick={onApprove}><RotateCw size={14} />{t('arch.editor.reapprove')}</Button>
          ) : (
            <Button size="sm" variant="primary" onClick={onApprove}><Check size={14} />{t('arch.editor.approve')}</Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose} aria-label={t('arch.editor.close')} title={t('arch.editor.close')}><X size={16} /></Button>
        </div>
      </header>

      {/* Canvas por bloque (F2-F3 montan flow/wireframe) */}
      <div className="flex-1 min-h-0 relative">
        {block === 'sitemap' ? (
          <SiteMapCanvas spec={spec} onChange={onChange} covTargets={covTargets} />
        ) : block === 'flow' ? (
          <FlowCanvas spec={spec} onChange={onChange} />
        ) : block === 'wireframe' ? (
          <WireframeCanvas spec={spec} onChange={onChange} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-sm px-6">
              <div className="w-12 h-12 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3"><Icon size={24} className="text-accent-strong" /></div>
              <p className="text-[15px] font-medium text-content">{t('arch.editor.canvasSoon')}</p>
              <p className="text-[13px] text-muted mt-1 leading-snug">{t('arch.editor.canvasSoonDesc')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
