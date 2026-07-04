import { useEffect, useState } from 'react'
import { readJSON, writeJSON } from './persist'

// Per-project / per-workspace panel state. In production this is the backend; here it's an
// in-memory map, mirrored to localStorage for *durable* kinds so edits survive a reload.
// Durability is opt-in per kind: Branding + brand* stay volatile while that section is in flux
// (we'll add them to DURABLE once Branding/book is finished — "cargar a redundancia").
const DURABLE = new Set([
  'brief', 'briefCatalogs', 'connections', 'defaultEngine', 'phaseEngines', 'translationEngine', 'styleLibrary',
  // Specs del pipeline (fases ya construidas): durables para que una demo no pierda el avance en un reload.
  // Son snapshots derivados y auto-consistentes. Branding + brand* siguen VOLÁTILES a propósito (resetean a su
  // seed) hasta cerrar Branding/book — ver memoria redundancia-persistence-layer.
  'archSpec', 'archSource', 'archApproved',
  'usersSpec', 'usersSource', 'usersApproved',
  'dsGenerated', 'dsApproved', 'dsSource', 'dsKnobs',
  'styleSpec', 'styleSource', 'styleApproved',
  'vizSpec', 'vizSource', 'vizApproved', 'vizBuilds', 'vizCmsMode', 'vizPageEdits', 'vizPageApproved', 'vizChat',
  'cmsSpec', 'cmsSource', 'cmsApproved',
])

// ── Sections (lists keyed by project/workspace id) ───────────────────────────
const stores: Record<string, Map<string, unknown>> = {}

function bucket(kind: string): Map<string, unknown> {
  let m = stores[kind]
  if (!m) {
    m = DURABLE.has(kind)
      ? new Map(Object.entries(readJSON<Record<string, unknown>>('sect:' + kind, {})))
      : new Map<string, unknown>()
    stores[kind] = m
  }
  return m
}

function flushSections(kind: string, m: Map<string, unknown>) {
  if (DURABLE.has(kind)) writeJSON('sect:' + kind, Object.fromEntries(m))
}

export function loadSections<T>(kind: string, projectId: string, seed: () => T[]): T[] {
  const m = bucket(kind)
  if (!m.has(projectId)) {
    m.set(projectId, seed())
    flushSections(kind, m)
  }
  return m.get(projectId) as T[]
}

export function saveSections<T>(kind: string, projectId: string, sections: T[]) {
  const m = bucket(kind)
  m.set(projectId, sections)
  flushSections(kind, m)
}

export function usePersistentSections<T>(kind: string, projectId: string, seed: () => T[]) {
  const [sections, setLocal] = useState<T[]>(() => loadSections(kind, projectId, seed))

  useEffect(() => {
    setLocal(loadSections(kind, projectId, seed))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const setSections = (updater: T[] | ((prev: T[]) => T[])) =>
    setLocal((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: T[]) => T[])(prev) : updater
      saveSections(kind, projectId, next)
      return next
    })

  return [sections, setSections] as const
}

// ── Single values (one value per project/workspace id) ───────────────────────
const values: Record<string, Map<string, unknown>> = {}

function valueBucket(kind: string): Map<string, unknown> {
  let m = values[kind]
  if (!m) {
    m = DURABLE.has(kind)
      ? new Map(Object.entries(readJSON<Record<string, unknown>>('val:' + kind, {})))
      : new Map<string, unknown>()
    values[kind] = m
  }
  return m
}

function flushValue(kind: string, m: Map<string, unknown>) {
  if (DURABLE.has(kind)) writeJSON('val:' + kind, Object.fromEntries(m))
}

export function setPersistentValue<T>(kind: string, projectId: string, value: T) {
  const m = valueBucket(kind)
  m.set(projectId, value)
  flushValue(kind, m)
}

// Non-hook read (e.g. to show a workspace's configured engine in a list of cards).
export function getPersistentValue<T>(kind: string, projectId: string, fallback: T): T {
  const m = valueBucket(kind)
  return m.has(projectId) ? (m.get(projectId) as T) : fallback
}

export function usePersistentValue<T>(kind: string, projectId: string, initial: T) {
  const m = valueBucket(kind)
  const [val, setLocal] = useState<T>(() => (m.has(projectId) ? (m.get(projectId) as T) : initial))

  useEffect(() => {
    setLocal(m.has(projectId) ? (m.get(projectId) as T) : initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const setValue = (v: T) => {
    m.set(projectId, v)
    flushValue(kind, m)
    setLocal(v)
  }

  return [val, setValue] as const
}
