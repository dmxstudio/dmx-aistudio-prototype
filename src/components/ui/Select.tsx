import { type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  // pill: compact rounded-full variant (e.g. the Brief "Vista" selector in a hero).
  // default: full-width form field matching the text inputs.
  pill?: boolean
}

// Native <select> with the browser arrow removed and a custom chevron that keeps
// breathing room from the right edge (the native arrow sits flush against it).
export function Select({ pill = false, className = '', children, ...rest }: Props) {
  const shape = pill ? 'h-8 rounded-full text-[13px] pl-3 pr-8' : 'h-10 w-full rounded-xl text-sm pl-3 pr-9'
  return (
    <div className={pill ? 'relative inline-flex' : 'relative block w-full'}>
      <select
        className={`appearance-none bg-raised border border-line text-content outline-none focus:border-accent cursor-pointer disabled:opacity-50 ${shape} ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={pill ? 14 : 16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint"
      />
    </div>
  )
}
