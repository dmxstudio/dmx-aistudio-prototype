import type { BriefField, BriefVersion, FieldEvent } from './brief'

// Formal BrandField: extends the Brief field shape with the richer brand metadata
// the spec requires (provenance, taxonomy, dual approval). Rich in the model, light in the view.
export interface BrandField extends BriefField {
  owner?: string
  taxonomy?: 'fact' | 'assumption' | 'risk'
  approval?: { human: boolean; client: boolean }
  // Repeatable structured group (values, milestones, personas…). When present, this field is a
  // list of objects the brand-book renders as cards/rows; `value` stays as a flat summary.
  rows?: Record<string, string>[]
}

export interface BrandSection {
  code: string
  id: string
  name: string
  fields: BrandField[]
}

export interface BrandScale {
  key: string
  left: string
  right: string
  value: number // 1..5
}

export const personalityScales: BrandScale[] = [
  { key: 'premium', left: 'Accesible', right: 'Premium', value: 4 },
  { key: 'human', left: 'Técnica', right: 'Humana', value: 4 },
  { key: 'energetic', left: 'Calmada', right: 'Enérgica', value: 2 },
  { key: 'expressive', left: 'Minimal', right: 'Expresiva', value: 3 },
]

// 11 campos del "mínimo viable" que desbloquean el avance a Design System.
export const brandGateIds = [
  'bf-essence',
  'bf-purpose',
  'bp-traits',
  'vt-principles',
  'ps-statement',
  'vi-concept',
  'vi-attributes',
  'cd-direction',
  'td-direction',
  'acc-req',
  'br-restrictions',
]

// Per-brand history feed for the HistoryDrawer (mock), mirroring brief's briefVersions/briefHistory.
// Used for the seeded brands (Nimbus p1 / Meridian p4); other projects fall back to emptyVersions.
export const brandVersions: BriefVersion[] = [
  { id: 'bv3', label: 'Borrador actual', author: 'tú', when: 'hace 5 min', current: true },
  { id: 'bv2', label: 'Sellada tras workshop', author: 'Brand Strategist', when: '14 jun', sealed: true },
  { id: 'bv1', label: 'Branding inicial', author: 'IA', when: '12 jun', origin: 'ai' },
]
export const brandHistory: FieldEvent[] = [
  { id: 'bh1', field: 'Esencia', detail: 'aprobada por equipo y cliente', origin: 'human', when: 'ahora' },
  { id: 'bh2', field: 'Dirección cromática', detail: 'conflicto: IA “neutrales fríos” vs “cálidos del tueste”', origin: 'human', when: 'hace 1 h' },
  { id: 'bh3', field: 'Misión', detail: 'IA generó propuesta · 0.6 — en revisión', origin: 'ai', when: 'ayer' },
  { id: 'bh4', field: 'Rasgos', detail: 'heredados del Brief (señal de tono)', origin: 'human', when: '12 jun' },
]

const f = (o: BrandField): BrandField => o
// Slots de imagen por pieza: tantos como opciones tiene el catálogo de su multiselect
// (displaySections los nombra por la pieza seleccionada y oculta los que sobran; piezas
// extra escritas en «Otro» van con mockup del sistema).
const slots = (pre: string, label: string, n: number): BrandField[] =>
  Array.from({ length: n }, (_, i) =>
    f({ id: `${pre}-img-${i + 1}`, label: `${label} ${i + 1}`, value: '', status: 'empty', origin: 'human', optional: true }),
  )

