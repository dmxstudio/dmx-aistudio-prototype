import { useTranslation } from 'react-i18next'
import { GitBranch, Check, ChevronDown } from 'lucide-react'
import { Popover } from '../ui/Popover'

export interface BrandSourceOption {
  id: string
  label: string
}

export function BrandSourceSelector({
  value,
  options,
  onChange,
}: {
  value: string
  options: BrandSourceOption[]
  onChange: (v: string) => void
}) {
  const { t } = useTranslation()
  const current = options.find((o) => o.id === value)

  return (
    <Popover
      menuClassName="w-64"
      button={
        <span className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-raised border border-line text-[13px] text-content">
          <GitBranch size={14} className="text-accent" />
          <span className="text-muted">{t('branding.brandSource')}:</span>
          <span className="font-medium truncate max-w-[140px]">{current?.label}</span>
          <ChevronDown size={13} className="text-faint" />
        </span>
      }
    >
      {(close) => (
        <div className="bg-surface border border-line rounded-xl shadow-soft p-1.5">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                onChange(o.id)
                close()
              }}
              className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-raised text-left"
            >
              <span className="flex-1 text-[13px] text-content truncate">{o.label}</span>
              {o.id === value && <Check size={14} className="text-accent shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </Popover>
  )
}
