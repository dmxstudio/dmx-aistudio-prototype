import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../lib/theme'

// Compact icon button for the topbar (matches the notifications bell).
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-10 h-10 rounded-full bg-surface border border-line flex items-center justify-center text-muted hover:text-content shrink-0"
    >
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
