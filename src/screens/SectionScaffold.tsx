import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Palette,
  Layers,
  Target,
  Map,
  Sparkles,
  Monitor,
  Database,
  Rocket,
  FileText,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { useWorkspace } from '../lib/workspace'

const ICONS: Record<string, LucideIcon> = {
  branding: Palette,
  designSystem: Layers,
  users: Target,
  architecture: Map,
  designStyle: Sparkles,
  visualizer: Monitor,
  cms: Database,
  publish: Rocket,
  brief: FileText,
}

export function SectionScaffold({ sectionKey }: { sectionKey: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { to } = useWorkspace()
  const Icon = ICONS[sectionKey] ?? Sparkles

  return (
    <div className="py-2 max-w-4xl">
      <PageHeader title={t(`sections.${sectionKey}.title`)} subtitle={t(`sections.${sectionKey}.desc`)} />
      <EmptyState
        icon={<Icon size={26} />}
        title={t('common.comingSoon')}
        description={t('common.comingSoonDesc')}
        action={
          <Button variant="secondary" onClick={() => navigate(to('brief'))}>
            <ArrowLeft size={15} />
            {t('common.backToBrief')}
          </Button>
        }
      />
    </div>
  )
}
