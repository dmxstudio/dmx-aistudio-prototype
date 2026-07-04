import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, Palette, GitBranch, Upload, Cpu, ClipboardCheck, ArrowRight, CircleCheck, Lock } from 'lucide-react'

// Vista generadora del Design System (empty-state), calcada de BrandKickstart. Tres entradas:
// Desde la Marca (recomendado, gated al mínimo viable de Branding) · Heredar · Importar tokens.
// "Desde cero" NO existe: el DS se deriva, no se teclea. Ver docs (design-system-approach).
interface Props {
  dsReady: boolean
  brandReason: string // por qué "Desde la Marca" está disponible o no (n/total o define color)
  canInherit: boolean
  modelName?: string
  onFromBrand: () => void
  onInherit: () => void
  onImport: () => void
}

export function DsKickstart({ dsReady, brandReason, canInherit, modelName, onFromBrand, onInherit, onImport }: Props) {
  const { t } = useTranslation()

  const card = (opts: {
    icon: ReactNode
    title: string
    desc: string
    foot: ReactNode
    onClick: () => void
    recommended?: boolean
    disabled?: boolean
  }) => (
    <button
      onClick={opts.disabled ? undefined : opts.onClick}
      disabled={opts.disabled}
      className={`text-left rounded-xl p-4 transition-colors flex flex-col gap-2 ${
        opts.recommended ? 'border-2 border-accent' : 'border border-line'
      } ${opts.disabled ? 'opacity-55 cursor-not-allowed' : 'hover:bg-raised cursor-pointer'}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-accent-strong">{opts.icon}</span>
        <span className="text-[15px] font-medium text-content">{opts.title}</span>
        {opts.recommended && (
          <span className="ml-auto text-[11px] font-medium bg-accent-soft text-accent-strong rounded-full px-2 py-0.5">
            {t('branding.kickstart.recommended')}
          </span>
        )}
      </div>
      <p className="text-[13px] leading-snug text-muted">{opts.desc}</p>
      <div className="mt-0.5">{opts.foot}</div>
    </button>
  )

  const footChip = (icon: ReactNode, label: string, tone: 'accent' | 'muted' = 'muted') => (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] rounded-full px-2.5 py-1 ${
        tone === 'accent' ? 'bg-accent-soft text-accent-strong' : 'border border-line text-muted'
      }`}
    >
      {icon}
      {label}
    </span>
  )

  return (
    <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 lg:p-8">
      <div className="text-center max-w-md mx-auto mb-6">
        <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3">
          <Layers size={22} className="text-accent-strong" />
        </div>
        <h2 className="font-display text-xl font-bold text-content">{t('ds.kickstart.title')}</h2>
        <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('ds.kickstart.subtitle')}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {card({
          icon: <Palette size={20} />,
          title: t('ds.kickstart.fromBrand'),
          desc: t('ds.kickstart.fromBrandDesc'),
          recommended: dsReady,
          disabled: !dsReady,
          onClick: onFromBrand,
          foot: dsReady
            ? footChip(<CircleCheck size={14} />, brandReason, 'accent')
            : footChip(<Lock size={13} />, brandReason),
        })}

        {card({
          icon: <GitBranch size={20} />,
          title: t('ds.kickstart.inherit'),
          desc: t('ds.kickstart.inheritDesc'),
          disabled: !canInherit,
          onClick: onInherit,
          foot: canInherit
            ? footChip(<ArrowRight size={14} />, t('ds.kickstart.chooseProject'))
            : footChip(<Lock size={13} />, t('ds.kickstart.noOtherProjects')),
        })}

        {card({
          icon: <Upload size={20} />,
          title: t('ds.kickstart.import'),
          desc: t('ds.kickstart.importDesc'),
          onClick: onImport,
          foot: footChip(<ArrowRight size={14} />, t('ds.kickstart.importAction')),
        })}
      </div>

      <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2 text-[12px] text-muted">
          <ClipboardCheck size={15} className="text-accent-strong shrink-0" />
          {t('ds.kickstart.footHint')}
        </span>
        <span className="inline-flex items-center gap-2 text-[12px] text-faint sm:ml-auto">
          <Cpu size={15} className="shrink-0" />
          {t('ds.kickstart.engine', { model: modelName ?? '—' })}
        </span>
      </div>
    </div>
  )
}
