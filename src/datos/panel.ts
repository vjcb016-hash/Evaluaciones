// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO DE DATOS DEL INSTRUCTOR
// Todo lo que el panel lee o cambia en Supabase pasa por acá.
// Solo funciona con una sesión de instructor: las reglas de seguridad (RLS) de
// la base de datos rechazan cualquier otra cosa.
// ─────────────────────────────────────────────────────────────────────────────

import type { Session } from '@supabase/supabase-js'
import type { Marca, TipoPregunta } from '../tipos'
import { supabase } from './supabase'

export interface DatosEvaluacion {
  slug: string
  marca: Marca
  titulo: string
  instructor: string
  fecha: string | null
  lugar: string | null
  nota_minima: number | null
  modo_resultado: 'inmediato' | 'liberar'
}

export interface EvaluacionFila extends DatosEvaluacion {
  id: string
  creada_en: string
}

export interface HabilitacionFila {
  id: string
  evaluacion_id: string
  abierta_en: string
  cierra_en: string
  cerrada_por_instructor: boolean
  notas_liberadas: boolean
}

/** Mismas columnas que la planilla de importación. */
export interface PreguntaNueva {
  orden: number
  tipo: TipoPregunta
  enunciado: string
  opcion_a: string | null
  opcion_b: string | null
  opcion_c: string | null
  opcion_d: string | null
  respuesta_correcta: string | null
  justificacion: string | null
}

export interface PreguntaFila extends PreguntaNueva {
  id: string
  evaluacion_id: string
}

export interface RespuestaFila {
  pregunta_id: string
  valor: string
  es_correcta: boolean | null
}

export interface EnvioFila {
  id: string
  habilitacion_id: string
  nombre: string
  comentario: string
  correctas: number
  total: number
  porcentaje: number
  enviado_en: string
  respuestas: RespuestaFila[]
}

export interface EvaluacionResumen extends EvaluacionFila {
  habilitaciones: HabilitacionFila[]
  cantidadPreguntas: number
}

export interface DetalleEvaluacion {
  evaluacion: EvaluacionFila
  preguntas: PreguntaFila[]
  /** Más reciente primero. */
  habilitaciones: HabilitacionFila[]
  tieneRespuestas: boolean
}

// ── Errores en lenguaje simple ───────────────────────────────────────────────

interface ErrorBD {
  message: string
  code?: string
}

function traducir(error: ErrorBD): Error {
  if (error.code === '23505') return new Error('Ese link ya está en uso. Elegí otro.')
  if (error.code === '42501') return new Error('No tenés permiso para hacer esto.')
  if (error.code === '23514') return new Error('Algún dato no es válido. Revisá el formulario.')
  if (error.code === 'P0001') return new Error(error.message)
  if (/fetch|network/i.test(error.message)) return new Error('No hay conexión. Revisá internet e intentá de nuevo.')
  return new Error(error.message)
}

function revisar<T>(r: { data: T; error: ErrorBD | null }): T {
  if (r.error) throw traducir(r.error)
  return r.data
}

// ── Sesión ───────────────────────────────────────────────────────────────────

export async function ingresar(email: string, contrasena: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: contrasena })
  if (error) {
    if (/invalid login credentials/i.test(error.message)) throw new Error('Correo o contraseña incorrectos.')
    if (/email not confirmed/i.test(error.message)) throw new Error('Ese correo todavía no fue confirmado.')
    throw traducir(error)
  }
}

export async function salir() {
  await supabase.auth.signOut()
}

/** Avisa cada vez que cambia la sesión (también una vez al empezar). Devuelve la función para dejar de escuchar. */
export function escucharSesion(alCambiar: (sesion: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
    // Recomendación de Supabase: no llamar a la base dentro del callback
    setTimeout(() => alCambiar(sesion), 0)
  })
  return () => data.subscription.unsubscribe()
}

export async function soyInstructor(): Promise<boolean> {
  return Boolean(revisar(await supabase.rpc('es_instructor')))
}

// ── Evaluaciones ─────────────────────────────────────────────────────────────

export async function listarEvaluaciones(): Promise<EvaluacionResumen[]> {
  const filas = revisar(
    await supabase
      .from('evaluaciones')
      .select('*, habilitaciones(*), preguntas(tipo)')
      .order('creada_en', { ascending: false }),
  ) as (EvaluacionFila & { habilitaciones: HabilitacionFila[]; preguntas: { tipo: TipoPregunta }[] })[]

  return filas.map(({ preguntas, habilitaciones, ...e }) => ({
    ...e,
    habilitaciones: habilitaciones.slice().sort((a, b) => b.abierta_en.localeCompare(a.abierta_en)),
    cantidadPreguntas: preguntas.filter((p) => p.tipo !== 'escala').length,
  }))
}

