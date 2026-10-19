import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MARCAS } from '../../marcas'
import {
  actualizarEvaluacion,
  borrarEvaluacion,
  duplicarEvaluacion,
  estadoDe,
  obtenerDetalle,
  reemplazarPreguntas,
  type DatosEvaluacion,
  type DetalleEvaluacion,
  type EvaluacionFila,
  type PreguntaNueva,
} from '../../datos/panel'
import { descargarPlantilla, leerPreguntasDeExcel, type ResultadoImportacion } from '../../lib/excel'
import { textoCorrecta } from '../../lib/resultados'
import { formatearFecha } from '../../lib/tiempo'
import { IconoCheck, Spinner } from '../../componentes/Iconos'
import { FormularioDatos } from './FormEvaluacion'
import { SeccionHabilitacion } from './SeccionHabilitacion'
import { SeccionResultados } from './SeccionResultados'
import { Aviso, BotonP, ChipEstado, Tarjeta } from './ui'

export default function PaginaDetalle() {
  const { id = '' } = useParams()
  const [detalle, setDetalle] = useState<DetalleEvaluacion | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const recargar = useCallback(async () => {
    try {
      setDetalle(await obtenerDetalle(id))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [id])

  useEffect(() => {
    setDetalle(undefined)
    recargar()
  }, [recargar])

  const volver = (
    <Link to="/panel" className="text-[15px] font-semibold text-texto-2 hover:text-texto">
      ← Evaluaciones
    </Link>
  )

  if (error && !detalle) {
    return (
      <>
        {volver}
        <div className="mt-4">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      </>
    )
  }
  if (detalle === undefined) {
    return (
      <div className="grid place-items-center py-16 text-3xl text-acento">
        <Spinner />
      </div>
    )
  }
  if (detalle === null) {
    return (
      <>
        {volver}
        <p className="mt-4">No se encontró esta evaluación.</p>
      </>
    )
  }

  const { evaluacion: ev, preguntas, habilitaciones, tieneRespuestas } = detalle
  const sinPreguntas = !preguntas.some((p) => p.tipo !== 'escala')

  return (
    <>
      {volver}
      <div className="mb-6 mt-3 flex items-start gap-4">
        <img src={MARCAS[ev.marca].logo} alt={MARCAS[ev.marca].nombre} className="h-14 w-14 shrink-0 object-contain" />
        <div className="min-w-0">
          <h1 className="font-titulo text-[28px] font-bold leading-tight">{ev.titulo}</h1>
          <p className="mt-1 text-[15px] text-texto-2">
            /e/{ev.slug}
            {ev.fecha && ` · ${formatearFecha(ev.fecha)}`}
            {ev.lugar && ` · ${ev.lugar}`}
          </p>
          <div className="mt-2">
            <ChipEstado estado={estadoDe(habilitaciones)} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Aviso tipo="error">{error}</Aviso>
        </div>
      )}

      {/* Sin preguntas, «Preguntas» va primero (con order); siempre es el mismo elemento, así no pierde su estado */}
      <div className="flex flex-col gap-5">
        <div className={sinPreguntas ? 'order-first' : 'order-3'}>
          <SeccionPreguntas
            evaluacion={ev}
            preguntas={preguntas}
            tieneRespuestas={tieneRespuestas}
            onCambio={recargar}
          />
        </div>
        <div className="order-1">
          <SeccionHabilitacion
            evaluacion={ev}
            habilitaciones={habilitaciones}
            sinPreguntas={sinPreguntas}
            onCambio={recargar}
          />
        </div>
        {habilitaciones.length > 0 && (
          <div className="order-2">
            <SeccionResultados evaluacion={ev} preguntas={preguntas} habilitaciones={habilitaciones} />
          </div>
        )}
        <div className="order-4">
          <SeccionDatos evaluacion={ev} onCambio={recargar} />
        </div>
      </div>
    </>
  )
}

// ── Preguntas ────────────────────────────────────────────────────────────────

