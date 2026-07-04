export type SectionNavItem = { id: string; code: string; label: string; decisions: number; pct: number }

// Shared section navigator for Brief/Branding. Below lg it's a horizontal-scroll tab strip
// (tablet + mobile); at lg+ it's the vertical card column. Same data, two layouts via CSS.
export function SectionNav({
  items,
  activeId,
  onSelect,
}: {
  items: SectionNavItem[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4
        lg:flex-col lg:gap-0 lg:mx-0 lg:p-2.5 lg:overflow-x-visible lg:overflow-y-auto lg:max-h-[70vh]
        lg:bg-surface lg:border lg:border-line lg:rounded-2xl lg:shadow-soft"
    >
      {items.map((s) => {
        const active = s.id === activeId
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`shrink-0 flex items-center gap-2 px-3 h-9 rounded-full border text-left transition-colors
              lg:w-full lg:shrink lg:h-10 lg:px-2.5 lg:gap-2.5 lg:rounded-xl lg:border-0 ${
                active
                  ? 'bg-accent-soft border-accent-soft lg:border-0'
                  : 'bg-surface border-line hover:bg-raised lg:bg-transparent lg:border-0'
              }`}
          >
            <span className={`font-display font-bold text-[12px] shrink-0 ${active ? 'text-accent-strong' : 'text-faint'}`}>
              {s.code}
            </span>
            <span className={`text-[12px] truncate max-w-[40vw] lg:max-w-none lg:flex-1 ${active ? 'text-accent-strong font-medium' : 'text-muted'}`}>
              {s.label}
            </span>
            {s.decisions > 0 ? (
              <span className="text-[10px] bg-danger-soft text-danger-strong rounded-full px-1.5 py-0.5 shrink-0">{s.decisions}</span>
            ) : (
              <span className="text-[11px] text-faint shrink-0 hidden lg:inline">{s.pct}%</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