export async function obtenerDetalle(id: string): Promise<DetalleEvaluacion | null> {
  const [ev, preguntas, habilitaciones] = await Promise.all([
    supabase.from('evaluaciones').select('*').eq('id', id).maybeSingle(),
    supabase.from('preguntas').select('*').eq('evaluacion_id', id).order('orden'),
    supabase.from('habilitaciones').select('*').eq('evaluacion_id', id).order('abierta_en', { ascending: false }),
  ])
  const evaluacion = revisar(ev) as EvaluacionFila | null
  if (!evaluacion) return null
  const habs = revisar(habilitaciones) as HabilitacionFila[]

  let tieneRespuestas = false
  if (habs.length > 0) {
    const { count, error } = await supabase
      .from('envios')
      .select('id', { count: 'exact', head: true })
      .in(
        'habilitacion_id',
        habs.map((h) => h.id),
      )
    if (error) throw traducir(error)
    tieneRespuestas = (count ?? 0) > 0
  }

  return {
    evaluacion,
    preguntas: revisar(preguntas) as PreguntaFila[],
    habilitaciones: habs,
    tieneRespuestas,
  }
}

export async function crearEvaluacion(datos: DatosEvaluacion): Promise<string> {
  const fila = revisar(await supabase.from('evaluaciones').insert(datos).select('id').single()) as { id: string }
  return fila.id
}

export async function actualizarEvaluacion(id: string, datos: DatosEvaluacion) {
  revisar(await supabase.from('evaluaciones').update(datos).eq('id', id))
}

export async function borrarEvaluacion(id: string) {
  revisar(await supabase.from('evaluaciones').delete().eq('id', id))
}

export async function duplicarEvaluacion(id: string, slug: string, titulo: string): Promise<string> {
  return revisar(
    await supabase.rpc('duplicar_evaluacion', { p_evaluacion_id: id, p_slug: slug, p_titulo: titulo }),
  ) as string
}

export async function reemplazarPreguntas(evaluacionId: string, preguntas: PreguntaNueva[]): Promise<number> {
  return revisar(
    await supabase.rpc('reemplazar_preguntas', { p_evaluacion_id: evaluacionId, p_preguntas: preguntas }),
  ) as number
}

// ── Habilitaciones ───────────────────────────────────────────────────────────

export async function habilitar(evaluacionId: string, horas: number) {
  revisar(await supabase.rpc('habilitar_evaluacion', { p_evaluacion_id: evaluacionId, p_horas: horas }))
}

export async function cerrarHabilitacion(habilitacionId: string) {
  revisar(await supabase.from('habilitaciones').update({ cerrada_por_instructor: true }).eq('id', habilitacionId))
}

export async function cambiarNotasLiberadas(habilitacionId: string, liberadas: boolean) {
  revisar(await supabase.from('habilitaciones').update({ notas_liberadas: liberadas }).eq('id', habilitacionId))
}

// ── Resultados ───────────────────────────────────────────────────────────────

export async function listarEnvios(habilitacionId: string): Promise<EnvioFila[]> {
  return revisar(
    await supabase
      .from('envios')
      .select('id, habilitacion_id, nombre, comentario, correctas, total, porcentaje, enviado_en, respuestas(pregunta_id, valor, es_correcta)')
      .eq('habilitacion_id', habilitacionId)
      .order('enviado_en'),
  ) as EnvioFila[]
}

export async function borrarEnvio(envioId: string) {
  revisar(await supabase.from('envios').delete().eq('id', envioId))
}

// ── Utilidades ───────────────────────────────────────────────────────────────

export type EstadoHabilitacion =
  | { tipo: 'nunca' }
  | { tipo: 'abierta'; habilitacion: HabilitacionFila }
  | { tipo: 'cerrada'; habilitacion: HabilitacionFila }

export function estadoDe(habilitaciones: HabilitacionFila[], ahora = Date.now()): EstadoHabilitacion {
  const h = habilitaciones[0]
  if (!h) return { tipo: 'nunca' }
  const abierta = !h.cerrada_por_instructor && ahora < Date.parse(h.cierra_en)
  return abierta ? { tipo: 'abierta', habilitacion: h } : { tipo: 'cerrada', habilitacion: h }
}

/** "Uso de extintores" → "uso-de-extintores" */
export function crearSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

export function linkParticipante(slug: string): string {
  return `${window.location.origin}/e/${slug}`
}
