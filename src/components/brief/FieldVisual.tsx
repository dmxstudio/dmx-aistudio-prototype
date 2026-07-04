import type { BriefField } from '../../data/brief'
import { IconProviderStrip } from './IconProviderStrip'
import { getEditor } from '../../data/fieldEditors'

// Inline visual aid for field rows (Branding): logo preview, color chips, palette swatches,
// live font specimens, photo thumbnails. Returns null for fields with no visual meaning.
// ponytail: id-keyed switch — one place to extend when new visual field kinds appear.

const loadedFonts = new Set<string>()
// util compartido co-ubicado a propósito con el componente (loader de fuentes de Google); no rompe nada en prod.
// eslint-disable-next-line react-refresh/only-export-components
export function loadGoogleFont(family: string) {
  const fam = family.trim()
  if (!fam || loadedFonts.has(fam)) return
  loadedFonts.add(fam)
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, '+')}:wght@400;500;700&display=swap`
  document.head.appendChild(l)
}

const HEX_RE = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i

function ColorDot({ hex, size = 18 }: { hex: string; size?: number }) {
  return (
    <span
      className="inline-block rounded-full border border-line shrink-0 align-middle"
      style={{ width: size, height: size, background: hex }}
      title={hex}
    />
  )
}

export function FieldVisual({ field }: { field: BriefField }) {
  const v = field.value ?? ''
  const rows = (field as { rows?: Record<string, string>[] }).rows

  // Logo mark: render the stored SVG at chip size.
  if (field.id === 'logo-svg' && v.startsWith('<svg'))
    return (
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-raised border border-line shrink-0 [&>svg]:w-7 [&>svg]:h-7"
        dangerouslySetInnerHTML={{ __html: v }}
      />
    )

  // Named palette + semantic colors + brand palette: one swatch per row (any row with a hex column).
  if (['cd-palette', 'cd-semantic', 'cd-primary'].includes(field.id) && rows?.length)
    return (
      <span className="inline-flex items-center gap-1 shrink-0">
        {rows.map((r, i) => (r.hex && HEX_RE.test(r.hex) ? <ColorDot key={i} hex={r.hex.match(HEX_RE)![0]} /> : null))}
      </span>
    )

  // Single color values (brand hex, dark accent…): chip from the first #hex found.
  if (['cd-brand-hex', 'dm-accent'].includes(field.id) && HEX_RE.test(v)) return <ColorDot hex={v.match(HEX_RE)![0]} />

  // Free text that carries hexes (e.g. cd-primary "Tostado #8B5E3C · crema #F5F0E8"): chip them all.
  if (field.id === 'cd-primary') {
    const hexes = v.match(new RegExp(HEX_RE.source, 'gi')) ?? []
    if (hexes.length)
      return (
        <span className="inline-flex items-center gap-1 shrink-0">
          {hexes.map((h, i) => (
            <ColorDot key={i} hex={h} />
          ))}
        </span>
      )
  }

  // Complementary fonts: one live specimen per row family.
  if (field.id === 'font-extra' && rows?.length) {
    rows.slice(0, 3).forEach((r) => r.family && loadGoogleFont(r.family))
    return (
      <span className="inline-flex items-center gap-1 shrink-0">
        {rows.slice(0, 3).map((r, i) =>
          r.family ? (
            <span
              key={i}
              className="inline-flex items-center justify-center h-9 px-2 rounded-lg bg-raised border border-line text-[17px] leading-none text-content"
              style={{ fontFamily: `'${r.family}', sans-serif` }}
              title={`${r.title ?? ''} · ${r.family}`.trim()}
            >
              Ag
            </span>
          ) : null,
        )}
      </span>
    )
  }

  // Font fields: live specimen in the actual family (loaded on demand from Google Fonts).
  if (['font-display', 'font-text', 'font-mono'].includes(field.id) && v) {
    loadGoogleFont(v)
    return (
      <span
        className="inline-flex items-center justify-center h-9 px-2 rounded-lg bg-raised border border-line text-[17px] leading-none text-content shrink-0"
        style={{ fontFamily: `'${v}', sans-serif` }}
        title={v}
      >
        Ag
      </span>
    )
  }

  // Dark-mode readiness: light/dark "Aa" pair; the dark chip reflects the declared state
  // (solid = covered, faded = partial, crossed = light-only). Self-contained — no brand hex needed.
  // Custom "Otro" text renders NO visual: an unrecognized declaration must not signal support.
  if (field.id === 'cd-dark' && v) {
    const state = /^Completo|^Automático/i.test(v) ? 'full' : /^Parcial/i.test(v) ? 'partial' : /^No aplica/i.test(v) ? 'none' : null
    if (!state) return null
    return (
      <span className="inline-flex items-center gap-1 shrink-0" title={v}>
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-line bg-white text-[13px] leading-none text-[#0E1116]">
          Aa
        </span>
        <span className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-line bg-[#0E1116] text-[13px] leading-none text-white overflow-hidden">
          <span className={state === 'partial' ? 'opacity-40' : state === 'none' ? 'opacity-25' : ''}>Aa</span>
          {state === 'none' && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-10 h-px bg-white/60 rotate-45" />
            </span>
          )}
        </span>
      </span>
    )
  }

  // Icon provider: live sample strip (home · search · heart · settings · bell) from the chosen set.
  if (field.id === 'ico-provider' && v) return <IconProviderStrip provider={v} />

  // Logo file uploads (§3.2 formatos): PNG previews; EPS/PDF get a document chip with the extension.
  if (['logo-file-eps', 'logo-file-pdf'].includes(field.id) && v)
    return (
      <span className="inline-flex items-center justify-center h-9 px-2 rounded-lg bg-raised border border-line text-[10px] font-medium tracking-wide text-muted shrink-0">
        {field.id.endsWith('eps') ? 'EPS' : 'PDF'}
      </span>
    )

  // Sonic clips: audio chip (the value is a data-URL, not previewable as image).
  if (field.id.startsWith('sonic-clip') && v)
    return (
      <span className="inline-flex items-center justify-center h-9 px-2 rounded-lg bg-raised border border-line text-[10px] font-medium tracking-wide text-muted shrink-0">
        ♪ AUDIO
      </span>
    )

  // Any image-editor field: thumbnail (data-URL or asset path). Logos render contained on a
  // raised chip; photographic/asset uploads render covered.
  const ed = getEditor(field.id)
  if (ed.type === 'image' && (ed.accept === undefined || ed.accept.startsWith('image')) && v && !v.startsWith('<svg'))
    return (
      <img
        src={v}
        alt=""
        className={`w-9 h-9 rounded-lg border border-line shrink-0 ${field.id.startsWith('logo-') ? 'object-contain bg-raised p-1' : 'object-cover'}`}
      />
    )

  return null
}
