# Arquitectura MVP de producción — DMXAiStudio · v2

> **v2 — endurecido tras auditoría senior de arquitectura / DevOps / PM.** Cambios respecto a v1 al
> final (§ Respuesta a la auditoría).

> **Qué ES y qué NO ES este documento.** Es una **arquitectura objetivo + framework de decisiones**
> para convertir el SPA simulado en un backend real, con criterios de aceptación por fase. **No es**
> una implementación: hoy no existe backend (ni API, ni DB, ni jobs, ni CI/CD). Cuando el documento
> dice "no negociable" o "irresponsable no resolver", se refiere a un **requisito que hay que cumplir
> antes de producción**, no a algo ya hecho. Producción no se alcanza con el diagrama.

**Rol:** technical-lead / orquestador · **Fuente:** síntesis de 5 subagentes (DevOps · Security ·
Integration · Scope · Observability) + auditoría senior externa. **Estado:** análisis, no
implementación — no se ha tocado código de backend.

---

## El reframe que cambia todo

**No estamos contenerizando una app; estamos escribiendo el backend que no existe.**

El repo es un SPA 100% cliente: sin servidor, sin `.env`, sin HTTP real, con toda la "generación"
**determinista/simulada** y la persistencia en **localStorage**. Esto es un **proyecto greenfield de
backend**, no el hardening de una app existente. Docker no es el punto de partida: es una
consecuencia. La decisión de Fase 0 no es *"¿Docker sí o no?"* sino **"¿qué es el orquestador, qué
contrato tiene con el SPA, y cómo aísla la ejecución y los secretos de terceros?"**. Y la distinción
del propio código —**model** (Codex/DeepSeek/Minimax: los orquestamos nosotros) vs **agent-platform**
(Hermes: solo enrutamos)— ya da la forma exacta de los adaptadores.

---

## Comparación de análisis (síntesis)

### Puntos de acuerdo (afirmados también por la auditoría)

- **Frontera `model` vs `agent` = columna vertebral.** Dos interfaces de adaptador separadas, *jamás*
  `if kind==='agent'`.
- **Monolito modular** (`api + db`), no microservicios/k8s/broker.
- **Postgres = fuente de verdad.** localStorage baja a borrador/cache; la firma la produce y verifica
  el servidor.
- **El orquestador es el ÚNICO que ejecuta efectos.** Todo engine solo *propone* un artefacto.
- **Gate humano server-enforced** en acciones críticas.
- **`RunRecord` con `runId` desde el borde HTTP** — la trazabilidad no se atornilla después.
- **Hermes fuera del compose**, por `HERMES_BASE_URL`.
- **Solo UNA fase real end-to-end** en el MVP.

### Riesgos repetidos (≥2 lentes) que la auditoría refuerza

- **[ALTO] Agente ejecuta comandos sin sandbox = RCE por diseño** → regla binaria (ver §Seguridad).
- **[ALTO] Prompt-injection por la cadena de contratos** → separar datos/instrucciones + egress allowlist.
- **[ALTO] Secretos BYOM filtrándose** → cifrado, redacción, nunca al prompt/cliente.
- **[ALTO] Multi-tenancy ≠ `tenant_id`** → hace falta authz por endpoint + tests de aislamiento.
- **[MEDIO] Jobs volátiles in-process** → el estado del job vive en Postgres.
- **[MEDIO] Health falso-positivo** → separar liveness de "health caro" de providers.

### Supuestos no validados (decidir antes de construir)

- Codex/DeepSeek/Minimax **no** dan JSON estructurado equivalente → forzar-JSON + validar + 1 reparación.
- "Conectar y testear Hermes" **no** es trivial → handshake + tarea-canario o es falso verde.
- **Minimax = región CN** → soberanía de datos del cliente sin resolver.

---

## Arquitectura consolidada

### Componentes

