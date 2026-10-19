import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { buscarEnvioPrevio, enviarRespuestas, obtenerEvaluacion, obtenerResultado } from '../datos/api'
import { aplicarMarca } from '../marcas'
import { obtenerDispositivoId } from '../lib/dispositivo'
import { estaCerrada } from '../lib/tiempo'
import type { EvaluacionPublica, Respuestas, ResultadoEnvio } from '../tipos'
import { BarraAcciones, Contenedor, Encabezado, Progreso } from '../componentes/Encabezado'
import { Boton } from '../componentes/Boton'
import { IconoFlechaIzq, Spinner } from '../componentes/Iconos'
import { Inicio } from '../pantallas/Inicio'
import { PreguntaMultiple, PreguntaVF } from '../pantallas/Pregunta'
import { Satisfaccion } from '../pantallas/Satisfaccion'
import { Enviado } from '../pantallas/Enviado'
import { Resultado } from '../pantallas/Resultado'
import { Cargando, Cerrada, ErrorConexion, NoEncontrada } from '../pantallas/Aviso'

type Listo = Extract<ResultadoEnvio, { estado: 'listo' }>
type PasoEnCurso = { t: 'pregunta'; i: number } | { t: 'satisfaccion' }
type Paso =
  | { t: 'cargando' }
  | { t: 'error' }
  | { t: 'noEncontrada' }
  | { t: 'cerrada' }
  | { t: 'inicio' }
  | PasoEnCurso
  | { t: 'enviado'; envioId: string; nombre: string }
  | { t: 'resultado'; resultado: Listo; recienEnviado: boolean }

/** Cada cuántos segundos se pregunta si el instructor ya liberó la nota. */
const SEGUNDOS_ENTRE_CONSULTAS = 5

