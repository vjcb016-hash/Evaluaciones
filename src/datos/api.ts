// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO DE DATOS
// Es el ÚNICO lugar de la app que sabe de dónde salen y adónde van los datos.
// Las pantallas solo usan estas 4 funciones:
//   obtenerEvaluacion · buscarEnvioPrevio · enviarRespuestas · obtenerResultado
//
// Cada una llama a una función de Postgres en Supabase (ver
// supabase/migraciones/001_esquema.sql). El celular nunca lee las tablas
// directamente ni recibe la respuesta correcta antes de enviar.
// ─────────────────────────────────────────────────────────────────────────────

import type { EnvioNuevo, EvaluacionPublica, RespuestaEnvio, ResultadoEnvio } from '../tipos'
import { supabase } from './supabase'

/** Evaluación tal como la ve el participante: SIN respuestas correctas ni justificaciones. */
export async function obtenerEvaluacion(slug: string): Promise<EvaluacionPublica | null> {
  const { data, error } = await supabase.rpc('obtener_evaluacion', { p_slug: slug })
  if (error) throw error
  return (data as EvaluacionPublica | null) ?? null
}

/** Si este dispositivo ya respondió en esta habilitación, devuelve el id del envío. */
export async function buscarEnvioPrevio(habilitacionId: string, dispositivoId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('buscar_envio_previo', {
    p_habilitacion_id: habilitacionId,
    p_dispositivo_id: dispositivoId,
  })
  if (error) throw error
  return (data as string | null) ?? null
}

export async function enviarRespuestas(envio: EnvioNuevo): Promise<RespuestaEnvio> {
  const { data, error } = await supabase.rpc('enviar_respuestas', {
    p_slug: envio.slug,
    p_habilitacion_id: envio.habilitacionId,
    p_dispositivo_id: envio.dispositivoId,
    p_nombre: envio.nombre,
    p_respuestas: envio.respuestas,
    p_comentario: envio.comentario,
  })
  if (error) throw error
  return data as RespuestaEnvio
}

/** Resultado corregido, o «pendiente» si el instructor todavía no liberó las notas. */
export async function obtenerResultado(envioId: string): Promise<ResultadoEnvio | null> {
  const { data, error } = await supabase.rpc('obtener_resultado', { p_envio_id: envioId })
  if (error) throw error
  return (data as ResultadoEnvio | null) ?? null
}
