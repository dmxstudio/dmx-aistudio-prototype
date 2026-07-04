// UX architecture for filling fields fast: each field declares the best control.
// Catalogs (flat or categorized) + "Otro/Otros" + quick suggestions + ranges/links → selection instead of typing.
export type EditorType = 'text' | 'textarea' | 'select' | 'multiselect' | 'range' | 'links' | 'group' | 'image' | 'font'

export interface OptionGroup {
  label: string
  options: string[]
}

// A repeatable group: each row is an object whose keys are these sub-fields. Stored on BrandField.rows.
export interface GroupField {
  key: string
  label: string
  input?: 'text' | 'textarea' | 'select' | 'font' // 'font' = Google Fonts picker (FontPicker)
  options?: string[] // for input: 'select'
  placeholder?: string // expected value format (e.g. '#RRGGBB' on hex columns)
}

export interface FieldEditor {
  type: EditorType
  options?: string[] // flat catalog (select / multiselect)
  groups?: OptionGroup[] // categorized catalog (takes precedence over flat options)
  allowOther?: boolean
  suggestions?: string[] // quick-fill chips for textarea
  placeholder?: string
  helper?: string // short clarifying line under the title
  optionInfo?: Record<string, string> // per-option "i" tooltip (select with explanations)
  // select's "Otro" becomes numeric px (pantalla) + mm (impreso) inputs, composed as
  // "N px pantalla · N mm impreso" — the parseable format bookData paints the guide from.
  customPxMm?: boolean
  // image editor: file-picker accept filter (default 'image/*'). Non-image files (EPS/PDF)
  // store a data-URL too and render as a document chip instead of an <img> preview.
  accept?: string
  // text editor: the value is a hex color — render a native color picker + live swatch.
  colorHex?: boolean
  // range
  min?: number
  max?: number
  step?: number
  rangeFormat?: 'currency' | 'weeks'
  // when present, the slider's max (its ceiling/scale) is chosen from these caps via a select
  rangeMaxOptions?: number[]
  // group: the per-row sub-fields (the columns of each repeatable row)
  groupFields?: GroupField[]
  // group: prefill for a freshly added row (e.g. auto-incremented version + today's date)
  newRow?: (rows: Record<string, string>[]) => Record<string, string>
  // group: derives the field's flat summary value from the rows (default: first column joined)
  rowSummary?: (rows: Record<string, string>[]) => string
}

export const MULTI_SEP = ' · '

