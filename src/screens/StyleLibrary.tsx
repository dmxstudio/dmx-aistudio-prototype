import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SwatchBook, Plus, Pencil, Copy as CopyIcon, Trash2, Eye, RotateCcw } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { usePersistentValue } from '../lib/store'
import { SpecimenPreview } from '../components/designstyle/SpecimenPreview'
import { StyleProofOverlay } from '../components/designstyle/StyleProofOverlay'
import { FamilyEditor } from '../components/designstyle/FamilyEditor'
import { FAMILIES, FAMILY_IDS, STYLE_LIB_ID, emptyFamily, familyToSpec, styleFromSpec, specimenContent, familyCardContent, type StyleFamily } from '../lib/styleData'

// Librería de estilos — GLOBAL (taste corpus del estudio, GOD-only). Familias BASE (11) + del estudio.
// Base y custom son EDITABLES: editar una base guarda un OVERRIDE (mismo id) en el store; "restablecer"
// lo quita. Persistencia DURABLE. Las cards son auto-descriptivas (nombre=titular, tesis=párrafo).
export function StyleLibrary() {
  const { t } = useTranslation()
  const [stored, setStored] = usePersistentValue<StyleFamily[]>('styleLibrary', STYLE_LIB_ID, [])
  const [editing, setEditing] = useState<StyleFamily | null>(null)
  const [proofFamily, setProofFamily] = useState<StyleFamily | null>(null)

  const canon = useMemo(() => specimenContent(null, ''), [])
  // El store mezcla overrides de base (id ∈ FAMILY_IDS) + familias del estudio (fam-N).
  const overrides = useMemo(() => Object.fromEntries(stored.filter((f) => FAMILY_IDS.includes(f.id)).map((f) => [f.id, f])), [stored])
  const customs = useMemo(() => stored.filter((f) => !FAMILY_IDS.includes(f.id)), [stored])
  const resolveBase = (id: string): StyleFamily => overrides[id] ?? FAMILIES[id]
  const familyName = (f: StyleFamily) => (FAMILY_IDS.includes(f.id) ? t(`style.family.${f.id}`) : f.name || t('styleLib.untitled'))

  const nextId = () => {
    let max = 0
    stored.forEach((f) => { const m = /^fam-(\d+)$/.exec(f.id); if (m) max = Math.max(max, +m[1]) })
    return `fam-${max + 1}`
  }
  const createNew = () => setEditing(emptyFamily(nextId(), t('styleLib.newName')))
  const duplicate = (f: StyleFamily) => setEditing({ ...structuredClone(f), id: nextId(), name: `${familyName(f)} ${t('styleLib.copySuffix')}` })
  const edit = (f: StyleFamily) => setEditing(structuredClone(f))
  const save = (f: StyleFamily) => { // upsert por id (sirve para override de base y para custom)
    setStored(stored.some((x) => x.id === f.id) ? stored.map((x) => (x.id === f.id ? f : x)) : [...stored, f])
    setEditing(null)
  }
  const removeStored = (id: string) => setStored(stored.filter((f) => f.id !== id)) // borrar custom / restablecer base

  // content auto-descriptivo: el nombre ES el titular y la tesis el párrafo, dentro del specimen.
  const cardContent = (f: StyleFamily, builtin: boolean) => familyCardContent(builtin ? t('styleLib.base') : t('styleLib.studioTag'), familyName(f), f.thesis)

  const familyCard = (f: StyleFamily, builtin: boolean) => {
    const overridden = builtin && !!overrides[f.id]
    return (
      <div key={f.id} className="bg-surface border border-line rounded-2xl shadow-soft overflow-hidden flex flex-col">
        <div className="h-[200px] overflow-hidden border-b border-line bg-raised">
          <SpecimenPreview style={styleFromSpec(familyToSpec(f))} content={cardContent(f, builtin)} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <Button size="sm" variant="secondary" onClick={() => edit(f)}><Pencil size={14} />{t('styleLib.edit')}</Button>
          <Button size="sm" variant="ghost" onClick={() => setProofFamily(f)}><Eye size={14} />{t('styleLib.openProof')}</Button>
          {overridden && <span className="text-[10px] rounded-full px-2 py-0.5 bg-accent-soft text-accent-strong">{t('styleLib.edited')}</span>}
          <div className="ml-auto flex items-center gap-0.5">
            <Button size="sm" variant="ghost" onClick={() => duplicate(f)} aria-label={t('styleLib.duplicate')} title={t('styleLib.duplicate')}><CopyIcon size={14} /></Button>
            {builtin
              ? overridden && <Button size="sm" variant="ghost" onClick={() => removeStored(f.id)} aria-label={t('styleLib.reset')} title={t('styleLib.reset')}><RotateCcw size={14} /></Button>
              : <Button size="sm" variant="ghost" className="text-danger-strong" onClick={() => removeStored(f.id)} aria-label={t('styleLib.delete')} title={t('styleLib.delete')}><Trash2 size={14} /></Button>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-content inline-flex items-center gap-2"><SwatchBook size={20} className="text-accent-strong" />{t('styleLib.title')}</h1>
          <p className="text-sm text-muted mt-1 max-w-xl leading-relaxed">{t('styleLib.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={createNew}><Plus size={16} />{t('styleLib.new')}</Button>
      </div>

      {customs.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{t('styleLib.studio')}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{customs.map((f) => familyCard(f, false))}</div>
        </div>
      )}

      <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2">{t('styleLib.baseSection')}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{FAMILY_IDS.map((id) => familyCard(resolveBase(id), true))}</div>

      <FamilyEditor key={editing?.id ?? 'closed'} family={editing} onClose={() => setEditing(null)} onSave={save} />
      <StyleProofOverlay open={!!proofFamily} spec={proofFamily ? familyToSpec(proofFamily) : null} style={proofFamily ? styleFromSpec(familyToSpec(proofFamily)) : null} content={canon} title={proofFamily ? familyName(proofFamily) : ''} onClose={() => setProofFamily(null)} />
    </div>
  )
}