| Componente | Rol | MVP |
|---|---|---|
| **SPA React** | Cliente. Estático (nginx/CDN). localStorage = borrador. | reusar el existente |
| **Orquestador API** | Backend nuevo. Monolito modular. Único que ejecuta efectos. | **núcleo del MVP** |
| **Postgres** | Verdad: tenants, secrets cifrados, artifacts (event-log+snapshots), runs, **jobs**, approvals. | sí, día 1 |
| **ModelAdapter** | Codex / DeepSeek / Minimax. Nosotros orquestamos. Key server-side. | 1 real + 1 mock, resto misma interfaz |
| **AgentAdapter** | Hermes. Solo enrutamos. | solo conexión + test |
| **Sandbox ejecutor** | Contenedor efímero si un agente corre código. | ver regla binaria abajo |
| **Hermes** | Agent-platform de terceros. **Externo**, por `HERMES_BASE_URL`. | fuera del compose |
| **Cola + worker** | Async pesado. | **NO** — job in-process + estado en Postgres |

**Regla binaria del sandbox (criterio de aceptación bloqueante):**

| Caso | Decisión |
|---|---|
| El agente ejecuta comandos / escribe archivos / corre tests / usa shell / toca repo | **Sandbox obligatorio** antes de producción |
| No hay sandbox | El agente **solo devuelve texto/artefactos**; el orquestador valida y aplica |

> **Sin sandbox, ningún agente ejecuta comandos ni accede al repo real.** No hay estado ambiguo.

### Diagrama de comunicación

```
  Cliente (owner)
        │
        ▼
  ┌─────────────────────────────────────────────┐
  │  SPA React  (estático · nginx/CDN)           │
  │  localStorage = borrador/cache, NO la verdad │
  └───────────────┬─────────────────────────────┘
     POST /phases/:key/run  ─▶ { jobId }
     GET  /jobs/:id         ◀─ estado (polling; job state en Postgres)
        │
        ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  ORQUESTADOR API   monolito modular (TS/Fastify · o Py/FastAPI) │
  │  identity+authz+tenant · secrets(BYOM envelope) · contracts     │
  │  orchestrator  ← ÚNICO que ejecuta efectos                      │
  │  jobs(state machine en DB) · enforcement(schema+Clase A)        │
  │  gates(aprobación humana) · audit(RunRecord + logs redactados)  │
  │                                                                 │
  │  adapters/  EngineAdapter { health(), run() }                   │
  │     ├─ ModelAdapter   (nosotros orquestamos)                    │
  │     └─ AgentAdapter   (solo enrutamos)                          │
  └──┬───────────────────────┬──────────────────────────┬──────────┘
     │ key server-side        │ tarea (sin key/sin repo)  │ verdad
     ▼                        ▼                           ▼
  ┌──────────────┐   ┌──────────────────┐        ┌────────────────┐
  │ Providers    │   │ Hermes           │        │ Postgres       │
  │ Codex        │   │ agent-platform   │        │ tenants·secrets│
  │ DeepSeek     │   │ EXTERNO ─ fuera  │        │ artifacts+log  │
  │ Minimax ⚠CN  │   │ del compose      │        │ runs·jobs      │
  └──────────────┘   │ HERMES_BASE_URL  │        │ approvals      │
                     └──────────────────┘        └────────────────┘
  ══ dentro del compose: [api] + [db] ══   todo lo demás es externo
```

### Decisión sobre Docker

**Dentro del compose (MVP):** `api` (monolito) + `db` (Postgres). Exactamente 2 servicios.
**Fuera:** SPA (estático/CDN), Hermes (URL), providers (APIs), sandbox (separado por confianza).
**Junto en MVP:** `api` + `db`. **Separar después:** el ejecutor de agentes y cualquier módulo con
perfil de escala distinto — no antes de medirlo.

> **Nota honesta sobre secretos en Compose:** los "docker secrets" en un Compose simple terminan
> siendo **archivos locales montados** (0400) en un host controlado. Es aceptable para un **MVP
> controlado**, pero NO es un secret manager robusto. Está clasificado como tal, no vendido como
> solución final (ver §Cuándo escalar).

### Estructura de carpetas (backend)