export default function PaginaEvaluacion() {
  const { slug = '' } = useParams()
  const [evaluacion, setEvaluacion] = useState<EvaluacionPublica | null>(null)
  const [paso, setPaso] = useState<Paso>({ t: 'cargando' })
  const [nombre, setNombre] = useState('')
  const [respuestas, setRespuestas] = useState<Respuestas>({})
  const [comentario, setComentario] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [recarga, setRecarga] = useState(0)

  const puntuables = useMemo(() => evaluacion?.preguntas.filter((p) => p.tipo !== 'escala') ?? [], [evaluacion])
  const escalas = useMemo(() => evaluacion?.preguntas.filter((p) => p.tipo === 'escala') ?? [], [evaluacion])

  const mostrarEnvio = useCallback(async (envioId: string, recienEnviado: boolean) => {
    const r = await obtenerResultado(envioId)
    if (!r) setPaso({ t: 'inicio' })
    else if (r.estado === 'listo') setPaso({ t: 'resultado', resultado: r, recienEnviado })
    else setPaso({ t: 'enviado', envioId, nombre: r.nombre })
  }, [])

  // Carga inicial: evaluación, ¿ya respondió este dispositivo?, ¿está cerrada?, ¿hay progreso guardado?
  useEffect(() => {
    let cancelado = false
    setPaso({ t: 'cargando' })
    ;(async () => {
      try {
        const ev = await obtenerEvaluacion(slug)
        if (cancelado) return
        if (!ev) return setPaso({ t: 'noEncontrada' })
        aplicarMarca(ev.marca)
        document.title = `${ev.titulo} · Evaluación`
        setEvaluacion(ev)

        const previo = await buscarEnvioPrevio(ev.habilitacion.id, obtenerDispositivoId())
        if (cancelado) return
        if (previo) return await mostrarEnvio(previo, false)
        if (estaCerrada(ev.habilitacion)) return setPaso({ t: 'cerrada' })

        const prog = leerProgreso(ev.habilitacion.id)
        const cantidad = ev.preguntas.filter((p) => p.tipo !== 'escala').length
        if (prog && (prog.paso.t === 'satisfaccion' || prog.paso.i < cantidad)) {
          setNombre(prog.nombre)
          setRespuestas(prog.respuestas)
          setComentario(prog.comentario)
          setPaso(prog.paso)
        } else {
          setPaso({ t: 'inicio' })
        }
      } catch {
        if (!cancelado) setPaso({ t: 'error' })
      }
    })()
    return () => {
      cancelado = true
    }
  }, [slug, recarga, mostrarEnvio])

  // Guarda el avance en el navegador, por si se recarga la página o se cierra sin querer
  useEffect(() => {
    if (evaluacion && (paso.t === 'pregunta' || paso.t === 'satisfaccion')) {
      guardarProgreso(evaluacion.habilitacion.id, { nombre, respuestas, comentario, paso })
    }
  }, [evaluacion, paso, nombre, respuestas, comentario])

  // En espera de que el instructor libere la nota: consulta cada pocos segundos
  const envioEnEspera = paso.t === 'enviado' ? paso.envioId : null
  useEffect(() => {
    if (!envioEnEspera) return
    const t = setInterval(async () => {
      try {
        const r = await obtenerResultado(envioEnEspera)
        if (r?.estado === 'listo') setPaso({ t: 'resultado', resultado: r, recienEnviado: false })
      } catch {
        // sin conexión: se vuelve a intentar en la próxima vuelta
      }
    }, SEGUNDOS_ENTRE_CONSULTAS * 1000)
    return () => clearInterval(t)
  }, [envioEnEspera])

  // Cada pantalla nueva empieza desde arriba
  const clavePaso = paso.t === 'pregunta' ? `p${paso.i}` : paso.t
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [clavePaso])

  function responder(preguntaId: string, valor: string) {
    setRespuestas((r) => ({ ...r, [preguntaId]: valor }))
  }

  function comenzar(n: string) {
    setNombre(n)
    if (puntuables.length > 0) setPaso({ t: 'pregunta', i: 0 })
    else if (escalas.length > 0) setPaso({ t: 'satisfaccion' })
    else setConfirmando(true)
  }

  function siguiente(i: number) {
    if (i + 1 < puntuables.length) setPaso({ t: 'pregunta', i: i + 1 })
    else if (escalas.length > 0) setPaso({ t: 'satisfaccion' })
    else setConfirmando(true)
  }

  async function enviar() {
    if (!evaluacion) return
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const r = await enviarRespuestas({
        slug,
        habilitacionId: evaluacion.habilitacion.id,
        dispositivoId: obtenerDispositivoId(),
        nombre,
        respuestas,
        comentario: comentario.trim(),
      })
      if (r.ok) {
        borrarProgreso(evaluacion.habilitacion.id)
        setConfirmando(false)
        await mostrarEnvio(r.envioId, true)
      } else if (r.motivo === 'cerrada') {
        setConfirmando(false)
        setPaso({ t: 'cerrada' })
      } else if (r.motivo === 'ya_respondio') {
        borrarProgreso(evaluacion.habilitacion.id)
        setConfirmando(false)
        const previo = await buscarEnvioPrevio(evaluacion.habilitacion.id, obtenerDispositivoId())
        if (previo) await mostrarEnvio(previo, false)
      } else {
        setErrorEnvio('No encontramos esta evaluación. Avisale al instructor.')
      }
    } catch {
      setErrorEnvio('No se pudo enviar. Revisá tu conexión e intentá de nuevo: tus respuestas siguen guardadas.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Pantallas ──────────────────────────────────────────────────────────────

  if (paso.t === 'cargando') return <Cargando />
  if (paso.t === 'error') return <ErrorConexion onReintentar={() => setRecarga((n) => n + 1)} />
  if (paso.t === 'noEncontrada' || !evaluacion) return <NoEncontrada />
  if (paso.t === 'cerrada') return <Cerrada evaluacion={evaluacion} />
  if (paso.t === 'enviado') return <Enviado marca={evaluacion.marca} nombre={paso.nombre} />
  if (paso.t === 'resultado')
    return <Resultado evaluacion={evaluacion} resultado={paso.resultado} recienEnviado={paso.recienEnviado} />

  const modal = confirmando && (
    <ConfirmarEnvio
      sinResponder={puntuables.filter((p) => !respuestas[p.id]).length}
      enviando={enviando}
      error={errorEnvio}
      onConfirmar={enviar}
      onCancelar={() => {
        setConfirmando(false)
        setErrorEnvio(null)
      }}
    />
  )

  if (paso.t === 'inicio') {
    return (
      <>
        <Inicio evaluacion={evaluacion} nombreInicial={nombre} onComenzar={comenzar} />
        {modal}
      </>
    )
  }

  if (paso.t === 'pregunta') {
    const p = puntuables[paso.i]
    const elegido = respuestas[p.id]
    const esUltima = paso.i === puntuables.length - 1 && escalas.length === 0
    return (
      <>
        <Encabezado evaluacion={evaluacion} nombre={nombre} />
        <Contenedor>
          <Progreso actual={paso.i + 1} total={puntuables.length} />
          {p.tipo === 'vf' ? (
            <PreguntaVF pregunta={p} valor={elegido} onElegir={(v) => responder(p.id, v)} />
          ) : (
            <PreguntaMultiple pregunta={p} valor={elegido} onElegir={(v) => responder(p.id, v)} />
          )}
          <BarraAcciones>
            <Boton
              variante="texto"
              aria-label="Anterior"
              onClick={() => (paso.i > 0 ? setPaso({ t: 'pregunta', i: paso.i - 1 }) : setPaso({ t: 'inicio' }))}
            >
              <IconoFlechaIzq /> Anterior
            </Boton>
            <Boton className="flex-1" disabled={!elegido} onClick={() => siguiente(paso.i)}>
              {esUltima ? 'Enviar respuestas' : 'Siguiente'}
            </Boton>
          </BarraAcciones>
        </Contenedor>
        {modal}
      </>
    )
  }

  // Satisfacción (siempre al final)
  const faltan = escalas.filter((p) => !respuestas[p.id]).length
  return (
    <>
      <Encabezado evaluacion={evaluacion} nombre={nombre} />
      <Contenedor>
        <Progreso actual={1} total={1} etiqueta="Última parte · Encuesta de satisfacción" />
        <Satisfaccion
          items={escalas}
          respuestas={respuestas}
          comentario={comentario}
          onElegir={responder}
          onComentario={setComentario}
        />
        <BarraAcciones>
          <Boton
            variante="texto"
            aria-label="Anterior"
            onClick={() =>
              puntuables.length > 0 ? setPaso({ t: 'pregunta', i: puntuables.length - 1 }) : setPaso({ t: 'inicio' })
            }
          >
            <IconoFlechaIzq /> Anterior
          </Boton>
          <Boton className="flex-1" disabled={faltan > 0} onClick={() => setConfirmando(true)}>
            {faltan > 0 ? `Faltan ${faltan} por marcar` : 'Enviar respuestas'}
          </Boton>
        </BarraAcciones>
      </Contenedor>
      {modal}
    </>
  )
}

function ConfirmarEnvio({
  sinResponder,
  enviando,
  error,
  onConfirmar,
  onCancelar,
}: {
  sinResponder: number
  enviando: boolean
  error: string | null
  onConfirmar: () => void
  onCancelar: () => void
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && !enviando && onCancelar()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [enviando, onCancelar])

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/45 sm:items-center"
      onClick={() => !enviando && onCancelar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-confirmar"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[600px] rounded-t-3xl bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6 shadow-xl sm:m-4 sm:rounded-3xl"
      >
        <h2 id="titulo-confirmar" className="font-titulo text-[24px] font-bold leading-tight">
          ¿Enviar tus respuestas?
        </h2>
        <p className="mt-2 text-texto-2">
          Tenés un solo intento: después de enviar <strong className="text-texto">no vas a poder cambiarlas</strong>.
        </p>
        {sinResponder > 0 && (
          <p className="mt-3 rounded-xl bg-error-fondo px-3 py-2 font-semibold text-error">
            Te {sinResponder === 1 ? 'queda 1 pregunta' : `quedan ${sinResponder} preguntas`} sin responder.
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-xl bg-error-fondo px-3 py-2 text-error" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <Boton onClick={onConfirmar} disabled={enviando} autoFocus>
            {enviando ? (
              <>
                <Spinner /> Enviando…
              </>
            ) : (
              'Sí, enviar'
            )}
          </Boton>
          <Boton variante="texto" className="w-full" onClick={onCancelar} disabled={enviando}>
            Revisar de nuevo
          </Boton>
        </div>
      </div>
    </div>
  )
}

// ── Progreso guardado en el navegador ────────────────────────────────────────

interface ProgresoGuardado {
  nombre: string
  respuestas: Respuestas
  comentario: string
  paso: PasoEnCurso
}

function leerProgreso(habilitacionId: string): ProgresoGuardado | null {
  try {
    const crudo = localStorage.getItem(`progreso:${habilitacionId}`)
    return crudo ? (JSON.parse(crudo) as ProgresoGuardado) : null
  } catch {
    return null
  }
}

function guardarProgreso(habilitacionId: string, p: ProgresoGuardado) {
  try {
    localStorage.setItem(`progreso:${habilitacionId}`, JSON.stringify(p))
  } catch {
    // sin almacenamiento: se sigue sin guardar
  }
}

function borrarProgreso(habilitacionId: string) {
  try {
    localStorage.removeItem(`progreso:${habilitacionId}`)
  } catch {
    // nada
  }
}
