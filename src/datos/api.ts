// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO DE DATOS
// Es el ÚNICO lugar de la app que sabe de dónde salen y adónde van los datos.
// Las pantallas solo usan estas 4 funciones:
//   obtenerEvaluacion · buscarEnvioPrevio · enviarRespuestas · obtenerResultado
//
// Por ahora (Etapa 2, parte 1) es una SIMULACIÓN: usa los datos de
// evaluaciones-demo.ts y guarda los envíos en el navegador (localStorage).
// En la parte 2 se reemplaza el contenido de este archivo por llamadas a
// Supabase, y la corrección pasa a una función de Postgres.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  EnvioNuevo,
  EvaluacionPublica,
  ItemRevision,
  RespuestaEnvio,
  Respuestas,
  ResultadoEnvio,
} from '../tipos'
import { estaCerrada } from '../lib/tiempo'
import { generarId } from '../lib/dispositivo'
import { EVALUACIONES_DEMO, type EvaluacionDemo, type PreguntaDemo } from './evaluaciones-demo'

/** Simulación: en modo «liberar yo», el instructor «libera» la nota sola a los N segundos. */
const SEGUNDOS_HASTA_LIBERAR_DEMO = 15
const CLAVE_ENVIOS = 'demo_envios'

interface EnvioGuardado {
  id: string
  slug: string
  habilitacionId: string
  dispositivoId: string
  nombre: string
  respuestas: Respuestas
  comentario: string
  enviadoEn: number
}

// ── API pública ──────────────────────────────────────────────────────────────

/** Evaluación tal como la ve el participante: SIN respuestas correctas ni justificaciones. */
export async function obtenerEvaluacion(slug: string): Promise<EvaluacionPublica | null> {
  await demora()
  const ev = buscar(slug)
  if (!ev) return null
  return {
    slug: ev.slug,
    marca: ev.marca,
    titulo: ev.titulo,
    instructor: ev.instructor,
    fecha: ev.fecha,
    lugar: ev.lugar,
    notaMinima: ev.notaMinima,
    modoResultado: ev.modoResultado,
    habilitacion: { ...ev.habilitacion },
    preguntas: ev.preguntas
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map(({ id, orden, tipo, enunciado, opciones }) => ({ id, orden, tipo, enunciado, opciones })),
  }
}

/** Si este dispositivo ya respondió en esta habilitación, devuelve el id del envío. */
export async function buscarEnvioPrevio(habilitacionId: string, dispositivoId: string): Promise<string | null> {
  await demora(150)
  const envio = Object.values(leerEnvios()).find(
    (e) => e.habilitacionId === habilitacionId && e.dispositivoId === dispositivoId,
  )
  return envio?.id ?? null
}

export async function enviarRespuestas(envio: EnvioNuevo): Promise<RespuestaEnvio> {
  await demora(600)
  const ev = buscar(envio.slug)
  if (!ev || ev.habilitacion.id !== envio.habilitacionId) return { ok: false, motivo: 'no_encontrada' }
  if (estaCerrada(ev.habilitacion)) return { ok: false, motivo: 'cerrada' }

  const envios = leerEnvios()
  const previo = Object.values(envios).find(
    (e) => e.habilitacionId === envio.habilitacionId && e.dispositivoId === envio.dispositivoId,
  )
  if (previo) return { ok: false, motivo: 'ya_respondio' }

  const id = generarId()
  envios[id] = { id, ...envio, nombre: envio.nombre.trim(), enviadoEn: Date.now() }
  guardarEnvios(envios)
  return { ok: true, envioId: id }
}

/** Resultado corregido, o «pendiente» si el instructor todavía no liberó las notas. */
export async function obtenerResultado(envioId: string): Promise<ResultadoEnvio | null> {
  await demora(200)
  const envio = leerEnvios()[envioId]
  if (!envio) return null
  const ev = buscar(envio.slug)
  if (!ev) return null

  if (ev.modoResultado === 'liberar' && !notaLiberadaDemo(envio)) {
    return { estado: 'pendiente', nombre: envio.nombre }
  }
  return corregir(ev, envio)
}

// ── Simulación del servidor (en la parte 2 esto vive en Postgres) ────────────

function corregir(ev: EvaluacionDemo, envio: EnvioGuardado): ResultadoEnvio {
  const revision: ItemRevision[] = ev.preguntas
    .filter((p) => p.tipo !== 'escala')
    .sort((a, b) => a.orden - b.orden)
    .map((p) => {
      const dada = envio.respuestas[p.id] ?? ''
      return {
        preguntaId: p.id,
        orden: p.orden,
        tipo: p.tipo as 'multiple' | 'vf',
        enunciado: p.enunciado,
        tuRespuesta: textoRespuesta(p, dada),
        esCorrecta: dada !== '' && dada === p.correcta,
        respuestaCorrecta: textoRespuesta(p, p.correcta ?? ''),
        justificacion: p.justificacion ?? '',
      }
    })
  const correctas = revision.filter((r) => r.esCorrecta).length
  const total = revision.length
  const porcentaje = total > 0 ? Math.round((correctas * 100) / total) : 0
  return {
    estado: 'listo',
    nombre: envio.nombre,
    correctas,
    total,
    porcentaje,
    notaMinima: ev.notaMinima,
    aprobado: ev.notaMinima === null ? null : porcentaje >= ev.notaMinima,
    revision,
  }
}

function textoRespuesta(p: PreguntaDemo, valor: string): string {
  if (!valor) return 'Sin responder'
  if (p.tipo === 'vf') return valor === 'V' ? 'Verdadero' : 'Falso'
  const op = p.opciones.find((o) => o.letra === valor)
  return op ? `${op.letra}) ${op.texto}` : valor
}

function notaLiberadaDemo(envio: EnvioGuardado): boolean {
  return Date.now() - envio.enviadoEn >= SEGUNDOS_HASTA_LIBERAR_DEMO * 1000
}

function buscar(slug: string): EvaluacionDemo | undefined {
  return EVALUACIONES_DEMO.find((e) => e.slug === slug)
}

function leerEnvios(): Record<string, EnvioGuardado> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ENVIOS) ?? '{}')
  } catch {
    return {}
  }
}

function guardarEnvios(envios: Record<string, EnvioGuardado>) {
  try {
    localStorage.setItem(CLAVE_ENVIOS, JSON.stringify(envios))
  } catch {
    // Sin almacenamiento disponible: el envío no persiste (solo pasa en la simulación)
  }
}

function demora(ms = 350) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Solo para pruebas: borra los envíos simulados y el progreso guardado de este navegador. */
export function reiniciarDemo() {
  try {
    for (const clave of Object.keys(localStorage)) {
      if (clave === CLAVE_ENVIOS || clave.startsWith('progreso:')) localStorage.removeItem(clave)
    }
  } catch {
    // nada que borrar
  }
}