```
# monolito modular por DOMINIO, no por capas técnicas
apps/
  api/
    src/
      contracts/      # schemas versionados de artefactos (reusa los tipos TS del SPA)
      identity/       # auth + authz (principal por request, ownership checks)
      secrets/        # BYOM: envelope encryption, versionado, revocación, auditoría de uso
      orchestrator/   # máquina de fase — ÚNICO con efectos
      jobs/           # state machine persistente en Postgres + recuperación tras restart
      enforcement/    # valida output vs schema + checklist Clase A
      gates/          # aprobación humana server-side (firmar/publicar)
      adapters/
        engine-port.ts   # interface EngineAdapter { health, run }
        model-adapter.ts # base: NOSOTROS orquestamos
        agent-adapter.ts # base: solo enrutamos
      providers/
        openai.ts  deepseek.ts  minimax.ts   # = ModelAdapter
        hermes.ts                            # = AgentAdapter
      audit/          # RunRecord + logs estructurados redactados
      http/           # rutas + middleware runId/correlationId + /live /ready
    migrations/       # migraciones versionadas (herramienta elegida en Fase 0)
    Dockerfile        # no-root, multi-stage, imagen pequeña
web/                  # el SPA existente (build estático)
docker-compose.yml
```

### docker-compose.yml (conceptual, corregido)

```yaml
services:
  api:
    build: ./apps/api
    user: "10001:10001"          # no-root
    read_only: true              # FS de solo lectura salvo tmpfs
    tmpfs: [/tmp]
    environment:
      DATABASE_URL_FILE: /run/secrets/database_url
      HERMES_BASE_URL: "https://hermes.host.externo"    # NO en este compose
      HERMES_TOKEN_FILE: /run/secrets/hermes_token
      ORCH_HMAC_KEY_FILE: /run/secrets/orch_hmac         # firma de artefactos
      SECRETS_MASTER_KEY_FILE: /run/secrets/master_key   # envelope: cifra los DEK
    secrets: [database_url, hermes_token, orch_hmac, master_key]
    depends_on:
      db: { condition: service_healthy }
    ports: ["8080:8080"]
    deploy:
      resources: { limits: { cpus: "1.0", memory: 512M } }
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_DB: dmx
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password   # ← password vía secret, no en claro
    secrets: [db_password]
    volumes: [dmxdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d dmx"]
      interval: 5s
      timeout: 3s
      retries: 5
secrets:                         # archivos locales 0400 POR AMBIENTE, nunca commiteados ni en la imagen
  database_url: { file: ./.secrets/${ENV}/database_url }
  db_password:  { file: ./.secrets/${ENV}/db_password }
  hermes_token: { file: ./.secrets/${ENV}/hermes_token }
  orch_hmac:    { file: ./.secrets/${ENV}/orch_hmac }
  master_key:   { file: ./.secrets/${ENV}/master_key }
volumes: { dmxdata: {} }
# Sin Hermes. Sin Redis. Sin worker. Sin nginx de la app (estático aparte).
```

### Variables de entorno — convención única `_FILE`

**Regla:** todo valor sensible se carga por `*_FILE` (docker secret / archivo 0400). **Prohibido**
poner secretos directos en env en producción.

| Variable | Para qué | Regla |
|---|---|---|
| `DATABASE_URL_FILE` | Conexión Postgres | secret |
| `DATABASE_PASSWORD_FILE` | Password de Postgres | secret |
| `HERMES_BASE_URL` | Endpoint externo de Hermes | **no secreto** · configurable; nunca asume localhost |
| `HERMES_TOKEN_FILE` | Auth del handshake | secret · nunca a un prompt/log |
| `SECRETS_MASTER_KEY_FILE` | Envelope: cifra los DEK de las keys BYOM | secret · solo el orquestador la lee |
| `ORCH_HMAC_KEY_FILE` | Firma/verifica integridad de artefactos | secret · base del gate |
| Keys BYOM (cliente) | OpenAI/DeepSeek/Minimax del cliente | **NO** en env — cifradas en Postgres por tenant |

### Contrato por engine

| Engine | Rol | Permitido | Prohibido | Fallback / errores |
|---|---|---|---|---|
| **Codex** (model) | LLM crudo que *nosotros* orquestamos. Primero por su JSON/tool-mode maduro. | Proponer artefacto validado vs schema | Ejecutar efectos, deploy, escribir CMS/DB, git, red arbitraria | mock adapter + backoff en 429/5xx; budget cap |
| **DeepSeek** (model) | Model alterno (fuerte en HTML/estructura) | Igual | Igual | forzar-JSON + validar + 1 reparación |
| **Minimax** (model · CN) | Model alterno — **región CN** | Igual, con flag de región | Igual + no enviar datos de cliente sin decisión de soberanía | latencia/estabilidad variable |
| **Hermes** (agent) | Agent-platform externa. Solo *enrutamos*. | Aceptar tarea, devolver resultado validado vs contrato | Recibir keys BYOM o el repo; ejecutar efectos | timeout + error de red; config interna fuera de alcance |

