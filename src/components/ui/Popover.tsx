import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Popover({
  button,
  children,
  menuClassName = '',
  align = 'start',
}: {
  button: ReactNode
  children: (close: () => void) => ReactNode
  menuClassName?: string
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full block">
        {button}
      </button>
      {open && (
        <div className={`absolute z-40 mt-1.5 ${align === 'end' ? 'right-0' : 'left-0'} ${menuClassName}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
