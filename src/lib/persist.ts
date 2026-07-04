// localStorage-backed durability for the mock data layer. All keys are namespaced under "dmx:".
// Bump SEED_VERSION whenever a seed's shape changes so stale persisted data is invalidated on load.
const NS = 'dmx:'
const SEED_VERSION = '2'

// One-time invalidation: if the stored seed version differs, wipe our namespace and re-stamp it.
// The book feed (dmxbook:*) and theme/lang keys use other prefixes and are left untouched.
try {
  if (localStorage.getItem(NS + 'v') !== SEED_VERSION) {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => localStorage.removeItem(k))
    localStorage.setItem(NS + 'v', SEED_VERSION)
  }
} catch {
  // localStorage unavailable (private mode / SSR) — persistence degrades to in-memory only.
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value))
  } catch {
    // best-effort: ignore quota / availability errors in the mockup
  }
}
