// Leer la planilla de preguntas y crear los Excel de plantilla y de resultados.
// Todo se hace en el navegador con SheetJS: no se sube ningún archivo a ningún lado.

import * as XLSX from 'xlsx'
import type { EnvioFila, EvaluacionFila, HabilitacionFila, PreguntaFila, PreguntaNueva } from '../datos/panel'
import type { TipoPregunta } from '../tipos'
import { claveNombre, nombresRepetidos, resumir } from './resultados'

export const COLUMNAS = [
  'orden',
  'tipo',
  'enunciado',
  'opcion_a',
  'opcion_b',
  'opcion_c',
  'opcion_d',
  'respuesta_correcta',
  'justificacion',
] as const
type Columna = (typeof COLUMNAS)[number]

export interface ResultadoImportacion {
  preguntas: PreguntaNueva[]
  errores: string[]
  avisos: string[]
}

// ── Importar ─────────────────────────────────────────────────────────────────

function sinTildes(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalizarEncabezado(v: unknown): string {
  return sinTildes(String(v ?? ''))
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function soloLetras(v: string): string {
  return sinTildes(v).toLowerCase().replace(/[^a-z]/g, '')
}

function normalizarTipo(v: string): TipoPregunta | null {
  const t = soloLetras(v)
  if (['multiple', 'opcionmultiple', 'om'].includes(t)) return 'multiple'
  if (['vf', 'verdaderofalso', 'verdaderoofalso'].includes(t)) return 'vf'
  if (['escala', 'satisfaccion', 'encuesta'].includes(t)) return 'escala'
  return null
}

function normalizarRespuesta(tipo: TipoPregunta, v: string): string | null {
  if (tipo === 'multiple') {
    const m = v.trim().toUpperCase().match(/^([A-D])(\W|$)/)
    return m ? m[1] : null
  }
  if (tipo === 'vf') {
    const t = soloLetras(v)
    if (['v', 'verdadero', 'true', 'si'].includes(t)) return 'V'
    if (['f', 'falso', 'false', 'no'].includes(t)) return 'F'
    return null
  }
  return null
}

/** Los CSV de Excel pueden venir en UTF-8 o en la codificación de Windows: probamos las dos. */
async function leerTextoCsv(archivo: File): Promise<string> {
  const bytes = await archivo.arrayBuffer()
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(bytes) : utf8.replace(/^﻿/, '')
}

export async function leerPreguntasDeExcel(archivo: File): Promise<ResultadoImportacion> {
  const errores: string[] = []
  const avisos: string[] = []

  let filas: unknown[][]
  try {
    const libro = /\.csv$/i.test(archivo.name)
      ? XLSX.read(await leerTextoCsv(archivo), { type: 'string' })
      : XLSX.read(await archivo.arrayBuffer())
    const hoja = libro.Sheets['Preguntas'] ?? libro.Sheets[libro.SheetNames[0]]
    filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, defval: '', blankrows: false, raw: false })
  } catch {
    return { preguntas: [], errores: ['No se pudo leer el archivo. Tiene que ser un Excel (.xlsx) o .csv.'], avisos }
  }

  if (filas.length < 2) {
    return { preguntas: [], errores: ['La planilla no tiene preguntas.'], avisos }
  }

  const encabezado = filas[0].map(normalizarEncabezado)
  const indice = Object.fromEntries(COLUMNAS.map((c) => [c, encabezado.indexOf(c)])) as Record<Columna, number>
  const faltan = (['tipo', 'enunciado', 'respuesta_correcta'] as const).filter((c) => indice[c] < 0)
  if (faltan.length) {
    return {
      preguntas: [],
      errores: [
        `Faltan columnas: ${faltan.join(', ')}. La primera fila tiene que tener los títulos: ${COLUMNAS.join(', ')}.`,
      ],
      avisos,
    }
  }

  const preguntas: PreguntaNueva[] = []
  const ordenesUsados = new Set<number>()

  filas.slice(1).forEach((fila, i) => {
    const nFila = i + 2 // número de fila como lo ve Excel
    const celda = (c: Columna) => (indice[c] >= 0 ? String(fila[indice[c]] ?? '').trim() : '')
    if (COLUMNAS.every((c) => !celda(c))) return

    const tipo = normalizarTipo(celda('tipo'))
    const enunciado = celda('enunciado')
    if (!tipo) {
      errores.push(`Fila ${nFila}: el tipo «${celda('tipo')}» no es válido. Usá multiple, vf o escala.`)
      return
    }
    if (!enunciado) {
      errores.push(`Fila ${nFila}: falta el enunciado.`)
      return
    }

    let orden = preguntas.length + 1
    if (celda('orden')) {
      orden = Number(celda('orden'))
      if (!Number.isInteger(orden) || orden < 1) {
        errores.push(`Fila ${nFila}: el orden «${celda('orden')}» tiene que ser un número entero.`)
        return
      }
    }
    if (ordenesUsados.has(orden)) {
      errores.push(`Fila ${nFila}: el orden ${orden} está repetido.`)
      return
    }

    const opciones = {
      opcion_a: celda('opcion_a') || null,
      opcion_b: celda('opcion_b') || null,
      opcion_c: celda('opcion_c') || null,
      opcion_d: celda('opcion_d') || null,
    }
    const justificacion = celda('justificacion') || null
    let respuesta: string | null = null

    if (tipo === 'multiple') {
      if (!opciones.opcion_a || !opciones.opcion_b) {
        errores.push(`Fila ${nFila}: una pregunta de opción múltiple necesita al menos opcion_a y opcion_b.`)
        return
      }
      if (!opciones.opcion_c && opciones.opcion_d) {
        errores.push(`Fila ${nFila}: hay opcion_d pero falta opcion_c.`)
        return
      }
      respuesta = normalizarRespuesta(tipo, celda('respuesta_correcta'))
      const letra = respuesta?.toLowerCase() as 'a' | 'b' | 'c' | 'd' | undefined
      if (!respuesta || !letra || !opciones[`opcion_${letra}`]) {
        errores.push(
          `Fila ${nFila}: la respuesta correcta «${celda('respuesta_correcta')}» no es válida. Tiene que ser la letra de una opción que exista (A, B, C o D).`,
        )
        return
      }
    } else if (tipo === 'vf') {
      respuesta = normalizarRespuesta(tipo, celda('respuesta_correcta'))
      if (!respuesta) {
        errores.push(`Fila ${nFila}: en verdadero/falso la respuesta correcta tiene que ser V o F.`)
        return
      }
      if (Object.values(opciones).some(Boolean)) avisos.push(`Fila ${nFila}: las opciones se ignoran en verdadero/falso.`)
      opciones.opcion_a = opciones.opcion_b = opciones.opcion_c = opciones.opcion_d = null
    } else {
      if (celda('respuesta_correcta')) avisos.push(`Fila ${nFila}: la respuesta correcta se ignora en escala.`)
      opciones.opcion_a = opciones.opcion_b = opciones.opcion_c = opciones.opcion_d = null
    }

    if (tipo !== 'escala' && !justificacion) avisos.push(`Fila ${nFila}: no tiene justificación («Por qué»).`)

    ordenesUsados.add(orden)
    preguntas.push({
      orden,
      tipo,
      enunciado,
      ...opciones,
      respuesta_correcta: respuesta,
      justificacion: tipo === 'escala' ? null : justificacion,
    })
  })

  preguntas.sort((a, b) => a.orden - b.orden)
  if (!errores.length && !preguntas.some((p) => p.tipo !== 'escala')) {
    errores.push('No hay ninguna pregunta con puntaje (multiple o vf).')
  }
  return { preguntas, errores, avisos }
}

