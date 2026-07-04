import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Rocket, Check, ArrowRight, Lock, Braces, Copy, Download, RotateCcw, Globe, Server, Box, Cloud, Link2, ShieldCheck, CircleAlert, ExternalLink, Fingerprint, Sparkles, PartyPopper, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { EnginePill } from '../components/models/EnginePill'
import { useWorkspace } from '../lib/workspace'
import { usePersistentValue, getPersistentValue, loadSections } from '../lib/store'
import { seedBrandingRead, type BrandSection } from '../data/branding'
import { buildBookTokens } from '../lib/bookData'
import type { ArchSpec } from '../lib/archData'
import type { StyleSpec } from '../lib/styleData'
import type { UsersSpec } from '../lib/usersData'
import { vizPages, criticalPageId, buildGenerationPlan, buildIsCurrent, type VizSpec, type PageEdit } from '../lib/vizData'
import { cmsAllApproved, type CmsSpec, type CmsTarget, type CmsApprovals } from '../lib/cmsData'
import { sig, HOSTS, hostKind, resolveCms, PUBLISH_ENV, defaultEnv, buildDeployBuild, publishChecklist, publishReady, DEPLOY_STEPS, shareLink, type HostKind } from '../lib/publishData'

// Publicar (fase 9, agente Dev Ninja) — cockpit de deploy. El DesignBuild firmado (+ CMS opcional) → DeployBuild
// firmado + URL en vivo + share link. La plataforma mueve la frontera (host estático/node/contenedor). Deploy
// SIMULADO honesto: en producción lo ejecuta la infra del cliente. Cierra el pipeline. Ver memoria publish-panel.

const KIND_ICON: Record<HostKind, typeof Cloud> = { static: Cloud, node: Server, container: Box }
const PHASES = ['brief', 'branding', 'designSystem', 'users', 'architecture', 'designStyle', 'visualizer', 'cms', 'publish']

interface PublishConfig { started: boolean; host: string; domain: string; env: Record<string, boolean> }

