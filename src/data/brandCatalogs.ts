import type { OptionGroup } from './fieldEditors'

// An AI-tailored catalog for one field: categorized groups (select/multiselect) OR
// quick suggestions (textarea). Generated per project (mocked from the sample below).
export interface BrandCatalog {
  groups?: OptionGroup[]
  suggestions?: string[]
}

// Sample "a la medida" catalogs for the demo brand (Nimbus Coffee). In the real product the
// client's connected engine would generate these per field; here it's a deterministic mock.
export const AI_CATALOG_SAMPLE: Record<string, BrandCatalog> = {
  'bf-values': {
    groups: [
      { label: 'El café y su origen', options: ['Origen trazable', 'Tueste fresco al pedido', 'Granos de especialidad', 'Respeto al productor', 'Notas de cata honestas'] },
      { label: 'El ritual del barista', options: ['Cuidado de barista', 'Preparación a tu medida', 'Conocimiento que se comparte', 'Ritual diario de café', 'Cercanía sin corporativismo'] },
      { label: 'Vínculo y recompra', options: ['Confianza en cada entrega', 'Cliente recurrente cuidado', 'Recompra sin fricción', 'Acompañamiento constante', 'Comunidad cafetera'] },
      { label: 'Conciencia del grano', options: ['Comercio justo al origen', 'Empaque responsable', 'Café con propósito', 'Del campo a la taza'] },
    ],
  },
  'ps-diff': {
    groups: [
      { label: 'Café y origen', options: ['Especialidad de origen único', 'Tueste reciente por lote', 'Trazabilidad hasta el productor', 'Granos de altura mexicanos'] },
      { label: 'Ritual del barista', options: ['Recetas de barista incluidas', 'Guía de preparación en casa', 'Notas de cata por bolsa', 'Curaduría de tostador propio'] },
      { label: 'Suscripción que cuida', options: ['Entrega al ritmo de tu consumo', 'Pausa o ajuste sin fricción', 'Rotación de orígenes cada mes', 'Aviso antes de quedarte sin café'] },
      { label: 'Cercanía humana', options: ['Trato de barista, no corporativo', 'Historias del caficultor', 'Comunidad cafetera Nimbus', 'Acompañamiento en cada recompra'] },
    ],
  },
  'ap-trust': {
    groups: [
      { label: 'Calidad del café', options: ['Tueste reciente fechado', 'Origen y finca trazables', 'Notas de cata descritas', 'Granos de especialidad puntuados'] },
      { label: 'Ritual y experiencia', options: ['Guía de preparación incluida', 'Recomendaciones de barista', 'Café siempre fresco en casa', 'Métodos sugeridos por grano'] },
      { label: 'Suscripción confiable', options: ['Entrega puntual mes a mes', 'Pausa o cancela cuando quieras', 'Ajusta molienda y frecuencia', 'Sin cargos sorpresa'] },
      { label: 'Cercanía humana', options: ['Baristas que responden dudas', 'Historias del productor', 'Trato cálido no corporativo', 'Acompañamiento en cada recompra'] },
    ],
  },
  'vt-forbidden': {
    groups: [
      { label: 'Clichés del café', options: ['El mejor café del mundo', 'Café gourmet premium', 'Experiencia única de sabor', 'Aroma inigualable', 'Calidad de exportación'] },
      { label: 'Tono corporativo anti-barista', options: ['Estimado cliente', 'Nos complace informarle', 'Su satisfacción es nuestra prioridad', 'Atención de primer nivel'] },
      { label: 'Presión de recompra', options: ['No dejes que se acabe', 'Reabastece ya mismo', 'Última taza disponible', 'Renueva antes de quedarte sin café'] },
      { label: 'Falsa artesanía y origen', options: ['100% artesanal garantizado', 'Café del mejor origen', 'Tostado a la perfección', 'Granos seleccionados a mano'] },
    ],
  },
  'vi-attributes': {
    groups: [
      { label: 'Alma de barista', options: ['Artesanal de tueste', 'Hecho a mano', 'Honesto de origen', 'Sin pose corporativa'] },
      { label: 'Calidez de café', options: ['Tonos tostados', 'Ámbar de extracción', 'Crema de leche vaporizada', 'Madera de barra'] },
      { label: 'Ritual de taza', options: ['Acogedor de sobremesa', 'Cotidiano de mañana', 'Pausa cercana', 'Textura de grano'] },
      { label: 'Confianza de recompra', options: ['Etiqueta clara de lote', 'Empaque cuidado al detalle', 'Frescura visible', 'Cercanía recurrente'] },
    ],
  },
  'ico-style': {
    groups: [
      { label: 'Trazo de barista', options: ['Línea dibujada a mano', 'Trazo de tiza sobre pizarrón', 'Contorno cálido y suave', 'Trazo de tinta artesanal'] },
      { label: 'Repertorio cafetero', options: ['Íconos de grano y origen', 'Glifos de ritual y método', 'Set de taza y vapor', 'Símbolos de tueste y aroma'] },
      { label: 'Acabado de marca', options: ['Esquinas suaves y cercanas', 'Acento en indigo Nimbus', 'Textura de papel kraft', 'Sello que invita a recomprar'] },
    ],
  },
  'mo-personality': {
    groups: [
      { label: 'Ritual del café', options: ['Vapor que asciende', 'Vertido lento de barista', 'Aroma que se despliega', 'Crema que se asienta'] },
      { label: 'Calidez artesanal', options: ['Gesto hecho a mano', 'Movimiento tibio y cercano', 'Cadencia sin prisa', 'Textura de grano tostado'] },
      { label: 'Confianza cercana', options: ['Transición de barista, no corporativa', 'Reaparición que invita a volver', 'Ritmo humano y constante', 'Cierre que reconforta'] },
      { label: 'Gancho de recompra', options: ['Empuje sutil al reorden', 'Taza que se rellena', 'Bienvenida de regreso cálida', 'Suscripción activa celebrada'] },
    ],
  },
  'bf-essence': {
    suggestions: ['Cada taza, un ritual que vuelves a elegir.', 'Café de especialidad con alma de barista.', 'Del origen a tu taza, sin perder el cariño.', 'Tu café favorito, siempre listo en casa.', 'El ritual diario que no quieres saltarte.', 'Especialidad cercana, no café de oficina.'],
  },
  'bf-purpose': {
    suggestions: ['Existimos para que tomar buen café en casa sea un ritual diario, no un lujo.', 'Llevamos café de especialidad fresco hasta tu taza, sin complicaciones.', 'Queremos que cada recompra se sienta como volver con tu barista de confianza.', 'Existimos para que nunca te falte tu café favorito, recién tostado.'],
  },
  'bf-mission': {
    suggestions: ['Llevar café de especialidad fresco hasta tu puerta, mes con mes.', 'Convertir tu pausa diaria en un ritual que vale la pena repetir.', 'Acercarte cafés de origen seleccionados por baristas, sin complicaciones.', 'Mantener viva tu taza con tuestes frescos y entregas puntuales.'],
  },
  'ps-statement': {
    suggestions: ['Para compradores recurrentes de 25 a 40, Nimbus Coffee es la suscripción de café de especialidad que convierte cada entrega en un ritual esperado.', 'Para quienes ya conocen el buen café, Nimbus es el barista de confianza que llega a casa, no una tienda más en línea.', 'Para amantes del café cotidiano, Nimbus cuida el origen y el tueste para que nunca quieras saltarte una recompra.', 'Para clientes recurrentes, Nimbus ofrece café de especialidad con alma de barista que da motivos reales para volver mes con mes.'],
  },
  'ps-uvp': {
    suggestions: ['Tu café de especialidad recién tostado, en casa cada semana.', 'Del origen a tu taza, sin que muevas un dedo.', 'El ritual de barista que no quieres dejar de repetir.', 'Suscríbete y nunca te quedes sin tu café favorito.', 'Cada taza sabe a por qué volviste.'],
  },
  'ap-desired': {
    suggestions: ['El café de especialidad en quien confío cada semana.', 'Como tener un barista de cabecera en casa.', 'Origen real y tueste fresco, sin presumir.', 'Mi ritual de café, siempre listo a tiempo.', 'Cercana, artesanal y nunca corporativa.'],
  },
  'msg-core': {
    suggestions: ['Tu café de especialidad, siempre fresco en la puerta.', 'Del origen a tu taza, sin perder el ritual.', 'Baristas que cuidan tu próxima taza como la primera.', 'Suscríbete una vez, disfruta cada mañana.', 'Recién tostado para ti, no para el almacén.'],
  },
  'msg-cta': {
    suggestions: ['Recibe tu primer café', 'Arma tu suscripción', 'Vuelve a tu mezcla favorita', 'Despierta con Nimbus', 'Renueva tu ritual de barista', 'Reactiva tu envío mensual'],
  },
  'vi-concept': {
    suggestions: ['Identidad cálida y artesanal con texturas de papel kraft y grano de café.', 'Fotografía cercana del ritual: taza humeante, granos y manos de barista.', 'Paleta de tonos tostados, crema y verde origen.', 'Sellos y etiquetas de origen que resaltan el café de especialidad.'],
  },
  'img-style': {
    groups: [
      { label: 'Ritual Nimbus', options: ['Vapor y crema de cerca', 'Manos de barista', 'Granos en tueste', 'Mesa de barrio'] },
      { label: 'Luz y encuadre', options: ['Luz de mañana', 'Sombra cálida', 'Detalle macro'] },
    ],
  },

  // — Brief fields (Nimbus Coffee) — same field ids the Brief screen reads. ——————————————
  'a-problem': {
    groups: [
      { label: 'Recompra y suscripción', options: ['Caen las recompras de café', 'Suscriptores que pausan', 'Compra única sin retorno', 'Se olvidan de reordenar'] },
      { label: 'Experiencia de compra', options: ['Checkout largo para suscribirse', 'Difícil elegir entre orígenes', 'Experiencia móvil descuidada'] },
      { label: 'Producto y frescura', options: ['Café que llega sin frescura', 'Sin info de origen ni tueste', 'Notas de cata poco claras'] },
      { label: 'Marca', options: ['Se ve como "otra tienda de café"', 'Marca sin alma de barista', 'Poca diferenciación de especialidad'] },
    ],
  },
  'a-obj': {
    groups: [
      { label: 'Recompra recurrente', options: ['Subir la tasa de recompra', 'Reducir cancelaciones de suscripción', 'Aumentar suscriptores activos'] },
      { label: 'Ingreso', options: ['Subir el ticket por entrega', 'Crecer el ingreso recurrente (MRR)', 'Vender más bolsas al mes'] },
      { label: 'Captación', options: ['Bajar el costo de adquisición', 'Aumentar pruebas de suscripción', 'Crecer la base de clientes'] },
      { label: 'Marca', options: ['Posicionar el café de especialidad', 'Diferenciar de tiendas genéricas'] },
    ],
  },
  'a-usergoal': {
    groups: [
      { label: 'Recibir su café', options: ['Recibir café fresco a tiempo', 'Nunca quedarse sin café', 'Ajustar molienda y frecuencia'] },
      { label: 'Elegir y descubrir', options: ['Elegir un origen fácilmente', 'Descubrir tuestes nuevos', 'Entender notas de cata'] },
      { label: 'Gestionar suscripción', options: ['Pausar sin fricción', 'Saltar o adelantar una entrega', 'Cambiar de plan'] },
    ],
  },
  'a-brandgoal': {
    groups: [
      { label: 'Percepción', options: ['Café de especialidad cercano', 'Barista de confianza en casa', 'Origen real, sin pose'] },
      { label: 'Diferenciación', options: ['No "otra tienda de café"', 'Trato humano, no corporativo'] },
      { label: 'Confianza', options: ['Frescura demostrable', 'Comunidad cafetera Nimbus'] },
    ],
  },
  'b-primary': {
    groups: [
      { label: 'Tomador de café', options: ['Tomadores diarios 25-40', 'Entusiastas del café de especialidad', 'Compradores recurrentes'] },
      { label: 'Hábito', options: ['Ritual de mañana en casa', 'Home office cafetero', 'Compra recurrente de regalo'] },
      { label: 'Comportamiento', options: ['Suscriptores fieles', 'Compran desde el móvil', 'Investigan el origen antes de comprar'] },
    ],
  },
  'b-journey': {
    groups: [
      { label: 'Suscripción', options: ['Descubrir → Probar → Suscribirse', 'Origen → Plan → Checkout', 'Quiz de taza → Recomendación → Suscribirse'] },
      { label: 'Recompra', options: ['Aviso de reorden → Confirmar → Entrega', 'Pausa → Reactivar → Recibir'] },
      { label: 'Descubrimiento', options: ['Anuncio → Landing → Primera bolsa'] },
    ],
  },
  'b-secondary': {
    suggestions: ['Regalos corporativos de café', 'Oficinas y home office cafetero', 'Nuevos en el café de especialidad', 'Cafeterías pequeñas (mayoreo)'],
  },
  'c-deliverables': {
    groups: [
      { label: 'Marca', options: ['Branding', 'Identidad de empaque', 'Sistema de etiquetas de lote'] },
      { label: 'Producto digital', options: ['Sitio de suscripción', 'Checkout de suscripción', 'Quiz de perfil de taza'] },
      { label: 'Contenido', options: ['Fotografía de origen', 'Notas de cata por bolsa', 'Guías de preparación'] },
    ],
  },
  'c-integrations': {
    groups: [
      { label: 'Suscripción y pago', options: ['Shopify Subscriptions', 'Stripe', 'Mercado Pago', 'Recharge'] },
      { label: 'Marketing y recompra', options: ['Klaviyo', 'WhatsApp Business', 'Mailchimp'] },
      { label: 'Logística', options: ['Skydropx', 'Envia.com', 'Rastreo de paquetería'] },
    ],
  },
  'd-anti': {
    groups: [
      { label: 'Estética a evitar', options: ['Look de cápsula industrial', 'Granos de stock genérico', 'Gourmet pretencioso'] },
      { label: 'Tono a evitar', options: ['Lenguaje de oficina', 'Promesas de "el mejor café del mundo"', 'Tecnicismo frío de catador'] },
      { label: 'Clichés de café', options: ['Costal de yute por todos lados', 'Humo exagerado', 'Sellos "premium" vacíos'] },
    ],
  },
  'd-restrict': {
    groups: [
      { label: 'Marca a conservar', options: ['Conservar el verde Nimbus', 'Mantener el nombre Nimbus', 'Respetar el isotipo de grano'] },
      { label: 'Producto', options: ['Vender solo café de especialidad', 'Mostrar siempre la fecha de tueste'] },
      { label: 'Legal', options: ['No hacer claims de salud', 'Origen verificable'] },
    ],
  },
  'e-dep': {
    groups: [
      { label: 'Contenido y activos', options: ['Fotografía de origen', 'Inventario de tuestes', 'Notas de cata por lote'] },
      { label: 'Accesos y técnico', options: ['Integración de suscripción', 'Acceso a Shopify', 'Dominio y DNS'] },
      { label: 'Aprobaciones y legal', options: ['Claims de origen validados', 'Etiquetado conforme'] },
      { label: 'Terceros', options: ['Acuerdo de paquetería', 'Pasarela de pago', 'Calendario de tueste'] },
    ],
  },
  'e-risk': {
    groups: [
      { label: 'Frescura y logística', options: ['Café que llega sin frescura', 'Retrasos de paquetería', 'Quiebres de stock de origen'] },
      { label: 'Contenido y activos', options: ['Fotografía de origen pendiente', 'Notas de cata incompletas'] },
      { label: 'Negocio', options: ['Churn de suscripción', 'Estacionalidad de cosecha'] },
      { label: 'Decisión', options: ['Aprobaciones lentas del cliente', 'Visión no alineada'] },
    ],
  },
}

// Whether a field can receive an AI catalog (so the modal shows the "A la medida · IA" section).
const AI_CAPABLE = new Set(Object.keys(AI_CATALOG_SAMPLE))
export const isAiCapable = (fieldId: string): boolean => AI_CAPABLE.has(fieldId)

// Mock generation: returns the tailored catalogs (all fields, or one when regenerating).
// Shared by Brief and Branding — each screen reads only its own field ids from the store.
export function generateCatalogs(): Record<string, BrandCatalog> {
  return { ...AI_CATALOG_SAMPLE }
}
export function regenerateCatalog(fieldId: string): BrandCatalog | undefined {
  return AI_CATALOG_SAMPLE[fieldId]
}
