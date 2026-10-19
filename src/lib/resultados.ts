import type { EnvioFila, PreguntaFila, PreguntaNueva } from '../datos/panel'

/** Para comparar nombres sin importar mayúsculas, tildes ni espacios. */
export function claveNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Nombres que aparecen más de una vez en la misma habilitación. */
export function nombresRepetidos(envios: EnvioFila[]): Set<string> {
  const vistos = new Map<string, number>()
  for (const e of envios) vistos.set(claveNombre(e.nombre), (vistos.get(claveNombre(e.nombre)) ?? 0) + 1)
  return new Set([...vistos].filter(([, n]) => n > 1).map(([k]) => k))
}

export interface Resumen {
  participantes: number
  promedio: number | null
  aprobados: number | null
  porPregunta: { pregunta: PreguntaFila; aciertos: number; porcentaje: number | null }[]
  satisfaccion: { pregunta: PreguntaFila; promedio: number | null; cantidad: number }[]
  comentarios: { nombre: string; texto: string }[]
}

export function resumir(envios: EnvioFila[], preguntas: PreguntaFila[], notaMinima: number | null): Resumen {
  const n = envios.length
  const respuestaDe = (e: EnvioFila, preguntaId: string) => e.respuestas.find((r) => r.pregunta_id === preguntaId)

  return {
    participantes: n,
    promedio: n ? Math.round(envios.reduce((s, e) => s + e.porcentaje, 0) / n) : null,
    aprobados: notaMinima === null ? null : envios.filter((e) => e.porcentaje >= notaMinima).length,
    porPregunta: preguntas
      .filter((p) => p.tipo !== 'escala')
      .map((p) => {
        const aciertos = envios.filter((e) => respuestaDe(e, p.id)?.es_correcta).length
        return { pregunta: p, aciertos, porcentaje: n ? Math.round((aciertos * 100) / n) : null }
      }),
    satisfaccion: preguntas
      .filter((p) => p.tipo === 'escala')
      .map((p) => {
        const valores = envios.map((e) => Number(respuestaDe(e, p.id)?.valor)).filter((v) => v >= 1 && v <= 5)
        return {
          pregunta: p,
          cantidad: valores.length,
          promedio: valores.length ? Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 10) / 10 : null,
        }
      }),
    comentarios: envios.filter((e) => e.comentario.trim()).map((e) => ({ nombre: e.nombre, texto: e.comentario.trim() })),
  }
}

/** "B) Clase B", "Verdadero"… para mostrar la respuesta correcta en el panel. */
export function textoCorrecta(p: PreguntaNueva): string {
  if (p.tipo === 'vf') return p.respuesta_correcta === 'V' ? 'Verdadero' : 'Falso'
  const op = { A: p.opcion_a, B: p.opcion_b, C: p.opcion_c, D: p.opcion_d }[p.respuesta_correcta ?? ''] ?? ''
  return `${p.respuesta_correcta}) ${op}`
}