export function Publish() {
  const { t } = useTranslation()
  const { activeProject, to } = useWorkspace()
  const projectId = activeProject?.id ?? 'p1'
  const projectName = activeProject?.name ?? ''

  const [config, setConfig] = usePersistentValue<PublishConfig>('publishConfig', projectId, { started: false, host: '', domain: '', env: defaultEnv() })
  const [publishedSig, setPublishedSig] = usePersistentValue<string>('publishedSig', projectId, '')
  const [deployStep, setDeployStep] = useState(-1) // -1 = no desplegando; 0..N = paso actual
  const [machineOpen, setMachineOpen] = useState(false)
  const [copied, setCopied] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // El deploy simulado es un timer transitorio + estado no-persistido: al cambiar de proyecto (o desmontar)
  // hay que cancelarlo y resetear el paso, o el progreso de un proyecto se filtra al otro. Ver publish-panel.
  useEffect(() => {
    setDeployStep(-1)
    return () => { if (timer.current) { clearTimeout(timer.current); timer.current = null } }
  }, [projectId])

  // Upstream: el DesignBuild firmado + el CMS opcional + procedencia + los estados que definen su VIGENCIA.
  const vizSpec = getPersistentValue<VizSpec | null>('vizSpec', projectId, null)
  const vizApproved = getPersistentValue<string>('vizApproved', projectId, '')
  const cmsMode = getPersistentValue<'auto' | 'yes' | 'no'>('vizCmsMode', projectId, 'auto')
  const cmsSpec = getPersistentValue<CmsSpec | null>('cmsSpec', projectId, null)
  const cmsApproved = getPersistentValue<CmsApprovals>('cmsApproved', projectId, {})
  const styleApproved = getPersistentValue<string>('styleApproved', projectId, '')
  const styleSpec = getPersistentValue<StyleSpec | null>('styleSpec', projectId, null)
  const users = getPersistentValue<UsersSpec | null>('usersSpec', projectId, null)
  const arch = getPersistentValue<ArchSpec | null>('archSpec', projectId, null)
  const pageEdits = getPersistentValue<Record<string, PageEdit>>('vizPageEdits', projectId, {})
  const pageApproved = getPersistentValue<Record<string, string>>('vizPageApproved', projectId, {})

  // GATE HONESTO: no basta `vizApproved === fingerprint`. El fingerprint NO incluye la capa del owner
  // (pageEdits/approvedPages) ni el drift aguas arriba, así que Publicar rehace la MISMA vigencia que el
  // Visualizador (buildIsCurrent) — si el owner editó/desavaló una página tras firmar, o el upstream derivó,
  // el build ya no está firmado y no se publica. realIds es determinista (rol crítico) → páginas reconstruibles.
  const branding = useMemo(() => loadSections<BrandSection>('branding', projectId, () => seedBrandingRead(projectId)), [projectId])
  const dsSig = useMemo(() => JSON.stringify(buildBookTokens(branding)), [branding])
  const pages = useMemo(() => { const c = arch ? criticalPageId(arch) : null; return arch ? vizPages(arch, c ? [c] : []) : [] }, [arch])
  const realPages = useMemo(() => pages.filter((p) => p.renderMode === 'real'), [pages])
  const currentPlanId = useMemo(() => (arch && styleSpec ? buildGenerationPlan(pages, styleSpec, arch, users, dsSig).planId : ''), [pages, styleSpec, arch, users, dsSig])
  const sealed = buildIsCurrent({ vizSpec, vizApproved, currentPlanId, realPages, pageEdits, approvedPages: pageApproved })

  const withCms = resolveCms(arch, cmsMode)
  const platform: CmsTarget | null = withCms ? cmsSpec?.target ?? null : null
  const kind = hostKind(withCms, platform)
  // El pre-flight de CMS exige TODOS los tipos aprobados (no solo que exista el spec). Fuente: cmsAllApproved.
  const cmsReady = !withCms || (!!cmsSpec && cmsAllApproved(cmsSpec, cmsApproved))
  const inputs = {
    projectName, withCms, platform, cmsReady,
    styleSig: styleApproved ? sig(styleApproved) : '', archSig: sig(arch?.pages ?? null), designBuildSig: vizApproved, cmsSig: withCms && cmsSpec ? sig(cmsSpec) : null,
  }

  const env = { ...defaultEnv(), ...(config.env ?? {}) }
  // Si el host persistido no pertenece al kind actual (el owner cambió de plataforma después de elegirlo),
  // no lo dejes filtrarse al DeployBuild firmado — cae al default del kind. Ver review publish-panel.
  const host = HOSTS[kind].includes(config.host) ? config.host : HOSTS[kind][0]
  const domain = config.domain ?? ''
  const deployBuild = buildDeployBuild(inputs, host, domain, env)
  const checks = publishChecklist(inputs, domain)
  const ready = publishReady(checks)
  const deploying = deployStep >= 0
  const publishStatus: 'draft' | 'published' | 'outdated' = !publishedSig ? 'draft' : publishedSig === deployBuild.fingerprint ? 'published' : 'outdated'
  const deployJson = JSON.stringify(deployBuild, null, 2)
  const liveUrl = domain.trim() ? (domain.startsWith('http') ? domain : `https://${domain}`) : `https://${(projectName || 'proyecto').toLowerCase().replace(/\s+/g, '-')}.dmx.live`

  const prepare = () => setConfig({ ...config, started: true }) // el host default lo resuelve la derivación guardada
  const reset = () => { setConfig({ started: false, host: '', domain: '', env: defaultEnv() }); setPublishedSig('') }
  const setHost = (h: string) => setConfig({ ...config, host: h })
  const setDomain = (d: string) => setConfig({ ...config, domain: d })
  const toggleEnv = (k: string) => setConfig({ ...config, env: { ...env, [k]: !env[k] } })
  const copyText = (text: string, tag: string) => navigator.clipboard?.writeText(text).then(() => { setCopied(tag); setTimeout(() => setCopied(''), 1500) }).catch(() => {})
  const download = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([deployJson], { type: 'application/json' })); a.download = 'deploy.json'; a.click(); URL.revokeObjectURL(a.href) }

  const publish = () => {
    if (!ready || deploying) return
    const targetSig = deployBuild.fingerprint
    setDeployStep(0)
    let i = 0
    const tick = () => {
      i += 1
      // i == length deja TODOS los pasos en verde un beat antes de publicar; i > length cierra el deploy.
      if (i <= DEPLOY_STEPS.length) { setDeployStep(i); timer.current = setTimeout(tick, 560) }
      else { timer.current = null; setDeployStep(-1); setPublishedSig(targetSig) } // en producción lo ejecuta la infra del cliente
    }
    timer.current = setTimeout(tick, 420)
  }

  // ── Kickstart (gate por el DesignBuild firmado) ─────────────────────────────
  if (!config.started || !sealed) {
    return (
      <div className="py-2">
        <div className="flex items-center gap-2 flex-wrap mb-4"><EnginePill phase="publish" /></div>
        <div className="bg-surface border border-line rounded-2xl shadow-soft p-6 lg:p-8">
          <div className="text-center max-w-md mx-auto mb-6">
            <div className="w-11 h-11 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-3"><Rocket size={22} className="text-accent-strong" /></div>
            <h2 className="font-display text-xl font-bold text-content">{t('publish.kickstart.title')}</h2>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{t('publish.kickstart.subtitle')}</p>
          </div>
          <div className="max-w-md mx-auto">
            {sealed ? (
              <button onClick={prepare} className="w-full text-left rounded-xl p-4 border-2 border-accent hover:bg-raised transition-colors flex flex-col gap-2 cursor-pointer">
                <div className="flex items-center gap-2"><span className="text-accent-strong"><Rocket size={20} /></span><span className="text-[15px] font-medium text-content">{t('publish.kickstart.prepare')}</span><span className="ml-auto text-[11px] font-medium bg-accent-soft text-accent-strong rounded-full px-2 py-0.5">{t('branding.kickstart.recommended')}</span></div>
                <p className="text-[13px] leading-snug text-muted">{t('publish.kickstart.prepareDesc')}</p>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] rounded-full px-2.5 py-1 w-fit bg-accent-soft text-accent-strong"><Fingerprint size={13} />{t('publish.kickstart.designBuild', { fp: vizSpec!.fingerprint })}</div>
              </button>
            ) : (
              <div className="w-full rounded-xl p-4 border border-line bg-raised flex flex-col gap-2">
                <div className="flex items-center gap-2"><Lock size={18} className="text-faint" /><span className="text-[15px] font-medium text-muted">{t('publish.kickstart.blocked')}</span></div>
                <p className="text-[13px] leading-snug text-muted">{t('publish.kickstart.blockedDesc')}</p>
                <Link to={to('visualizer', 'project')} className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-accent-strong hover:underline w-fit"><ArrowRight size={14} />{t('publish.kickstart.goViz')}</Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-x-5 gap-y-2 flex-wrap mt-6 pt-5 border-t border-line max-w-md mx-auto">
            <span className="inline-flex items-center gap-2 text-[12px] text-muted"><Link2 size={15} className="text-accent-strong shrink-0" />{t('publish.kickstart.footHint')}</span>
          </div>
        </div>
      </div>
    )
  }

  const KindIcon = KIND_ICON[kind]

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <EnginePill phase="publish" />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={reset}><RotateCcw size={14} />{t('publish.reset')}</Button>
          <Button size="sm" variant="secondary" onClick={() => setMachineOpen(true)} aria-label="deploy.json" title="deploy.json"><Braces size={15} /></Button>
        </div>
      </div>

      {/* Resumen + procedencia */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[13px] text-muted inline-flex items-center gap-1.5"><Check size={13} className="text-success-strong" />{t(`publish.routing.${withCms ? 'cms' : 'static'}`, { platform: platform ? t(`cms.provider.${platform}`) : '' })}</div>
            <div className="font-display text-lg font-bold text-content">{t('publish.titleFor', { name: projectName || t('publish.untitled') })}</div>
            <div className="text-[12px] text-faint mt-0.5 inline-flex items-center gap-1"><Fingerprint size={12} />{t('publish.deployFp', { fp: deployBuild.fingerprint })}</div>
          </div>
          {publishStatus === 'published' ? <Badge tone="success"><Check size={11} />{t('publish.live')}</Badge> : publishStatus === 'outdated' ? <Badge tone="warning"><CircleAlert size={11} />{t('publish.changed')}</Badge> : <Badge tone="neutral">{t('publish.draft')}</Badge>}
        </div>
        {/* Procedencia: cuatro firmas HERMANAS que alimentan el DeployBuild (no una derivación en cadena —
            el CMS se deriva de la Arquitectura, no del DesignBuild; por eso separadores, no flechas). */}
        <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-line flex-wrap text-[11px] font-mono text-faint">
          <span className="text-muted normal-case font-sans inline-flex items-center gap-1"><ShieldCheck size={12} className="text-accent-strong" />{t('publish.chain')}</span>
          {([['style', inputs.styleSig], ['arch', inputs.archSig], ['designBuild', inputs.designBuildSig], ...(withCms ? [['cms', inputs.cmsSig ?? '—'] as const] : [])] as const).map(([k, v], i) => (
            <span key={k} className="inline-flex items-center gap-1.5">{i > 0 && <span className="text-faint" aria-hidden>·</span>}<span className="rounded-full px-2 py-0.5 bg-raised border border-line">{k}:{v || '—'}</span></span>
          ))}
        </div>
      </div>

      {/* Destino (host según plataforma) + dominio + env */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-muted uppercase tracking-wide inline-flex items-center gap-1.5"><KindIcon size={13} className="text-accent-strong" />{t('publish.host')}</span>
          <span className="text-[11px] rounded-full px-2 py-0.5 bg-raised border border-line text-muted">{t(`publish.kind.${kind}`)}</span>
          <span className="text-[12px] text-faint">· {t(`publish.kindNote.${kind}`)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {HOSTS[kind].map((h) => (
            <button key={h} onClick={() => setHost(h)} className={`text-[12px] rounded-full px-3 py-1 border transition-colors ${host === h ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{h}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <label className="block">
            <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1 inline-flex items-center gap-1.5"><Globe size={12} className="text-accent-strong" />{t('publish.domain')}</span>
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder={t('publish.domainPh')} className="w-full text-[13px] rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-content font-mono" />
          </label>
          <div>
            <span className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1">{t('publish.env')}</span>
            <div className="flex flex-wrap gap-1.5">
              {PUBLISH_ENV.map((k) => (
                <button key={k} onClick={() => toggleEnv(k)} className={`text-[12px] rounded-full px-2.5 py-1 border transition-colors inline-flex items-center gap-1 ${env[k] ? 'border-accent bg-accent-soft text-accent-strong' : 'border-line text-muted hover:bg-raised'}`}>{env[k] && <Check size={11} />}{t(`publish.envK.${k}`)}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pre-flight + acción de publicar */}
      <div className="bg-surface border border-line rounded-2xl shadow-soft p-5">
        <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-accent-strong" />{t('publish.preflight')}</div>
        <div className="flex flex-col gap-1.5 mb-4">
          {checks.map((c) => (
            <div key={c.key} className="flex items-center gap-2 text-[13px]">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.ok ? 'bg-success-soft text-success-strong' : 'bg-raised border border-line text-faint'}`}>{c.ok ? <Check size={13} /> : <Lock size={11} />}</span>
              <span className={c.ok ? 'text-content' : 'text-muted'}>{t(`publish.check.${c.key}`)}</span>
            </div>
          ))}
        </div>

        {deploying ? (
          <div className="rounded-xl border border-line bg-raised p-4">
            <div className="text-[12px] text-muted mb-2 inline-flex items-center gap-1.5"><Loader2 size={13} className="text-accent-strong animate-spin" />{t('publish.deploying')}</div>
            <div className="flex flex-col gap-1.5">
              {DEPLOY_STEPS.map((s, i) => (
                <div key={s} className={`text-[12px] inline-flex items-center gap-2 ${i < deployStep ? 'text-success-strong' : i === deployStep ? 'text-content' : 'text-faint'}`}>
                  {i < deployStep ? <Check size={13} /> : i === deployStep ? <Loader2 size={13} className="animate-spin" /> : <span className="w-3 h-3 rounded-full border border-line inline-block" />}
                  {t(`publish.step.${s}`)}
                </div>
              ))}
            </div>
          </div>
        ) : publishStatus === 'published' ? (
          <PublishedPanel liveUrl={liveUrl} share={shareLink(deployBuild.fingerprint)} copied={copied} copyText={copyText} t={t} />
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="primary" onClick={publish} disabled={!ready} title={!ready ? t('publish.notReady') : undefined}><Rocket size={16} />{publishStatus === 'outdated' ? t('publish.redeploy') : t('publish.publish')}</Button>
            <span className="text-[12px] text-faint inline-flex items-center gap-1.5"><CircleAlert size={13} />{t('publish.simNote')}</span>
          </div>
        )}
      </div>

      <Modal open={machineOpen} onClose={() => setMachineOpen(false)} title="deploy.json" size="lg"
        footer={<>
          <Button variant="ghost" onClick={() => copyText(deployJson, 'json')}>{copied === 'json' ? <Check size={15} /> : <Copy size={15} />}{copied === 'json' ? t('ds.copied') : t('ds.copy')}</Button>
          <Button variant="primary" onClick={download}><Download size={15} />{t('ds.download')}</Button>
        </>}>
        <p className="text-[12px] text-muted mb-3 leading-snug">{t('publish.jsonNote')}</p>
        <pre className="text-[11px] leading-relaxed text-content bg-raised border border-line rounded-xl p-3 overflow-auto max-h-[55vh] font-mono">{deployJson}</pre>
      </Modal>
    </div>
  )
}

type T = (k: string, o?: Record<string, unknown>) => string

// Estado publicado: URL en vivo + share link (el hand-off al cliente) + capstone de cierre del pipeline.
function PublishedPanel({ liveUrl, share, copied, copyText, t }: { liveUrl: string; share: string; copied: string; copyText: (t: string, tag: string) => void; t: T }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-success-soft bg-success-soft/30 p-4">
        <div className="text-[13px] font-medium text-success-strong inline-flex items-center gap-1.5 mb-2"><PartyPopper size={15} />{t('publish.publishedTitle')}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={liveUrl} target="_blank" rel="noreferrer" className="text-[13px] font-mono text-accent-strong hover:underline inline-flex items-center gap-1.5"><ExternalLink size={13} />{liveUrl}</a>
        </div>
        {/* La honestidad no se apaga al publicar: el estado "en vivo" también recuerda que el deploy es simulado. */}
        <div className="mt-2 text-[11px] text-muted inline-flex items-center gap-1.5"><CircleAlert size={12} />{t('publish.simNote')}</div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-success-soft flex-wrap">
          <span className="text-[12px] text-muted inline-flex items-center gap-1.5"><Link2 size={13} className="text-accent-strong" />{t('publish.share')}</span>
          <span className="text-[12px] font-mono text-content truncate">{share}</span>
          <button onClick={() => copyText(share, 'share')} className="text-[12px] text-accent-strong hover:underline inline-flex items-center gap-1 ml-auto">{copied === 'share' ? <Check size={12} /> : <Copy size={12} />}{t('publish.copyShare')}</button>
        </div>
      </div>

      {/* Capstone: el pipeline se cierra */}
      <div className="rounded-xl border border-line bg-raised p-4">
        <div className="text-[11px] font-medium text-muted uppercase tracking-wide mb-2 inline-flex items-center gap-1.5"><Sparkles size={12} className="text-accent-strong" />{t('publish.capstone')}</div>
        <div className="flex flex-wrap gap-1.5">
          {PHASES.map((p) => (
            <span key={p} className="text-[11px] rounded-full px-2 py-0.5 bg-surface border border-line text-muted inline-flex items-center gap-1"><Check size={10} className="text-success-strong" />{t(`nav.${p}`)}</span>
          ))}
        </div>
        <p className="text-[12px] text-muted mt-3 leading-snug">{t('publish.capstoneNote')}</p>
      </div>
    </div>
  )
}