**Logging obligatorio** (todos): un `RunRecord` por generación (ver §Observabilidad).
**Deny-by-default:** engine sin scope declarado = sin permiso.

### Integración de Hermes — alcance y contrato

**Nuestro alcance:** conexión (auth por token) · capability discovery (listar sus 7 agentes) ·
health real + tarea-canario validada vs schema de fase · enrutar tareas y recoger resultado.
**Fuera de alcance:** instalar/configurar Hermes, elegir sus modelos/tools/pasos, su gasto/ciclo de
vida/secretos. El `AgentAdapter` le habla por URL, no in-process.

---

## Seguridad mínima (requisitos, no opcionales)

### Multi-tenancy = aislamiento, no solo `tenant_id`

`tenant_id` en toda tabla es necesario pero **no suficiente**. Hace falta: modelo de identidad + auth,
authz por workspace/proyecto/conexión, **ownership checks en cada endpoint** (contra IDOR),
auditoría de acceso a secretos, y **tests de aislamiento entre tenants**.

**Matriz de permisos (RBAC mínimo):**

| Actor | Puede ver | Ejecutar | Aprobar | Administrar keys |
|---|---|---|---|---|
| Owner | Su workspace | Sí | Sí | Sí |
| Editor | Workspace asignado | Sí | No / configurable | No |
| Viewer | Solo lectura | No | No | No |
| Admin interno | Solo soporte auditado | No por defecto | No | No acceso directo |

### Secretos BYOM (envelope encryption)

Tabla `secret`: `id, tenant_id, connectionId, provider, ciphertext, key_version, fingerprint,
created_at, rotated_at?, last_used_at?, revoked_at?`.

- **Envelope:** la `SECRETS_MASTER_KEY` cifra DEKs; los DEK cifran las keys BYOM → rotar la master no
  re-cifra todo el dataset.
- **Versionado + revocación + re-encriptado** de claves; **auditoría de uso** sin exponer el valor.
- **Backup/restore** de secretos incluido en el plan de backups.
- **Si `SECRETS_MASTER_KEY` se compromete:** rotar master → re-envolver DEKs → revocar keys expuestas.
- Las keys **nunca** cruzan a un prompt ni al cliente tras guardarse; redacción por allowlist en logs.

### Firma de artefactos (HMAC con integridad real)

```
signature_payload (serialización canónica — orden estable, JCS/RFC 8785):
  { artifact_id, tenant_id, schema_version, phase_key, artifact_hash,
    created_at, approved_by?, approval_id? }
guardar junto al artefacto:  signature, signature_key_version
```

- `created_at`/nonce contra **replay**. Rotación de `ORCH_HMAC_KEY` con `key_version`; los artefactos
  viejos validan con **su** `key_version`. Migración de schema firmado documentada.

### Frontera de ejecución

- Límite de confianza **orquestador ↔ ejecutor** desde el día 1 (aunque sea un compose): el proceso
  con las keys ≠ el proceso que corre código. Co-residencia de red aceptable; de secretos **no**.
- **Generar ≠ publicar:** los agentes no tocan git ni credenciales de deploy; el orquestador valida y
  *él* despliega.
- **Egress allowlist** desde el sandbox (solo dominios de providers) → corta exfiltración por injection.
- **Gate humano server-side + verificación HMAC** del DesignBuild firmado.

---

## Observabilidad y operación

### `RunRecord` — la unidad de auditoría (persistida, no en memoria)

```
RunRecord {
  runId, correlationId, idempotencyKey,     # nacen en el middleware HTTP
  workspaceId (tenant), phaseKey, jobId,
  connectionId, engineId, engineKind,       # model | agent
  status: queued|running|succeeded|failed|timed_out|needs_human,
  startedAt, endedAt, latencyMs,
  usage: { promptTokens?, completionTokens?, costUSD?, provider_raw },
  errorClass?: Auth|RateLimit|Timeout|ContractViolation|ProviderDown|Unknown,
  artifactRef?, humanGate?: { approverId, decision, at }
}
```

### Jobs — máquina de estados en Postgres (no volátil)

```
queued → running → succeeded
                 → failed
                 → timed_out
                 → needs_human
```

