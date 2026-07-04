import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

// Info "i" with a hover/focus tooltip. The tooltip is portaled to <body> with fixed positioning
// so an ancestor's overflow-y-auto (modal scroll) never clips it. Shared by the field editors
// (per-option explanations) and the Design System knobs.
export function InfoTip({ text }: { text: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const show = () => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const half = 120 // half tooltip width (w-56 = 224px) + margin, to keep it on-screen near edges
    const x = Math.min(window.innerWidth - half, Math.max(half, r.left + r.width / 2))
    setPos({ x, y: r.top })
  }
  const hide = () => setPos(null)
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={text}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="text-faint hover:text-accent-strong focus:text-accent-strong outline-none cursor-help"
      >
        <Info size={13} />
      </button>
      {pos &&
        createPortal(
          <span
            role="tooltip"
            style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}
            className="pointer-events-none fixed z-[60] w-56 rounded-lg px-2.5 py-1.5 text-[11px] leading-snug text-center bg-[var(--color-content)] text-[var(--color-surface)] shadow-soft"
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  )
}
