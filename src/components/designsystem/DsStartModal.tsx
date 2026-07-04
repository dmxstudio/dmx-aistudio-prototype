import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, Loader2, GitBranch, X, Info } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { extractImportBrand } from '../../lib/dsData'

export type DsStartMode = 'inherit' | 'import' | null
export type ImportVals = { brandHex?: string; fontDisplay?: string }

const taCls =
  'w-full rounded-xl bg-raised border border-line px-3 py-2.5 text-sm text-content placeholder:text-faint outline-none focus:border-accent resize-none font-mono text-[12px]'

// Modal de las entradas Heredar / Importar. Import es un MOCKUP: la reconciliación real de
// conflictos con la Marca llega en la Fase 3 (revisión por grupos). Ver design-system-approach.
export function DsStartModal({
  mode,
  inheritOptions,
  onClose,
  onInherit,
  onImport,
}: {
  mode: DsStartMode
  inheritOptions: { id: string; label: string }[]
  onClose: () => void
  onInherit: (id: string) => void
  onImport: (vals: ImportVals) => void
}) {
  const { t } = useTranslation()
  const [fileName, setFileName] = useState('')
  const [fileText, setFileText] = useState('')
  const [paste, setPaste] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!mode) return
    setFileName('')
    setFileText('')
    setPaste('')
    setAnalyzing(false)
  }, [mode])

  // El archivo subido se LEE de verdad (su texto entra a la ingesta); si no, se usa el pegado.
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    f.text().then(setFileText).catch(() => setFileText(''))
  }
  const clearFile = () => {
    setFileName('')
    setFileText('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // Ingesta simulada: breve estado "analizando…", parsea el JSON (archivo o pegado) y genera.
  useEffect(() => {
    if (!analyzing) return
    const id = setTimeout(() => onImport(extractImportBrand(fileText || paste)), 1300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzing])

  if (!mode) return null

  const hasImport = !!fileText.trim() || !!paste.trim()
  const title = mode === 'inherit' ? t('ds.start.inheritTitle') : t('ds.start.importTitle')

  const footer =
    mode === 'inherit' ? (
      <Button variant="ghost" onClick={onClose}>
        {t('common.cancel')}
      </Button>
    ) : (
      <>
        <Button variant="ghost" onClick={onClose} disabled={analyzing}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" disabled={!hasImport || analyzing} onClick={() => setAnalyzing(true)}>
          {analyzing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {t('ds.start.analyze')}
        </Button>
      </>
    )

  return (
    <Modal open={!!mode} onClose={analyzing ? () => {} : onClose} title={title} footer={footer}>
      {analyzing ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Loader2 size={26} className="text-accent-strong animate-spin" />
          <p className="text-sm text-content">{t('ds.start.analyzing')}</p>
          <p className="text-[12px] text-faint">{t('ds.start.analyzingHint')}</p>
        </div>
      ) : mode === 'inherit' ? (
        <div className="space-y-2">
          <p className="text-[13px] text-muted mb-1">{t('ds.start.inheritPick')}</p>
          {inheritOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => onInherit(o.id)}
              className="w-full flex items-center gap-2.5 rounded-xl border border-line px-3 h-11 hover:bg-raised hover:border-accent transition-colors text-left"
            >
              <GitBranch size={15} className="text-accent shrink-0" />
              <span className="flex-1 text-[13px] text-content truncate">{o.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Reconciliación con la Marca: nota clave del enfoque (fuente de verdad + conflictos). */}
          <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft p-3">
            <Info size={16} className="text-accent-strong shrink-0 mt-0.5" />
            <p className="text-[12px] text-accent-strong leading-relaxed">{t('ds.start.reconcile')}</p>
          </div>

          <input ref={fileRef} type="file" accept=".json,application/json" onChange={onFile} className="hidden" />
          {fileName ? (
            <div className="flex items-center gap-2 bg-raised border border-line rounded-xl px-3 h-11">
              <FileText size={16} className="text-accent-strong shrink-0" />
              <span className="flex-1 text-[13px] text-content truncate">{fileName}</span>
              <button onClick={clearFile} aria-label={t('common.delete')} className="text-faint hover:text-danger-strong">
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-6 text-muted hover:text-content hover:border-accent transition-colors"
            >
              <Upload size={20} />
              <span className="text-[13px]">{t('ds.start.uploadJson')}</span>
            </button>
          )}

          <div>
            <label className="block text-[13px] text-muted mb-1.5">{t('ds.start.pasteLabel')}</label>
            <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} placeholder={t('ds.start.pastePlaceholder')} className={taCls} />
          </div>
        </div>
      )}
    </Modal>
  )
}
