import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Brain, MessageCircle, Search, Pencil, Trash2, ArrowRight } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { ClientModal } from '../components/workspaces/ClientModal'
import { type Client, type CountryCode } from '../data/mock'
import { useWorkspace } from '../lib/workspace'
import { getPersistentValue } from '../lib/store'
import { seedDefaultEngine, getEngine, getConnection } from '../data/models'

type ClientDraft = { name: string; email: string; countryCode: CountryCode; phone: string }

export function Workspaces() {
  const { t } = useTranslation()
  const { workspaces, selectWorkspace, addWorkspace, updateWorkspace, removeWorkspace, projectCountFor } =
    useWorkspace()
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const filtered = useMemo(
    () => workspaces.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [workspaces, query],
  )

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (c: Client) => {
    setEditing(c)
    setModalOpen(true)
  }
  const openWorkspace = (c: Client) => {
    selectWorkspace(c.id) // selectWorkspace navigates to the workspace's first project
  }
  const save = (data: ClientDraft, id?: string) => {
    if (id) updateWorkspace(id, data)
    else addWorkspace(data)
  }
  const remove = (c: Client) => {
    removeWorkspace(c.id)
    setDeleting(null)
  }

  return (
    <div className="py-2">
      <PageHeader
        title={t('workspaces.title')}
        subtitle={t('workspaces.subtitle')}
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            {t('workspaces.newClient')}
          </Button>
        }
      />

      <div className="relative max-w-xs mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('workspaces.searchPlaceholder')}
          className="w-full h-10 rounded-full bg-surface border border-line pl-10 pr-4 text-sm text-content placeholder:text-faint outline-none focus:border-accent"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted">
            {query ? t('workspaces.emptySearch', { q: query }) : t('workspaces.empty')}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const engId = getPersistentValue('defaultEngine', c.id, seedDefaultEngine(c.id))
            const conn = engId ? getConnection(getEngine(engId)?.connectionId ?? '') : undefined
            const configured = !!conn
            return (
              <Card key={c.id} className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={c.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-content truncate">{c.name}</p>
                    <p className="text-xs text-muted truncate">
                      {c.email || `${projectCountFor(c.id)} ${t('workspaces.projectsLabel')}`}
                    </p>
                  </div>
                  <Badge tone={configured ? 'success' : 'neutral'}>
                    {configured ? t('workspaces.statusActive') : t('workspaces.statusDraft')}
                  </Badge>
                </div>

                <div className="rounded-xl bg-raised border border-line p-3 flex items-center gap-2">
                  <Brain size={15} className="text-accent shrink-0" />
                  <span className="text-[13px] text-muted shrink-0">{t('workspaces.intelligence')}:</span>
                  <span className="text-[13px] text-content font-medium truncate">
                    {conn?.name ?? t('workspaces.notConfigured')}
                  </span>
                </div>

                {c.phone && (
                  <a
                    href={`https://wa.me/${c.countryCode.replace('+', '')}${c.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center gap-2 rounded-xl bg-raised border border-line px-3 h-10 hover:border-accent transition-colors"
                  >
                    <MessageCircle size={15} className="text-success-strong shrink-0" />
                    <span className="text-[13px] text-content flex-1 truncate">
                      {c.countryCode} {c.phone}
                    </span>
                    <span className="text-[12px] text-success-strong font-medium">{t('workspaces.whatsapp')}</span>
                  </a>
                )}

                <div className="flex gap-2 mt-auto pt-3">
                  <Button variant="primary" className="flex-1" onClick={() => openWorkspace(c)}>
                    {t('common.open')}
                    <ArrowRight size={15} />
                  </Button>
                  <Button variant="secondary" onClick={() => openEdit(c)} aria-label={t('common.edit')}>
                    <Pencil size={15} />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setDeleting(c)}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={save}
        client={editing}
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="sm"
        title={t('workspaces.deleteTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={() => deleting && remove(deleting)}>
              <Trash2 size={15} />
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {deleting && t('workspaces.deleteDesc', { name: deleting.name })}
        </p>
      </Modal>
    </div>
  )
}
