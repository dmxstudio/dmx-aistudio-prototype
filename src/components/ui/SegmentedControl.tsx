interface Option {
  value: string
  label: string
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: Option[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-raised p-1 border border-line">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`h-8 px-4 rounded-full text-[13px] font-medium transition-colors ${
            value === o.value ? 'bg-accent text-accent-ink' : 'text-muted hover:text-content'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