export const brandSections: BrandSection[] = [
  {
    code: '01',
    id: 'foundation',
    name: 'Brand Foundation',
    fields: [
      f({ id: 'bf-essence', label: 'Esencia', value: 'Calidez artesanal', status: 'closed', origin: 'human', required: true, owner: 'Brand Strategist', source: 'workshop', taxonomy: 'fact', approval: { human: true, client: true } }),
      f({ id: 'bf-purpose', label: 'Propósito', value: 'Devolver el ritual humano del café a la compra online', status: 'closed', origin: 'human', required: true, owner: 'Brand Strategist', taxonomy: 'fact', approval: { human: true, client: false } }),
      f({ id: 'bf-vision', label: 'Visión', value: 'Que pedir café de especialidad en casa sea tan natural como en la barra', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'bf-mission', label: 'Misión', value: 'Suscribirse a café de especialidad tan simple como pedirlo en barra', status: 'decision', origin: 'ai', required: true, kind: 'review', confidence: 0.6 }),
      f({ id: 'bf-values', label: 'Valores', value: 'Transparencia · Cercanía · Origen', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { name: 'Transparencia', desc: 'Mostramos origen, proceso y rostro.' },
        { name: 'Cercanía', desc: 'Hablamos como baristas, no como banco.' },
        { name: 'Origen', desc: 'Cada grano tiene una finca y una historia.' },
      ] }),
      f({ id: 'bf-promise', label: 'Promesa', value: 'Tostado en las últimas 72h', status: 'decision', origin: 'ai', required: true, kind: 'question', blocks: 'aprobación legal (claim)', taxonomy: 'assumption' }),
      f({ id: 'bf-story', label: 'Historia y herencia', value: 'Nimbus nació en una barra de barrio: el mismo café, ahora en casa', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'bf-milestones', label: 'Hitos', value: '2023 Primera tienda · 2024 Suscripción · 2025 Tueste propio', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { year: '2023', event: 'Primera tienda de barrio' },
        { year: '2024', event: 'Suscripción de café en línea' },
        { year: '2025', event: 'Tueste propio' },
      ] }),
    ],
  },
  {
    code: '02',
    id: 'positioning',
    name: 'Positioning & Strategy',
    fields: [
      f({ id: 'ps-statement', label: 'Positioning statement', value: 'Para amantes del café de origen, Nimbus es la suscripción que hace personal lo que la compra online volvió transaccional', status: 'inProgress', origin: 'ai', required: true }),
      f({ id: 'ps-uvp', label: 'Propuesta de valor', value: 'Café de origen, fresco y con rostro', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'ps-diff', label: 'Diferenciadores', value: 'Trazabilidad + tostado reciente', status: 'inProgress', origin: 'ai', optional: true }),
    ],
  },
  {
    code: '03',
    id: 'perception',
    name: 'Audience Perception',
    fields: [
      f({ id: 'ap-desired', label: 'Percepción deseada', value: 'Cercana y confiable, no "otra tienda online"', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'ap-trust', label: 'Drivers de confianza', value: 'Origen visible · reseñas reales · garantía', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'ap-aaname', label: 'Arquetipo de audiencia', value: 'Los que ritualizan', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'ap-aatext', label: 'Descripción de audiencia', value: 'Gente para quien el café es un momento, no un commodity', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'ap-personas', label: 'Personas', value: 'Ana Ríos · Lucía Fontes · Daniel Cruz', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { name: 'Ana Ríos', ptype: 'User persona', seg: 'Suscriptora semanal', quote: 'Quiero el de siempre, sin pensarlo.' },
        { name: 'Lucía Fontes', ptype: 'Buyer persona', seg: 'Compra para la oficina', quote: 'Que llegue a tiempo y le guste a todos.' },
        { name: 'Daniel Cruz', ptype: 'Proto-persona', seg: 'Curioso del origen', quote: 'Me gusta saber de dónde viene.' },
      ] }),
    ],
  },
  {
    code: '04',
    id: 'personality',
    name: 'Brand Personality',
    fields: [
      f({ id: 'bp-traits', label: 'Rasgos', value: 'Cálida · artesanal · confiable · cercana', status: 'closed', origin: 'human', required: true, inherited: true, owner: 'Brand Strategist', source: 'brief.signals.tone', approval: { human: true, client: false } }),
      f({ id: 'bp-archetype', label: 'Arquetipo', value: 'El Cuidador', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'bp-archetype-desc', label: 'Descripción del arquetipo', value: 'Nimbus cuida y acerca: cálido, cercano y confiable, como tu barista de siempre.', status: 'inProgress', origin: 'ai', optional: true }),
    ],
  },
  {
    code: '05',
    id: 'voice',
    name: 'Voice & Tone',
    fields: [
      f({ id: 'vt-principles', label: 'Principios de voz', value: 'Habla como barista, no como banco', status: 'closed', origin: 'human', required: true, inherited: true, owner: 'Content Designer', source: 'brief.signals.tone' }),
      f({ id: 'vt-formality', label: 'Formalidad', value: 'Media-baja', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'vt-forbidden', label: 'Términos prohibidos', value: 'disruptivo · sinergia · revolucionario', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'vt-voicedef', label: 'Definición de voz', value: 'Quiénes somos al escribir: cálidos, cercanos, de barrio. No cambia.', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'vt-tonedef', label: 'Definición de tono', value: 'Cómo nos adaptamos al momento del lector. Sí cambia.', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'vt-tone-traits', label: 'Principios de escritura', value: 'Cálida · Cercana · Confiable', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { trait: 'Cálida', is: 'humana, con calor', isnot: 'cursi', ex: '«Tu café favorito, listo otra vez.»' },
        { trait: 'Cercana', is: 'de tú a tú', isnot: 'informal de más', ex: '«¿Te preparo el de siempre?»' },
        { trait: 'Confiable', is: 'clara y cumplidora', isnot: 'sosa', ex: '«Tostado hace 2 días. Te llega el viernes.»' },
      ] }),
      f({ id: 'vt-grammar', label: 'Gramática y estilo', value: 'Sentence case · coma sin Oxford · voz activa', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { rule: 'Sentence case', example: '«Arma tu caja», no «Arma tu Caja».', convention: 'Solo mayúscula inicial y nombres propios.' },
        { rule: 'Coma en listas', example: '«origen, tueste y método»', convention: 'Sin coma de Oxford.' },
        { rule: 'Voz activa', example: '«Tostamos tu café», no «Tu café fue tostado».', convention: 'Sujeto que actúa; evita la pasiva.' },
        { rule: 'Números', example: '«tres orígenes», «12 SKUs»', convention: 'Cero a nueve en palabra; 10+ en cifra.' },
        { rule: 'Énfasis', example: '«Fresco», no «FRESCO».', convention: 'Sin mayúsculas sostenidas; usa peso.' },
      ] }),
      f({ id: 'vt-example-on', label: 'Ejemplo on-brand', value: '«Tu café no llegó a tiempo. Te mandamos uno fresco, va por nuestra cuenta.»', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'vt-example-off', label: 'Ejemplo off-brand', value: '«Incidencia de entrega: pedido no completado según SLA.»', status: 'inProgress', origin: 'ai', optional: true }),
    ],
  },
  {
    code: '06',
    id: 'messaging',
    name: 'Messaging',
    fields: [
      f({ id: 'msg-core', label: 'Mensaje núcleo', value: 'El café de tu barista, en tu casa', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'msg-cta', label: 'Lenguaje de CTA', value: 'Prueba tu primer origen · Ver orígenes · Suscríbete', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'msg-hierarchy', label: 'Jerarquía de mensajes', value: 'Idea central · Mensajes clave · Pruebas', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { level: 'Idea central', text: 'El café de tu barista, en tu casa.' },
        { level: 'Mensajes clave', text: 'Origen visible · tostado reciente · sin fricción.' },
        { level: 'Pruebas', text: 'Tostado hace 72h · suscripción flexible · garantía.' },
      ] }),
    ],
  },
  {
    code: '07',
    id: 'format',
    name: 'Format conventions',
    fields: [
      f({ id: 'fmt-locales', label: 'Locales', value: 'es-MX · en-US', status: 'closed', origin: 'human' }),
      f({ id: 'fmt-date', label: 'Formato de fecha', value: 'Mes escrito (12 de may 2026)', status: 'inProgress', origin: 'ai' }),
      f({ id: 'fmt-time', label: 'Formato de hora', value: '24 h (14:30)', status: 'inProgress', origin: 'ai' }),
      f({ id: 'fmt-currency', label: 'Moneda principal', value: 'MXN ($)', status: 'closed', origin: 'human' }),
      f({ id: 'fmt-storage', label: 'Estándar de datos', value: 'ISO 8601 · E.164 · ISO 4217 · SI', status: 'closed', origin: 'human' }),
    ],
  },
  // Sections 08–17 mirror the guide's 03-visual page order (3.1 logo → 3.13 motion) so editors
  // can review admin ↔ guide top-to-bottom. Field order inside each section follows the guide too.
  {
    code: '08',
    id: 'visual',
    name: 'Visual Identity',
    fields: [
      f({ id: 'vi-concept', label: 'Concepto visual', value: 'Editorial cálido con textura artesanal', status: 'inProgress', origin: 'ai', required: true }),
      f({ id: 'vi-attributes', label: 'Atributos', value: 'Espacioso · táctil · orgánico', status: 'inProgress', origin: 'ai', required: true }),
    ],
  },
  {
    code: '09',
    id: 'logo',
    name: 'Logo System & Variants',
    fields: [
      f({ id: 'logo-primary', label: 'Logo principal', value: '', status: 'empty', origin: 'human', required: true }),
      f({ id: 'logo-stacked', label: 'Logo apilado', value: '', status: 'empty', origin: 'human', optional: true }),
      // Símbolo: uploader (SVG o PNG). Los seeds llevan marcado SVG inline — sigue siendo válido y
      // es lo que la guía integra/recolorea; una imagen subida se intercambia como <img>.
      f({ id: 'logo-svg', label: 'Símbolo', value: '<svg class="mk" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#8B5E3C"/><g fill="#F5F0E8"><circle cx="16" cy="14" r="2.3"/><circle cx="20" cy="12.4" r="2.9"/><circle cx="24" cy="14" r="2.3"/><rect x="15.8" y="13.6" width="8.4" height="2.8" rx="1.4"/></g><path d="M13.6 20.6h11.8v3.5a4.5 4.5 0 0 1-4.5 4.5h-2.8a4.5 4.5 0 0 1-4.5-4.5z" fill="#F5F0E8"/><path d="M25.4 21.5h1.4a2.4 2.4 0 0 1 0 4.8h-1.4" fill="none" stroke="#F5F0E8" stroke-width="1.7"/></svg>', status: 'closed', origin: 'human', optional: true }),
      f({ id: 'logo-wordmark', label: 'Wordmark', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'logo-mono', label: 'Monocromo', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'logo-inverse', label: 'Inverso', value: '', status: 'empty', origin: 'human', optional: true }),
      // Reglas de uso (§3.2, orden de la guía: principal primero). Valores estándar seleccionables
      // o personalizados en px/mm — bookData los interpreta para PINTAR los diagramas de la guía.
      f({ id: 'logo-primary-clearspace', label: 'Área de respeto (principal)', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'logo-primary-minsize', label: 'Tamaño mínimo (principal)', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'logo-clearspace', label: 'Área de respeto (símbolo)', value: '1× la altura del símbolo', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'logo-minsize', label: 'Tamaño mínimo (símbolo)', value: '24 px pantalla · 8 mm impreso', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'logo-backgrounds', label: 'Fondos válidos', value: 'Sobre claro · Sobre oscuro · Sobre color de marca · Sobre fotografía', status: 'closed', origin: 'human', optional: true }),
      f({ id: 'logo-bg-photo', label: 'Fondo de referencia (imagen)', value: '', status: 'empty', origin: 'human', optional: true }),
      // Formatos de archivo (§3.2): el SVG lo genera el sistema desde el símbolo; los demás se
      // suben aquí. Solo los formatos existentes aparecen como descarga en la guía.
      f({ id: 'logo-file-png', label: 'Logo PNG', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'logo-file-eps', label: 'Logo EPS', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'logo-file-pdf', label: 'Logo PDF', value: '', status: 'empty', origin: 'human', optional: true }),
    ],
  },
  {
    code: '10',
    id: 'color',
    name: 'Color Palette',
    fields: [
      f({ id: 'cd-direction', label: 'Dirección cromática', value: 'Neutrales cálidos del tueste + acento terracota de origen', status: 'decision', origin: 'ai', required: true, kind: 'conflict', aiValue: 'Neutrales fríos, minimalista tech', humanValue: 'Neutrales cálidos del tueste + terracota de origen', blocks: 'paleta de marca (cd-primary)' }),
      f({ id: 'cd-brand-hex', label: 'Color de marca (hex)', value: '#8B5E3C', status: 'closed', origin: 'human', optional: true }),
      f({ id: 'cd-palette', label: 'Paleta nombrada', value: 'Tostado · Crema · Terracota · Espresso · Canela', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { name: 'Tostado', role: 'Primario / acción', hex: '#8B5E3C' },
        { name: 'Crema', role: 'Fondo cálido / superficie', hex: '#F5F0E8' },
        { name: 'Terracota', role: 'Acento / origen', hex: '#C85A28' },
        { name: 'Espresso', role: 'Texto / profundidad', hex: '#2A2420' },
        { name: 'Canela', role: 'Neutro cálido / superficie secundaria', hex: '#C89A6B' },
      ] }),
      f({ id: 'cd-primary', label: 'Paleta de marca', value: 'Tostado · Crema · Espresso', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { name: 'Tostado', hex: '#8B5E3C' },
        { name: 'Crema', hex: '#F5F0E8' },
        { name: 'Espresso', hex: '#2A2420' },
      ] }),
      // Colores semánticos con base estándar (verde/ámbar/rojo/azul), separados de la marca:
      // rol + hex + cuándo se usa, como grupo estructurado.
      f({ id: 'cd-semantic', label: 'Intención semántica', value: 'Éxito · Advertencia · Error · Información', status: 'inProgress', origin: 'ai', optional: true, rows: [
        { role: 'Éxito', hex: '#16A34A', use: 'Confirmaciones y estados completados' },
        { role: 'Advertencia', hex: '#D97706', use: 'Avisos que requieren atención' },
        { role: 'Error', hex: '#DC2626', use: 'Fallos, validaciones y acciones destructivas' },
        { role: 'Información', hex: '#2563EB', use: 'Mensajes neutrales del sistema' },
      ] }),
      // Especificación de color para impresos (§4.1): alimenta el chip Pantone/CMYK de la guía;
      // sin valor, el chip se oculta para la marca.
      f({ id: 'cd-print', label: 'Color de impresión', value: 'CMYK 0/32/57/45', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'cd-dark', label: 'Listo para dark mode', value: 'Parcial — solo acento adaptado', status: 'closed', origin: 'human', optional: true, owner: 'Design System Manager', source: 'brief', taxonomy: 'fact' }),
    ],
  },
  {
    code: '11',
    id: 'typography',
    name: 'Typography',
    fields: [
      f({ id: 'td-personality', label: 'Personalidad tipográfica', value: 'Humanista y cálida', status: 'inProgress', origin: 'ai', optional: true }),
      // Dirección tipográfica = QUÉ roles tipográficos existen (obligatoria). Cada rol
      // seleccionado activa su campo de fuente abajo y lo vuelve obligatorio; los roles no
      // seleccionados se ocultan aquí y en la guía.
      f({ id: 'td-direction', label: 'Dirección tipográfica', value: 'Display · Texto · Mono', status: 'closed', origin: 'human', required: true, owner: 'Design System Manager', source: 'brief' }),
      f({ id: 'font-display', label: 'Fuente display', value: 'Fraunces', status: 'closed', origin: 'human' }),
      f({ id: 'font-text', label: 'Fuente de texto', value: 'Work Sans', status: 'closed', origin: 'human' }),
      f({ id: 'font-mono', label: 'Fuente mono', value: 'IBM Plex Mono', status: 'closed', origin: 'human' }),
      // Fuentes complementarias: se listan en el admin y la guía las anota (§3.5) sin extenderlas.
      f({ id: 'font-extra', label: 'Fuentes complementarias', value: '', status: 'empty', origin: 'human', optional: true }),
    ],
  },
  {
    code: '12',
    id: 'accessibility',
    name: 'Accessibility & Contrast',
    fields: [
      f({ id: 'acc-req', label: 'Requisitos de accesibilidad', value: 'WCAG 2.2 AA · contraste verificado claro/oscuro', status: 'closed', origin: 'human', required: true }),
      f({ id: 'cd-contrast', label: 'Contraste mínimo', value: '4.5:1 texto · 3:1 UI (AA)', status: 'closed', origin: 'human', optional: true }),
    ],
  },
  {
    code: '13',
    id: 'darkmode',
    name: 'Dark Mode (web)',
    fields: [
      f({ id: 'dm-accent', label: 'Acento para oscuro', value: '#D4A574', status: 'inProgress', origin: 'ai', owner: 'Design System Manager' }),
      f({ id: 'dm-surface', label: 'Superficies y elevación', value: 'Marrón café profundo (no negro azulado); elevación por luz cálida', status: 'inProgress', origin: 'ai' }),
    ],
  },
  {
    code: '14',
    id: 'iconography',
    name: 'Iconography',
    fields: [
      f({ id: 'ico-provider', label: 'Proveedor de iconos', value: 'Lucide', status: 'closed', origin: 'human', optional: true }),
      f({ id: 'ico-style', label: 'Estilo de íconos', value: 'Lineal · 1.75 px', status: 'inProgress', origin: 'ai', optional: true }),
    ],
  },
  {
    code: '15',
    id: 'imagery',
    name: 'Photography & Art Direction',
    fields: [
      // Estilo fotográfico: los TRES primeros estilos seleccionados nombran los tiles de la guía
      // (§3.9); cada tile puede llevar su propia foto (1-3), con la 1 como fallback global.
      f({ id: 'img-style', label: 'Estilo fotográfico', value: 'Luz natural · Texturas de cerca · Personas reales', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'img-treatment', label: 'Tratamiento de color', value: 'Tonos cálidos', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'img-photo', label: 'Fotografía de marca', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'img-photo-2', label: 'Fotografía adicional 2', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'img-photo-3', label: 'Fotografía adicional 3', value: '', status: 'empty', origin: 'human', optional: true }),
    ],
  },
  {
    code: '16',
    id: 'illustration',
    name: 'Illustration Style',
    // Sección OPCIONAL de la guía (§3.10): sin estilo ni referencias, la guía la oculta.
    // Las referencias subidas sustituyen los demos genéricos de la sección.
    fields: [
      f({ id: 'ill-style', label: 'Estilo de ilustración', value: 'Orgánica con textura', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'ill-ref-1', label: 'Referencia 1', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'ill-ref-2', label: 'Referencia 2', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'ill-ref-3', label: 'Referencia 3', value: '', status: 'empty', origin: 'human', optional: true }),
    ],
  },
  {
    code: '17',
    id: 'graphic',
    name: 'Graphic Elements & Patterns',
    // Igual que Ilustración: sección opcional de la guía (§3.11); las referencias visten los
    // tiles de patrón.
    fields: [
      f({ id: 'ge-style', label: 'Dirección gráfica', value: 'Texturas y grano', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'ge-ref-1', label: 'Referencia 1', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'ge-ref-2', label: 'Referencia 2', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'ge-ref-3', label: 'Referencia 3', value: '', status: 'empty', origin: 'human', optional: true }),
    ],
  },
  {
    code: '18',
    id: 'grid',
    name: 'Grid, Layout & Spacing',
    // Decisiones prácticas de layout: la guía PINTA el diagrama (N columnas) y la escala
    // de espaciado (múltiplos de la base declarada).
    fields: [
      f({ id: 'vi-grid', label: 'Personalidad de rejilla', value: 'Modular, aireada', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'grid-columns', label: 'Columnas (web)', value: '12 columnas', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'grid-spacing', label: 'Base de espaciado', value: 'Escala de 8 pt', status: 'inProgress', origin: 'ai', optional: true }),
    ],
  },
  {
    code: '19',
    id: 'motion',
    name: 'Motion & Animation',
    // La tabla de easing/duración de la guía se DERIVA de la duración base y el easing declarados.
    fields: [
      f({ id: 'mo-personality', label: 'Personalidad de motion', value: 'Transiciones suaves', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'mo-duration', label: 'Duración base', value: 'Rápida (150 ms)', status: 'inProgress', origin: 'ai', optional: true }),
      f({ id: 'mo-easing', label: 'Easing', value: 'Ease-out — entradas naturales', status: 'inProgress', origin: 'ai', optional: true }),
    ],
  },
  {
    code: '20',
    id: 'dataviz',
    name: 'Data Visualization',
    // Sección OPCIONAL de la guía (§3.14): sin dirección declarada, no se muestra.
    fields: [f({ id: 'dv-style', label: 'Dirección de dataviz', value: '', status: 'empty', origin: 'human', optional: true })],
  },
  {
    code: '21',
    id: 'sonic',
    name: 'Sonic Identity',
    // Sección OPCIONAL de la guía (§3.15): al activarla (dirección y/o clips), la guía muestra
    // los clips subidos como reproductores de audio.
    fields: [
      f({ id: 'sonic-style', label: 'Dirección sonora', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'sonic-clip-1', label: 'Clip 1', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'sonic-clip-2', label: 'Clip 2', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'sonic-clip-3', label: 'Clip 3', value: '', status: 'empty', origin: 'human', optional: true }),
    ],
  },
  {
    code: '22',
    id: 'applications',
    name: 'Brand Applications',
    // 04 · Aplicaciones dirigida por CONTENIDO: sin aplicaciones incluidas, el capítulo entero
    // desaparece de la guía; Impresos exige piezas y Social exige redes. Los slots de imagen
    // (print-img-N / social-img-N) toman el nombre de su pieza/red seleccionada y solo se
    // muestran tantos como haya seleccionadas.
    fields: [
      f({ id: 'app-rules', label: 'Aplicaciones incluidas', value: 'Impresos y papelería · Digital y web · Iconos de app y assets de tienda · Redes sociales · Email y firmas', status: 'inProgress', origin: 'ai', optional: true }),
      // §4.1 Impresos: piezas seleccionadas → un slot de imagen por pieza (mockup del sistema si no se sube).
      f({ id: 'print-pieces', label: 'Piezas impresas', value: 'Tarjetas de presentación · Hoja membretada · Folder', status: 'inProgress', origin: 'ai', optional: true }),
      ...slots('print', 'Impreso', 6),
      // §4.2 Digital: el favicon lo compone el sistema desde el símbolo; el banner social es
      // 1200×630 con zona segura centrada de 860×630 (la guía pinta las guías encima).
      f({ id: 'dig-og', label: 'Social share banner', value: '', status: 'empty', origin: 'human', optional: true }),
      // §4.4 Iconos de app: se sube EL MÁS GRANDE por plataforma y la guía rellena los tamaños.
      f({ id: 'appicon-ios', label: 'Icono iOS', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'appicon-android', label: 'Icono Android', value: '', status: 'empty', origin: 'human', optional: true }),
      f({ id: 'appicon-play', label: 'Icono Play Store', value: '', status: 'empty', origin: 'human', optional: true }),
      // §4.5 Social: primero se definen las redes; cada red abre su slot de plantilla.
      f({ id: 'social-networks', label: 'Redes sociales', value: '', status: 'empty', origin: 'human', optional: true }),
      ...slots('social', 'Plantilla', 6),
      // §4.6 Firma de email: teléfono de contacto + bloque HTML copiable (lo compone el sistema).
      f({ id: 'sig-phone', label: 'Teléfono de contacto', value: '', status: 'empty', origin: 'human', optional: true }),
      // §4.7–§4.12: misma lógica que Impresos — cada pieza seleccionada abre su slot de imagen
      // (los slots toman el nombre de su pieza; piezas extra de «Otro» van con mockup del sistema).
      f({ id: 'pres-pieces', label: 'Piezas de presentación', value: '', status: 'empty', origin: 'human', optional: true }),
      ...slots('pres', 'Presentación', 5),
      f({ id: 'pack-pieces', label: 'Piezas de packaging', value: '', status: 'empty', origin: 'human', optional: true }),
      ...slots('pack', 'Packaging', 5),
      f({ id: 'sign-pieces', label: 'Piezas de señalética', value: '', status: 'empty', origin: 'human', optional: true }),
      ...slots('sign', 'Señalética', 5),
      f({ id: 'env-pieces', label: 'Piezas de espacial / retail', value: '', status: 'empty', origin: 'human', optional: true }),
      ...slots('env', 'Espacial', 5),
      f({ id: 'merch-pieces', label: 'Piezas de merchandising', value: '', status: 'empty', origin: 'human', optional: true }),
      ...slots('merch', 'Merch', 6),
      f({ id: 'veh-pieces', label: 'Piezas de rotulación', value: '', status: 'empty', origin: 'human', optional: true }),
      ...slots('veh', 'Vehículo', 4),
    ],
  },
  {
    code: '23',
    id: 'rules',
    name: 'Brand Rules & Restrictions',
    fields: [
      f({ id: 'br-restrictions', label: 'Restricciones de marca', value: 'Conservar el verde de marca · sin claims sin validar', status: 'closed', origin: 'human', required: true, inherited: true, source: 'brief.signals.restrictions' }),
    ],
  },
  {
    code: '24',
    id: 'legal',
    name: 'Legal, Trademark & Licensing',
    // §5.2 de la guía: titular + estado de registro + aviso (el sistema deriva el aviso © y
    // compone la nota de licencias desde fuentes/iconos declarados).
    fields: [
      f({ id: 'legal-entity', label: 'Titular legal', value: 'Nimbus Coffee, S.A. de C.V.', status: 'inProgress', origin: 'human', optional: true }),
      f({ id: 'legal-tm', label: 'Registro de marca', value: 'En trámite ™', status: 'inProgress', origin: 'human', optional: true }),
      f({ id: 'legal-notice', label: 'Aviso legal / copyright', value: '© 2026 Nimbus Coffee. Todos los derechos reservados.', status: 'inProgress', origin: 'human', optional: true }),
    ],
  },
  {
    code: '25',
    id: 'governance',
    name: 'Governance & Contacts',
    // §5.3: responsable, contacto, política y ciclo de revisión.
    fields: [
      f({ id: 'gov-owner', label: 'Responsable de marca', value: 'Equipo de marca', status: 'closed', origin: 'human', optional: true }),
      f({ id: 'gov-contact', label: 'Contacto de marca', value: 'marca@nimbus.example', status: 'closed', origin: 'human', optional: true }),
      f({ id: 'gov-approvals', label: 'Política de aprobaciones', value: 'Los cambios de marca requieren visto bueno del equipo de marca.', status: 'inProgress', origin: 'human', optional: true }),
      f({ id: 'gov-review', label: 'Ciclo de revisión', value: 'Semestral', status: 'inProgress', origin: 'human', optional: true }),
    ],
  },
  {
    code: '26',
    id: 'versioning',
    name: 'Version Control / Changelog',
    // §5.4: changelog (filas versión/fecha/cambios) + estado de aprobación. La versión actual
    // la maneja el SISTEMA: es la de la última entrada del changelog (cada fila nueva se
    // pre-rellena con el incremento automático) y alimenta portada y pie del manual.
    fields: [
      f({ id: 'ver-log', label: 'Changelog', value: 'v1.0', status: 'inProgress', origin: 'human', optional: true, rows: [
        { ver: 'v1.0', date: '2026-06', note: 'Primera versión pública de la marca.' },
      ] }),
      f({ id: 'apr', label: 'Estado de aprobación', value: 'En revisión', status: 'inProgress', origin: 'human', optional: true }),
    ],
  },
]

