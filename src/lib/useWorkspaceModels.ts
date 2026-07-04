import { useWorkspace } from './workspace'
import { usePersistentValue } from './store'
import {
  CONNECTIONS,
  getEngine,
  seedConnections,
  seedDefaultEngine,
  seedPhaseEngines,
  effectiveEngineId,
  type Engine,
} from '../data/models'

// Per-workspace model/agent assignment: connected sources, a default engine, and per-phase overrides.
export function useWorkspaceModels() {
  const { activeWorkspace } = useWorkspace()
  const wsId = activeWorkspace?.id ?? '1'

  const [connectedIds, setConnectedIds] = usePersistentValue<string[]>('connections', wsId, seedConnections(wsId))
  const [defaultEngineId, setDefaultEngineId] = usePersistentValue<string>('defaultEngine', wsId, seedDefaultEngine(wsId))
  const [phaseEngines, setPhaseEnginesRaw] = usePersistentValue<Record<string, string>>(
    'phaseEngines',
    wsId,
    seedPhaseEngines(wsId),
  )
  // Motor de traducción: transversal (no es una fase). '' = usar el motor por defecto.
  const [translationEngineId, setTranslationEngineId] = usePersistentValue<string>('translationEngine', wsId, '')

  const connections = CONNECTIONS.filter((c) => connectedIds.includes(c.id))
  const engines = connections.flatMap((c) => c.engines)
  const connected = connections.length > 0

  const setPhaseEngine = (phaseKey: string, engineId: string | null) => {
    const next = { ...phaseEngines }
    if (engineId === null) delete next[phaseKey]
    else next[phaseKey] = engineId
    setPhaseEnginesRaw(next)
  }

  const liveEngineIds = (connIds: string[]) =>
    new Set(CONNECTIONS.filter((c) => connIds.includes(c.id)).flatMap((c) => c.engines.map((e) => e.id)))

  const connect = (connId: string) => {
    if (connectedIds.includes(connId)) return
    const nextIds = [...connectedIds, connId]
    setConnectedIds(nextIds)
    // Heal a default that was left dangling while disconnected.
    const live = liveEngineIds(nextIds)
    if (!live.has(defaultEngineId)) setDefaultEngineId([...live][0] ?? '')
  }

  const disconnect = (connId: string) => {
    const remaining = connectedIds.filter((id) => id !== connId)
    setConnectedIds(remaining)
    // Drop references to engines that no longer have a live connection.
    const live = liveEngineIds(remaining)
    if (!live.has(defaultEngineId)) setDefaultEngineId([...live][0] ?? '')
    const nextPhases: Record<string, string> = {}
    for (const [k, v] of Object.entries(phaseEngines)) if (live.has(v)) nextPhases[k] = v
    setPhaseEnginesRaw(nextPhases)
    if (translationEngineId && !live.has(translationEngineId)) setTranslationEngineId('')
  }

  const effectiveEngine = (phaseKey: string): Engine | undefined =>
    getEngine(effectiveEngineId(phaseKey, phaseEngines, defaultEngineId))
  // Motor efectivo de traducción: el asignado, o el motor por defecto si no se especificó.
  const effectiveTranslationEngine = (): Engine | undefined =>
    getEngine(translationEngineId || defaultEngineId)

  return {
    wsId,
    connectedIds,
    connections,
    engines,
    connected,
    defaultEngineId,
    setDefaultEngineId,
    phaseEngines,
    setPhaseEngine,
    setPhaseEngines: setPhaseEnginesRaw,
    translationEngineId,
    setTranslationEngineId,
    connect,
    disconnect,
    effectiveEngine,
    effectiveTranslationEngine,
  }
}
