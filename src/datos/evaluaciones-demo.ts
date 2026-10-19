// Datos de ejemplo para probar sin base de datos.
// En la parte 2 esto se reemplaza por las tablas de Supabase y este archivo se borra.

import type { EvaluacionPublica, PreguntaPublica } from '../tipos'

export interface PreguntaDemo extends PreguntaPublica {
  /** Letra ("A".."D") o "V"/"F". Nunca se envía al celular antes de enviar. */
  correcta?: string
  justificacion?: string
}

export interface EvaluacionDemo extends Omit<EvaluacionPublica, 'preguntas'> {
  preguntas: PreguntaDemo[]
}

function hoyALas(hora: number, minuto: number, sumarDias = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + sumarDias)
  d.setHours(hora, minuto, 0, 0)
  return d.toISOString()
}

function hoyAAAAMMDD(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const SATISFACCION_VC: PreguntaDemo[] = [
  { id: 'vc-s1', orden: 4, tipo: 'escala', enunciado: 'El contenido fue útil para mi trabajo.', opciones: [] },
  { id: 'vc-s2', orden: 5, tipo: 'escala', enunciado: 'El instructor explicó con claridad.', opciones: [] },
  { id: 'vc-s3', orden: 6, tipo: 'escala', enunciado: 'La práctica con extintores fue suficiente.', opciones: [] },
]

const PREGUNTAS_EXTINTORES: PreguntaDemo[] = [
  {
    id: 'vc-1',
    orden: 1,
    tipo: 'multiple',
    enunciado: '¿Qué clase de fuego corresponde a líquidos inflamables como nafta, gasoil o aceite?',
    opciones: [
      { letra: 'A', texto: 'Clase A' },
      { letra: 'B', texto: 'Clase B' },
      { letra: 'C', texto: 'Clase C' },
      { letra: 'D', texto: 'Clase D' },
    ],
    correcta: 'B',
    justificacion:
      'La clase B agrupa los líquidos y gases inflamables: nafta, gasoil, aceites, pinturas y solventes.',
  },
  {
    id: 'vc-2',
    orden: 2,
    tipo: 'vf',
    enunciado: 'Un extintor de agua se puede usar sobre un tablero eléctrico con corriente.',
    opciones: [],
    correcta: 'F',
    justificacion:
      'El agua conduce la electricidad y hay riesgo de electrocución. En equipos con corriente (clase C) se usa CO₂ o polvo químico seco.',
  },
  {
    id: 'vc-3',
    orden: 3,
    tipo: 'multiple',
    enunciado: 'Al usar un extintor, ¿hacia dónde hay que dirigir la descarga?',
    opciones: [
      { letra: 'A', texto: 'Hacia la parte más alta de las llamas' },
      { letra: 'B', texto: 'Hacia el humo' },
      { letra: 'C', texto: 'A la base del fuego' },
      { letra: 'D', texto: 'Al centro del ambiente' },
    ],
    correcta: 'C',
    justificacion:
      'En la base está el material que se quema. Apuntar a las llamas o al humo gasta el extintor sin apagar el fuego.',
  },
]

export const EVALUACIONES_DEMO: EvaluacionDemo[] = [
  {
    slug: 'demo-vc',
    marca: 'vc',
    titulo: 'Uso de extintores portátiles',
    instructor: 'Vidal Caballero',
    fecha: hoyAAAAMMDD(),
    lugar: 'Empresa Demo S.A.',
    notaMinima: 70,
    modoResultado: 'inmediato',
    habilitacion: { id: 'hab-demo-vc', cierraEn: hoyALas(23, 59), cerradaPorInstructor: false },
    preguntas: [...PREGUNTAS_EXTINTORES, ...SATISFACCION_VC],
  },
  {
    slug: 'demo-cbvl',
    marca: 'cbvl',
    titulo: 'Control de hemorragias',
    instructor: 'Vidal Caballero',
    fecha: hoyAAAAMMDD(),
    lugar: null,
    notaMinima: null,
    modoResultado: 'liberar',
    habilitacion: { id: 'hab-demo-cbvl', cierraEn: hoyALas(23, 59), cerradaPorInstructor: false },
    preguntas: [
      {
        id: 'cb-1',
        orden: 1,
        tipo: 'multiple',
        enunciado: '¿Cuál es la primera acción ante una hemorragia externa abundante en un brazo?',
        opciones: [
          { letra: 'A', texto: 'Elevar el brazo y esperar' },
          { letra: 'B', texto: 'Hacer presión directa y firme sobre la herida' },
          { letra: 'C', texto: 'Colocar un torniquete en todos los casos' },
          { letra: 'D', texto: 'Lavar la herida con abundante agua' },
        ],
        correcta: 'B',
        justificacion:
          'La presión directa es el primer paso y controla la mayoría de las hemorragias externas. El torniquete se reserva para cuando la presión no alcanza.',
      },
      {
        id: 'cb-2',
        orden: 2,
        tipo: 'vf',
        enunciado: 'Si la gasa se empapa de sangre, hay que sacarla y poner una nueva.',
        opciones: [],
        correcta: 'F',
        justificacion:
          'Al sacarla se arranca el coágulo que se está formando. Se coloca otra gasa encima y se sigue presionando.',
      },
      {
        id: 'cb-3',
        orden: 3,
        tipo: 'multiple',
        enunciado: 'Sangre roja brillante que sale a chorros, al ritmo del pulso, indica una hemorragia:',
        opciones: [
          { letra: 'A', texto: 'Venosa' },
          { letra: 'B', texto: 'Capilar' },
          { letra: 'C', texto: 'Arterial' },
          { letra: 'D', texto: 'Interna' },
        ],
        correcta: 'C',
        justificacion:
          'La sangre arterial es rojo brillante y sale a presión con cada latido. Es la más urgente de controlar.',
      },
      { id: 'cb-s1', orden: 4, tipo: 'escala', enunciado: 'El contenido fue útil para mi labor.', opciones: [] },
      { id: 'cb-s2', orden: 5, tipo: 'escala', enunciado: 'El instructor explicó con claridad.', opciones: [] },
      { id: 'cb-s3', orden: 6, tipo: 'escala', enunciado: 'Me siento capaz de aplicar lo aprendido.', opciones: [] },
    ],
  },
  {
    // Sirve para ver la pantalla «Evaluación cerrada»
    slug: 'demo-cerrada',
    marca: 'vc',
    titulo: 'Uso de extintores portátiles',
    instructor: 'Vidal Caballero',
    fecha: null,
    lugar: null,
    notaMinima: 70,
    modoResultado: 'inmediato',
    habilitacion: { id: 'hab-demo-cerrada', cierraEn: hoyALas(18, 0, -1), cerradaPorInstructor: false },
    preguntas: [...PREGUNTAS_EXTINTORES, ...SATISFACCION_VC],
  },
]
