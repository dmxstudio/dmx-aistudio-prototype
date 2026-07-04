import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { ROLES, STATUSES } from './userMeta'
import type { AppUser, UserRole, UserStatus } from '../../data/mock'
import type { UserDraft } from '../../lib/auth'

const inputCls =
  'w-full h-10 rounded-xl bg-raised border border-line px-3 text-sm text-content placeholder:text-faint outline-none focus:border-accent'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block flex-1">
      <span className="block text-[13px] text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function draftFrom(u?: AppUser | null): UserDraft {
  if (!u) return { name: '', email: '', role: 'editor', status: 'invited' }
  return { name: u.name, email: u.email, role: u.role, status: u.status }
}

export function UserModal({
  open,
  onClose,
  onSave,
  editUser,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: UserDraft, id?: string) => void
  editUser?: AppUser | null
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<UserDraft>(() => draftFrom(editUser))

  useEffect(() => {
    if (open) setDraft(draftFrom(editUser))
  }, [open, editUser])

  const canSave = draft.name.trim().length > 0 && draft.email.trim().length > 0
  const submit = () => {
    if (!canSave) return
    onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() }, editUser?.id)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editUser ? t('accounts.editTitle') : t('accounts.inviteTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSave}>
            {editUser ? t('common.save') : t('accounts.inviteAction')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={t('account.fieldName')}>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder={t('accounts.namePlaceholder')}
            className={inputCls}
            autoFocus
          />
        </Field>

        <Field label={t('account.fieldEmail')}>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            placeholder="persona@designo.mx"
            className={inputCls}
          />
        </Field>

        <div className="flex gap-3">
          <Field label={t('accounts.fieldRole')}>
            <Select
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as UserRole })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`account.role.${r}`)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={t('accounts.fieldStatus')}>
            <Select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as UserStatus })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`account.status.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  )
}