Reglas: timeout por job · cancelación · reintento controlado · `idempotencyKey` (misma key no
re-ejecuta) · **recuperación tras restart** (jobs `running` huérfanos → reconciliados) · limpieza de
huérfanos. Sin esto, "job+polling" es una fachada.

### Health-checks (separados — un provider caído NO reinicia tu API)

| Endpoint | Prueba | Uso |
|---|---|---|
| `/live` | El proceso responde | reinicio del contenedor |
| `/ready` | DB + migraciones + config mínima | tráfico del load balancer |
| `/health/providers` | auth + roundtrip caro por provider | panel interno · **bajo demanda, cacheado, rate-limited** |
| `/health/hermes` | handshake + canario | diagnóstico, **no** liveness |

### Logs, métricas y alertas

- **Logs JSON estructurados** (un evento por transición de estado), **redacción por allowlist**,
  enviados a un **destino externo** (no solo stdout). Retención básica definida.
- **Métricas** derivadas del RunRecord: latencia p50/p95, error-rate por clase/proveedor, tokens/costo
  por fase **y por tenant**. `/metrics` en memoria basta para arrancar; el envío externo de logs es lo
  que da operabilidad.
- **Alertas mínimas:** error-rate / 5xx, auth failures, provider failures, gasto anómalo, loops/retries.
- **Auditoría por ejecución:** `GET /runs/:runId` reconstruye request→job→engine→acción→artifactRef.

### Política de costos (con números, no intenciones)

| Límite | Criterio de MVP |
|---|---|
| Costo máx. por run | bloquear si excede el presupuesto del tenant |
| Tokens máx. por fase | cortar antes de reintentos |
| Retries máx. | 1 reparación de JSON, nunca loop abierto |
| Duración máx. de job | timeout duro |
| Concurrencia máx. | por tenant y por provider |
| Gasto diario máx. | circuito de corte + alerta |

### Almacenamiento de artefactos

- Artefactos **pequeños/estructurados** (Brief, specs JSON) → Postgres. **Correcto para empezar.**
- Artefactos **grandes/binarios** (HTML, imágenes, snapshots pesados) → **object storage** (S3-compat)
  con un `ref` en DB. Decisión registrada para cuando lleguen las fases visuales; define tamaño máximo,
  retención, compresión y exportabilidad por tenant. **Evitar que Postgres cargue blobs.**

### Migraciones (decidir en Fase 0 — bloqueante)

Elegir herramienta: **Drizzle** (recomendado con TS/Fastify) o Prisma; **Alembic** si FastAPI. Exigir:
migraciones versionadas · ejecución automática controlada · rollback/forward-fix documentado · seed
mínimo dev/test · **probadas en CI**. Regla dura: **toda migración backward-compatible o con
procedimiento explícito de reversión**.

### "Clase A" — checklist verificable (no etiqueta subjetiva)

```
Clase A = schema válido
        + firma válida (HMAC, key_version correcta)
        + approval requerido cumplido
        + logs completos (RunRecord sin huecos)
        + costo registrado
        + sin policy violation (egress / scope / budget)
```

---

## Plan por fases (ejecutable)

Cada fase: **objetivo · entregables · criterio de aceptación medible (DoD) · owner · fuera.** Los
*owner* y *fechas* los define el estudio — marcados `— asignar`.

### Fase 0 — Cierre de decisiones irreversibles
- **Objetivo:** eliminar ambigüedad antes de escribir código.
- **Entregables:** ADR de arquitectura base · **stack backend = TS/Fastify** (decidido) · **hosting =
  Railway** (decidido) · modelo de identidad + autorización · modelo tenant/workspace/project · contrato
  `EngineAdapter` + split
  Model/Agent · schema `RunRecord` · taxonomía de 6 errores · política de secretos · política de
  artefactos firmados · **herramienta de migraciones** · decisión *"agentes no ejecutan comandos hasta
  tener sandbox"* · **Hermes = DIFERIDO** (decidido) · fase inicial = **Brief** (decidido) · provider
  inicial = **OpenAI Codex** (decidido).
- **DoD:** schemas versionados · ADRs aprobados · lista cerrada de endpoints MVP · decisión Hermes explícita.
- **Owner:** — asignar. **Fuera:** todo lo runtime.

