import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus, ChevronDown } from 'lucide-react'
import type { GroupField } from '../../data/fieldEditors'
import { FontPicker } from './FontPicker'

type Row = Record<string, string>

// Editor for a repeatable group (BrandField.rows). Add/remove rows; each row is the group's
// sub-fields (columns) as inputs. v1: no reorder/validation beyond "≥1 row". Emits rows + valid.
export function GroupEditor({
  fieldId,
  initialRows,
  groupFields,
  onChange,
  newRow,
}: {
  fieldId: string
  initialRows: Row[]
  groupFields: GroupField[]
  onChange: (rows: Row[], valid: boolean) => void
  // Optional prefill for a freshly added row (e.g. changelog auto-increments version + today).
  newRow?: (rows: Row[]) => Row
}) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Row[]>(() => initialRows.map((r) => ({ ...r })))

  useEffect(() => {
    onChange(rows, rows.length > 0)
  }, [rows, onChange])

  const update = (i: number, key: string, val: string) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: val } : r)))
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i))
  const addRow = () =>
    setRows((rs) => [...rs, { ...Object.fromEntries(groupFields.map((g) => [g.key, ''])), ...(newRow?.(rs) ?? {}) }])

  const inputCls =
    'w-full rounded-lg bg-surface border border-line px-2.5 py-1.5 text-[13px] text-content placeholder:text-faint outline-none focus:border-accent'

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={i} className="relative rounded-xl border border-line bg-raised p-3 pr-9 space-y-2">
          <button
            onClick={() => removeRow(i)}
            aria-label={t('common.removeRow')}
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-faint hover:text-danger-strong hover:bg-danger-soft transition-colors"
          >
            <X size={13} />
          </button>
          {groupFields.map((g) => (
            <div key={g.key} className="space-y-1">
              <label className="block text-[11px] font-medium text-muted">
                {t(`groupCols.${fieldId}.${g.key}`, { defaultValue: g.label })}
              </label>
              {g.input === 'font' ? (
                <FontPicker value={row[g.key] ?? ''} onPick={(v) => update(i, g.key, v)} autoFocus={false} />
              ) : g.input === 'textarea' ? (
                <textarea
                  value={row[g.key] ?? ''}
                  onChange={(e) => update(i, g.key, e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              ) : g.input === 'select' ? (
                <div className="relative">
                  <select
                    value={row[g.key] ?? ''}
                    onChange={(e) => update(i, g.key, e.target.value)}
                    className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                  >
                    <option value="">—</option>
                    {(g.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                </div>
              ) : (
                <div className="relative">
                  <input value={row[g.key] ?? ''} onChange={(e) => update(i, g.key, e.target.value)} placeholder={g.placeholder} className={inputCls} />
                  {/^#(?:[0-9a-f]{6}|[0-9a-f]{3})$/i.test((row[g.key] ?? '').trim()) && (
                    <span
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-line pointer-events-none"
                      style={{ background: (row[g.key] ?? '').trim() }}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
      <button
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-[13px] text-accent-strong hover:bg-accent-soft rounded-full px-3 py-1.5 transition-colors"
      >
        <Plus size={15} />
        {t('common.addRow')}
      </button>
    </div>
  )
}
