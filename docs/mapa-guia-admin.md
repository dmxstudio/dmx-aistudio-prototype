# Mapa · Guía (brand book) ↔ Admin (Branding)

Referencia para revisar la guía contra el admin. Base: **Meridian** — guía en `/book/index.html?brand=3`, admin en `/meridian/sitio-web/branding`.

**Cómo fluye el dato:** el panel de Branding escribe `localStorage['dmxbook:3']` (lo genera `src/lib/bookData.ts`); la guía lo lee vía `?brand=3` — `i18n.js` mergea los textos sobre el diccionario demo y `config.js` aplica nombre, logo, colores, fuentes y foto. **Lo que no tiene campo cae al texto demo de la plantilla** (se ve "lleno" pero no es editable).

---

## Dirección 1 · Estoy viendo la GUÍA, ¿dónde lo edito en el admin?

### Portada (`index.html`)
| En la guía | Campo (admin) | Sección admin |
|---|---|---|
| Nombre de marca / wordmark | nombre del workspace | (Workspaces, no Branding) |
| Símbolo / logo | Símbolo (SVG o PNG; sin símbolo → monograma) | 09 · Sistema de logo y variantes |
| Tagline ("Aligned by design") | Mensaje núcleo | 06 · Mensajería |
| Lead (párrafo principal) | Positioning statement | 02 · Posicionamiento |
| Colores/fuentes (estilo global) | Color de marca (hex) · Fuentes | 10 · Color / 11 · Tipografía |
| Meta (versión · actualizado · owner), barra de paleta, nombres de fuente del bloque tipo | — plantilla (estático) | — |

### 01 · Fundamento estratégico (`01-strategic.html`)
| Guía | Campo | Sección admin |
|---|---|---|
| §1.1 Propósito (statement) | Propósito | 01 · Fundamentos |
| §1.1 Visión / Misión (tarjetas) | Visión · Misión | 01 · Fundamentos |
| §1.1 Valores (3 tarjetas nombre+desc) | Valores (grupo) | 01 · Fundamentos |
| §1.2 Historia (párrafo) | Historia y herencia | 01 · Fundamentos |
| §1.2 Hitos (solo el TEXTO; los años 2024/25/26 son fijos) | Hitos (grupo) | 01 · Fundamentos |
| §1.3 Statement de posicionamiento | Positioning statement | 02 · Posicionamiento |
| §1.3 fila "Segmento" | Arquetipo de audiencia ⚠️ | 03 · Percepción |
| §1.3 fila "Propuesta de valor" y §1.4 statement | Propuesta de valor | 02 · Posicionamiento |
| §1.3 fila "Promesa" y §1.4 callout | **Promesa** | **01 · Fundamentos** ⚠️ |
| §1.3 fila "Diferenciadores" | Diferenciadores | 02 · Posicionamiento |
| §1.5 Arquetipo de audiencia (tarjeta) | Arquetipo de audiencia + Descripción de audiencia | 03 · Percepción |
| §1.5 Personas (3 tarjetas, incl. el tipo User/Buyer/Proto-persona) | Personas (grupo, columna "Tipo") | 03 · Percepción |
| §1.6 "Arquetipo · X" (nombre) | Arquetipo | 04 · Personalidad |
| §1.6 descripción del arquetipo | Descripción del arquetipo | 04 · Personalidad |
| §1.6 chips de personalidad | Rasgos | 04 · Personalidad |
| Intros de cada sección (párrafo gris bajo el título) | — plantilla | — |