### Fase 1 — Backend skeleton + DB + CI
- **Objetivo:** entorno reproducible sin lógica compleja.
- **Entregables:** API skeleton · Postgres · migraciones iniciales · Dockerfile no-root · compose local
  · `/live` + `/ready` · CI (lint/typecheck/unit/build imagen + escaneo de vulnerabilidades) · config
  loader con `_FILE`.
- **DoD:** `docker compose up` en máquina limpia · CI falla ante lint/type/test/build error · la API
  conecta a DB · migraciones corren en entorno limpio · **cero secretos commiteados** (`.dockerignore`).
- **Owner:** — asignar. **Fuera:** providers reales, Hermes.

### Fase 2 — Núcleo multi-tenant + persistencia
- **Objetivo:** el core antes de cualquier provider.
- **Entregables:** tablas (tenants/workspaces/users/connections/secrets/artifacts/runs/**jobs**/approvals)
  · `tenant_id` obligatorio · middleware de identidad + **authz checks** · secrets cifrados (envelope)
  · RunRecord persistido · logs JSON redactados · **job state machine persistente** · idempotency keys.
- **DoD:** tenant A no puede leer ni ejecutar recursos de B (**test de aislamiento**) · un job sobrevive
  a restart con estado consistente · logs sin secretos (grep) · misma idempotencyKey no re-ejecuta.
- **Owner:** — asignar. **Fuera:** llamadas a providers reales.

### Fase 3 — Primer ModelAdapter real + una fase real (Brief)
- **Objetivo:** validar el flujo completo con un provider real. **Brief** por input controlable y
  output estructurado (menor riesgo de assets/subjetividad que Branding).
- **Entregables:** un ModelAdapter real + **adapter mock** para tests · prompt envelope versionado ·
  validación JSON/schema + 1 reparación · budget cap · rate limit · timeout · persistencia de artifact ·
  firma server-side · `GET /runs/:runId` · polling de job desde el SPA.
- **DoD:** el SPA dispara una generación real → `jobId` → polling muestra estado → artifact persistido y
  firmado · RunRecord con provider/costo/latencia/status/errorClass · **cero keys** en prompt/respuesta/logs
  · output inválido se rechaza o repara una sola vez · cambiar de provider solo por config · llamada >60s
  sobrevive · budget cap corta un loop.
- **Owner:** — asignar. **Fuera:** las otras fases; auto-routing entre providers.

### Fase 4 — Gate humano y publicación controlada
- **Objetivo:** impedir efectos críticos sin aprobación real.
- **Entregables:** tabla de approvals · endpoint approve/reject · enforcement server-side · verificación
  HMAC · política de quién puede aprobar · auditoría del approver · bloqueo de publish sin approval.
- **DoD:** publicar sin approval → 4xx · artifact manipulado falla validación · approval ligado a
  usuario/tenant/artifact/timestamp/signature · el frontend no puede saltarse el gate.
- **Owner:** — asignar.

### Fase 5 — Segundo provider (Hermes diferido — decidido)
- **Camino elegido (Opción B):** segundo ModelAdapter real (candidato: **DeepSeek**, OpenAI-compatible →
  mismo SDK, otra `baseURL`) → validar la abstracción, comparar error handling, cambio de provider por
  config, medir costo/latencia/calidad. Hermes (`AgentAdapter` → `HERMES_BASE_URL`) queda para cuando la
  demo/venta lo exija.
- **DoD:** no se rompe el contrato del orquestador · no se duplican caminos de negocio · el nuevo engine
  solo propone · el orquestador sigue validando/firmando/persistiendo · cambio de provider solo por config.
- **Owner:** — asignar.

### Fase 6 — Producción temprana (sin sobrediseñar)
- **Objetivo:** operar con bajo riesgo.
- **Entregables:** deploy staging + prod · TLS + dominio + CORS estricto · **backups automáticos +
  prueba de restore** · logs centralizados · alertas mínimas · smoke tests post-deploy · **rollback
  documentado** (migraciones backward-compatible) · runbook de incidentes · límites de costo por tenant
  · panel interno básico de runs/failures.
- **DoD:** desplegar una versión nueva · volver a una anterior · restaurar DB desde backup · investigar
  un run fallido · cortar gasto anómalo · revocar una key · probar un provider sin afectar producción.
