import { Home, Search, Heart, Settings, Bell } from 'lucide-react'
import { HEROICON_PATHS } from './heroiconPaths'

// Sample strip (home · search · heart · settings · bell) for the selected icon provider.
// Tabler / Bootstrap / Remix render via their CDN webfont (inherit currentColor, injected once);
// Lucide is already a local dependency; Heroicons has no webfont → official paths inlined.
export const ICON_PROVIDERS = ['Tabler', 'Lucide', 'Heroicons', 'Bootstrap Icons', 'Remix Icon'] as const

const WEBFONTS: Record<string, { href: string; classes: string[] }> = {
  Tabler: {
    href: 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.24.0/dist/tabler-icons.min.css',
    classes: ['ti ti-home', 'ti ti-search', 'ti ti-heart', 'ti ti-settings', 'ti ti-bell'],
  },
  'Bootstrap Icons': {
    href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    classes: ['bi bi-house', 'bi bi-search', 'bi bi-heart', 'bi bi-gear', 'bi bi-bell'],
  },
  'Remix Icon': {
    href: 'https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css',
    classes: ['ri-home-line', 'ri-search-line', 'ri-heart-line', 'ri-settings-3-line', 'ri-notification-3-line'],
  },
}

const loadedCss = new Set<string>()
function loadCss(href: string) {
  if (loadedCss.has(href)) return
  loadedCss.add(href)
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = href
  document.head.appendChild(l)
}

const LUCIDE = [Home, Search, Heart, Settings, Bell]

export function IconProviderStrip({ provider, size = 17 }: { provider: string; size?: number }) {
  const wf = WEBFONTS[provider]
  if (wf) loadCss(wf.href)

  return (
    <span className="inline-flex items-center gap-2 px-2 h-9 rounded-lg bg-raised border border-line text-content shrink-0" title={provider}>
      {wf ? (
        wf.classes.map((c) => <i key={c} className={c} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true" />)
      ) : provider === 'Lucide' ? (
        LUCIDE.map((Icon, i) => <Icon key={i} size={size} strokeWidth={1.75} />)
      ) : provider === 'Heroicons' ? (
        HEROICON_PATHS.map((paths, i) => (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {paths.map((d, j) => (
              <path key={j} d={d} />
            ))}
          </svg>
        ))
      ) : null}
    </span>
  )
}