### 02 · Voz (`02-voice.html`)
| Guía | Campo | Sección admin |
|---|---|---|
| §2.1 chips (Claro/Confiado/Humano) | Principios de escritura (columna Rasgo) | 05 · Voz y tono |
| §2.2 Voz · constante | Definición de voz | 05 · Voz y tono |
| §2.2 Tono · variable | Definición de tono | 05 · Voz y tono |
| §2.3 Principios de escritura (3 tarjetas: nombre + sí es/no es + ejemplo) | Principios de escritura (grupo) | 05 · Voz y tono |
| §2.4 Diales de tono | — plantilla (posiciones fijas) | — |
| §2.5 Jerarquía de mensajes | Jerarquía de mensajes (grupo) | 06 · Mensajería |
| §2.6 statement grande | Mensaje núcleo | 06 · Mensajería |
| §2.6 primer chip CTA | Lenguaje de CTA | 06 · Mensajería |
| §2.7 Gramática y estilo (tabla 5 filas) | Gramática y estilo (grupo) | 05 · Voz y tono |
| §2.8 Formatos — bloque "convenciones declaradas" (Locales/Fecha/Hora/Moneda/Datos) | Locales · Formato de fecha · Formato de hora · Moneda principal · Estándar de datos | 07 · Convenciones |
| §2.8 Formatos — matriz de ejemplos (headers de locale + filas fecha/hora/fecha-hora/número/moneda/porcentaje/relativa) | **derivada con Intl** de Locales + Formato de hora + Moneda principal (coherencia garantizada) | 07 · Convenciones |
| §2.8 Formatos — filas Rango/Teléfono/Unidades | — plantilla (convención tipográfica/estándar, no preferencia de marca) | — |
| §2.9 Terminología | — plantilla ilustrativa | — |
| §2.10/§2.12 inclusivo · canales | — plantilla | — |
| §2.11 On-brand / Off-brand | Ejemplo on-brand · Ejemplo off-brand | 05 · Voz y tono |
| §2.13 prompt IA (nombre de marca) | nombre del workspace (auto) | — |

