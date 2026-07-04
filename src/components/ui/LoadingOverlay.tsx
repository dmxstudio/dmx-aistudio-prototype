import { Check, X } from 'lucide-react'
import { Spinner } from './Spinner'

// iOS-style overlay: dimmed backdrop + centered dark rounded box with a spinner (or success/error
// icon) and optional text. `fullscreen` covers the viewport; otherwise it fills the nearest
// positioned (relative) parent. Not wired anywhere yet — a reusable primitive for later.
export function LoadingOverlay({
  open,
  text,
  status = 'loading',
  fullscreen = true,
  className = '',
}: {
  open: boolean
  text?: string
  status?: 'loading' | 'success' | 'error'
  fullscreen?: boolean
  className?: string
}) {
  if (!open) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${fullscreen ? 'fixed' : 'absolute'} inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-black/80 text-white p-4 w-[136px] min-h-[136px] shadow-soft">
        {status === 'loading' && <Spinner size={30} />}
        {status === 'success' && <Check size={34} strokeWidth={2.5} />}
        {status === 'error' && <X size={34} strokeWidth={2.5} />}
        {text && <p className="text-[13px] font-medium text-center leading-snug">{text}</p>}
      </div>
    </div>
  )
}
