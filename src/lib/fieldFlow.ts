import type { BriefField } from '../data/brief'

// Auto-advance rule (continuous fill): after saving a field, look at the next editable
// field in document order. If it's empty → return it so the modal jumps straight to it.
// If it already has data → return null so the modal closes (we stop at the first filled field).
// Non-editable fields (decisions, moved-to-another-panel, inherited) are skipped, not stops.
export function nextEmptyEditable(
  sections: { fields: BriefField[] }[],
  currentId: string,
): BriefField | null {
  const all = sections.flatMap((s) => s.fields)
  const idx = all.findIndex((f) => f.id === currentId)
  if (idx < 0) return null
  for (let i = idx + 1; i < all.length; i++) {
    const f = all[i]
    const editable = f.status !== 'decision' && !f.movedTo && !f.inherited
    if (!editable) continue
    return !f.value || f.status === 'empty' ? f : null
  }
  return null
}

// The next editable field in document order, regardless of whether it's empty — backs the explicit
// "Siguiente" button (vs nextEmptyEditable, which only auto-advances to the next *blank* on save).
export function nextEditable(
  sections: { fields: BriefField[] }[],
  currentId: string,
): BriefField | null {
  const all = sections.flatMap((s) => s.fields)
  const idx = all.findIndex((f) => f.id === currentId)
  if (idx < 0) return null
  for (let i = idx + 1; i < all.length; i++) {
    const f = all[i]
    if (f.status !== 'decision' && !f.movedTo && !f.inherited) return f
  }
  return null
}

// The previous editable field in document order — backs the "←" back button (symmetric to nextEditable).
export function prevEditable(
  sections: { fields: BriefField[] }[],
  currentId: string,
): BriefField | null {
  const all = sections.flatMap((s) => s.fields)
  const idx = all.findIndex((f) => f.id === currentId)
  if (idx < 0) return null
  for (let i = idx - 1; i >= 0; i--) {
    const f = all[i]
    if (f.status !== 'decision' && !f.movedTo && !f.inherited) return f
  }
  return null
}

export function sectionIdOf(
  sections: { id: string; fields: BriefField[] }[],
  fieldId: string,
): string | undefined {
  return sections.find((s) => s.fields.some((f) => f.id === fieldId))?.id
}