### 03 · Identidad visual (`03-visual.html`)
| Guía | Campo | Sección admin |
|---|---|---|
| §3.1 Vitrina de variantes (Principal/Apilado/Símbolo/Wordmark/Monocromo/Inverso) | subida por variante: Logo principal* · Logo apilado · Símbolo (SVG o PNG) · Wordmark · Monocromo · Inverso — sin subida, el tile se compone de Símbolo + nombre | 09 · Logotipo |
| Logo (marca compuesta en toda la guía) | Símbolo | 09 · Logotipo |
| §3.2 Área de respeto (símbolo): nota + **marco punteado pintado** (padding `--cs`) | Área de respeto (símbolo) — select estándar (½/1×/2×) u "Otro" px/mm; el sistema interpreta el valor | 09 · Logotipo |
| §3.2 Tamaño mínimo (símbolo): marks redimensionados + captions px/mm (mitad sin definir se oculta) | Tamaño mínimo (símbolo) — select estándar (16/24/32 px) u "Otro" px/mm | 09 · Logotipo |
| §3.2 Área de respeto y Tamaño mínimo · logo principal (bloques opcionales; marco `--cs` pintado y logo al ancho mínimo declarado) | Área de respeto (principal) · Tamaño mínimo (principal) — selects estándar u "Otro" px/mm | 09 · Logotipo |
| §3.2 Fondos válidos | compuesto por el sistema + **curable**: Fondos válidos (multiselect oculta tiles) · "sobre marca" ← Color de marca (§10) · "sobre foto" ← Fondo de referencia (imagen), placeholder X por default | 09 · Logotipo |
| §3.2 Formatos de archivo + filas extra en 05 · Recursos | **solo los formatos existentes** se ofrecen como descarga: SVG generado por el sistema (asset del logo) · Logo PNG / EPS / PDF subidos en el admin (generación automática de faltantes: fase futura) | 09 · Logotipo |
| §3.3 Usos incorrectos | grid del símbolo solo si existe símbolo (marcas wordmark-only lo ocultan); grid del Principal cuando existe; uno o los dos | 09 · Logotipo |
| Intro de Color + rampa `--brand-*` | Dirección cromática · Color de marca (hex) | 10 · Color |
| Swatches primarios | Paleta nombrada (grupo) | 10 · Color |
| Nota dark ("¿Listo para dark mode?") | Listo para dark mode | 10 · Color |
| Notas de modo oscuro (acento/superficies/contraste) | Acento para oscuro · Superficies | 13 · Modo oscuro (contraste → 12 · Accesibilidad) |
| §3.5 nota "Fuentes complementarias" (lista título: familia; oculta sin filas) | Fuentes complementarias | 11 · Tipografía |
| Intro de Tipografía + nombres/render de fuentes + escala | Personalidad tipográfica (select estándar) · **Dirección tipográfica** (roles Display/Texto/Mono: cada rol activa su fuente obligatoria; roles no declarados ocultan su tarjeta y sus filas de escala) · Fuente display/texto/mono (nombres reales también en la tabla de escala) | 11 · Tipografía |
| Intro de Grid | Personalidad de rejilla | 16 · Grid, layout y espaciado |
| §3.6 Tabla de contraste: chips **recoloreados a la marca** y ratios/AA-AAA **recalculados** (WCAG real) · callout | (tabla derivada del Color de marca) · callout ← Requisitos de accesibilidad + Contraste mínimo | 12 · Accesibilidad y contraste |
| §3.7 Demos de modo oscuro (botones, filas de acento, comparativa) | acentos recoloreados desde Color de marca + **Acento para oscuro** (hex declarado, mismo criterio que dark.css) · notas ← Acento/Superficies/Contraste | 13 · Modo oscuro / 12 |
| §3.8 Grid de iconos: **renderiza el proveedor declarado** (Tabler default; Bootstrap/Remix por webfont; Lucide/Heroicons SVG inline desde CDN, con el **grosor de trazo declarado**) + nota "Proveedor · Estilo · px" | Proveedor de iconos · Estilo de íconos (multiselect: Lineal/Sólido/Redondeado/Recto + grosor px) | 14 · Iconografía |
| §3.9 Tiles de fotografía: captions = los 3 primeros **Estilos fotográficos**; cada tile con foto propia (los campos de foto TOMAN EL NOMBRE de su estilo) · intro ← Tratamiento de color (select estándar) | Estilo fotográfico · fotos por estilo · Tratamiento de color | 15 · Fotografía |
| §3.10 Ilustración — **SECCIÓN OPCIONAL**: sin estilo ni referencias se elimina (subnav + renumeración 3.N); referencias subidas sustituyen los demos; nota ← Estilo de ilustración | Estilo de ilustración · Referencias 1-3 | **16 · Ilustración** |
| §3.11 Elementos gráficos — **SECCIÓN OPCIONAL** igual; referencias visten los tiles de patrón; nota ← Dirección gráfica | Dirección gráfica · Referencias 1-3 | **17 · Elementos gráficos** |
| §3.12 Grid: **diagrama pintado con las columnas declaradas** + escala re-etiquetada (múltiplos de la base) · intro ← Personalidad de rejilla | Columnas (web) · Base de espaciado · Personalidad de rejilla | 18 · Grid |
| §3.13 Motion: tabla Entrada/Salida/Énfasis **derivada** (curva declarada · base/×0.85/×1.3) + nota compuesta | Personalidad de motion · Duración base · Easing | 19 · Motion |
| §3.14 Dataviz — **SECCIÓN OPCIONAL**: sin dirección se elimina (renumeración + portada); barras recoloreadas; nota ← Dirección de dataviz | Dirección de dataviz | **20 · Visualización de datos** |
| §3.15 Sonora — **SECCIÓN OPCIONAL**: dirección y/o clips la activan; los clips se reproducen como <audio> en la guía; nota ← Dirección sonora | Dirección sonora · Clips 1-3 (audio) | **21 · Identidad sonora** |

| Escala 8pt, easing, do/don't, roles de token neutrales | — plantilla (estándar del sistema) | — |

