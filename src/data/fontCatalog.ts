// Curated Google Fonts catalog for the font picker (no API key: the full Fonts API needs one, and
// a frontend-only mockup shouldn't). ~65 popular families across categories; "Otro" in the picker
// accepts any Google Fonts family name and live-loads it the same way.
export type FontCat = 'sans' | 'serif' | 'display' | 'mono' | 'script'

export interface FontEntry {
  name: string
  cat: FontCat
}

export const FONT_CATALOG: FontEntry[] = [
  // Sans
  { name: 'Inter', cat: 'sans' },
  { name: 'Roboto', cat: 'sans' },
  { name: 'Open Sans', cat: 'sans' },
  { name: 'Lato', cat: 'sans' },
  { name: 'Montserrat', cat: 'sans' },
  { name: 'Poppins', cat: 'sans' },
  { name: 'Work Sans', cat: 'sans' },
  { name: 'Nunito', cat: 'sans' },
  { name: 'Rubik', cat: 'sans' },
  { name: 'Manrope', cat: 'sans' },
  { name: 'DM Sans', cat: 'sans' },
  { name: 'Mulish', cat: 'sans' },
  { name: 'Barlow', cat: 'sans' },
  { name: 'Karla', cat: 'sans' },
  { name: 'Outfit', cat: 'sans' },
  { name: 'Plus Jakarta Sans', cat: 'sans' },
  { name: 'Figtree', cat: 'sans' },
  { name: 'Sora', cat: 'sans' },
  { name: 'Urbanist', cat: 'sans' },
  { name: 'IBM Plex Sans', cat: 'sans' },
  { name: 'Source Sans 3', cat: 'sans' },
  { name: 'Noto Sans', cat: 'sans' },
  { name: 'Raleway', cat: 'sans' },
  { name: 'Jost', cat: 'sans' },
  { name: 'Lexend', cat: 'sans' },
  { name: 'Archivo', cat: 'sans' },
  { name: 'Chivo', cat: 'sans' },
  // Serif
  { name: 'Playfair Display', cat: 'serif' },
  { name: 'Merriweather', cat: 'serif' },
  { name: 'Lora', cat: 'serif' },
  { name: 'Libre Baskerville', cat: 'serif' },
  { name: 'Cormorant Garamond', cat: 'serif' },
  { name: 'EB Garamond', cat: 'serif' },
  { name: 'Crimson Pro', cat: 'serif' },
  { name: 'Source Serif 4', cat: 'serif' },
  { name: 'Fraunces', cat: 'serif' },
  { name: 'Spectral', cat: 'serif' },
  { name: 'Bitter', cat: 'serif' },
  { name: 'Zilla Slab', cat: 'serif' },
  { name: 'Newsreader', cat: 'serif' },
  { name: 'Literata', cat: 'serif' },
  // Display
  { name: 'Space Grotesk', cat: 'display' },
  { name: 'Bebas Neue', cat: 'display' },
  { name: 'Archivo Black', cat: 'display' },
  { name: 'Abril Fatface', cat: 'display' },
  { name: 'Anton', cat: 'display' },
  { name: 'Oswald', cat: 'display' },
  { name: 'Righteous', cat: 'display' },
  { name: 'Alfa Slab One', cat: 'display' },
  { name: 'Bricolage Grotesque', cat: 'display' },
  { name: 'Unbounded', cat: 'display' },
  { name: 'Syne', cat: 'display' },
  { name: 'DM Serif Display', cat: 'display' },
  // Mono
  { name: 'IBM Plex Mono', cat: 'mono' },
  { name: 'Space Mono', cat: 'mono' },
  { name: 'JetBrains Mono', cat: 'mono' },
  { name: 'Fira Code', cat: 'mono' },
  { name: 'Source Code Pro', cat: 'mono' },
  { name: 'Roboto Mono', cat: 'mono' },
  { name: 'DM Mono', cat: 'mono' },
  { name: 'Inconsolata', cat: 'mono' },
  { name: 'Courier Prime', cat: 'mono' },
  // Script
  { name: 'Caveat', cat: 'script' },
  { name: 'Pacifico', cat: 'script' },
  { name: 'Dancing Script', cat: 'script' },
  { name: 'Satisfy', cat: 'script' },
  { name: 'Great Vibes', cat: 'script' },
  { name: 'Shadows Into Light', cat: 'script' },
]
