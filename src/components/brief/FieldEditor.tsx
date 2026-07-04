import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Plus, Link2, Sparkles, RefreshCw, ChevronDown, Loader2, Upload, FileText } from 'lucide-react'
import { InfoTip } from '../ui/InfoTip'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { getEditor, MULTI_SEP, type OptionGroup } from '../../data/fieldEditors'
import type { BrandCatalog } from '../../data/brandCatalogs'
import type { BriefField } from '../../data/brief'
import { FontPicker } from './FontPicker'

const inputCls =
  'w-full h-10 rounded-xl bg-raised border border-line px-3 text-sm text-content placeholder:text-faint outline-none focus:border-accent'
// `ai` chips get a light accent tint so the AI-tailored catalog reads differently from the base.
const chipCls = (on: boolean, ai = false) =>
  `px-3 py-1.5 max-w-full rounded-2xl text-[13px] text-left leading-snug border transition-colors ${
    on
      ? 'bg-accent text-accent-ink border-accent'
      : ai
        ? 'bg-accent-soft text-accent-strong border-accent-soft hover:border-accent'
        : 'bg-surface text-muted border-line hover:text-content'
  }`

const OTHER = '__other__'

// Split a stored multi-value into trimmed parts, accepting the canonical " · " and legacy ", ".
const splitMulti = (v: string): string[] => v.split(/\s*·\s*|\s*,\s*/).map((s) => s.trim()).filter(Boolean)