### 04 · Aplicaciones (`04-applications.html`) — dirigida por CONTENIDO
| Guía | Campo | Sección admin |
|---|---|---|
| El CAPÍTULO entero (nav + portada + página) desaparece sin aplicaciones con contenido | **Aplicaciones incluidas** (Impresos exige Piezas; Social exige Redes) | 22 · Aplicaciones |
| §4.1 Impresos: un tile por pieza — imagen subida o mockup del sistema | Piezas impresas (multiselect + Otro) · un slot por pieza (6 = catálogo; nombre = la pieza, sin prefijo; duplicadas entre familias se sufijan «(Familia)») | 22 · Aplicaciones |
| §4.2 Favicon **aplicado** (pestaña de navegador + 48/32/16 con el símbolo real) | (compuesto por el sistema desde el Símbolo) | — |
| §4.2 Social share banner 1200×630 con **zona segura 860×630 pintada** | Social share banner (imagen; sin subir, mockup con guías igual) | 22 · Aplicaciones |
| §4.4 Iconos: el icono subido (el más grande) se aplica a 64/48/32 con máscara por plataforma; 3er grupo = Play Store | Icono iOS (1024) · Icono Android (512 adaptive) · Icono Play Store (512) | 22 · Aplicaciones |
| §4.5 Social 100% visual: tarjeta por red (plantilla subida o mockup) + medidas; la tabla demo se retira | Redes sociales (multiselect cerrado) · un slot por red (6 = catálogo completo; nombre = la red) | 22 · Aplicaciones |
| §4.6 Firma: logo a la izquierda + teléfono + **bloque HTML copiable** (tabla + estilos inline, compuesto por el sistema) | Teléfono de contacto · Personas (nombre) | 22 · Aplicaciones |
| §4.7–§4.12 Presentaciones / Packaging / Señalética / Espacial / Merch / Vehículos — **mismo patrón que Impresos**: cada pieza seleccionada abre su slot de imagen (pres/pack/sign/env 5, merch 6, veh 4 = catálogo; extras de «Otro» con mockup); sin piezas, la sección se omite | Piezas de <sección> + slots dinámicos | 22 · Aplicaciones |
| §4.13 Co-branding: lockup en claro Y oscuro (tintas fijas correctas) | — plantilla | — |
| ~~Publicidad y campañas~~ **ELIMINADA** de la guía y del catálogo | — | — |
| §4.1 chip Pantone/CMYK (solo si se define) | **Color de impresión** — CMYK **derivado del Color de marca** (chip "Generado por el sistema") u Otro manual (Pantone) | 10 · Color |
| §4.6 firma: nombre ← Personas (fila 1) · rol con nombre de marca (i18n) · handle compuesto (`<slug>.example · @<slug>`) | Personas · (compuesto) | 03 · Percepción |
| Mockups: logo/wordmark vía sweeps + **fondos y acentos recoloreados** a la rampa de la marca | derivado del Color de marca | 10 · Color |

### 05 · Recursos (`05-resources.html`)
| Guía | Campo | Sección admin |
|---|---|---|
| Descargas: logo.svg / colors.json / tokens.json / voice.md / formats.json / dark.css | se generan de: 09 logo · 10 color · 12 tipo · 05+06 voz (incl. **Esencia**) · 07 formatos · 11 dark | varias |
| §5.2 Legal: chips (marca ®/™ según registro · titular · aviso ©) + nota con **licencias compuestas por el sistema** (Google Fonts OFL + licencia del proveedor de iconos) | Titular legal · Registro de marca · Aviso legal (© generable por el sistema) | 24 · Legal |
| §5.3 Gobernanza: responsable / contacto / política / **ciclo de revisión** | Responsable · Contacto · Política de aprobaciones · Ciclo de revisión | 25 · Gobernanza y contactos |
| §5.4 Changelog: entradas REALES (versión/fecha/cambios) + versión en portada y pie | Changelog (grupo; la versión la maneja el sistema: cada fila nueva se pre-rellena incremental y la vigente = última fila) · Estado de aprobación | 26 · Control de versiones |
| §5.2 Legal · §5.4 Changelog · 5 links extra (llms.txt, mcp, AGENTS…) | — plantilla | — |

---

## Dirección 2 · Estoy en el ADMIN, ¿dónde cae en la guía?