export const fieldEditors: Record<string, FieldEditor> = {
  // Brief · A — Overview & Business
  'a-name': { type: 'text', placeholder: 'p. ej. Rediseño Nimbus' },
  'a-client': { type: 'text', placeholder: 'Nombre del cliente / marca' },
  'a-industry': {
    type: 'select',
    allowOther: true,
    options: ['Café / Restaurante', 'E-commerce / Retail', 'SaaS / Software', 'Salud / Bienestar', 'Educación', 'Fintech', 'Moda / Belleza', 'Inmobiliaria', 'Agencia / Servicios', 'Manufactura', 'Turismo / Hospitalidad', 'Medios / Entretenimiento', 'ONG / Social'],
  },
  'a-markets': { type: 'multiselect', allowOther: true, options: ['México', 'Estados Unidos', 'Latinoamérica', 'Europa', 'Canadá', 'Global'] },
  'a-competitors': { type: 'links' },
  'a-problem': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Negocio', options: ['Baja conversión', 'Pocos prospectos', 'Ventas estancadas', 'Carrito abandonado', 'Caen las recompras'] },
      { label: 'Experiencia', options: ['Navegación confusa', 'Alta tasa de rebote', 'Flujo de compra largo', 'Mala experiencia móvil'] },
      { label: 'Marca', options: ['Imagen desactualizada', 'Marca poco diferenciada', 'Identidad inconsistente', 'Baja credibilidad'] },
      { label: 'Técnico', options: ['Sitio lento', 'Diseño no responsivo', 'Plataforma obsoleta', 'Contenido difícil de actualizar'] },
    ],
  },
  'a-obj': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Ingresos', options: ['Aumentar ventas', 'Mejorar conversión', 'Subir ticket promedio', 'Reducir abandono de carrito'] },
      { label: 'Captación', options: ['Generar leads', 'Aumentar registros', 'Agendar demos', 'Crecer tráfico'] },
      { label: 'Retención', options: ['Fidelizar clientes', 'Reducir cancelaciones', 'Aumentar recurrencia'] },
      { label: 'Marca y eficiencia', options: ['Posicionar marca', 'Reducir costo de soporte', 'Acelerar lanzamiento'] },
    ],
  },
  'a-usergoal': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Comprar', options: ['Comprar sin fricción', 'Comparar opciones', 'Pagar de forma segura', 'Rastrear pedido'] },
      { label: 'Encontrar', options: ['Encontrar información rápido', 'Resolver una duda', 'Conocer la marca'] },
      { label: 'Gestionar', options: ['Agendar una cita', 'Crear una cuenta', 'Administrar su perfil', 'Contactar soporte'] },
      { label: 'Decidir', options: ['Tomar una decisión', 'Pedir cotización', 'Comparar precios'] },
    ],
  },
  'a-brandgoal': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Posicionamiento', options: ['Percepción premium', 'Liderazgo de categoría', 'Marca aspiracional', 'Diferenciación clara'] },
      { label: 'Confianza', options: ['Credibilidad profesional', 'Autoridad experta', 'Solidez institucional'] },
      { label: 'Cercanía', options: ['Marca cercana', 'Conexión emocional', 'Tono humano'] },
      { label: 'Modernización', options: ['Imagen moderna', 'Marca innovadora', 'Mayor relevancia'] },
    ],
  },
  'a-langs': { type: 'multiselect', allowOther: true, options: ['Español', 'Inglés', 'Portugués', 'Francés', 'Alemán'] },
  // Brief · B — Audience & Experience
  'b-primary': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Consumidor', options: ['Público general', 'Compradores frecuentes', 'Compradores primerizos', 'Segmento premium'] },
      { label: 'Profesional / Negocio', options: ['Dueños de negocio', 'Tomadores de decisión', 'Equipos internos', 'Distribuidores / Mayoristas'] },
      { label: 'Por edad', options: ['Jóvenes 18-24', 'Adultos 25-40', 'Adultos 40-60', 'Adultos mayores'] },
      { label: 'Por comportamiento', options: ['Nativos digitales', 'Usuarios recurrentes', 'Compradores móviles', 'Investigan antes de comprar'] },
    ],
  },
  'b-journey': {
    type: 'select',
    allowOther: true,
    groups: [
      { label: 'E-commerce', options: ['Descubrir → Comparar → Comprar', 'Buscar → Ver producto → Checkout', 'Carrito → Pago → Confirmación', 'Recomendación → Detalle → Recompra'] },
      { label: 'SaaS / Producto', options: ['Landing → Registro → Onboarding', 'Prueba gratis → Activación → Pago', 'Login → Tarea clave → Resultado', 'Free → Límite → Upgrade'] },
      { label: 'Servicios / Lead', options: ['Conocer → Cotizar → Contactar', 'Servicio → Formulario → Agendar', 'Anuncio → Landing → Lead', 'Caso → Confianza → Solicitud'] },
      { label: 'Contenido / Comunidad', options: ['Descubrir → Leer → Suscribir', 'Contenido → Registro → Membresía', 'Búsqueda → Consumo → Compartir'] },
    ],
  },
  'b-a11y': {
    type: 'select',
    allowOther: true,
    options: ['WCAG 2.2 AA', 'WCAG 2.1 AA', 'WCAG 2.2 AAA', 'Sin requisito formal'],
    optionInfo: {
      'WCAG 2.2 AA': 'Estándar recomendado: contraste suficiente, navegación por teclado y foco visible. Cumple la mayoría de normativas.',
      'WCAG 2.1 AA': 'Versión previa del nivel AA, muy adoptada. Base sólida de accesibilidad.',
      'WCAG 2.2 AAA': 'Nivel más estricto: máximo contraste y criterios avanzados. Difícil de cumplir al 100%.',
      'Sin requisito formal': 'Sin auditoría obligatoria de accesibilidad; se aplican buenas prácticas básicas.',
    },
  },
  'b-secondary': {
    type: 'textarea',
    helper: 'Un segundo grupo de usuarios a considerar, además del primario. Describe quién es y por qué importa.',
    suggestions: ['Regalos corporativos', 'Nuevos visitantes', 'Usuarios internos / staff', 'Prensa y aliados'],
  },
  'b-devices': { type: 'multiselect', options: ['Móvil', 'Tablet', 'Desktop'] },
  'b-states': {
    type: 'select',
    options: ['Básico', 'Estándar', 'Completo'],
    optionInfo: {
      Básico: 'Solo estados esenciales: normal y error. Para prototipos o alcance reducido.',
      Estándar: 'Estados comunes: vacío, carga, error y éxito. Recomendado para la mayoría.',
      Completo: 'Todos los estados: vacío, carga, error, éxito, deshabilitado, hover y foco.',
    },
  },
  // Brief · C — Scope & Work Map
  'c-deliverables': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Estrategia y marca', options: ['Branding', 'Identidad visual', 'Manual de marca', 'Naming', 'Estrategia digital'] },
      { label: 'Diseño', options: ['Wireframes', 'Diseño UI', 'Prototipo', 'Design system', 'Diseño responsivo'] },
      { label: 'Contenido', options: ['Copywriting', 'Arquitectura de información', 'Fotografía', 'Iconografía', 'Ilustración'] },
      { label: 'Desarrollo y entrega', options: ['Sitio web', 'Landing page', 'App', 'CMS', 'Documentación'] },
    ],
  },
  'c-platforms': { type: 'multiselect', allowOther: true, options: ['Web responsive', 'iOS', 'Android', 'PWA'] },
  'c-integrations': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Pagos y e-commerce', options: ['Stripe', 'PayPal', 'Mercado Pago', 'Shopify', 'WooCommerce'] },
      { label: 'Marketing y CRM', options: ['Mailchimp', 'HubSpot', 'Salesforce', 'Klaviyo', 'Brevo'] },
      { label: 'Analítica y datos', options: ['Google Analytics', 'Meta Pixel', 'Hotjar', 'Google Tag Manager'] },
      { label: 'CMS y comunicación', options: ['WordPress', 'Contentful', 'Sanity', 'WhatsApp Business', 'Intercom'] },
    ],
  },
  'c-budget': {
    type: 'range',
    min: 0,
    max: 100000,
    step: 1000,
    rangeFormat: 'currency',
    rangeMaxOptions: [10000, 100000, 1000000],
    helper: 'Presupuesto tope estimado del proyecto, en USD. Ajusta el tope a la escala del proyecto.',
  },
  'c-guardian': {
    type: 'select',
    allowOther: true,
    options: ['Project Lead', 'Design Lead', 'AI Project Manager', 'Cliente'],
    helper: 'Quién aprueba el trabajo de los agentes de IA antes de avanzar de fase. Es el responsable de validar decisiones.',
  },
  // Brief · D — Initial Brand Signals
  'd-maturity': { type: 'select', options: ['Nueva', 'En evolución', 'Establecida', 'Rebranding'] },
  'd-refs': {
    type: 'links',
    helper: 'Sitios, marcas o piezas que sirven de referencia visual. Agrega los enlaces uno por uno.',
  },
  'd-tone': {
    type: 'multiselect',
    allowOther: true,
    options: ['Cálido', 'Cercano', 'Profesional', 'Lúdico', 'Premium', 'Minimalista', 'Audaz', 'Confiable', 'Artesanal', 'Elegante', 'Moderno', 'Sofisticado', 'Amigable', 'Enérgico', 'Sereno', 'Honesto'],
  },
  'd-anti': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Estética a evitar', options: ['Look corporativo frío', 'Stock genérico', 'Sobrecarga visual', 'Diseño anticuado', 'Minimalismo vacío'] },
      { label: 'Tono a evitar', options: ['Lenguaje técnico frío', 'Tono agresivo de venta', 'Promesas exageradas', 'Demasiado informal'] },
      { label: 'Clichés de categoría', options: ['Gradientes morados tech', 'Personas sonriendo de stock', 'Iconos planos genéricos', 'Buzzwords vacíos'] },
      { label: 'Patrones UX a evitar', options: ['Pop-ups intrusivos', 'Carruseles automáticos', 'Registro obligatorio', 'Scroll infinito'] },
    ],
  },
  'd-restrict': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Marca a conservar', options: ['Conservar el logo', 'Respetar la paleta de marca', 'Mantener la tipografía', 'Conservar el símbolo / isotipo', 'Respetar el manual de marca'] },
      { label: 'Legal y normativo', options: ['Cumplir normativa del sector', 'Respetar derechos de imágenes y fuentes', 'Incluir avisos legales', 'Proteger datos personales'] },
      { label: 'Técnico y plataforma', options: ['Mantener el CMS actual', 'Conservar las URLs (SEO)', 'Compatibilidad con navegadores antiguos', 'Integrar con sistemas existentes'] },
      { label: 'Contenido e idioma', options: ['Mantener el sitio bilingüe', 'Conservar nombres de producto', 'No alterar claims aprobados'] },
    ],
  },
  // Brief · E — Constraints & Risks
  'e-timeline': {
    type: 'range',
    min: 0,
    max: 240,
    step: 1,
    rangeFormat: 'weeks',
    helper: 'Duración estimada del proyecto, en semanas.',
  },
  'e-fact': {
    type: 'textarea',
    helper: 'Un dato verificable y cierto del proyecto (no una suposición). Ej: "Catálogo de 40 SKUs".',
  },
  'e-dep': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Contenido y activos', options: ['Contenido del cliente', 'Fotografía de producto', 'Logos y manual de marca', 'Textos finales', 'Inventario de productos'] },
      { label: 'Accesos y técnico', options: ['Accesos y credenciales', 'Dominio y DNS', 'Repositorio de código', 'Llaves de API', 'Entorno de staging'] },
      { label: 'Aprobaciones y legal', options: ['Aprobación legal de claims', 'Validación de marca', 'Firma de contrato', 'Aviso de privacidad', 'Derechos de imágenes'] },
      { label: 'Terceros y proveedores', options: ['Pasarela de pago', 'Proveedor de hosting', 'Integración de CRM', 'Servicio de paquetería'] },
    ],
  },
  'e-assumption': {
    type: 'textarea',
    helper: 'Algo que damos por cierto sin confirmarlo aún. Si cambia, puede afectar el proyecto.',
  },
  'e-risk': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Alcance y tiempo', options: ['Alcance abierto', 'Plazos ajustados', 'Cambios frecuentes', 'Dependencias externas'] },
      { label: 'Contenido y activos', options: ['Contenido incompleto', 'Fotografía pendiente', 'Sin material de marca', 'Textos sin definir'] },
      { label: 'Técnico', options: ['Integraciones complejas', 'Migración de datos', 'Deuda técnica', 'Requisitos inciertos'] },
      { label: 'Decisión', options: ['Aprobaciones lentas', 'Múltiples interesados', 'Visión no alineada', 'Disponibilidad limitada'] },
    ],
  },
  // Brief · F — Technical Context
  'f-framework': { type: 'select', allowOther: true, options: ['HTML + JS + CSS', 'React', 'Next.js', 'Angular'] },
  'f-cms': { type: 'select', allowOther: true, options: ['Sanity', 'Contentful', 'Strapi', 'Storyblok', 'WordPress', 'Prismic', 'Ninguno'] },
  'f-hosting': { type: 'select', allowOther: true, options: ['Self Hosted', 'Vercel', 'AWS', 'Google Cloud'] },

  // Branding — base catalogs (the AI-tailored layer comes from brandCatalogs.ts at runtime).
  'bp-archetype': { type: 'select', allowOther: true, options: ['El Cuidador', 'El Creador', 'El Sabio', 'El Héroe', 'El Explorador', 'El Amante', 'El Mago', 'El Inocente', 'El Guía'] },
  'bp-archetype-desc': { type: 'textarea' },
  'vt-formality': { type: 'select', options: ['Alta', 'Media', 'Media-baja', 'Baja'] },
  // Repeatable groups (edited via <GroupEditor>; stored on BrandField.rows). bf-values traded its
  // multiselect catalog for {name,desc} pairs so the book's value cards can render descriptions.
  'bf-values': { type: 'group', groupFields: [{ key: 'name', label: 'Valor' }, { key: 'desc', label: 'Descripción', input: 'textarea' }] },
  'bf-milestones': { type: 'group', groupFields: [{ key: 'year', label: 'Año' }, { key: 'event', label: 'Hito' }] },
  'ap-personas': { type: 'group', groupFields: [{ key: 'name', label: 'Nombre' }, { key: 'ptype', label: 'Tipo', input: 'select', options: ['User persona', 'Buyer persona', 'Proto-persona'] }, { key: 'seg', label: 'Segmento' }, { key: 'quote', label: 'Quote', input: 'textarea' }] },
  'vt-tone-traits': { type: 'group', groupFields: [{ key: 'trait', label: 'Rasgo' }, { key: 'is', label: 'Sí es' }, { key: 'isnot', label: 'No es' }, { key: 'ex', label: 'Ejemplo', input: 'textarea' }] },
  'vt-grammar': { type: 'group', groupFields: [{ key: 'rule', label: 'Regla' }, { key: 'example', label: 'Ejemplo', input: 'textarea' }, { key: 'convention', label: 'Convención' }] },
  'msg-hierarchy': { type: 'group', groupFields: [{ key: 'level', label: 'Nivel' }, { key: 'text', label: 'Texto', input: 'textarea' }] },
  'cd-palette': { type: 'group', groupFields: [{ key: 'name', label: 'Nombre' }, { key: 'role', label: 'Rol' }, { key: 'hex', label: 'Hex', placeholder: '#RRGGBB' }] },
  'ps-diff': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Producto y calidad', options: ['Calidad superior', 'Ingredientes seleccionados', 'Frescura garantizada', 'Proceso artesanal', 'Origen rastreable'] },
      { label: 'Experiencia de compra', options: ['Suscripción flexible', 'Envío puntual', 'Empaque cuidado', 'Compra sin complicaciones'] },
      { label: 'Relación con el cliente', options: ['Atención cercana', 'Comunidad de marca', 'Programa de lealtad', 'Recomendaciones personalizadas'] },
      { label: 'Valores y propósito', options: ['Comercio justo', 'Empaque sostenible', 'Apoyo a productores', 'Transparencia total'] },
    ],
  },
  'ap-trust': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Garantías y respaldo', options: ['Garantía de satisfacción', 'Devoluciones sin complicaciones', 'Pago seguro', 'Datos protegidos'] },
      { label: 'Prueba social', options: ['Reseñas verificadas', 'Calificaciones de clientes', 'Casos reales', 'Comunidad activa'] },
      { label: 'Transparencia', options: ['Precios claros', 'Sin letra chica', 'Políticas visibles', 'Origen del producto'] },
      { label: 'Servicio y soporte', options: ['Atención cercana', 'Respuesta rápida', 'Acompañamiento posventa', 'Canales de contacto directos'] },
    ],
  },
  'vt-forbidden': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Clichés de marketing', options: ['Líderes en el mercado', 'Calidad insuperable', 'El mejor del mundo', 'Solución integral', 'Innovación disruptiva'] },
      { label: 'Lenguaje corporativo vacío', options: ['Sinergia', 'Valor agregado', 'Excelencia operativa', 'Compromiso total', 'Pasión por servir'] },
      { label: 'Promesas exageradas', options: ['100% garantizado', 'Resultados milagrosos', 'Sin igual en el sector', 'Único en su tipo'] },
      { label: 'Urgencia agresiva', options: ['Compra ahora o piérdelo', 'Oferta irrepetible', 'Última oportunidad', 'No te quedes fuera'] },
    ],
  },
  'vi-attributes': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Estilo', options: ['Minimalista', 'Moderno', 'Clásico', 'Elegante', 'Atrevido'] },
      { label: 'Carácter', options: ['Cálido', 'Cercano', 'Confiable', 'Sofisticado', 'Dinámico'] },
      { label: 'Acabado visual', options: ['Limpio', 'Geométrico', 'Orgánico', 'Texturizado', 'Luminoso'] },
      { label: 'Paleta', options: ['Tonos neutros', 'Colores vivos', 'Alto contraste', 'Tonos pastel'] },
    ],
  },
  // Curación de 04 · Aplicaciones: catálogo CERRADO — cada opción ES una sección de la guía
  // (una app libre no tendría sección que mostrar). Solo las seleccionadas aparecen, renumeradas.
  'app-rules': {
    type: 'multiselect',
    groups: [
      { label: 'Base', options: ['Impresos y papelería', 'Digital y web', 'App / UI de producto', 'Iconos de app y assets de tienda'] },
      { label: 'Comunicación', options: ['Redes sociales', 'Email y firmas', 'Presentaciones y documentos'] },
      { label: 'Mundo físico', options: ['Packaging', 'Señalética y wayfinding', 'Espacial / retail', 'Merchandising y apparel', 'Vehículos / rotulación'] },
      { label: 'Alianzas', options: ['Co-branding y alianzas'] },
    ],
    optionInfo: {
      'Impresos y papelería': 'Tarjetas, papelería y folder (§4.1) + especificación de impresión.',
      'Digital y web': 'Mockup de sitio + favicon/PWA (§4.2).',
      'App / UI de producto': 'La marca dentro del producto digital (§4.3).',
      'Iconos de app y assets de tienda': 'Tamaños iOS/Android/Play Store; sube el icono más grande por plataforma (§4.4).',
      'Redes sociales': 'Tabla de tamaños por plataforma (§4.5).',
      'Email y firmas': 'Firma de correo con datos de la marca (§4.6).',
      'Presentaciones y documentos': 'Portada de deck y documentos (§4.7).',
      'Packaging': 'Caja, etiqueta y sleeve (§4.8).',
      'Señalética y wayfinding': 'Rótulos y orientación en espacios (§4.9).',
      'Espacial / retail': 'La marca en espacios físicos y retail (§4.10).',
      'Merchandising y apparel': 'Playeras, totes y gorras (§4.11).',
      'Vehículos / rotulación': 'Flotillas y rotulación vehicular (§4.12).',
      'Co-branding y alianzas': 'Lockup con marcas aliadas (§4.13).',
    },
  },
  // 04 · Aplicaciones — assets reales por sección.
  'print-pieces': {
    type: 'multiselect',
    allowOther: true,
    options: ['Tarjetas de presentación', 'Hoja membretada', 'Folder', 'Sobre', 'Sello', 'Etiqueta'],
    optionInfo: {
      'Tarjetas de presentación': 'El impreso de contacto; suele definir el sistema en pequeño formato.',
      'Hoja membretada': 'Papelería de cartas y documentos oficiales.',
      Folder: 'Carpeta para propuestas y entregas físicas.',
      Sobre: 'Sobres con la marca para correspondencia.',
      Sello: 'Sello físico o de tinta para empaques y papelería.',
      Etiqueta: 'Etiquetas adhesivas de producto o envío.',
    },
  },
  // Slots de imagen de 04: uno por opción del catálogo de su multiselect de piezas (los slots
  // sin pieza seleccionada se ocultan en displaySections; misma tabla que los seeds `slots()`).
  ...Object.fromEntries(
    ([['print', 6], ['social', 6], ['pres', 5], ['pack', 5], ['sign', 5], ['env', 5], ['merch', 6], ['veh', 4]] as const).flatMap(
      ([pre, n]) => Array.from({ length: n }, (_, i) => [`${pre}-img-${i + 1}`, { type: 'image' as const }]),
    ),
  ),
  'dig-og': { type: 'image', helper: '1200×630 px (og:image). Mantén texto y logo dentro de la zona segura centrada de 860×630; la guía pinta esas guías encima.' },
  'appicon-ios': { type: 'image', accept: 'image/png', helper: 'PNG 1024×1024, sin transparencia; la máscara y esquinas las aplica el sistema. La guía lo aplica a todos los tamaños iOS.' },
  'appicon-android': { type: 'image', accept: 'image/png', helper: 'PNG 512×512 (adaptive: contenido importante en el 66% central). La guía lo aplica a los tamaños Android.' },
  'appicon-play': { type: 'image', accept: 'image/png', helper: 'Icono de ficha Play Store: PNG 512×512, esquinas rectas (Google aplica el radio).' },
  'social-networks': {
    type: 'multiselect',
    options: ['Instagram', 'Facebook', 'LinkedIn', 'X', 'YouTube', 'TikTok'],
    optionInfo: {
      Instagram: 'Avatar 320 · post 1080×1350 · story 1080×1920.',
      Facebook: 'Avatar 170 · banner 820×312 · post 1200×630 · story 1080×1920.',
      LinkedIn: 'Avatar 300 · banner 1128×191 · post 1200×627.',
      X: 'Avatar 400 · banner 1500×500 · post 1600×900.',
      YouTube: 'Avatar 800 · banner 2560×1440 · thumbnail 1280×720.',
      TikTok: 'Avatar 200 · video 1080×1920.',
    },
  },
  'sig-phone': { type: 'text', placeholder: '+52 55 1234 5678', helper: 'Teléfono de contacto para la firma de email; entra también al bloque HTML copiable.' },
  'pres-pieces': { type: 'multiselect', allowOther: true, options: ['Deck', 'Plantilla de documento', 'One-pager', 'Informe', 'Propuesta comercial'] },
  'pack-pieces': { type: 'multiselect', allowOther: true, options: ['Caja', 'Etiqueta', 'Bolsa', 'Sleeve', 'Lata / frasco'] },
  'sign-pieces': { type: 'multiselect', allowOther: true, options: ['Rótulo exterior', 'Directorio', 'Señal de área', 'Pictogramas', 'Vinil de vidriera'] },
  'env-pieces': { type: 'multiselect', allowOther: true, options: ['Fachada', 'Interior de tienda', 'Stand / feria', 'Mostrador', 'Escaparate'] },
  'merch-pieces': { type: 'multiselect', allowOther: true, options: ['Playera', 'Tote', 'Gorra', 'Taza', 'Sudadera', 'Stickers'] },
  'veh-pieces': { type: 'multiselect', allowOther: true, options: ['Auto compacto', 'Van de reparto', 'Camión', 'Moto / bici'] },
  'img-photo': { type: 'image' },
  'img-photo-2': { type: 'image' },
  'img-photo-3': { type: 'image' },
  'ill-ref-1': { type: 'image' },
  'ill-ref-2': { type: 'image' },
  'ill-ref-3': { type: 'image' },
  'ge-ref-1': { type: 'image' },
  'ge-ref-2': { type: 'image' },
  'ge-ref-3': { type: 'image' },
  // Dirección de elementos gráficos (§3.11): estándar + Otro; sin valor ni referencias, la
  // sección de la guía se oculta.
  'ge-style': {
    type: 'select',
    allowOther: true,
    options: ['Patrones geométricos', 'Líneas y retículas', 'Formas orgánicas', 'Texturas y grano', 'Degradados', 'Iconografía ampliada'],
    optionInfo: {
      'Patrones geométricos': 'Repetición de formas simples (círculos, rombos). Ordenado y sistemático.',
      'Líneas y retículas': 'Tramas lineales y grids visibles. Técnico, editorial.',
      'Formas orgánicas': 'Manchas y curvas irregulares. Humano y fluido.',
      'Texturas y grano': 'Ruido, papel, grano fotográfico. Táctil y artesanal.',
      'Degradados': 'Transiciones de color de la rampa de marca. Contemporáneo.',
      'Iconografía ampliada': 'Los iconos del sistema usados a gran escala como gráfico.',
    },
  },
  'ill-style': {
    type: 'select',
    allowOther: true,
    options: ['Geométrica plana', 'Trazo lineal', 'Orgánica con textura', 'Isométrica', 'Collage editorial', '3D suave'],
    optionInfo: {
      'Geométrica plana': 'Formas simples de color pleno, sin contornos. Moderna y escalable.',
      'Trazo lineal': 'Línea continua con pesos consistentes, poco relleno. Ligera y técnica.',
      'Orgánica con textura': 'Formas irregulares con grano o textura. Cálida y artesanal.',
      'Isométrica': 'Perspectiva 30° sin punto de fuga. Para producto y procesos.',
      'Collage editorial': 'Mezcla de foto, formas y tipografía. Expresiva, para campañas.',
      '3D suave': 'Volúmenes redondeados con iluminación suave. Amigable y actual.',
    },
  },
  // Color de impresión: el sistema DERIVA el CMYK del color de marca (chip "Generado por el
  // sistema" en el modal); "Otro" integra Pantone/especificaciones manuales.
  'cd-print': { type: 'select', allowOther: true, helper: 'Genera el CMYK desde el color de marca o intégralo manualmente (p. ej. Pantone). Alimenta el chip de Impresos (§4.1).' },
  'ico-provider': {
    type: 'select',
    options: ['Tabler', 'Lucide', 'Heroicons', 'Bootstrap Icons', 'Remix Icon'],
    optionInfo: {
      'Tabler': 'MIT · 5,900+ iconos outline/filled · el set que usa la plantilla de la guía (default).',
      'Lucide': 'ISC · 1,500+ iconos lineales · sucesor mantenido de Feather.',
      'Heroicons': 'MIT · ~316 iconos outline/solid · del equipo de Tailwind CSS.',
      'Bootstrap Icons': 'MIT · 2,000+ iconos · del ecosistema Bootstrap.',
      'Remix Icon': 'Apache 2.0 · 3,000+ iconos line/fill · gran cobertura temática.',
    },
  },
  // Configuración del set: estilo del trazo + grosor sugerido. Compone la nota de la guía
  // ("Proveedor · Estilo · px") y el grosor se aplica a los SVGs inline (Lucide/Heroicons).
  'ico-style': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Estilo', options: ['Lineal', 'Sólido', 'Redondeado', 'Recto'] },
      { label: 'Grosor de trazo', options: ['1.5 px', '1.75 px', '2 px'] },
    ],
    optionInfo: {
      Lineal: 'Solo contornos (outline). El estándar para UI: ligero y legible en tamaños pequeños.',
      'Sólido': 'Rellenos (filled). Más peso visual; útil para estados activos y énfasis.',
      Redondeado: 'Esquinas y terminales redondeados. Amable y cercano.',
      Recto: 'Esquinas y terminales rectos. Técnico y preciso.',
      '1.5 px': 'Trazo fino: elegante en pantallas densas; puede perderse en tamaños muy chicos.',
      '1.75 px': 'El equilibrio más común entre presencia y ligereza.',
      '2 px': 'Trazo firme: máxima legibilidad en iconos pequeños.',
    },
  },
  'mo-personality': {
    type: 'select',
    allowOther: true,
    groups: [
      { label: 'Velocidad y energía', options: ['Movimiento ágil', 'Ritmo pausado', 'Transiciones suaves', 'Acentos enérgicos'] },
      { label: 'Carácter del gesto', options: ['Gestos fluidos', 'Movimiento preciso', 'Inercia natural', 'Rebote sutil'] },
      { label: 'Tono emocional', options: ['Calidez visual', 'Sobriedad elegante', 'Cercanía amable', 'Confianza serena'] },
      { label: 'Estilo de entrada/salida', options: ['Aparición gradual', 'Despliegue limpio', 'Encadenado continuo', 'Reposo estable'] },
    ],
  },
  'bf-essence': { type: 'select', allowOther: true, options: ['Hacemos lo cotidiano memorable.', 'Calidad sin complicaciones.', 'Cercanía que se nota en cada detalle.', 'Lo auténtico, hecho simple.', 'Acompañamos tus momentos del día.', 'Confianza en cada decisión.'] },
  'bf-purpose': { type: 'textarea', suggestions: ['Existimos para acercar a las personas a productos en los que pueden confiar.', 'Buscamos que cada compra se sienta cuidada, simple y bien hecha.', 'Queremos elevar lo cotidiano con calidad y trato cercano.', 'Existimos para que comprar bien sea fácil y placentero.'] },
  'bf-mission': { type: 'textarea', suggestions: ['Ofrecer productos de calidad consistente en cada compra.', 'Hacer que comprar en línea sea simple y confiable.', 'Acompañar al cliente antes, durante y después de la venta.', 'Entregar a tiempo y cumplir lo que prometemos.'] },
  'ps-statement': { type: 'textarea', suggestions: ['Para [audiencia], [marca] es la opción que [beneficio principal].', 'Para quienes buscan [necesidad], [marca] ofrece [propuesta] sin [fricción común].', '[Marca] es la marca de [categoría] que prioriza [valor] por encima de la competencia.', 'Para [segmento], [marca] es la alternativa [atributo] frente a opciones [defecto del mercado].'] },
  'ps-uvp': { type: 'select', allowOther: true, options: ['Calidad superior a un precio justo.', 'Ahorra tiempo en cada compra.', 'Lo que necesitas, siempre disponible.', 'Compra fácil, recibe rápido.', 'La experiencia que esperabas, sin complicaciones.'] },
  'ap-desired': { type: 'select', allowOther: true, options: ['Una marca confiable y cercana.', 'Calidad consistente en cada compra.', 'Atención humana y honesta.', 'Profesional sin ser distante.', 'Auténtica y transparente.'] },
  'msg-core': { type: 'select', allowOther: true, options: ['Calidad que se nota en cada detalle.', 'Lo hacemos simple para que tú no te compliques.', 'Hecho con cuidado, pensado para ti.', 'Estamos cerca cuando nos necesitas.', 'Tu confianza es lo que nos mueve.'] },
  'msg-cta': { type: 'multiselect', allowOther: true, options: ['Empieza ahora', 'Descubre más', 'Pruébalo gratis', 'Únete hoy', 'Conoce los planes', 'Compra en un clic', 'Ver el sistema', 'Ver la guía', 'Descargar assets'] },
  'vi-concept': { type: 'select', allowOther: true, options: ['Estilo minimalista con mucho espacio en blanco y foco en producto.', 'Fotografía real de producto sobre fondos neutros.', 'Paleta sobria de dos colores y un acento.', 'Iconografía de línea sencilla y consistente.'] },
  // Estilos canónicos cortos: los TRES primeros seleccionados nombran los tiles de §3.9.
  'img-style': { type: 'multiselect', allowOther: true, options: ['Luz natural', 'Espacio negativo', 'Personas reales', 'Producto en contexto', 'Texturas de cerca', 'Arquitectura y espacios', 'Blanco y negro', 'Aérea / panorámica'] },
  // Branding · Convenciones de formato (sección 07) — captura las decisiones; el detalle por locale se genera (formats.json).
  'fmt-locales': { type: 'multiselect', allowOther: true, options: ['es-MX', 'en-US', 'es-ES', 'en-GB', 'pt-BR', 'fr-FR', 'de-DE'] },
  'fmt-date': {
    type: 'select',
    allowOther: true,
    options: ['Mes escrito (12 de may 2026)', 'Numérico ISO (2026-05-12)', 'Corto local (12/05/2026)'],
    optionInfo: {
      'Mes escrito (12 de may 2026)': 'Recomendado: el mes escrito evita ambigüedad entre idiomas.',
      'Numérico ISO (2026-05-12)': 'Inequívoco; ideal para datos y exports.',
      'Corto local (12/05/2026)': 'Compacto pero ambiguo entre es/en (¿día o mes primero?).',
    },
  },
  'fmt-time': { type: 'select', options: ['24 h (14:30)', '12 h (2:30 p. m.)'] },
  'fmt-currency': { type: 'select', allowOther: true, options: ['MXN ($)', 'USD (US$)', 'EUR (€)', 'GBP (£)'] },
  'fmt-storage': {
    type: 'multiselect',
    allowOther: true,
    options: ['ISO 8601', 'E.164', 'ISO 4217', 'SI', 'BCP 47', 'UTF-8'],
    optionInfo: {
      'ISO 8601': 'Fechas y horas para datos: año-mes-día (2026-06-12, 14:30). Sin ambigüedad entre idiomas.',
      'E.164': 'Teléfonos internacionales: +código de país y número, sin espacios (+525512345678).',
      'ISO 4217': 'Monedas con código de 3 letras: MXN, USD, EUR. Evita símbolos ambiguos en datos.',
      'SI': 'Unidades del Sistema Internacional: mm, kg, °C. Símbolo separado del número (24 px).',
      'BCP 47': 'Etiquetas de idioma/región: es-MX, en-US. El estándar de locales en la web.',
      'UTF-8': 'Codificación de texto universal: cubre acentos, símbolos y emoji sin corrupción.',
    },
  },
  // Branding · Modo oscuro (sección 11) — decisiones; el sistema de tokens/código es output/handoff.
  // Hex puro: dark.css valida el valor completo — texto extra rompería el acento declarado.
  'dm-accent': { type: 'text', placeholder: '#RRGGBB', colorHex: true, helper: 'Solo el valor hex del acento ajustado para fondos oscuros. Ej: #8E82E6' },
  'dm-surface': { type: 'select', allowOther: true, options: ['Elevación por luz (no sombra)', 'Elevación por sombra', 'Mixto'] },

  // ── Branding · entradas explícitas (auditoría Branding↔Brief). El estándar de Brief es que
  // cada campo declare su editor; estos antes caían al default {type:'textarea'} de getEditor. ──
  // Elección + "Otro"
  'acc-req': {
    type: 'select',
    allowOther: true,
    options: ['WCAG 2.2 AA', 'WCAG 2.1 AA', 'WCAG 2.2 AAA', 'Sin requisito formal'],
    optionInfo: {
      'WCAG 2.2 AA': 'Estándar recomendado: contraste suficiente, navegación por teclado y foco visible. Cumple la mayoría de normativas.',
      'WCAG 2.1 AA': 'Versión previa del nivel AA, muy adoptada. Base sólida de accesibilidad.',
      'WCAG 2.2 AAA': 'Nivel más estricto: máximo contraste y criterios avanzados. Difícil de cumplir al 100%.',
      'Sin requisito formal': 'Sin auditoría obligatoria de accesibilidad; se aplican buenas prácticas básicas.',
    },
  },
  'apr': { type: 'select', allowOther: true, options: ['Borrador', 'En revisión', 'Aprobado', 'Publicado'] },
  // §5.2 Legal: titular + registro + aviso (el aviso © se puede generar por el sistema).
  'legal-entity': { type: 'text', placeholder: 'p. ej. Nimbus Coffee, S.A. de C.V.' },
  'legal-tm': {
    type: 'select',
    allowOther: true,
    options: ['Marca registrada ®', 'En trámite ™', 'Sin registro'],
    optionInfo: {
      'Marca registrada ®': 'Registro concedido: usar ® junto al nombre en piezas formales.',
      'En trámite ™': 'Solicitud presentada: usar ™ mientras se resuelve.',
      'Sin registro': 'Sin protección registral; el nombre se usa sin símbolo.',
    },
  },
  'legal-notice': { type: 'select', allowOther: true, helper: 'Genera el aviso © desde el nombre de la marca o intégralo manualmente.' },
  'gov-review': {
    type: 'select',
    allowOther: true,
    options: ['Trimestral', 'Semestral', 'Anual', 'Continua'],
    optionInfo: {
      Trimestral: 'Revisión de la guía cada 3 meses; para marcas en cambio rápido.',
      Semestral: 'El punto medio habitual: dos revisiones al año.',
      Anual: 'Una revisión al año; para marcas estables.',
      Continua: 'La guía se actualiza al momento con cada decisión aprobada.',
    },
  },
  // §5.4 Changelog: filas versión / fecha / cambios → entradas reales en la guía. La versión la
  // maneja el sistema: cada fila nueva se pre-rellena con el incremento de la última (v1.2→v1.3)
  // y la fecha de hoy (editables — un rediseño mayor se marca a mano, p. ej. v2.0); la versión
  // ACTUAL de la marca es la de la última fila (rowSummary → value → portada y pie de la guía).
  'ver-log': {
    type: 'group',
    groupFields: [
      { key: 'ver', label: 'Versión', placeholder: 'v1.0' },
      { key: 'date', label: 'Fecha', placeholder: '2026-06' },
      { key: 'note', label: 'Cambios', input: 'textarea' },
    ],
    newRow: (rows) => {
      const last = [...rows].reverse().find((r) => (r.ver ?? '').trim())?.ver ?? ''
      // Preferir el número con prefijo v ('Junio 2026 — v1.2' → v1.3, no v2026.1); sin match → v1.0.
      const m = /v(\d+)(?:\.(\d+))?/i.exec(last) ?? /(\d+)(?:\.(\d+))?/.exec(last)
      const d = new Date() // fecha LOCAL con granularidad de mes, igual que seeds y demo ('2026-06')
      return {
        ver: m ? `v${m[1]}.${(m[2] ? +m[2] : 0) + 1}` : 'v1.0',
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      }
    },
    rowSummary: (rows) => [...rows].reverse().find((r) => (r.ver ?? '').trim())?.ver ?? '',
  },
  'gov-owner': { type: 'text', placeholder: 'p. ej. Equipo de marca' },
  'gov-contact': { type: 'text', placeholder: 'p. ej. marca@empresa.com' },
  'gov-approvals': { type: 'textarea' },
  // Preparación para dark mode: estados estándar explicados; el valor alimenta la nota de la guía.
  'cd-dark': {
    type: 'select',
    allowOther: true,
    options: [
      'Completo — paleta oscura propia',
      'Automático — re-mapeo de tokens de rol',
      'Parcial — solo acento adaptado',
      'No aplica — solo modo claro',
    ],
    optionInfo: {
      'Completo — paleta oscura propia': 'La marca define cada token para oscuro (superficies, texto, acento). Máximo control, más mantenimiento.',
      'Automático — re-mapeo de tokens de rol': 'El sistema deriva la rampa oscura del color de marca: mismo rol, valores re-mapeados. Es lo que hace esta guía.',
      'Parcial — solo acento adaptado': 'Solo se ajusta el acento para conservar contraste sobre superficies oscuras estándar.',
      'No aplica — solo modo claro': 'La marca se publica únicamente en modo claro; sin compromiso de dark mode.',
    },
  },
  'bp-traits': {
    type: 'multiselect',
    allowOther: true,
    options: ['Cálido', 'Cercano', 'Profesional', 'Lúdico', 'Premium', 'Minimalista', 'Audaz', 'Confiable', 'Artesanal', 'Elegante', 'Moderno', 'Sofisticado', 'Amigable', 'Enérgico', 'Sereno', 'Honesto'],
  },
  'br-restrictions': {
    type: 'multiselect',
    allowOther: true,
    groups: [
      { label: 'Marca a conservar', options: ['Conservar el logo', 'Respetar la paleta de marca', 'Mantener la tipografía', 'Conservar el símbolo / isotipo', 'Respetar el manual de marca'] },
      { label: 'Legal y normativo', options: ['Cumplir normativa del sector', 'Respetar derechos de imágenes y fuentes', 'Incluir avisos legales', 'Proteger datos personales'] },
      { label: 'Técnico y plataforma', options: ['Mantener el CMS actual', 'Conservar las URLs (SEO)', 'Compatibilidad con navegadores antiguos', 'Integrar con sistemas existentes'] },
      { label: 'Contenido e idioma', options: ['Mantener el sitio bilingüe', 'Conservar nombres de producto', 'No alterar claims aprobados'] },
    ],
  },
  'vi-grid': { type: 'multiselect', allowOther: true, options: ['Modular', 'Aireada', 'Compacta', 'Editorial', 'Asimétrica', 'Geométrica', 'Mucho blanco'] },
  // Decisiones prácticas de layout (§3.12): la guía pinta el diagrama y la escala con esto.
  'grid-columns': {
    type: 'select',
    allowOther: true,
    options: ['12 columnas', '16 columnas', '8 columnas', '6 columnas'],
    optionInfo: {
      '12 columnas': 'El estándar web: divisible entre 2/3/4/6, cubre casi cualquier layout.',
      '16 columnas': 'Para interfaces densas o pantallas muy anchas (dashboards).',
      '8 columnas': 'Sistemas editoriales simples; menos decisiones por fila.',
      '6 columnas': 'Layouts compactos o mobile-first estrictos.',
    },
  },
  'grid-spacing': {
    type: 'select',
    allowOther: true,
    options: ['Escala de 8 pt', 'Escala de 4 pt'],
    optionInfo: {
      'Escala de 8 pt': 'El estándar de la industria: múltiplos de 8 con medios pasos (4). Consistente entre plataformas.',
      'Escala de 4 pt': 'Grano más fino para UI densa; más valores posibles, exige disciplina.',
    },
  },
  // Motion práctico (§3.13): la tabla de tokens de la guía se deriva de estos dos.
  'mo-duration': {
    type: 'select',
    allowOther: true,
    options: ['Rápida (150 ms)', 'Media (220 ms)', 'Pausada (320 ms)'],
    optionInfo: {
      'Rápida (150 ms)': 'Respuesta inmediata; ideal para micro-interacciones y hover.',
      'Media (220 ms)': 'El punto medio perceptible sin estorbar. Default seguro.',
      'Pausada (320 ms)': 'Movimiento protagonista; para transiciones grandes y storytelling.',
    },
  },
  'mo-easing': {
    type: 'select',
    allowOther: true,
    options: ['Ease-out — entradas naturales', 'Ease-in-out — transiciones simétricas', 'Spring — rebote sutil', 'Linear — mecánico y constante'],
    optionInfo: {
      'Ease-out — entradas naturales': 'Arranca rápido y frena suave. El default para que la UI se sienta viva.',
      'Ease-in-out — transiciones simétricas': 'Acelera y frena por igual. Para movimientos de ida y vuelta.',
      'Spring — rebote sutil': 'Sobrepasa y regresa. Juguetón; usar con moderación.',
      'Linear — mecánico y constante': 'Velocidad constante. Para progreso/loaders, no para entradas.',
    },
  },
  // §3.14 OPCIONAL: sin dirección, la guía omite la sección.
  'dv-style': {
    type: 'select',
    allowOther: true,
    options: ['Series en la rampa de marca', 'Monocromo con un acento', 'Categórico multicolor', 'Minimal (solo datos)'],
    optionInfo: {
      'Series en la rampa de marca': 'Cada serie toma un paso de la rampa del color de marca. Cohesivo por defecto.',
      'Monocromo con un acento': 'Todo en neutros y UNA serie destacada con el acento. Máxima jerarquía.',
      'Categórico multicolor': 'Colores distintos por categoría; exige revisar contraste y daltonismo.',
      'Minimal (solo datos)': 'Sin decoración: líneas finas, sin rellenos. Para reportes técnicos.',
    },
  },
  // §3.15 OPCIONAL: dirección sonora + clips de audio reproducibles en la guía.
  'sonic-style': {
    type: 'select',
    allowOther: true,
    options: ['Logo sonoro (2–3 s)', 'Paisaje ambiental', 'Sonidos de UI', 'Música de marca'],
    optionInfo: {
      'Logo sonoro (2–3 s)': 'Firma corta y memorable para intros/outros (como el "tudum").',
      'Paisaje ambiental': 'Texturas sonoras largas para espacios, video y espera.',
      'Sonidos de UI': 'Feedback puntual: confirmaciones, alertas, transiciones.',
      'Música de marca': 'Pistas o librería musical con el carácter de la marca.',
    },
  },
  'sonic-clip-1': { type: 'image', accept: 'audio/*' },
  'sonic-clip-2': { type: 'image', accept: 'audio/*' },
  'sonic-clip-3': { type: 'image', accept: 'audio/*' },
  // Texto de una línea (token atómico)
  'cd-brand-hex': { type: 'text', placeholder: '#RRGGBB', colorHex: true },
  // Contraste mínimo: los niveles estándar WCAG, con Otro para políticas propias.
  'cd-contrast': {
    type: 'select',
    allowOther: true,
    options: ['4.5:1 texto · 3:1 UI (AA)', '7:1 texto · 4.5:1 UI (AAA)', '3:1 solo texto grande (mínimo)'],
    optionInfo: {
      '4.5:1 texto · 3:1 UI (AA)': 'WCAG AA — el estándar recomendado: 4.5:1 en texto normal, 3:1 en texto grande y componentes de UI.',
      '7:1 texto · 4.5:1 UI (AAA)': 'WCAG AAA — el nivel más estricto: 7:1 en texto normal. Difícil de sostener en toda la paleta.',
      '3:1 solo texto grande (mínimo)': 'El piso absoluto: solo válido para titulares grandes y elementos no textuales.',
    },
  },
  'ap-aaname': { type: 'text', placeholder: 'p. ej. Los que ritualizan' },
  // Reglas de uso del logo (§3.2): estándares seleccionables; "Otro" abre inputs numéricos
  // px (pantalla) / mm (impreso). bookData interpreta el valor y la guía pinta el diagrama.
  'logo-clearspace': {
    type: 'select',
    allowOther: true,
    customPxMm: true,
    options: ['½ de la altura del símbolo', '1× la altura del símbolo', '2× la altura del símbolo'],
    optionInfo: {
      '½ de la altura del símbolo': 'Margen compacto: la mitad de la altura del símbolo en los cuatro lados. Para UI densa.',
      '1× la altura del símbolo': 'El estándar más común: un margen igual a la altura del símbolo en los cuatro lados.',
      '2× la altura del símbolo': 'Margen generoso: el doble de la altura del símbolo. Para editorial y gran formato.',
    },
  },
  // Logo variant uploads (§3.1 de la guía) — solo el principal es obligatorio.
  'logo-primary': { type: 'image' },
  'logo-stacked': { type: 'image' },
  'logo-svg': { type: 'image' }, // Símbolo: acepta SVG o PNG (los seeds llevan marcado SVG legacy)
  'logo-wordmark': { type: 'image' },
  'logo-mono': { type: 'image' },
  'logo-inverse': { type: 'image' },
  'logo-primary-clearspace': {
    type: 'select',
    allowOther: true,
    customPxMm: true,
    options: ['1× la altura del símbolo', '½ de la altura del logo', 'Cap-height del wordmark'],
    optionInfo: {
      '1× la altura del símbolo': 'El clásico: el símbolo del lockup define el margen en los cuatro lados.',
      '½ de la altura del logo': 'La mitad de la altura total del lockup como margen. Equilibrado y fácil de medir.',
      'Cap-height del wordmark': 'La altura de las mayúsculas del wordmark como unidad de margen. Tradición editorial.',
    },
  },
  'logo-primary-minsize': {
    type: 'select',
    allowOther: true,
    customPxMm: true,
    options: ['120 px pantalla · 25 mm impreso', '96 px pantalla · 20 mm impreso', '72 px pantalla · 15 mm impreso'],
    optionInfo: {
      '120 px pantalla · 25 mm impreso': 'Conservador: garantiza legibilidad del wordmark en headers y papelería.',
      '96 px pantalla · 20 mm impreso': 'Estándar para lockups horizontales en web y documentos.',
      '72 px pantalla · 15 mm impreso': 'Límite agresivo: solo si el wordmark es corto y de trazo abierto.',
    },
  },
  'logo-minsize': {
    type: 'select',
    allowOther: true,
    customPxMm: true,
    options: ['16 px pantalla · 5 mm impreso', '24 px pantalla · 8 mm impreso', '32 px pantalla · 10 mm impreso'],
    optionInfo: {
      '16 px pantalla · 5 mm impreso': 'Escala favicon/app: solo símbolos muy simples sobreviven a este tamaño.',
      '24 px pantalla · 8 mm impreso': 'Estándar para UI (iconos, avatares) y sellos impresos pequeños.',
      '32 px pantalla · 10 mm impreso': 'Conservador: para símbolos con detalle fino que se cierra al reducir.',
    },
  },
  // Formatos de archivo (§3.2): SVG lo genera el sistema; estos se suben y habilitan su descarga.
  'logo-file-png': { type: 'image', accept: 'image/png' },
  'logo-file-eps': { type: 'image', accept: '.eps,.ps,application/postscript' },
  'logo-file-pdf': { type: 'image', accept: 'application/pdf,.pdf' },
  // §3.2 "Fondos válidos": el sistema compone los tiles; aquí se cura cuáles aplican.
  'logo-backgrounds': {
    type: 'multiselect',
    options: ['Sobre claro', 'Sobre oscuro', 'Sobre color de marca', 'Sobre fotografía'],
    optionInfo: {
      'Sobre claro': 'Fondo neutro claro de la plantilla.',
      'Sobre oscuro': 'Fondo neutro oscuro de la plantilla.',
      'Sobre color de marca': 'Usa el Color de marca (sección 10) como fondo.',
      'Sobre fotografía': 'Usa el Fondo de referencia subido; sin subida muestra un placeholder.',
    },
  },
  'logo-bg-photo': { type: 'image' },
  'font-display': { type: 'font' },
  'font-text': { type: 'font' },
  'font-mono': { type: 'font' },
  // Fuentes complementarias: título/uso + familia del catálogo. Se listan en el admin y la guía
  // las anota en §3.5 ("Fuentes complementarias: …") sin extender los especímenes.
  'font-extra': {
    type: 'group',
    groupFields: [
      { key: 'title', label: 'Uso / título' },
      { key: 'family', label: 'Fuente', input: 'font' },
    ],
  },
  // Párrafo (textarea explícito)
  'ap-aatext': { type: 'textarea' },
  'bf-promise': { type: 'textarea' },
  'bf-story': { type: 'textarea' },
  'bf-vision': { type: 'textarea' },
  // Dirección cromática: arquetipos estándar de paleta, con Otro para direcciones propias.
  'cd-direction': {
    type: 'select',
    allowOther: true,
    options: ['Monocromática + un acento', 'Neutros cálidos + acento', 'Neutros fríos + acento', 'Dupla de alto contraste', 'Multicolor vibrante', 'Pastel y suave'],
    optionInfo: {
      'Monocromática + un acento': 'Una sola familia tonal con un acento puntual. Sobria y fácil de mantener.',
      'Neutros cálidos + acento': 'Grises/beiges cálidos como base y el color de marca como acento. Cercana y artesanal.',
      'Neutros fríos + acento': 'Grises fríos/azulados como base y el acento de marca encima. Técnica y precisa (dirección suiza).',
      'Dupla de alto contraste': 'Dos colores fuertes en tensión (p. ej. negro + acento vibrante). Editorial y llamativa.',
      'Multicolor vibrante': 'Paleta amplia de colores saturados por rol. Expresiva; exige reglas de uso estrictas.',
      'Pastel y suave': 'Tonos desaturados y claros. Amable y ligera; cuidar el contraste en texto.',
    },
  },
  // Paleta de marca: filas nombre + hex (misma UX que Paleta nombrada, sin columna de rol).
  'cd-primary': {
    type: 'group',
    groupFields: [
      { key: 'name', label: 'Nombre' },
      { key: 'hex', label: 'Hex', placeholder: '#RRGGBB' },
    ],
  },
  // Colores semánticos: filas rol/hex/uso con roles estándar (la base UI universal: verde éxito,
  // ámbar advertencia, rojo error, azul info) — siempre separados del color de marca.
  'cd-semantic': {
    type: 'group',
    groupFields: [
      { key: 'role', label: 'Rol', input: 'select', options: ['Éxito', 'Advertencia', 'Error', 'Información'] },
      { key: 'hex', label: 'Hex', placeholder: '#RRGGBB' },
      { key: 'use', label: 'Cuándo se usa' },
    ],
  },
  'img-treatment': {
    type: 'select',
    allowOther: true,
    options: ['Color fiel y natural', 'Tonos cálidos', 'Tonos fríos', 'Alto contraste y saturado', 'Desaturado / mate', 'Blanco y negro'],
    optionInfo: {
      'Color fiel y natural': 'Sin filtros: el color real de la escena. Honesto y atemporal.',
      'Tonos cálidos': 'Balance hacia ámbar/dorado. Cercano y acogedor.',
      'Tonos fríos': 'Balance hacia azul/neutro. Técnico y sereno.',
      'Alto contraste y saturado': 'Colores intensos y sombras profundas. Enérgico y llamativo.',
      'Desaturado / mate': 'Saturación reducida y curvas suaves. Sobrio y editorial.',
      'Blanco y negro': 'Monocromo total. Dramático; reserva el color para la marca.',
    },
  },
  // Dirección tipográfica: qué roles existen. Cada rol activa su campo de fuente (y lo vuelve
  // obligatorio); la guía muestra solo los roles declarados. Catálogo cerrado: un rol libre no
  // tendría campo de fuente que activar.
  'td-direction': {
    type: 'multiselect',
    options: ['Display', 'Texto', 'Mono'],
    optionInfo: {
      Display: 'Titulares, cifras grandes y momentos de marca. La voz visual más reconocible.',
      Texto: 'Cuerpo de lectura y UI. Optimizada para tamaños pequeños y párrafos largos.',
      Mono: 'Código, datos, tablas y etiquetas técnicas. Ancho fijo.',
    },
  },
  'td-personality': {
    type: 'select',
    allowOther: true,
    options: ['Geométrica y moderna', 'Humanista y cálida', 'Editorial y clásica', 'Técnica y neutra', 'Expresiva y display'],
    optionInfo: {
      'Geométrica y moderna': 'Formas circulares y limpias (Futura, Space Grotesk). Marcas tech y contemporáneas.',
      'Humanista y cálida': 'Trazos con influencia caligráfica (Work Sans, Fraunces). Marcas cercanas y artesanales.',
      'Editorial y clásica': 'Serifas de lectura y contraste (Playfair, Lora). Autoridad y tradición.',
      'Técnica y neutra': 'Grotescas funcionales (Inter, Helvetica). Precisión sin protagonismo.',
      'Expresiva y display': 'Personalidad fuerte en titulares; requiere una fuente de texto sobria que la equilibre.',
    },
  },
  'vt-example-off': { type: 'textarea' },
  'vt-example-on': { type: 'textarea' },
  'vt-principles': { type: 'textarea' },
  'vt-tonedef': { type: 'textarea' },
  'vt-voicedef': { type: 'textarea' },
}

export function getEditor(fieldId: string): FieldEditor {
  return fieldEditors[fieldId] ?? { type: 'textarea' }
}
