import { type BriefField } from '../data/brief'
import { nextEmptyEditable, nextEditable, prevEditable, sectionIdOf } from './fieldFlow'

type FieldSection = { id: string; fields: BriefField[] }

// Field-flow handlers shared by the Brief and Branding panels (identical logic, different section
// type). Save a value (origin → human), then jump to the next-empty field (Save), or step to the
// next/previous editable field — only persisting on a step if the value actually changed, so
// navigating past an AI value doesn't re-stamp it as human.
export function useFieldFlow<S extends FieldSection>(
  sections: S[],
  setSections: (next: S[]) => void,
  allFields: BriefField[],
  setEditField: (f: BriefField | null) => void,
  setActiveId: (id: string) => void,
) {
  const apply = (id: string, value: string): S[] => {
    const updated = sections.map((s) => ({
      ...s,
      fields: s.fields.map((f) =>
        f.id === id ? { ...f, value, status: value.trim() ? 'closed' : 'empty', origin: 'human', kind: undefined } : f,
      ),
    })) as S[] // generic spread-map: runtime preserves every field; the cast restores the section type
    setSections(updated)
    return updated
  }
  const go = (updated: S[], next: BriefField | null) => {
    setEditField(next)
    if (next) {
      const sid = sectionIdOf(updated, next.id)
      if (sid) setActiveId(sid)
    }
  }
  const edit = (id: string, value: string) => {
    const updated = apply(id, value)
    go(updated, nextEmptyEditable(updated, id))
  }
  const step = (find: typeof nextEditable) => (id: string, value: string) => {
    const cur = allFields.find((f) => f.id === id)
    const changed = !!cur && value.trim() !== (cur.value ?? '').trim()
    const updated = changed ? apply(id, value) : sections
    go(updated, find(updated, id))
  }
  return { edit, editNext: step(nextEditable), editPrev: step(prevEditable) }
}