| Sección admin | Campo | Sale en |
|---|---|---|
| 01 Fundamentos | Esencia | ⚠️ **solo la descarga `voice.md`** (no se ve en páginas) |
| | Propósito / Visión / Misión / Valores | guía §1.1 |
| | Promesa | guía §1.3 + §1.4 ⚠️ |
| | Historia / Hitos | guía §1.2 |
| 02 Posicionamiento | Positioning statement | §1.3 + **lead de portada** |
| | Propuesta de valor | §1.3 + §1.4 |
| | Diferenciadores | §1.3 |
| 03 Percepción | Arquetipo de audiencia / Descripción | §1.5 (+ fila "Segmento" de §1.3 ⚠️) |
| | Personas | §1.5 + firma email (04) |
| | Percepción deseada / Drivers de confianza | ✗ no sale (solo JSON export) |
| 04 Personalidad | Rasgos | §1.6 chips |
| | Arquetipo / Descripción del arquetipo | §1.6 tarjeta |
| 05 Voz y tono | Definición de voz / tono | §2.2 |
| | Principios de escritura | §2.1 chips + §2.3 tarjetas |
| | Gramática y estilo | §2.7 |
| | Ejemplos on/off-brand | §2.11 |
| | Principios de voz / Formalidad / Términos prohibidos | ⚠️ solo `voice.md` |
| 06 Mensajería | Mensaje núcleo | **tagline portada** + §2.6 |
| | Lenguaje de CTA | §2.6 |
| | Jerarquía de mensajes | §2.5 |
| 07 Convenciones | fmt-* (locales/fecha/hora/moneda/estándar) | §2.8 bloque de convenciones declaradas + descarga `formats.json` (la matriz de ejemplos es ilustrativa) |
| 08 Identidad visual | Concepto / Atributos | ✗ no salen |
| 18 Grid | Columnas · Base de espaciado · Personalidad | diagrama + escala + intro (03 §3.12) |
| 19 Motion | Personalidad · Duración base · Easing | tabla de tokens derivada + nota (03 §3.13) |
| 20 Dataviz / 21 Sonora | Dirección (+ clips de audio en Sonora) | secciones opcionales §3.14/§3.15 |
| 09 Logotipo | Símbolo | logo en TODA la guía |
| | Área de respeto (símbolo/principal) | nota + marco punteado pintado (03 §3.2) |
| | Tamaño mínimo (símbolo/principal) | marks/logo al tamaño real declarado (03 §3.2) |
| 10 Color | Color de marca (hex) | rampa `--brand-*` global + tokens.json |
| | Dirección cromática | intro Color (03) |
| | Paleta nombrada | swatches (03) + colors.json |
| | — (movido a 12 · Accesibilidad) | — |
| | Listo para dark mode | select de estados estándar con visual claro/oscuro en el admin → nota dark (03) |
| | Intención semántica | grupo rol/hex/uso con base estándar → bloque `semantic` de colors.json (no sale en páginas) |
| | Logo PNG / EPS / PDF | chips de Formatos (03 §3.2) + filas de descarga (05) — solo los subidos |
| | Paleta de marca | ✗ no sale |
| 13 Modo oscuro (web) | Acento / Superficies | notas §3 dark + `dark.css` |
| 11 Tipografía | Dirección tipográfica | cura los roles: tarjetas + filas de escala visibles (03) + tokens/webfonts/tokens.json |
| | Fuentes display/texto/mono | fuentes de TODA la guía + nombres (tarjetas y tabla de escala, 03) |
| | Personalidad tipográfica | intro Tipografía (03) |
| | Dirección tipográfica | ✗ no sale |
| 15 Fotografía | Estilo fotográfico | captions de los tiles §3.9 |
| | Fotografía de marca / adicional 2 / adicional 3 | fotos por tile (03) + fondos (01/04) |
| | Estilo de ilustración | nota §3.10 |
| | Tratamiento de color | intro Imágenes (03) |
| | Estilo fotográfico | ✗ no sale |
| 14/17 | Estilo de iconos / Motion | notas (03) |
| 22 Aplicaciones | Aplicaciones incluidas | cura QUÉ secciones muestra 04 (renumeradas) |
| 10 Color | Color de impresión (CMYK derivado del hex u Otro manual) | chip §4.1 · link admin → Color (03 §3.4) |
| 11 Tipografía | Fuentes complementarias (grupo uso+fuente) | nota §3.5 "Fuentes complementarias" (lista, sin especímenes) |
| 12 Accesibilidad y contraste | Requisitos · Contraste mínimo | intro + callout §3.6 (tabla derivada del color) + nota contraste oscuro §3.7 |
| 23 Reglas | Restricciones de marca | ✗ no sale (solo JSON export) |


| 24 Legal / 25 Gobernanza / 26 Versiones | legal-* · gov-* · ver-* · apr | §5.2/§5.3/§5.4 + versión de portada/pie |

**Leyenda:** ⚠️ = editable pero vive en un lugar "inesperado" · ✗ = campo interno del panel, no alimenta la guía (por diseño o pendiente).
