import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Check } from 'lucide-react'
import { FONT_CATALOG, type FontCat } from '../../data/fontCatalog'
import { loadGoogleFont } from './FieldVisual'

const CATS: Array<{ key: FontCat | 'all'; label: string }> = [
  { key: 'all', label: '' }, // label resolved via i18n (brief.fontAll)
  { key: 'sans', label: 'Sans' },
  { key: 'serif', label: 'Serif' },
  { key: 'display', label: 'Display' },
  { key: 'mono', label: 'Mono' },
  { key: 'script', label: 'Script' },
]

const VISIBLE_CAP = 14 // fonts shown (and therefore webfonts loaded) at once

// Google Fonts picker: curated catalog + search + live specimens; free text falls through as a
// custom family ("Otro") that is live-loaded the same way. Value is just the family name string.
export function FontPicker({ value, onPick, autoFocus = true }: { value: string; onPick: (family: string) => void; autoFocus?: boolean }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<FontCat | 'all'>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FONT_CATALOG.filter((f) => (cat === 'all' || f.cat === cat) && (!q || f.name.toLowerCase().includes(q)))
  }, [query, cat])

  const visible = filtered.slice(0, VISIBLE_CAP)
  const hidden = filtered.length - visible.length
  const exactMatch = FONT_CATALOG.some((f) => f.name.toLowerCase() === query.trim().toLowerCase())
  const custom = query.trim() && !exactMatch ? query.trim() : ''

  if (value) loadGoogleFont(value)

  return (
    <div className="space-y-3">
      {/* Current selection specimen */}
      <div className="rounded-xl border border-line bg-raised px-4 py-3">
        <p className="text-[11px] text-faint mb-1">{value || '—'}</p>
        <p className="text-[26px] leading-snug text-content" style={value ? { fontFamily: `'${value}', sans-serif` } : undefined}>
          Ag 123 — {t('brief.fontSpecimen')}
        </p>
      </div>

      {/* Search + categories */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          placeholder={t('brief.fontSearch')}
          className="w-full h-9 rounded-full bg-raised border border-line pl-8 pr-3 text-[13px] text-content placeholder:text-faint outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`h-7 px-2.5 rounded-full text-[12px] border transition-colors ${
              cat === c.key ? 'bg-accent text-accent-ink border-accent' : 'bg-surface text-muted border-line hover:text-content'
            }`}
          >
            {c.key === 'all' ? t('brief.fontAll') : c.label}
          </button>
        ))}
      </div>

      {/* Family list — each row rendered in its own webfont (loaded on demand, capped) */}
      <div className="rounded-xl border border-line divide-y divide-line max-h-64 overflow-y-auto">
        {visible.map((f) => {
          loadGoogleFont(f.name)
          const on = value === f.name
          return (
            <button
              key={f.name}
              onClick={() => onPick(f.name)}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors ${
                on ? 'bg-accent-soft' : 'hover:bg-raised'
              }`}
            >
              <span className={`text-[17px] leading-snug ${on ? 'text-accent-strong' : 'text-content'}`} style={{ fontFamily: `'${f.name}', sans-serif` }}>
                {f.name}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] uppercase tracking-wide text-faint">{f.cat}</span>
                {on && <Check size={14} className="text-accent-strong" />}
              </span>
            </button>
          )
        })}
        {custom && (
          <button onClick={() => onPick(custom)} className="w-full px-3.5 py-2 text-left text-[13px] text-accent-strong hover:bg-raised">
            {t('brief.fontUse', { name: custom })}
          </button>
        )}
        {visible.length === 0 && !custom && <p className="px-3.5 py-3 text-[12px] text-faint">{t('brief.fontNone')}</p>}
      </div>
      {hidden > 0 && <p className="text-[11px] text-faint">{t('brief.fontMore', { n: hidden })}</p>}
    </div>
  )
}
