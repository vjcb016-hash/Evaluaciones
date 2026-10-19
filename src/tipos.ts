// Tipos compartidos por toda la app.
// "Pública" = lo que el celular del participante puede ver (sin respuestas correctas).

export type Marca = 'vc' | 'cbvl'
export type TipoPregunta = 'multiple' | 'vf' | 'escala'
export type Letra = 'A' | 'B' | 'C' | 'D'

export interface Opcion {
  letra: Letra
  texto: string
}

export interface PreguntaPublica {
  id: string
  orden: number
  tipo: TipoPregunta
  enunciado: string
  /** Solo para tipo "multiple"; vacío en "vf" y "escala". */
  opciones: Opcion[]
}

export interface Habilitacion {
  id: string
  /** Fecha y hora de cierre automático (ISO). */
  cierraEn: string
  cerradaPorInstructor: boolean
}

export interface EvaluacionPublica {
  slug: string
  marca: Marca
  titulo: string
  instructor: string
  /** Formato AAAA-MM-DD, opcional. */
  fecha: string | null
  lugar: string | null
  /** Porcentaje mínimo para aprobar, o null si no hay nota mínima. */
  notaMinima: number | null
  modoResultado: 'inmediato' | 'liberar'
  habilitacion: Habilitacion
  preguntas: PreguntaPublica[]
}

/** preguntaId → respuesta ("A".."D", "V"/"F", o "1".."5" en satisfacción). */
export type Respuestas = Record<string, string>

export interface EnvioNuevo {
  slug: string
  habilitacionId: string
  dispositivoId: string
  nombre: string
  respuestas: Respuestas
  comentario: string
}

export type RespuestaEnvio =
  | { ok: true; envioId: string }
  | { ok: false; motivo: 'cerrada' | 'ya_respondio' | 'no_encontrada' }

export interface ItemRevision {
  preguntaId: string
  orden: number
  tipo: 'multiple' | 'vf'
  enunciado: string
  tuRespuesta: string
  esCorrecta: boolean
  respuestaCorrecta: string
  justificacion: string
}

export type ResultadoEnvio =
  | { estado: 'pendiente'; nombre: string }
  | {
      estado: 'listo'
      nombre: string
      correctas: number
      total: number
      porcentaje: number
      notaMinima: number | null
      /** null cuando no hay nota mínima. */
      aprobado: boolean | null
      revision: ItemRevision[]
    }
