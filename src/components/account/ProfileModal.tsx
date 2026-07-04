import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { useAuth } from '../../lib/auth'
import { roleTone } from './userMeta'

const inputCls =
  'w-full h-10 rounded-xl bg-raised border border-line px-3 text-sm text-content placeholder:text-faint outline-none focus:border-accent'

export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)

  useEffect(() => {
    if (open) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [open, user])

  const canSave = name.trim().length > 0 && email.trim().length > 0
  const submit = () => {
    if (!canSave) return
    updateProfile({ name: name.trim(), email: email.trim() })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('account.profileTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSave}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={name.trim() || user.name} size={48} />
          <div>
            <Badge tone={roleTone(user.role)}>{t(`account.role.${user.role}`)}</Badge>
            <p className="text-[12px] text-faint mt-1.5">{t('account.roleManagedHint')}</p>
          </div>
        </div>

        <label className="block">
          <span className="block text-[13px] text-muted mb-1.5">{t('account.fieldName')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} autoFocus />
        </label>

        <label className="block">
          <span className="block text-[13px] text-muted mb-1.5">{t('account.fieldEmail')}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hola@estudio.com"
            className={inputCls}
          />
        </label>
      </div>
    </Modal>
  )
}