- **Owner:** — asignar.
> **Línea simple sostenida:** blue/green y canary son **sobreingeniería** para un MVP de una instancia.
> El estándar MVP de rollback = migraciones backward-compatible + imagen anterior + smoke tests. Se
> sube a canary cuando el tráfico lo justifique (ver §Cuándo escalar).

---

## Bloqueantes antes de producción

**Técnicos:** backend real · identidad + authz · `tenant_id` obligatorio · migraciones versionadas ·
secrets cifrados con versionado + auditoría · job state persistente · idempotencia por endpoint ·
RunRecord persistido · logs redactados (allowlist) · validación de schemas · firma server-side con key
versioning · gate humano server-side · budget caps reales · rate limits por tenant/provider · errores
normalizados · sandbox **o** prohibición explícita de ejecución · egress policy · tests de aislamiento
multi-tenant.

**DevOps:** Dockerfile no-root · imagen pequeña/reproducible sin secretos · `.dockerignore` · CI
(lint/type/test/build + escaneo de vulns) · ambientes dev/staging/prod · config y secrets por ambiente ·
migraciones en deploy + probadas en CI · smoke post-deploy · rollback documentado · backups + prueba de
restore · logs centralizados · alertas (5xx / provider / gasto) · TLS + reverse proxy + hosting definido
· CORS explícito · request size limits · resource limits · retención de logs/artefactos.

**Gestión:** alcance MVP congelado · fase inicial (**Brief**) · provider inicial · Hermes crítico o
diferido · owners por fase · dependencias · registro de riesgos con severidad+mitigación · DoD por fase ·
criterios de aceptación medibles · qué NO entra al MVP · plan de incidentes · plan de fallos de providers
· control de costos · criterios para cola/worker · secret manager externo · separar servicios · k8s.

---

## Decisiones ahora / aplazar / sobreingeniería / no negociable

**Decidir día 1:** stack (recomiendo **TS/Fastify** para reusar los tipos de contratos existentes;
FastAPI válido) · identidad + `tenant_id` · frontera Model/Agent · Postgres como verdad + firma
server-side · política de secretos (envelope) · contrato HTTP job+polling · `RunRecord` + taxonomía ·
gate humano server-side · Hermes fuera del compose · **fase inicial = Brief** · herramienta de migraciones
· regla binaria del sandbox.

**Aplazar:** cola/worker (hasta que timeouts lo exijan) · migrar las 8 fases restantes · separar la api
en servicios · secret manager externo (Vault/KMS) · k8s/HA/multi-región · observabilidad pesada
(Prometheus/Grafana/OTel) · metering/cost-tiers · conectar los 3 models a la vez · topología física de Hermes.

**Sobreingeniería (evitar):** k8s/microservicios/servicio-por-fase · Redis+worker+broker día 1 · Vault
empresarial cuando un store cifrado simple cumple · PKI con rotación cuando un HMAC cierra el gate ·
**blue/green/canary en una sola instancia** · abstracción "cualquier provider" antes del 2º real ·
Prometheus/Grafana para 1 instancia · golden-file testing de salidas de LLM no deterministas · Hermes en
el compose.

**Irresponsable no resolver en MVP:** secretos BYOM cifrados/fuera-de-logs/fuera-del-ejecutor ·
`tenant_id` + **authz** (no solo la columna) desde el primer INSERT · firma server-side · gate humano
server-side · agentes sin sandbox → que NO ejecuten comandos · egress allowlist · `runId` + logs
redactados desde la 1ª línea · job state persistente · health real separado de liveness · budget/rate
cap por conexión.

---

## Riesgos y mitigaciones

