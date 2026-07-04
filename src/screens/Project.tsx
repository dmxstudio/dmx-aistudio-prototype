import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Smartphone, ArrowRight, GitBranch } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { BrandSourceSelector, type BrandSourceOption } from '../components/branding/BrandSourceSelector'
import { useWorkspace } from '../lib/workspace'

export function Project() {
  const { t } = useTranslation()
  const { workspaceProjects, createProject } = useWorkspace()
  const [brandSource, setBrandSource] = useState('own')

  const options = [
    { key: 'website', icon: Globe, title: t('project.website'), desc: t('project.websiteDesc') },
    { key: 'app', icon: Smartphone, title: t('project.app'), desc: t('project.appDesc') },
  ]
  const sourceOptions: BrandSourceOption[] = [
    { id: 'own', label: t('branding.ownBrand') },
    ...workspaceProjects.map((p) => ({
      id: `inherit:${p.id}`,
      label: t('branding.inheritFrom', { name: p.name }),
    })),
  ]
  const inheritedFrom =
    brandSource === 'own' ? null : workspaceProjects.find((p) => `inherit:${p.id}` === brandSource)?.name

  return (
    <div className="py-2 max-w-3xl">
      <PageHeader title={t('project.title')} subtitle={t('project.subtitle')} />

      <div className="grid sm:grid-cols-2 gap-4">
        {options.map((o) => {
          const Icon = o.icon
          return (
            <button
              key={o.key}
              onClick={() => createProject(o.key as 'website' | 'app', brandSource)}
              className="text-left"
            >
              <Card className="p-5 h-full hover:border-accent transition-colors">
                <span className="inline-flex w-11 h-11 rounded-xl bg-accent-soft text-accent-strong items-center justify-center mb-4">
                  <Icon size={20} />
                </span>
                <h3 className="font-display text-lg font-bold text-content">{o.title}</h3>
                <p className="text-sm text-muted mt-1">{o.desc}</p>
                <span className="inline-flex items-center gap-1 text-[13px] text-accent-strong mt-4">
                  {t('common.create')} <ArrowRight size={14} />
                </span>
              </Card>
            </button>
          )
        })}
      </div>

      <div className="mt-4 bg-surface border border-line rounded-2xl shadow-soft p-4">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch size={15} className="text-accent" />
          <span className="text-sm font-medium text-content">{t('project.brandStep')}</span>
        </div>
        <BrandSourceSelector value={brandSource} options={sourceOptions} onChange={setBrandSource} />
        {inheritedFrom && (
          <p className="text-[12px] text-muted mt-2.5">{t('project.brandHint', { name: inheritedFrom })}</p>
        )}
      </div>
    </div>
  )
}
