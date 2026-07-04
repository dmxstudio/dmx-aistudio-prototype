import type { ArchSpec } from './archData'
import { needsCms } from './vizData'
import type { CmsTarget } from './cmsData'

// Fase 9 — PUBLICAR. El DesignBuild firmado (+ CMS opcional) se convierte en un DeployBuild firmado y una URL
// en vivo (+ share link para el cliente). La PLATAFORMA mueve la frontera: sin CMS = host estático (Publish
// delgado) · Payload = sitio + API (Node) · Instatic = contenedor (Instatic YA es el publisher → Publish
// mínimo). El deploy es SIMULADO/honesto: en producción lo ejecuta tu pipeline de deploy (BYO infra). Cierra
// el pipeline; el share link es el hand-off. Ver memoria publish-panel + handoff-share-link.

// hash djb2 → base36 (fingerprint de CONTENIDO, no cripto — mismo criterio que vizData).
export const sig = (obj: unknown): string => {
  const s = JSON.stringify(obj ?? null)
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

export type HostKind = 'static' | 'node' | 'container'
export const HOSTS: Record<HostKind, string[]> = {
  static: ['Vercel', 'Netlify', 'Cloudflare Pages'],
  node: ['Railway', 'Render', 'Fly.io'],
  container: ['Railway', 'Render', 'VPS'],
}
// La plataforma del CMS decide el tipo de host (y qué tan delgado queda Publish).
export const hostKind = (withCms: boolean, platform: CmsTarget | null): HostKind =>
  !withCms ? 'static' : platform === 'instatic' ? 'container' : 'node'

// ¿el proyecto pasa por CMS? (la misma decisión del Visualizador: auto = roles de colección, o forzado).
export const resolveCms = (arch: ArchSpec | null, mode: 'auto' | 'yes' | 'no'): boolean =>
  mode === 'auto' ? (arch ? needsCms(arch) : false) : mode === 'yes'

export const PUBLISH_ENV = ['analytics', 'forms', 'sitemap', 'cdn']
export const defaultEnv = (): Record<string, boolean> => ({ analytics: true, forms: true, sitemap: true, cdn: false })

// ── DeployBuild: el manifiesto de deploy firmado (cara-máquina). El eslabón final de la cadena de firmas:
// StyleSpec → DesignBuild → (ContentBuild) → DeployBuild. La firma = identidad de la versión publicada. ──
export interface DeployBuild {
  meta: { project: string; generatedFrom: string }
  routing: 'design_build' | 'design_build + cms'
  target: { kind: HostKind; host: string }
  domain: string
  env: Record<string, boolean>
  source: { style: string; arch: string; designBuild: string; cms: string | null } // procedencia (firmas aguas arriba)
  fingerprint: string
}
export interface PublishInputs { projectName: string; withCms: boolean; platform: CmsTarget | null; styleSig: string; archSig: string; designBuildSig: string; cmsSig: string | null }

export function buildDeployBuild(inp: PublishInputs, host: string, domain: string, env: Record<string, boolean>): DeployBuild {
  const kind = hostKind(inp.withCms, inp.platform)
  const routing: DeployBuild['routing'] = inp.withCms ? 'design_build + cms' : 'design_build'
  const source = { style: inp.styleSig, arch: inp.archSig, designBuild: inp.designBuildSig, cms: inp.cmsSig }
  const fingerprint = sig([routing, kind, host, domain, env, source])
  return { meta: { project: inp.projectName || 'Proyecto', generatedFrom: 'DesignBuild firmado' }, routing, target: { kind, host }, domain, env, source, fingerprint }
}

// ── Pre-flight (enforcement al deploy): no se publica sin DesignBuild firmado, CMS listo (si aplica) y dominio. ──
export interface Check { key: string; ok: boolean }
export function publishChecklist(inp: PublishInputs, domain: string): Check[] {
  return [
    { key: 'designBuild', ok: !!inp.designBuildSig }, // DesignBuild sellado
    { key: 'cms', ok: !inp.withCms || !!inp.cmsSig }, // paquete de CMS listo si el proyecto lo lleva
    { key: 'domain', ok: domain.trim().length > 0 },
  ]
}
export const publishReady = (checks: Check[]): boolean => checks.every((c) => c.ok)

// Pasos del deploy SIMULADO (log escalonado, honesto — en producción lo ejecuta la infra del cliente).
export const DEPLOY_STEPS = ['build', 'bundle', 'upload', 'dns', 'live']

// Share link = el hand-off al cliente (que no entró al cockpit del owner). La firma es la identidad de versión.
export const shareLink = (fingerprint: string): string => `https://studio.dmx/live/${fingerprint}`
