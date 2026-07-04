import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { UserModal } from '../components/account/UserModal'
import { roleTone, statusTone } from '../components/account/userMeta'
import { useAuth, type UserDraft } from '../lib/auth'
import type { AppUser } from '../data/mock'

export function AccountsAdmin() {
  const { t } = useTranslation()
  const { user, users, addUser, updateUser, removeUser } = useAuth()
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [deleting, setDeleting] = useState<AppUser | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q)) : users
  }, [users, query])

  const openInvite = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (u: AppUser) => {
    setEditing(u)
    setModalOpen(true)
  }
  const save = (data: UserDraft, id?: string) => {
    if (id) updateUser(id, data)
    else addUser(data)
  }
  const confirmRemove = () => {
    if (deleting) removeUser(deleting.id)
    setDeleting(null)
  }

  return (
    <div className="py-2">
      <PageHeader
        title={t('accounts.title')}
        subtitle={t('accounts.subtitle')}
        actions={
          <Button variant="primary" onClick={openInvite}>
            <Plus size={16} />
            {t('accounts.invite')}
          </Button>
        }
      />

      <div className="relative max-w-xs mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('accounts.searchPlaceholder')}
          className="w-full h-10 rounded-full bg-surface border border-line pl-10 pr-4 text-sm text-content placeholder:text-faint outline-none focus:border-accent"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted">{t('accounts.empty', { q: query })}</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="hidden sm:flex items-center gap-4 px-5 py-3 border-b border-line text-[11px] font-medium text-faint uppercase tracking-wide">
            <span className="flex-1">{t('accounts.colUser')}</span>
            <span className="w-28">{t('accounts.fieldRole')}</span>
            <span className="w-28">{t('accounts.fieldStatus')}</span>
            <span className="w-16 text-right">{t('accounts.colActions')}</span>
          </div>

          {filtered.map((u) => {
            const isSelf = u.id === user.id
            return (
              <div
                key={u.id}
                className="flex items-center gap-4 px-5 py-3 border-b border-line last:border-0 hover:bg-raised/40 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={u.name} size={38} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-content truncate">
                      {u.name}
                      {isSelf && <span className="text-[11px] text-accent-strong font-normal"> · {t('accounts.you')}</span>}
                    </p>
                    <p className="text-[12px] text-muted truncate">{u.email}</p>
                  </div>
                </div>

                <div className="w-28 hidden sm:block">
                  <Badge tone={roleTone(u.role)}>{t(`account.role.${u.role}`)}</Badge>
                </div>
                <div className="w-28 hidden sm:block">
                  <Badge tone={statusTone(u.status)}>{t(`account.status.${u.status}`)}</Badge>
                </div>

                <div className="w-16 flex items-center justify-end gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(u)}
                    aria-label={t('common.edit')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-faint hover:text-accent-strong hover:bg-accent-soft transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleting(u)}
                    disabled={isSelf}
                    aria-label={t('common.delete')}
                    title={isSelf ? t('accounts.cannotDeleteSelf') : undefined}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-faint hover:text-danger-strong hover:bg-danger-soft transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      <UserModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={save} editUser={editing} />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        size="sm"
        title={t('accounts.deleteTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              <Trash2 size={15} />
              {t('common.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">{deleting && t('accounts.deleteDesc', { name: deleting.name })}</p>
      </Modal>
    </div>
  )
}
