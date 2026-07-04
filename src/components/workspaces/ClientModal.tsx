import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { COUNTRIES, type Client, type CountryCode } from '../../data/mock'

interface Draft {
  name: string
  email: string
  countryCode: CountryCode
  phone: string
}

const inputCls =
  'w-full h-10 rounded-xl bg-raised border border-line px-3 text-sm text-content placeholder:text-faint outline-none focus:border-accent'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] text-muted mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function clientToDraft(c?: Client | null): Draft {
  if (!c) return { name: '', email: '', countryCode: '+52', phone: '' }
  return { name: c.name, email: c.email ?? '', countryCode: c.countryCode, phone: c.phone }
}

export function ClientModal({
  open,
  onClose,
  onSave,
  client,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; email: string; countryCode: CountryCode; phone: string }, id?: string) => void
  client?: Client | null
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Draft>(() => clientToDraft(client))

  useEffect(() => {
    if (open) setDraft(clientToDraft(client))
  }, [open, client])

  const canSave = draft.name.trim().length > 0

  const submit = () => {
    if (!canSave) return
    onSave(
      {
        name: draft.name.trim(),
        email: draft.email.trim(),
        countryCode: draft.countryCode,
        phone: draft.phone.replace(/\D/g, ''),
      },
      client?.id,
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={client ? t('workspaces.modalEditTitle') : t('workspaces.modalCreateTitle')}
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
        <Field label={t('workspaces.fieldName')}>
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder={t('workspaces.fieldNamePlaceholder')}
            className={inputCls}
            autoFocus
          />
        </Field>

        <Field label={t('workspaces.fieldEmail')}>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            placeholder="hola@cliente.com"
            className={inputCls}
          />
        </Field>

        <Field label={t('workspaces.fieldPhone')}>
          <div className="flex gap-2">
            <Select
              value={draft.countryCode}
              onChange={(e) => setDraft({ ...draft, countryCode: e.target.value as CountryCode })}
            >
              {COUNTRIES.map((co) => (
                <option key={co.code} value={co.code}>
                  {t(co.labelKey)}
                </option>
              ))}
            </Select>
            <input
              type="tel"
              inputMode="numeric"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              placeholder={t('workspaces.phonePlaceholder')}
              className={inputCls}
            />
          </div>
          <p className="text-xs text-faint mt-1.5">{t('workspaces.phoneHint')}</p>
        </Field>
      </div>
    </Modal>
  )
}
