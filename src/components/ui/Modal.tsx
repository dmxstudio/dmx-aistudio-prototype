import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${
          size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-md'
        } max-h-[calc(100vh-2rem)] flex flex-col bg-surface border border-line rounded-2xl shadow-soft`}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
          <h2 className="font-display text-base font-bold text-content">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:bg-raised hover:text-content"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5 flex-1 min-h-0 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-line flex justify-end gap-2 shrink-0">{footer}</div>
        )}
      </div>
    </div>
  )
}