// Meridian (project p4) brand content. Strategic fields mirror the brand-book template so
// /book?brand=3 reproduces the demo from the panel; the rest is Meridian-aligned. Same value-map
// pattern as the brief's meridianValues. ponytail: data over re-declaring 50 field objects.
type Override = { value: string; rows?: Record<string, string>[] }
const meridianBranding: Record<string, Override> = {
  'bf-essence': { value: 'Coherencia, hecha simple' },
  'bf-purpose': { value: 'Existimos para que cualquier equipo cree con la coherencia de una gran marca.' },
  'bf-vision': { value: 'Ser el punto de referencia que alinea marca, producto y comunicación.' },
  'bf-mission': { value: 'Orientar a cada equipo para crear con claridad y confianza.' },
  'bf-values': {
    value: 'Claridad · Rigor · Calidez',
    rows: [
      { name: 'Claridad', desc: 'Decimos lo esencial, sin ruido.' },
      { name: 'Rigor', desc: 'Cada decisión tiene un porqué.' },
      { name: 'Calidez', desc: 'Profesionales, nunca distantes.' },
    ],
  },
  'bf-promise': { value: 'Si sigues la guía, siempre se ve y suena como Meridian.' },
  'bf-story': { value: 'Meridian nació de una idea simple: la coherencia no debería depender de una sola persona. Lo que empezó como una guía interna hoy es un sistema completo.' },
  'bf-milestones': {
    value: '2024 Primera guía interna · 2025 Sistema visual v1 · 2026 Guía pública',
    rows: [
      { year: '2024', event: 'Primera guía interna' },
      { year: '2025', event: 'Sistema visual v1' },
      { year: '2026', event: 'Guía pública' },
    ],
  },
  'ps-statement': { value: 'Para equipos que crecen rápido, Meridian es el sistema de marca que mantiene todo alineado — de la estrategia a la última aplicación.' },
  'ps-uvp': { value: 'Una sola fuente de verdad para la marca: menos fricción, más coherencia.' },
  'ps-diff': { value: 'Sistema vivo y aplicable, no un PDF estático' },
  'ap-desired': { value: 'El estándar de coherencia de marca, no otra herramienta' },
  'ap-trust': { value: 'Sistema completo · ejemplos reales · adopción del equipo' },
  'ap-aaname': { value: 'Los que escalan' },
  'ap-aatext': { value: 'Equipos en crecimiento que valoran velocidad y coherencia; quieren verse profesionales sin frenar.' },
  'ap-personas': {
    value: 'Ana Ríos · Lucía Fonts · Daniel Cruz',
    rows: [
      { name: 'Ana Ríos', ptype: 'User persona', seg: 'Líder de diseño', quote: 'Necesito que cualquiera en el equipo cree on-brand.' },
      { name: 'Lucía Fonts', ptype: 'Buyer persona', seg: 'Head of Brand', quote: 'Cada pieza debe verse como nosotros.' },
      { name: 'Daniel Cruz', ptype: 'Proto-persona', seg: 'Marketing', quote: 'Que las plantillas hagan el trabajo pesado.' },
    ],
  },
  'bp-traits': { value: 'Claro · Confiado · Humano' },
  'bp-archetype': { value: 'El Guía' },
  'bp-archetype-desc': { value: 'Meridian acompaña y orienta: experto, claro y confiable, nunca protagonista.' },
  'vt-principles': { value: 'Claro, riguroso y cálido — explica el porqué' },
  'vt-formality': { value: 'Media' },
  'vt-forbidden': { value: 'disruptivo · sinergia · revolucionario' },
  'vt-voicedef': { value: 'Quiénes somos al escribir: claros, confiados, humanos. No cambia.' },
  'vt-tonedef': { value: 'Cómo nos adaptamos al contexto y al estado de ánimo del lector. Sí cambia.' },
  'vt-tone-traits': {
    value: 'Claro · Confiado · Humano',
    rows: [
      { trait: 'Claro', is: 'directo, concreto', isnot: 'simplista', ex: '«Listo. Tu marca está publicada.»' },
      { trait: 'Confiado', is: 'seguro, con criterio', isnot: 'arrogante', ex: '«Esta es la mejor opción para ti.»' },
      { trait: 'Humano', is: 'cercano, cálido', isnot: 'informal de más', ex: '«Te ayudamos a resolverlo.»' },
    ],
  },
  'msg-hierarchy': {
    value: 'Idea central · Mensajes clave · Pruebas',
    rows: [
      { level: 'Idea central', text: 'Mantén tu marca alineada, siempre.' },
      { level: 'Mensajes clave', text: 'Una fuente de verdad · Plantillas listas · Coherencia a escala.' },
      { level: 'Pruebas', text: '55 secciones · estándar internacional · bilingüe.' },
    ],
  },
  'vt-grammar': {
    value: 'Sentence case · coma sin Oxford · voz activa',
    rows: [
      { rule: 'Sentence case', example: '«Descargar assets», no «Descargar Assets».', convention: 'Solo mayúscula inicial y nombres propios.' },
      { rule: 'Coma en listas', example: '«logo, color y tipografía»', convention: 'Sin coma de Oxford (RAE).' },
      { rule: 'Voz activa', example: '«Publicamos tu marca», no «Tu marca fue publicada».', convention: 'Sujeto que actúa; evita la pasiva.' },
      { rule: 'Números', example: '«tres pasos», «53 secciones»', convention: 'Cero a nueve en palabra; 10+ en cifra.' },
      { rule: 'Énfasis', example: '«Importante», no «IMPORTANTE».', convention: 'Sin MAYÚSCULAS sostenidas; usa peso para resaltar.' },
    ],
  },
  'vt-example-on': { value: '«Algo salió mal al guardar. Inténtalo de nuevo en un momento.»' },
  'vt-example-off': { value: '«ERROR 500: la petición no pudo ser procesada por el servidor.»' },
  'msg-core': { value: 'Aligned by design' },
  'msg-cta': { value: 'Ver el sistema · Ver la guía · Descargar assets' },
  'fmt-locales': { value: 'es-MX · en-US' },
  'fmt-date': { value: 'Mes escrito (12 may 2026)' },
  'fmt-time': { value: '24 h (14:30)' },
  'fmt-currency': { value: 'USD (US$)' },
  'fmt-storage': { value: 'ISO 8601 · ISO 4217 · SI' },
  'vi-concept': { value: 'Sistema suizo: claro, ordenado, con aire' },
  'vi-attributes': { value: 'Preciso · sobrio · confiable' },
  'vi-grid': { value: 'Rejilla modular, mucho blanco' },
  'logo-primary': { value: '/book/assets/downloads/meridian-logo.svg' },
  'logo-clearspace': { value: '1× la altura del símbolo' },
  'logo-minsize': { value: '24 px pantalla · 8 mm impreso' },
  'logo-primary-clearspace': { value: '1× la altura del símbolo' },
  'logo-primary-minsize': { value: '120 px pantalla · 25 mm impreso' },
  'logo-backgrounds': { value: 'Sobre claro · Sobre oscuro · Sobre color de marca · Sobre fotografía' },
  // Símbolo real de Meridian (meridian_simb.svg) — viewBox 400 nativo; el sweep del book copia el
  // viewBox del mark almacenado, así que no hace falta reescalar coordenadas.
  'logo-svg': { value: '<svg class="mk" viewBox="0 0 400 400" aria-hidden="true"><path fill="#2C46D8" d="M382.551 170 A185 185 0 0 0 230 17.449 L230 124 L170 124 L170 17.449 A185 185 0 0 0 17.449 170 Z"/><path fill="#2C46D8" d="M382.551 230 A185 185 0 0 1 17.449 230 Z"/></svg>' },
  'img-photo': { value: '/book/assets/img/screenshot-light.png' },
  'cd-direction': { value: 'Cobalto sobre neutros fríos (dirección suiza)' },
  'cd-primary': { value: 'Cobalto · Ink', rows: [
    { name: 'Cobalto', hex: '#2348E0' },
    { name: 'Ink', hex: '#0E1116' },
  ] },
  'cd-brand-hex': { value: '#2348E0' },
  'cd-palette': {
    value: 'Cobalt · Ink · Mist',
    rows: [
      { name: 'Cobalt', role: 'Primario / acción', hex: '#2348E0' },
      { name: 'Ink', role: 'Texto / superficies', hex: '#0E1116' },
      { name: 'Mist', role: 'Superficie fría', hex: '#EEF1F5' },
    ],
  },
  'cd-semantic': { value: 'Éxito · Advertencia · Error · Información', rows: [
    { role: 'Éxito', hex: '#16A34A', use: 'Confirmaciones; nunca el cobalto para estados' },
    { role: 'Advertencia', hex: '#D97706', use: 'Avisos y límites de uso' },
    { role: 'Error', hex: '#DC2626', use: 'Fallos y acciones destructivas' },
    { role: 'Información', hex: '#2563EB', use: 'Mensajes del sistema; distinto del cobalto de marca' },
  ] },
  'cd-contrast': { value: '4.5:1 texto · 3:1 UI (AA)' },
  'cd-dark': { value: 'Automático — re-mapeo de tokens de rol' },
  // dm-accent es hex puro: dark.css valida el valor completo (/^#?hex6$/) — texto extra
  // rompería la validación y caería al fallback de la rampa.
  'dm-accent': { value: '#4F6FEE' },
  'dm-surface': { value: 'Elevación por superficie (no sombra)' },
  'td-direction': { value: 'Display · Texto · Mono' },
  'td-personality': { value: 'Técnica y neutra' },
  'font-display': { value: 'Space Grotesk' },
  'font-text': { value: 'Inter' },
  'font-mono': { value: 'Space Mono' },
  'img-style': { value: 'Luz natural · Espacio negativo · Producto en contexto' },
  'ill-style': { value: 'Geométrica plana' },
  'ge-style': { value: 'Líneas y retículas' },
  'cd-print': { value: 'Pantone 2728 C' },
  'font-extra': { value: 'Editorial impreso', rows: [{ title: 'Editorial impreso', family: 'Lora' }] },
  'img-treatment': { value: 'Color fiel y natural' },
  'ico-provider': { value: 'Tabler' },
  'ico-style': { value: 'Lineal · 1.75 px' },
  'mo-personality': { value: 'Sobriedad elegante' },
  'mo-duration': { value: 'Media (220 ms)' },
  'mo-easing': { value: 'Ease-out — entradas naturales' },
  'grid-columns': { value: '12 columnas' },
  'grid-spacing': { value: 'Escala de 8 pt' },
  'dv-style': { value: 'Series en la rampa de marca' },
  'app-rules': { value: 'Impresos y papelería · Digital y web · App / UI de producto · Iconos de app y assets de tienda · Redes sociales · Email y firmas · Presentaciones y documentos · Packaging · Señalética y wayfinding · Espacial / retail · Merchandising y apparel · Vehículos / rotulación · Co-branding y alianzas' },
  'sig-phone': { value: '+52 55 1234 5678' },
  'pres-pieces': { value: 'Deck · One-pager' },
  'pack-pieces': { value: 'Caja · Etiqueta · Sleeve' },
  'sign-pieces': { value: 'Rótulo exterior · Directorio' },
  'env-pieces': { value: 'Interior de tienda' },
  'merch-pieces': { value: 'Playera · Tote · Gorra' },
  'veh-pieces': { value: 'Van de reparto' },
  'print-pieces': { value: 'Tarjetas de presentación · Hoja membretada · Folder' },
  'social-networks': { value: 'Instagram · Facebook · LinkedIn · X · YouTube · TikTok' },
  'acc-req': { value: 'WCAG 2.2 AA · contraste verificado claro/oscuro' },
  'br-restrictions': { value: 'No alterar el cobalto · no distorsionar el símbolo' },
  'apr': { value: 'Publicado' },
  'legal-entity': { value: 'Meridian Systems, S.A.' },
  'legal-tm': { value: 'Marca registrada ®' },
  'legal-notice': { value: '© 2026 Meridian. Todos los derechos reservados.' },
  'gov-review': { value: 'Trimestral' },
  'ver-log': { value: 'v0.1', rows: [
    { ver: 'v0.1', date: '2026-06', note: 'Estructura base: 6 capítulos · dirección visual Sistema suizo · bilingüe ES/EN.' },
  ] },
  'gov-owner': { value: 'Equipo de marca' },
  'gov-contact': { value: 'marca@meridian.example' },
  'gov-approvals': { value: 'Todo cambio de marca pasa por el equipo de diseño antes de publicarse.' },
}

// Meridian-populated branding (project p4): the override map applied over the shared structure.
export function seedMeridianBranding(): BrandSection[] {
  return brandSections.map((s) => ({
    ...s,
    fields: s.fields.map((ff): BrandField => {
      const o = meridianBranding[ff.id]
      return {
        ...ff,
        value: o?.value ?? '',
        rows: o?.rows,
        status: o?.value ? 'closed' : 'empty',
        origin: 'human',
        kind: undefined,
        aiValue: undefined,
        humanValue: undefined,
        inherited: undefined,
        confidence: undefined,
        approval: undefined,
        taxonomy: undefined,
      }
    }),
  }))
}