// ── Plantilla ────────────────────────────────────────────────────────────────

export function descargarPlantilla() {
  const ejemplo = [
    [...COLUMNAS],
    [
      1,
      'multiple',
      '¿Qué clase de fuego corresponde a líquidos inflamables?',
      'Clase A',
      'Clase B',
      'Clase C',
      'Clase D',
      'B',
      'La clase B agrupa líquidos y gases inflamables como nafta o aceite.',
    ],
    [
      2,
      'vf',
      'Un extintor de agua se puede usar sobre un tablero eléctrico con corriente.',
      '',
      '',
      '',
      '',
      'F',
      'El agua conduce la electricidad: hay riesgo de electrocución.',
    ],
    [3, 'escala', 'El contenido fue útil para mi trabajo.', '', '', '', '', '', ''],
  ]
  const hoja = XLSX.utils.aoa_to_sheet(ejemplo)
  hoja['!cols'] = [6, 10, 60, 25, 25, 25, 25, 18, 60].map((wch) => ({ wch }))

  const instrucciones = XLSX.utils.aoa_to_sheet([
    ['Cómo completar la hoja «Preguntas»'],
    [''],
    ['orden', 'Número de la pregunta (1, 2, 3…). Define el orden en que aparecen.'],
    ['tipo', 'multiple = opción múltiple · vf = verdadero o falso · escala = satisfacción de 1 a 5 (no suma puntaje).'],
    ['enunciado', 'El texto de la pregunta.'],
    ['opcion_a … opcion_d', 'Solo para multiple. Mínimo A y B. Dejá vacías las que no uses.'],
    ['respuesta_correcta', 'multiple: la letra (A, B, C o D) · vf: V o F · escala: vacío.'],
    ['justificacion', 'El «Por qué» que ve el participante después de enviar. Vacío en escala.'],
    [''],
    ['Las preguntas de escala siempre se muestran al final, juntas.'],
    ['No cambies los títulos de la primera fila.'],
  ])
  instrucciones['!cols'] = [{ wch: 22 }, { wch: 100 }]

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Preguntas')
  XLSX.utils.book_append_sheet(libro, instrucciones, 'Instrucciones')
  XLSX.writeFile(libro, 'plantilla-preguntas.xlsx')
}

// ── Resultados ───────────────────────────────────────────────────────────────