function SeccionPreguntas({
  evaluacion,
  preguntas,
  tieneRespuestas,
  onCambio,
}: {
  evaluacion: EvaluacionFila
  preguntas: PreguntaNueva[]
  tieneRespuestas: boolean
  onCambio: () => Promise<void>
}) {
  const [importacion, setImportacion] = useState<(ResultadoImportacion & { archivo: string }) | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const cantidad = preguntas.filter((p) => p.tipo !== 'escala').length

  async function elegir(archivo: File | undefined) {
    if (!archivo) return
    setOk(null)
    setError(null)
    setImportacion({ ...(await leerPreguntasDeExcel(archivo)), archivo: archivo.name })
    if (entrada.current) entrada.current.value = ''
  }

  async function guardar() {
    if (!importacion) return
    setGuardando(true)
    setError(null)
    try {
      const n = await reemplazarPreguntas(evaluacion.id, importacion.preguntas)
      setImportacion(null)
      setOk(`Listo: se guardaron ${n} preguntas. Revisalas abajo antes de habilitar.`)
      await onCambio()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Tarjeta
      titulo={`Preguntas${cantidad ? ` (${cantidad})` : ''}`}
      descripcion="Se cargan desde una planilla Excel. Revisalas siempre antes de habilitar."
      accion={
        <div className="flex flex-wrap gap-2">
          <BotonP variante="secundario" onClick={descargarPlantilla}>
            Descargar plantilla
          </BotonP>
          <BotonP disabled={tieneRespuestas || guardando} onClick={() => entrada.current?.click()}>
            Importar Excel
          </BotonP>
          <input
            ref={entrada}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => elegir(e.target.files?.[0])}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {tieneRespuestas && (
          <Aviso tipo="info">
            Esta evaluación ya tiene respuestas, así que sus preguntas no se pueden reemplazar. Para cambiarlas, usá
            «Duplicar» en «Datos de la evaluación» y cargá las preguntas en la copia.
          </Aviso>
        )}
        {ok && <Aviso tipo="ok">{ok}</Aviso>}
        {error && <Aviso tipo="error">{error}</Aviso>}

        {importacion ? (
          <div className="flex flex-col gap-3 rounded-xl border-2 border-acento/30 p-4">
            <p className="font-semibold">Vista previa de «{importacion.archivo}»</p>
            {importacion.errores.length > 0 && (
              <Aviso tipo="error">
                <p className="font-semibold">Hay que corregir la planilla antes de guardar:</p>
                <ul className="mt-1 list-disc pl-5">
                  {importacion.errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </Aviso>
            )}
            {importacion.avisos.length > 0 && (
              <Aviso tipo="info">
                <ul className="list-disc pl-5">
                  {importacion.avisos.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </Aviso>
            )}
            {importacion.errores.length === 0 && <ListaPreguntas preguntas={importacion.preguntas} />}
            <div className="flex flex-wrap gap-2">
              {importacion.errores.length === 0 && (
                <BotonP onClick={guardar} disabled={guardando}>
                  {guardando ? 'Guardando…' : `Guardar estas ${importacion.preguntas.length} preguntas`}
                </BotonP>
              )}
              <BotonP variante="secundario" onClick={() => setImportacion(null)} disabled={guardando}>
                Cancelar
              </BotonP>
            </div>
            {importacion.errores.length === 0 && preguntas.length > 0 && (
              <p className="text-sm text-texto-2">Esto reemplaza las {preguntas.length} preguntas actuales.</p>
            )}
          </div>
        ) : preguntas.length === 0 ? (
          <p className="rounded-xl bg-black/[0.03] p-4 text-[15px] text-texto-2">
            Todavía no hay preguntas. Descargá la plantilla, completala (o pedile a Claude que la genere a partir del
            material de la capacitación) y tocá «Importar Excel».
          </p>
        ) : (
          <ListaPreguntas preguntas={preguntas} />
        )}
      </div>
    </Tarjeta>
  )
}

/** Muestra las preguntas como para revisar: con la respuesta correcta marcada. */
function ListaPreguntas({ preguntas }: { preguntas: PreguntaNueva[] }) {
  const puntuables = preguntas.filter((p) => p.tipo !== 'escala')
  const escalas = preguntas.filter((p) => p.tipo === 'escala')
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {puntuables.map((p, i) => (
          <li key={`${p.orden}-${i}`} className="rounded-xl border border-black/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-texto-2">
              <span>Pregunta {i + 1}</span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                {p.tipo === 'vf' ? 'Verdadero / Falso' : 'Opción múltiple'}
              </span>
            </div>
            <p className="font-semibold leading-snug">{p.enunciado}</p>
            {p.tipo === 'multiple' ? (
              <ul className="mt-2 flex flex-col gap-1 text-[15px]">
                {(['A', 'B', 'C', 'D'] as const).map((letra) => {
                  const texto = p[`opcion_${letra.toLowerCase() as 'a' | 'b' | 'c' | 'd'}`]
                  if (!texto) return null
                  const correcta = p.respuesta_correcta === letra
                  return (
                    <li
                      key={letra}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1 ${correcta ? 'bg-ok-fondo font-semibold text-ok' : ''}`}
                    >
                      <span className="w-5 shrink-0 font-bold">{letra})</span>
                      <span className="flex-1">{texto}</span>
                      {correcta && <IconoCheck aria-label="Correcta" />}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ok-fondo px-2 py-1 text-[15px] font-semibold text-ok">
                <IconoCheck /> Correcta: {textoCorrecta(p)}
              </p>
            )}
            <p className={`mt-2 text-[15px] ${p.justificacion ? 'text-texto' : 'text-error'}`}>
              <span className="font-semibold">Por qué: </span>
              {p.justificacion || 'Sin justificación'}
            </p>
          </li>
        ))}
      </ol>
      {escalas.length > 0 && (
        <div className="rounded-xl border border-black/10 p-4">
          <p className="mb-2 text-sm font-semibold text-texto-2">Encuesta de satisfacción (al final, de 1 a 5, sin puntaje)</p>
          <ul className="list-disc pl-5 text-[15px]">
            {escalas.map((p, i) => (
              <li key={`${p.orden}-${i}`}>{p.enunciado}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Datos de la evaluación ───────────────────────────────────────────────────

function SeccionDatos({ evaluacion: ev, onCambio }: { evaluacion: EvaluacionFila; onCambio: () => Promise<void> }) {
  const navegar = useNavigate()
  const [editando, setEditando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const datos: DatosEvaluacion = {
    slug: ev.slug,
    marca: ev.marca,
    titulo: ev.titulo,
    instructor: ev.instructor,
    fecha: ev.fecha,
    lugar: ev.lugar,
    nota_minima: ev.nota_minima,
    modo_resultado: ev.modo_resultado,
  }

  async function duplicar() {
    setOcupado(true)
    setError(null)
    try {
      let nuevoId: string | null = null
      for (let n = 2; n <= 20 && !nuevoId; n++) {
        try {
          nuevoId = await duplicarEvaluacion(ev.id, `${ev.slug}-${n}`, `${ev.titulo} (copia)`)
        } catch (e) {
          if (!/ya está en uso/.test((e as Error).message)) throw e
        }
      }
      if (!nuevoId) throw new Error('No se pudo encontrar un link libre para la copia.')
      navegar(`/panel/e/${nuevoId}`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOcupado(false)
    }
  }

  async function eliminar() {
    if (
      !confirm(
        `¿Eliminar «${ev.titulo}»?\n\nSe borran también sus preguntas y TODOS sus resultados. No se puede deshacer.`,
      )
    )
      return
    setOcupado(true)
    try {
      await borrarEvaluacion(ev.id)
      navegar('/panel')
    } catch (e) {
      setError((e as Error).message)
      setOcupado(false)
    }
  }

  return (
    <Tarjeta titulo="Datos de la evaluación">
      {editando ? (
        <div className="flex flex-col gap-4">
          <Aviso tipo="info">Si cambiás el link, los QR que ya imprimiste o compartiste dejan de funcionar.</Aviso>
          <FormularioDatos
            inicial={datos}
            textoBoton="Guardar cambios"
            onCancelar={() => setEditando(false)}
            onGuardar={async (d) => {
              await actualizarEvaluacion(ev.id, d)
              setEditando(false)
              await onCambio()
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
            <Fila titulo="Marca" valor={MARCAS[ev.marca].nombre} />
            <Fila titulo="Instructor" valor={ev.instructor} />
            <Fila titulo="Fecha" valor={ev.fecha ? formatearFecha(ev.fecha) : '—'} />
            <Fila titulo="Lugar o empresa" valor={ev.lugar ?? '—'} />
            <Fila titulo="Nota mínima" valor={ev.nota_minima === null ? 'Sin nota mínima' : `${ev.nota_minima}%`} />
            <Fila titulo="Resultado" valor={ev.modo_resultado === 'inmediato' ? 'Nota inmediata' : 'La libera el instructor'} />
          </dl>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <div className="flex flex-wrap gap-2">
            <BotonP variante="secundario" onClick={() => setEditando(true)} disabled={ocupado}>
              Editar datos
            </BotonP>
            <BotonP variante="secundario" onClick={duplicar} disabled={ocupado}>
              Duplicar
            </BotonP>
            <BotonP variante="peligro" onClick={eliminar} disabled={ocupado}>
              Eliminar
            </BotonP>
          </div>
        </div>
      )}
    </Tarjeta>
  )
}

function Fila({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-black/5 py-1.5 sm:block sm:border-0 sm:py-0">
      <dt className="text-texto-2">{titulo}</dt>
      <dd className="font-semibold">{valor}</dd>
    </div>
  )
}