// The catalog-aware editor body, shared by FieldEditModal (filling a field) and ResolveModal
// (resolving a decision about a field) so both offer the SAME base + AI catalog + "Otro".
// Emits the current value and whether it can be committed via onChange. `initialValue` seeds
// the editor (decisions pre-fill it, e.g. a conflict's AI value); falls back to field.value.
export function FieldEditor({
  field,
  aiCatalog,
  aiCapable,
  onRegenerate,
  initialValue,
  onChange,
  systemOptions,
}: {
  field: BriefField
  aiCatalog?: BrandCatalog
  aiCapable?: boolean
  onRegenerate?: () => void
  initialValue?: string
  onChange: (value: string, valid: boolean) => void
  // Values the SYSTEM derives from other fields (e.g. CMYK from the brand hex) — rendered as
  // their own chip group so "generate" is one click, distinct from the AI catalog.
  systemOptions?: string[]
}) {
  const { t } = useTranslation()
  const editor = getEditor(field.id)
  // The value the editor seeds from: an explicit override (decisions) or the field's own value.
  const seedValue = initialValue ?? field.value
  // Helper line under the title: prefer a localized fieldHelp.<id>, fall back to the editor's own helper.
  const helpText = t(`fieldHelp.${field.id}`, { defaultValue: editor.helper ?? '' })
  // Unify flat + grouped catalogs: a flat list renders as a single unlabeled group.
  const groups: OptionGroup[] = editor.groups ?? (editor.options ? [{ label: '', options: editor.options }] : [])
  const aiGroups: OptionGroup[] = aiCatalog?.groups ?? []
  const aiSuggestions: string[] = aiCatalog?.suggestions ?? []

  const [text, setText] = useState('')
  const [single, setSingle] = useState('')
  const [otherText, setOtherText] = useState('')
  // For single-select "Otro": a committed custom value shows as a chip + locks the input (one value only).
  const [otherCommitted, setOtherCommitted] = useState(false)
  // customPxMm "Otro": numeric screen px + print mm, composed live into the canonical value string.
  const [pxVal, setPxVal] = useState('')
  const [mmVal, setMmVal] = useState('')
  const [multi, setMulti] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [otherOn, setOtherOn] = useState(false)
  const [confirmOther, setConfirmOther] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [num, setNum] = useState(0)
  const [rangeMax, setRangeMax] = useState(0)
  const [rangeTouched, setRangeTouched] = useState(false)
  const [links, setLinks] = useState<string[]>([])
  const [linkInput, setLinkInput] = useState('')
  const [imgValue, setImgValue] = useState('') // image fields: a data-URL (uploaded) or asset path
  const [fileTooBig, setFileTooBig] = useState(false) // upload rejected: localStorage quota is ~5MB
  const [aiGenerating, setAiGenerating] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  // Base catalog accordion: index of the open category (one at a time), -1 = all closed.
  const [openBase, setOpenBase] = useState(0)

  useEffect(() => {
    setConfirmOther(false)
    setRangeTouched(false)
    setAiGenerating(false)
    setCollapsed({})
    const ed = getEditor(field.id)
    const list = [
      ...(ed.options ?? ed.groups?.flatMap((g) => g.options) ?? []),
      ...(aiCatalog?.groups?.flatMap((g) => g.options) ?? []),
      ...(systemOptions ?? []),
    ]
    if (ed.type === 'select') {
      setPxVal('')
      setMmVal('')
      if (seedValue && list.includes(seedValue)) {
        setSingle(seedValue)
        setOtherText('')
        setOtherCommitted(false)
      } else if (seedValue) {
        setSingle(OTHER)
        if (ed.customPxMm) {
          // a saved custom "N px pantalla · N mm impreso" re-opens as the numeric inputs
          setPxVal(seedValue.match(/(\d+(?:\.\d+)?)\s*px/i)?.[1] ?? '')
          setMmVal(seedValue.match(/(\d+(?:\.\d+)?)\s*mm/i)?.[1] ?? '')
          setOtherText('')
          setOtherCommitted(false)
        } else {
          setOtherText(seedValue)
          setOtherCommitted(true) // a saved custom value opens as a committed chip
        }
      } else {
        setSingle('')
        setOtherText('')
        setOtherCommitted(false)
      }
    } else if (ed.type === 'multiselect') {
      // Accept both the canonical " · " and legacy ", " separators so pre-existing data parses into chips, not a blob.
      const parts = splitMulti(seedValue)
      const tags = parts.filter((p) => !list.includes(p))
      setMulti(parts.filter((p) => list.includes(p)))
      setCustomTags(tags)
      setOtherOn(tags.length > 0)
      setTagInput('')
    } else if (ed.type === 'range') {
      const digits = seedValue.replace(/[^0-9]/g, '')
      const raw = digits ? parseInt(digits, 10) : (ed.min ?? 0)
      const opts = ed.rangeMaxOptions
      // pick the smallest cap that contains the current value; default to ed.max when empty.
      const cap = opts
        ? raw > 0
          ? (opts.find((o) => raw <= o) ?? opts[opts.length - 1])
          : opts.includes(ed.max ?? 0)
            ? (ed.max as number)
            : opts[0]
        : (ed.max ?? 0)
      setRangeMax(cap)
      setNum(Math.min(cap, Math.max(ed.min ?? 0, raw)))
    } else if (ed.type === 'links') {
      setLinks(splitMulti(seedValue))
      setLinkInput('')
    } else if (ed.type === 'image') {
      setImgValue(seedValue)
      setFileTooBig(false)
    } else {
      setText(seedValue)
    }
    // Accordion default: open the base category holding the current selection, else the first.
    const baseGs = ed.groups ?? (ed.options ? [{ label: '', options: ed.options }] : [])
    const sel = ed.type === 'multiselect' ? splitMulti(seedValue) : seedValue ? [seedValue] : []
    const gi = baseGs.findIndex((g) => g.options.some((o) => sel.includes(o)))
    setOpenBase(gi >= 0 ? gi : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field, initialValue])

  const formatRange = (n: number) =>
    editor.rangeFormat === 'currency'
      ? `$${n.toLocaleString('en-US')} USD`
      : `${n} ${t(n === 1 ? 'brief.weekOne' : 'brief.weekMany')}`

  // When the max is selectable, scale the step to the chosen cap (~100 steps) so it stays smooth.
  const rangeStep = editor.rangeMaxOptions ? Math.max(1, Math.round(rangeMax / 100)) : (editor.step ?? 1)
  const changeMax = (cap: number) => {
    const step = Math.max(1, Math.round(cap / 100))
    setRangeMax(cap)
    setNum((n) => Math.round(Math.min(cap, n) / step) * step)
  }

  // Pending free-text that hasn't been "committed" with Enter yet — folded into the value at Save so nothing is lost.
  const pendingTags =
    editor.type === 'multiselect' && otherOn
      ? [
          ...new Set(
            tagInput
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .filter((p) => !multi.includes(p) && !customTags.includes(p)),
          ),
        ]
      : []

  const normalizeLink = (raw: string) => {
    let v = raw.trim()
    if (!v) return ''
    if (!/^https?:\/\//i.test(v) && /\./.test(v)) v = 'https://' + v
    return v
  }
  const pendingLink = editor.type === 'links' ? normalizeLink(linkInput) : ''
  const pendingLinkValid = !!pendingLink && !links.includes(pendingLink)

  // customPxMm compose: only valid positive numbers enter the canonical value — Number()
  // normalizes '1e3'→1000 and rejects '-5'/'0', which the downstream digit regexes would misread.
  const posNum = (s: string) => {
    const n = Number(s)
    return Number.isFinite(n) && n > 0 ? String(n) : ''
  }
  const pxMmValue = [
    posNum(pxVal) && `${posNum(pxVal)} px pantalla`,
    posNum(mmVal) && `${posNum(mmVal)} mm impreso`,
  ]
    .filter(Boolean)
    .join(MULTI_SEP)

  const value =
    editor.type === 'select'
      ? single === OTHER
        ? editor.customPxMm
          ? pxMmValue
          : otherText.trim()
        : single
      : editor.type === 'multiselect'
        ? [...multi, ...customTags, ...pendingTags].join(MULTI_SEP)
        : editor.type === 'range'
          ? formatRange(num)
          : editor.type === 'links'
            ? [...links, ...(pendingLinkValid ? [pendingLink] : [])].join(MULTI_SEP)
            : editor.type === 'image'
              ? imgValue
              : text.trim()

  const valid =
    editor.type === 'multiselect'
      ? multi.length + customTags.length + pendingTags.length > 0
      : editor.type === 'links'
        ? links.length + (pendingLinkValid ? 1 : 0) > 0
        : editor.type === 'range'
          ? seedValue.trim() !== '' || rangeTouched
          : value.length > 0

  // Surface the current value + whether it can be committed (valid and not mid "clear Otro?" prompt).
  useEffect(() => {
    onChange(value, valid && !confirmOther)
  }, [value, valid, confirmOther, onChange])

  const addTags = () => {
    const parts = tagInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length)
      setCustomTags((prev) => {
        const next = [...prev]
        parts.forEach((p) => {
          if (!next.includes(p) && !multi.includes(p)) next.push(p)
        })
        return next
      })
    setTagInput('')
  }

  const addLink = () => {
    const v = normalizeLink(linkInput)
    if (v && !links.includes(v)) setLinks((p) => [...p, v])
    setLinkInput('')
  }

  // "Otro/Otros" toggle-off: deselect + hide the field, asking first if it already holds a value.
  const confirmClearOther = () => {
    if (editor.type === 'select') {
      setOtherText('')
      setPxVal('')
      setMmVal('')
      setSingle('')
    } else {
      setCustomTags([])
      setTagInput('')
      setOtherOn(false)
    }
    setConfirmOther(false)
  }
  const toggleOther = () => {
    if (otherOn) {
      if (customTags.length > 0 || tagInput.trim()) setConfirmOther(true)
      else setOtherOn(false)
    } else {
      setOtherOn(true)
    }
  }
  const selectOther = () => {
    if (single === OTHER) {
      if (otherText.trim() || pxVal.trim() || mmVal.trim()) setConfirmOther(true)
      else setSingle('')
    } else {
      setSingle(OTHER)
      setConfirmOther(false)
    }
  }

  const confirmBlock = (
    <div className="rounded-xl border border-line bg-raised px-3 py-2.5 space-y-2">
      <p className="text-[12px] text-content">{t('brief.confirmClearOther')}</p>
      <div className="flex gap-2">
        <button
          onClick={confirmClearOther}
          className="h-8 px-3 rounded-full text-[13px] bg-danger-soft text-danger-strong hover:opacity-90 transition-opacity"
        >
          {t('brief.confirmClearYes')}
        </button>
        <button
          onClick={() => setConfirmOther(false)}
          className="h-8 px-3 rounded-full text-[13px] text-muted hover:text-content transition-colors"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )

  const chipFor = (o: string, on: boolean, onClick: () => void, ai = false) => {
    const info = editor.optionInfo?.[o]
    const btn = (
      <button key={o} onClick={onClick} className={chipCls(on, ai)}>
        {o}
      </button>
    )
    return info ? (
      <span key={o} className="inline-flex items-center gap-1">
        {btn}
        <InfoTip text={info} />
      </span>
    ) : (
      btn
    )
  }

  const showAi = !!aiCapable
  const hasAiContent = aiGroups.length > 0 || aiSuggestions.length > 0
  const baseSuggOpen = !(collapsed['base:sugg'] ?? hasAiContent) // base suggestions collapse only when AI has content
  const doRegenerate = () => {
    if (!onRegenerate || aiGenerating) return
    setAiGenerating(true)
    setTimeout(() => {
      onRegenerate()
      setAiGenerating(false)
    }, 900)
  }

  // Collapsible groups: base groups start collapsed only when AI content exists (unless they hold a selection); AI groups open.
  const renderGroups = (
    gs: OptionGroup[],
    render: (o: string) => ReactNode,
    prefix: string,
    selected: (o: string) => boolean,
  ) =>
    gs.map((g, i) => {
      if (!g.label)
        return (
          <div key={i} className="flex flex-wrap gap-2">
            {g.options.map(render)}
          </div>
        )
      const key = `${prefix}:${i}`
      // Base catalog with >1 category = accordion (one open at a time); else individually collapsible.
      const accordion = prefix === 'base' && gs.length > 1
      const defaultCollapsed = prefix === 'base' && hasAiContent && !g.options.some(selected)
      const open = accordion ? openBase === i : !(collapsed[key] ?? defaultCollapsed)
      const toggle = accordion
        ? () => setOpenBase((cur) => (cur === i ? -1 : i))
        : () => setCollapsed((c) => ({ ...c, [key]: open }))
      return (
        <div key={i} className="space-y-2">
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-1.5 w-full text-left"
          >
            <ChevronDown
              size={13}
              className={`text-faint shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
            />
            <span className="text-[11px] font-medium text-faint uppercase tracking-wide">{g.label}</span>
            <span className="text-[11px] text-faint">· {g.options.length}</span>
          </button>
          {open && <div className="flex flex-wrap gap-2">{g.options.map(render)}</div>}
        </div>
      )
    })

  const aiHeader = (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-strong bg-accent-soft rounded-full px-2.5 py-1">
        <Sparkles size={12} />
        {t('brief.aiCatalog')}
      </span>
      <span className="flex-1 h-px bg-line" />
      {onRegenerate && (
        <button
          onClick={doRegenerate}
          disabled={aiGenerating}
          title={t('brief.aiGenerateTip')}
          className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-accent-strong transition-colors disabled:opacity-60"
        >
          {aiGenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {hasAiContent ? t('brief.regenerate') : t('brief.aiGenerate')}
        </button>
      )}
    </div>
  )
  const baseHeader = (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-muted border border-line rounded-full px-2.5 py-1">
        {t('brief.baseCatalog')}
      </span>
      <span className="flex-1 h-px bg-line" />
    </div>
  )

  return (
    <>
      {helpText && <p className="text-[12px] text-muted mb-3 -mt-1 leading-snug">{helpText}</p>}

      {editor.type === 'text' &&
        (editor.colorHex ? (
          // Hex fields: native color picker + text input, like the palette rows' live swatches.
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(text.trim()) ? text.trim() : '#888888'}
              onChange={(e) => setText(e.target.value.toUpperCase())}
              aria-label={editor.placeholder ?? '#RRGGBB'}
              className="w-10 h-10 rounded-full border border-line cursor-pointer shrink-0 appearance-none overflow-hidden bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none"
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              placeholder={editor.placeholder}
              className={inputCls}
            />
          </div>
        ) : (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder={editor.placeholder}
            className={inputCls}
          />
        ))}

      {editor.type === 'font' && <FontPicker value={text} onPick={setText} />}

      {editor.type === 'textarea' && (
        <div className="space-y-3">
          {showAi && (
            <div className="space-y-2">
              {aiHeader}
              {aiSuggestions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.map((s) => (
                    <button key={s} onClick={() => setText(s)} className={chipCls(text === s, true)}>
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-faint">{t('brief.aiNotYet')}</p>
              )}
            </div>
          )}
          {editor.suggestions && editor.suggestions.length > 0 && (
            <div className="space-y-2">
              {hasAiContent ? (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, 'base:sugg': baseSuggOpen }))}
                  className="flex items-center gap-1.5 w-full text-left"
                >
                  <ChevronDown
                    size={13}
                    className={`text-faint shrink-0 transition-transform ${baseSuggOpen ? '' : '-rotate-90'}`}
                  />
                  <span className="text-[11px] font-medium text-muted uppercase tracking-wide">
                    {t('brief.baseCatalog')}
                  </span>
                  <span className="text-[11px] text-faint">· {editor.suggestions.length}</span>
                </button>
              ) : (
                <p className="text-[12px] text-muted">{t('brief.suggestions')}</p>
              )}
              {(!hasAiContent || baseSuggOpen) && (
                <div className="flex flex-wrap gap-2">
                  {editor.suggestions.map((s) => (
                    <button key={s} onClick={() => setText(s)} className={chipCls(text === s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder={editor.placeholder ?? t('brief.editPlaceholder')}
            className="w-full rounded-xl bg-raised border border-line px-3 py-2.5 text-sm text-content placeholder:text-faint outline-none focus:border-accent resize-none"
          />
        </div>
      )}

      {editor.type === 'select' && (
        <div className="space-y-3">
          <p className="text-[12px] text-muted">{t('brief.chooseOne')}</p>
          {systemOptions && systemOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted border border-line rounded-full px-2.5 py-1">
                  {t('brief.systemCatalog')}
                </span>
                <span className="flex-1 h-px bg-line" />
              </div>
              <div className="flex flex-wrap gap-2">
                {systemOptions.map((o) => chipFor(o, single === o, () => setSingle(o)))}
              </div>
            </div>
          )}
          {showAi && (
            <div className="space-y-2">
              {aiHeader}
              {aiGroups.length > 0 ? (
                renderGroups(aiGroups, (o) => chipFor(o, single === o, () => setSingle(o), true), 'ai', (o) => single === o)
              ) : (
                <p className="text-[12px] text-faint">{t('brief.aiNotYet')}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            {showAi && baseHeader}
            {renderGroups(groups, (o) => chipFor(o, single === o, () => setSingle(o)), 'base', (o) => single === o)}
          </div>
          {editor.allowOther && (
            <div className="flex flex-wrap gap-2">
              <button onClick={selectOther} className={chipCls(single === OTHER)}>
                {t('brief.other')}
              </button>
            </div>
          )}
          {single === OTHER &&
            (confirmOther ? (
              confirmBlock
            ) : editor.customPxMm ? (
              // Custom px/mm: numeric inputs for screen (px) and print (mm); value composes live.
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ['otherPx', pxVal, setPxVal],
                    ['otherMm', mmVal, setMmVal],
                  ] as const
                ).map(([key, val, set], i) => (
                  <label key={key} className="flex-1 min-w-32 space-y-1">
                    <span className="block text-[11px] font-medium text-faint uppercase tracking-wide">
                      {t(`brief.${key}`)}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      autoFocus={i === 0}
                      placeholder={key === 'otherPx' ? '24' : '8'}
                      className={inputCls}
                    />
                  </label>
                ))}
              </div>
            ) : otherCommitted && otherText.trim() ? (
              // Committed custom value → chip only (remove it with × to enter another — single value).
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-start gap-1.5 max-w-full pl-3 pr-2 py-1.5 rounded-2xl bg-accent text-accent-ink text-[13px] leading-snug">
                  <span className="min-w-0 break-words">{otherText}</span>
                  <button
                    onClick={() => {
                      setOtherText('')
                      setOtherCommitted(false)
                    }}
                    aria-label={t('common.delete')}
                    className="shrink-0 mt-0.5"
                  >
                    <X size={13} />
                  </button>
                </span>
              </div>
            ) : (
              <input
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && otherText.trim()) {
                    e.preventDefault()
                    setOtherCommitted(true)
                  }
                }}
                autoFocus
                placeholder={t('brief.otherPlaceholder')}
                className={inputCls}
              />
            ))}
        </div>
      )}

      {editor.type === 'multiselect' && (
        <div className="space-y-3">
          <p className="text-[12px] text-muted">{t('brief.chooseMany')}</p>
          {showAi && (
            <div className="space-y-2">
              {aiHeader}
              {aiGroups.length > 0 ? (
                renderGroups(
                  aiGroups,
                  (o) =>
                    chipFor(
                      o,
                      multi.includes(o),
                      () => setMulti((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o])),
                      true,
                    ),
                  'ai',
                  (o) => multi.includes(o),
                )
              ) : (
                <p className="text-[12px] text-faint">{t('brief.aiNotYet')}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            {showAi && baseHeader}
            {renderGroups(
              groups,
              (o) =>
                chipFor(o, multi.includes(o), () =>
                  setMulti((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o])),
                ),
              'base',
              (o) => multi.includes(o),
            )}
          </div>
          {(editor.allowOther || customTags.length > 0) && (
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap gap-2">
                {editor.allowOther && (
                  <button onClick={toggleOther} className={chipCls(otherOn)}>
                    {t('brief.other')}
                  </button>
                )}
                {customTags.map((tg) => (
                  <span
                    key={tg}
                    className="inline-flex items-start gap-1.5 max-w-full pl-3 pr-2 py-1.5 rounded-2xl bg-accent text-accent-ink text-[13px] leading-snug"
                  >
                    <span className="min-w-0 break-words">{tg}</span>
                    <button
                      onClick={() => setCustomTags((p) => p.filter((x) => x !== tg))}
                      aria-label="Quitar"
                      className="shrink-0 mt-0.5"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
              {editor.allowOther &&
                otherOn &&
                (confirmOther ? (
                  confirmBlock
                ) : (
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTags()
                      }
                    }}
                    autoFocus
                    placeholder={t('brief.addOther')}
                    className={inputCls}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {editor.type === 'range' && (
        <div className="space-y-4 pt-1">
          <div className="text-center">
            <span className="font-display text-2xl font-bold text-content">{formatRange(num)}</span>
          </div>
          <input
            type="range"
            min={editor.min}
            max={editor.rangeMaxOptions ? rangeMax : editor.max}
            step={rangeStep}
            value={num}
            onChange={(e) => {
              setNum(Number(e.target.value))
              setRangeTouched(true)
            }}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="flex items-center justify-between gap-2 text-[11px] text-faint">
            <span>{formatRange(editor.min ?? 0)}</span>
            {editor.rangeMaxOptions ? (
              <Select pill value={String(rangeMax)} onChange={(e) => changeMax(Number(e.target.value))}>
                {editor.rangeMaxOptions.map((o) => (
                  <option key={o} value={o}>
                    {formatRange(o)}
                  </option>
                ))}
              </Select>
            ) : (
              <span>{formatRange(editor.max ?? 0)}</span>
            )}
          </div>
        </div>
      )}

      {editor.type === 'links' && (
        <div className="space-y-3">
          {!helpText && <p className="text-[12px] text-muted">{t('brief.linksHint')}</p>}
          {links.length > 0 && (
            <div className="space-y-2">
              {links.map((lnk) => (
                <div
                  key={lnk}
                  className="flex items-center gap-2 bg-raised border border-line rounded-xl px-3 h-10"
                >
                  <Link2 size={14} className="text-faint shrink-0" />
                  <span className="flex-1 text-[13px] text-content truncate">{lnk}</span>
                  <button
                    onClick={() => setLinks((p) => p.filter((x) => x !== lnk))}
                    aria-label="Quitar"
                    className="text-faint hover:text-danger-strong shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
              autoFocus
              placeholder={t('brief.linkPlaceholder')}
              className={inputCls}
            />
            <Button variant="secondary" onClick={addLink} disabled={!linkInput.trim()}>
              <Plus size={15} />
            </Button>
          </div>
        </div>
      )}

      {editor.type === 'image' && (
        <div className="space-y-3">
          {helpText ? null : <p className="text-[12px] text-muted">{t('brief.imageHint')}</p>}
          {imgValue ? (
            <div className="relative rounded-xl overflow-hidden border border-line bg-raised">
              {/* Non-image fields (EPS/PDF) can't preview — a document chip, keyed on the field's
                  accept (deterministic; browser-reported mimes for .eps vary by OS). */}
              {editor.accept && !editor.accept.startsWith('image') ? (
                <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted px-4">
                  {imgValue.startsWith('data:audio') ? (
                    // Audio clips get a real player right in the editor.
                    <audio controls preload="metadata" src={imgValue} className="w-full" />
                  ) : (
                    <FileText size={28} />
                  )}
                  <span className="text-[12px]">
                    {t('brief.fileLoaded')}
                    {imgValue.startsWith('data:') &&
                      ` · ${Math.max(1, Math.round((imgValue.length * 3) / 4 / 1024))} KB`}
                  </span>
                </div>
              ) : (
                <img src={imgValue} alt="" className="w-full h-44 object-cover" />
              )}
              <button
                onClick={() => setImgValue('')}
                aria-label={t('common.delete')}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 border border-line flex items-center justify-center text-muted hover:text-danger-strong"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-raised h-44 flex items-center justify-center text-[13px] text-faint">
              {t('brief.noImage')}
            </div>
          )}
          <label className="inline-flex w-fit items-center gap-2 h-10 px-4 rounded-full bg-surface border border-line text-sm text-content hover:bg-raised cursor-pointer">
            <Upload size={15} />
            {editor.accept && !editor.accept.startsWith('image')
              ? t(imgValue ? 'brief.replaceFile' : 'brief.uploadFile')
              : t(imgValue ? 'brief.replaceImage' : 'brief.uploadImage')}
            <input
              type="file"
              accept={editor.accept ?? 'image/*'}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                // The book feed lives in localStorage (~5MB total) — cap uploads so one print
                // file can't blow the quota for the whole brand.
                if (file.size > 1_500_000) {
                  setFileTooBig(true)
                  e.target.value = ''
                  return
                }
                setFileTooBig(false)
                const reader = new FileReader()
                reader.onload = () => setImgValue(String(reader.result))
                reader.readAsDataURL(file)
              }}
            />
          </label>
          {fileTooBig && <p className="text-[12px] text-danger-strong">{t('brief.fileTooBig')}</p>}
        </div>
      )}
    </>
  )
}