| Riesgo | Sev. | Mitigación |
|---|---|---|
| Agente ejecuta comandos sin aislamiento (RCE) | ALTO | Sandbox efímero (sin red/no-root/sin repo) — o el agente no ejecuta en MVP |
| Fuga de key BYOM (logs/imagen/prompt) | ALTO | Envelope encryption por tenant, redacción, nunca al prompt/cliente |
| `tenant_id` sin authz → IDOR / cross-tenant | ALTO | Ownership checks por endpoint + tests de aislamiento |
| Prompt-injection por la cadena de contratos | ALTO | Separar datos/instrucciones + egress allowlist |
| Publicar sin aprobación humana | ALTO | Gate server-side + HMAC verificable |
| Firma solo client-side (falsificable) | ALTO | Verdad + firma en el servidor; serialización canónica + key_version |
| Job volátil in-process se pierde al reinicio | ALTO | State machine en Postgres + recuperación tras restart |
| Compromiso de `SECRETS_MASTER_KEY` | ALTO | Envelope: rotar master → re-envolver DEK → revocar keys expuestas |
| Loop de agente vacía la cuota del cliente | MEDIO | Budget/rate cap con números + circuito de corte |
| Health-check reinicia la API si un provider cae | MEDIO | `/live` no llama providers; health de provider bajo demanda/cacheado |
| Postgres cargando blobs pesados | MEDIO | Artefactos grandes a object storage con ref en DB |
| Providers no equivalentes (JSON/región) | MEDIO | Normalizar en el adaptador; Minimax = región CN marcada |
| Sin migraciones versionadas → deploy frágil | MEDIO | Herramienta elegida en Fase 0, probada en CI, backward-compatible |

---

## Cuándo escalar (triggers medibles, no estética)

- **Cola/worker (Redis):** cuando una fase real supere consistentemente los timeouts, o se necesite
  concurrencia > lo que el proceso in-process sostiene.
- **Secret manager externo (Vault/KMS):** cuando el volumen de tenants o un requisito de compliance lo exija.
- **Separar un módulo en servicio:** cuando tenga un perfil de escala o despliegue genuinamente distinto.
- **Canary/blue-green:** cuando el tráfico haga inaceptable el downtime de un deploy simple.
- **k8s:** solo con una razón técnica fuerte y medible (escala horizontal real, multi-tenant pesado).

---

## Veredicto

La arquitectura va en la dirección correcta; **no está lista para producción** hasta cerrar: (1)
alcance reducido del MVP, (2) las decisiones de seguridad hoy ambiguas (sandbox, authz, secretos, firma),
(3) fases convertidas en entregables verificables. **Un provider real primero, no los cuatro.** Después,
Hermes **o** un segundo provider — no ambos a la vez.

---

## Respuesta a la auditoría (changelog v1 → v2)

**Aceptado e incorporado:** framing de honestidad (arquitectura objetivo ≠ implementación) · regla
binaria del sandbox como criterio bloqueante · matriz de authz + tests de aislamiento (multi-tenancy ≠
`tenant_id`) · envelope encryption + versionado/revocación/auditoría de secretos + plan si se compromete
la master · `signature_payload` canónico + `key_version` + anti-replay · job state machine en Postgres +
recuperación tras restart · split de health `/live` `/ready` `/health/providers` `/health/hermes` ·
logs centralizados + alertas · umbrales de costo con números · herramienta de migraciones en Fase 0 ·
estrategia de artefactos grandes (object storage) · "Clase A" como checklist · **Brief** como fase
inicial · **corrección de los errores concretos**: naming `_FILE` unificado, Postgres con password vía
secret, Dockerfile no-root/resource-limits · plan por fases con DoD + owners · reordenado (Hermes movido a
Fase 5, después del primer flujo real).

**Matizado (mantengo la línea simple):** *blue/green y canary* siguen fuera del MVP — para una sola
instancia son sobreingeniería; el estándar de rollback es migración backward-compatible + imagen anterior
+ smoke tests, y se sube a canary por trigger de tráfico. *"3 providers diluye el foco"*: v1 ya lo diferí
(estaba en APLAZAR), pero afilé la Fase para dejar explícito **un real + un mock**.

**Decisiones cerradas:** Hermes = **diferido** (Fase 5 = segundo ModelAdapter) · provider inicial =
**OpenAI Codex** · fase inicial = **Brief** · stack backend = **TS/Fastify** (una sola definición de los
contratos, reusando los tipos del SPA como schemas Zod compartidos) · hosting = **Railway** (plataforma
gestionada: baja backups/TLS/deploy/staging+prod; `docker-compose` se queda para dev local, la plataforma
corre la misma imagen en prod).

**Tuyo por definir:** owners por fase (Fases 0-4 = dev backend del estudio; Fase 6 = apoyo DevOps puntual o
la plataforma gestionada) · fechas según velocidad (camino crítico F0→F1→F2→F3, F2 = el cuello).

---

*DMXAiStudio · síntesis de 5 análisis + auditoría senior · monolito modular + docker-compose · sin k8s ·
análisis, no implementación — no se ha tocado código de backend.*
