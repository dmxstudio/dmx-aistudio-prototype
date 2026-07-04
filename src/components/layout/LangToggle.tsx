import { useTranslation } from 'react-i18next'

const LANGS = ['es', 'en'] as const

// Compact ES/EN pill for the topbar (light surface, accent for the active language).
export function LangToggle() {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'es'

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-surface border border-line p-0.5 shrink-0">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => i18n.changeLanguage(l)}
          className={`h-7 px-2.5 rounded-full text-xs font-medium transition-colors ${
            current === l ? 'bg-accent text-accent-ink' : 'text-muted hover:text-content'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
