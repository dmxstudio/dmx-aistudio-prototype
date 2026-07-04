import { useTranslation } from 'react-i18next'
import { Languages, Eye, EyeOff, Sparkles, ArrowRight, Info, Check } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { TransSummary } from '../../lib/translation'

// Vista PREVIA del sistema de traducción (docs/spec-traduccion-contenido.md). Sin funcionalidad
// real: los botones de traducir son inertes; el objetivo es auditar la UI/UX.

// Chip del hero: cobertura de traducción del idioma destino + toggle para ver el estado por campo.
export function TranslationStatus({
  targetShort,
  summary,
  view,
  onOpen,
  onToggleView,
}: {
  targetShort: string
  summary: TransSummary
  view: boolean
  onOpen: () => void
  onToggleView: () => void
}) {
  const { t } = useTranslation()
  // Color = estado "peor": pendientes → ámbar, IA sin auditar → acento, todo revisado → verde.
  const cls =
    summary.pendiente > 0
      ? 'bg-warning-soft text-warning-strong'
      : summary.ia > 0
        ? 'bg-accent-soft text-accent-strong'
        : 'bg-success-soft text-success-strong'
  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={onOpen}
        title={t('translation.chipTitle')}
        className={`inline-flex items-center gap-1.5 text-[12px] font-medium rounded-full px-2.5 py-1.5 ${cls} hover:opacity-90 transition-opacity`}
      >
        <Languages size={13} />
        {targetShort} {summary.done}/{summary.total}
      </button>
      <button
        onClick={onToggleView}
        aria-pressed={view}
        title={view ? t('translation.viewOff') : t('translation.viewOn')}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
          view ? 'text-accent-strong bg-accent-soft' : 'text-faint hover:text-accent-strong hover:bg-accent-soft'
        }`}
      >
        {view ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

// Panel "Traducir a X": ADAPTATIVO. Caso A (origen incompleto) recomienda completar el idioma
// nativo primero; Caso B (origen completo) recomienda traducir con IA y auditar después.
export function TranslationPanel({
  open,
  onClose,
  sourceLabel,
  targetLabel,
  summary,
  sourceIncomplete,
  remainingSource,
  engineLabel,
  onGoComplete,
  onShowByField,
}: {
  open: boolean
  onClose: () => void
  sourceLabel: string
  targetLabel: string
  summary: TransSummary
  sourceIncomplete: boolean
  remainingSource: number
  engineLabel: string
  onGoComplete: () => void
  onShowByField: () => void
}) {
  const { t } = useTranslation()
  const allDone = summary.pendiente === 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('translation.panelTitle', { lang: targetLabel })}
      size="lg"
      footer={
        sourceIncomplete ? (
          <>
            {/* Sin número: el count de pendientes de traducción y el de campos por completar en el
                origen son universos distintos; mostrar «(N)» aquí contradecía el aviso ámbar. */}
            <Button variant="ghost" onClick={onClose}>
              {t('translation.translateAnyway')}
            </Button>
            <Button variant="primary" onClick={onGoComplete}>
              {t('translation.goComplete')}
              <ArrowRight size={15} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t('translation.defer', { src: sourceLabel })}
            </Button>
            <Button variant="primary" onClick={onClose} disabled={allDone}>
              <Sparkles size={15} />
              {t('translation.translateAi', { n: summary.pendiente, engine: engineLabel })}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {/* Estado del origen y del destino */}
        {sourceIncomplete ? (
          <div className="rounded-xl border border-warning-soft bg-warning-soft p-3 flex items-start gap-2.5">
            <Info size={16} className="text-warning-strong shrink-0 mt-0.5" />
            <p className="text-[13px] text-warning-strong leading-snug">
              {t('translation.sourceIncomplete', { n: remainingSource, src: sourceLabel })}
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-content leading-snug">
            {t('translation.readySummary', { total: summary.total, src: sourceLabel, pending: summary.pendiente, tgt: targetLabel })}
          </p>
        )}

        {/* Desglose de estados (barra + leyenda) */}
        <div>
          <div className="h-2 rounded-full overflow-hidden flex bg-raised">
            <span className="h-full bg-success" style={{ width: pct(summary.revisado, summary.total) }} />
            <span className="h-full bg-accent" style={{ width: pct(summary.ia, summary.total) }} />
            <span className="h-full bg-warning" style={{ width: pct(summary.pendiente, summary.total) }} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px]">
            <Legend color="bg-success" label={t('translation.legendReviewed')} n={summary.revisado} />
            <Legend color="bg-accent" label={t('translation.legendAi')} n={summary.ia} />
            <Legend color="bg-warning" label={t('translation.legendPending')} n={summary.pendiente} />
          </div>
        </div>

        {allDone && !sourceIncomplete && (
          <div className="rounded-xl border border-success-soft bg-success-soft p-3 flex items-start gap-2.5">
            <Check size={16} className="text-success-strong shrink-0 mt-0.5" />
            <p className="text-[13px] text-success-strong leading-snug">
              {t('translation.allDone', { tgt: targetLabel, ia: summary.ia })}
            </p>
          </div>
        )}

        {/* Alcance (visual, inerte) */}
        {!sourceIncomplete && (
          <fieldset className="rounded-xl border border-line p-3">
            <legend className="px-1 text-[11px] font-medium text-muted">{t('translation.scopeLegend')}</legend>
            <label className="flex items-center gap-2 text-[13px] text-content py-1 cursor-pointer">
              <input type="radio" name="trans-scope" defaultChecked className="accent-accent" />
              {t('translation.scopeAll')}
            </label>
            <label className="flex items-center gap-2 text-[13px] text-content py-1 cursor-pointer">
              <input type="radio" name="trans-scope" className="accent-accent" />
              {t('translation.scopeSections')}
            </label>
          </fieldset>
        )}

        {/* Motor de traducción (viene de Inteligencia) */}
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <Sparkles size={13} className="text-accent-strong shrink-0" />
          <span>
            {t('translation.engineLine', { engine: engineLabel })} · {t('translation.engineHint')}
          </span>
        </div>

        {/* Ver por campo + nota de mockup */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-line">
          <button onClick={onShowByField} className="text-[12px] text-accent-strong hover:underline inline-flex items-center gap-1">
            <Eye size={13} />
            {t('translation.byFieldLink')}
          </button>
          <span className="text-[11px] text-faint">{t('translation.mockNote')}</span>
        </div>
      </div>
    </Modal>
  )
}

const pct = (n: number, total: number) => (total ? `${(100 * n) / total}%` : '0%')

function Legend({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {label} <span className="font-medium text-content">{n}</span>
    </span>
  )
}