function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function exportarResultados(
  evaluacion: EvaluacionFila,
  habilitacion: HabilitacionFila,
  preguntas: PreguntaFila[],
  envios: EnvioFila[],
) {
  const puntuables = preguntas.filter((p) => p.tipo !== 'escala')
  const escalas = preguntas.filter((p) => p.tipo === 'escala')
  const repetidos = nombresRepetidos(envios)
  const res = resumir(envios, preguntas, evaluacion.nota_minima)

  // Hoja 1: una fila por participante
  const encabezado = [
    'Nº',
    'Nombre y apellido',
    'Enviado',
    'Correctas',
    'Total',
    'Porcentaje',
    'Estado',
    ...puntuables.map((p, i) => `P${i + 1} (correcta: ${p.respuesta_correcta})`),
    ...escalas.map((_, i) => `Satisfacción ${i + 1}`),
    'Comentario',
    'Nombre repetido',
  ]
  const filas = envios.map((e, i) => {
    const valor = (id: string) => e.respuestas.find((r) => r.pregunta_id === id)
    return [
      i + 1,
      e.nombre,
      fechaHora(e.enviado_en),
      e.correctas,
      e.total,
      e.porcentaje / 100,
      evaluacion.nota_minima === null
        ? 'Participó'
        : e.porcentaje >= evaluacion.nota_minima
          ? 'Aprobado'
          : 'No aprobado',
      ...puntuables.map((p) => {
        const r = valor(p.id)
        return r ? `${r.valor} ${r.es_correcta ? '✓' : '✗'}` : '—'
      }),
      ...escalas.map((p) => {
        const r = valor(p.id)
        return r ? Number(r.valor) : ''
      }),
      e.comentario,
      repetidos.has(claveNombre(e.nombre)) ? 'Sí' : '',
    ]
  })
  const hojaResultados = XLSX.utils.aoa_to_sheet([encabezado, ...filas])
  hojaResultados['!cols'] = encabezado.map((h, i) => ({ wch: i === 1 ? 30 : h === 'Comentario' ? 50 : Math.max(10, h.length + 2) }))
  for (let f = 1; f <= filas.length; f++) {
    const celda = hojaResultados[XLSX.utils.encode_cell({ r: f, c: 5 })]
    if (celda) celda.z = '0%'
  }

  // Hoja 2: cada pregunta con su porcentaje de aciertos
  const hojaPreguntas = XLSX.utils.aoa_to_sheet([
    ['Nº', 'Tipo', 'Enunciado', 'Respuesta correcta', 'Aciertos', '% de aciertos', 'Justificación'],
    ...res.porPregunta.map(({ pregunta: p, aciertos, porcentaje }, i) => [
      i + 1,
      p.tipo === 'vf' ? 'Verdadero/Falso' : 'Opción múltiple',
      p.enunciado,
      p.respuesta_correcta,
      aciertos,
      porcentaje === null ? '' : `${porcentaje}%`,
      p.justificacion ?? '',
    ]),
  ])
  hojaPreguntas['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 60 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 60 }]

  // Hoja 3: satisfacción y comentarios
  const hojaSatisfaccion = XLSX.utils.aoa_to_sheet([
    ['Ítem', 'Promedio (1 a 5)', 'Respuestas'],
    ...res.satisfaccion.map((s) => [s.pregunta.enunciado, s.promedio ?? '', s.cantidad]),
    [],
    ['Comentarios'],
    ...res.comentarios.map((c) => [c.texto, c.nombre]),
  ])
  hojaSatisfaccion['!cols'] = [{ wch: 70 }, { wch: 18 }, { wch: 12 }]

  // Hoja 4: resumen
  const hojaResumen = XLSX.utils.aoa_to_sheet([
    ['Evaluación', evaluacion.titulo],
    ['Institución', evaluacion.marca === 'vc' ? 'VC Prevención y Capacitación' : 'Bomberos Voluntarios de Luque'],
    ['Instructor', evaluacion.instructor],
    ['Lugar o empresa', evaluacion.lugar ?? ''],
    ['Habilitada', fechaHora(habilitacion.abierta_en)],
    ['Cierre', fechaHora(habilitacion.cierra_en)],
    ['Participantes', res.participantes],
    ['Promedio', res.promedio === null ? '' : `${res.promedio}%`],
    ['Nota mínima', evaluacion.nota_minima === null ? 'Sin nota mínima' : `${evaluacion.nota_minima}%`],
    ['Aprobados', res.aprobados === null ? '—' : `${res.aprobados} de ${res.participantes}`],
    ['Nombres repetidos', repetidos.size ? [...repetidos].length : 'Ninguno'],
  ])
  hojaResumen['!cols'] = [{ wch: 20 }, { wch: 50 }]

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hojaResultados, 'Resultados')
  XLSX.utils.book_append_sheet(libro, hojaPreguntas, 'Preguntas')
  XLSX.utils.book_append_sheet(libro, hojaSatisfaccion, 'Satisfacción')
  XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen')
  XLSX.writeFile(libro, `resultados-${evaluacion.slug}-${habilitacion.abierta_en.slice(0, 10)}.xlsx`)
}
