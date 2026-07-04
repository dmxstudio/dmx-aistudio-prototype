import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, FileText, Upload, GitBranch, Wand2, Cpu, ClipboardCheck, ArrowRight, CircleCheck, Lock } from 'lucide-react'

interface Props {
  briefReadiness: number
  byomConnected: boolean
  modelName?: string
  canInherit: boolean
  onFromBrief: () => void
  onIngest: () => void
  onInherit: () => void
  onScratch: () => void
}

const BRIEF_READY_AT = 25

export function BrandKickstart({
  briefReadiness,
  byomConnected,
  modelName,
  canInherit,
  onFromBrief,
  onIngest,
  onInherit,
  onScratch,
}: Props) {
  const { t } = useTranslation()
  const briefReady = briefReadiness >= BRIEF_READY_AT

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
          <Sparkles size={22} className="text-accent-strong" />
        </div>
        <h2 className="font-display text-xl font-bold text-content">{t('branding.kickstart.title')}</h2>
        <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('branding.kickstart.subtitle')}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
        {card({
          icon: <FileText size={20} />,
          title: t('branding.kickstart.fromBrief'),
          desc: t('branding.kickstart.fromBriefDesc'),
          recommended: byomConnected,
          disabled: !byomConnected,
          onClick: onFromBrief,
          foot: byomConnected
            ? footChip(
                <CircleCheck size={14} />,
                briefReady
                  ? t('branding.kickstart.briefReady', { n: briefReadiness })
                  : t('branding.kickstart.briefThin', { n: briefReadiness }),
                briefReady ? 'accent' : 'muted',
              )
            : footChip(<Lock size={13} />, t('branding.kickstart.byomMissing')),
        })}

        {card({
          icon: <Upload size={20} />,
          title: t('branding.kickstart.ingest'),
          desc: t('branding.kickstart.ingestDesc'),
          disabled: !byomConnected,
          onClick: onIngest,
          foot: byomConnected
            ? footChip(<ArrowRight size={14} />, t('branding.kickstart.ingestAction'))
            : footChip(<Lock size={13} />, t('branding.kickstart.byomMissing')),
        })}

        {card({
          icon: <GitBranch size={20} />,
          title: t('branding.kickstart.inherit'),
          desc: t('branding.kickstart.inheritDesc'),
          onClick: onInherit,
          disabled: !canInherit,
          foot: canInherit
            ? footChip(<ArrowRight size={14} />, t('branding.kickstart.chooseProject'))
            : footChip(<Lock size={13} />, t('branding.kickstart.noOtherProjects')),
        })}

        {card({
          icon: <Wand2 size={20} />,
          title: t('branding.kickstart.scratch'),
          desc: t('branding.kickstart.scratchDesc'),
          onClick: onScratch,
          foot: footChip(<ArrowRight size={14} />, t('branding.kickstart.startBlank')),
        })}
      </div>

      <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2 text-[12px] text-muted">
          <ClipboardCheck size={15} className="text-accent-strong shrink-0" />
          {t('branding.kickstart.proposalHint')}
        </span>
        <span className="inline-flex items-center gap-2 text-[12px] text-faint sm:ml-auto">
          <Cpu size={15} className="shrink-0" />
          {byomConnected
            ? t('branding.kickstart.byom', { model: modelName })
            : t('branding.kickstart.byomMissing')}
        </span>
      </div>
    </div>
  )
}
