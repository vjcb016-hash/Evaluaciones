import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MARCAS } from '../../marcas'
import { estadoDe, listarEvaluaciones, type EvaluacionResumen } from '../../datos/panel'
import { simularOtroDispositivo } from '../../lib/dispositivo'
import { formatearFecha } from '../../lib/tiempo'
import { Spinner } from '../../componentes/Iconos'
import { Aviso, ChipEstado } from './ui'

export default function ListaEvaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionResumen[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [simulado, setSimulado] = useState(false)

  useEffect(() => {
    listarEvaluaciones()
      .then(setEvaluaciones)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-titulo text-[28px] font-bold">Evaluaciones</h1>
        <Link
          to="/panel/nueva"
          className="inline-flex h-11 items-center rounded-xl bg-acento px-4 text-[15px] font-semibold text-white shadow-sm hover:bg-acento-hover"
        >
          + Nueva evaluación
        </Link>
      </div>

      {error && <Aviso tipo="error">{error}</Aviso>}
      {!evaluaciones && !error && (
        <div className="grid place-items-center py-16 text-3xl text-acento">
          <Spinner />
        </div>
      )}
      {evaluaciones?.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-black/15 p-8 text-center text-texto-2">
          Todavía no hay evaluaciones. Creá la primera con «Nueva evaluación».
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {evaluaciones?.map((ev) => (
          <li key={ev.id}>
            <Link
              to={`/panel/e/${ev.id}`}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <img src={MARCAS[ev.marca].logo} alt={MARCAS[ev.marca].nombre} className="h-12 w-12 shrink-0 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{ev.titulo}</p>
                <p className="truncate text-sm text-texto-2">
                  /e/{ev.slug} · {ev.cantidadPreguntas} {ev.cantidadPreguntas === 1 ? 'pregunta' : 'preguntas'}
                  {ev.fecha && ` · ${formatearFecha(ev.fecha)}`}
                  {ev.lugar && ` · ${ev.lugar}`}
                </p>
                <div className="mt-1.5">
                  <ChipEstado estado={estadoDe(ev.habilitaciones)} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-2xl border border-black/10 p-4 text-[15px] text-texto-2">
        <p className="font-semibold text-texto">Para probar como participante</p>
        <p className="mt-1">
          Cada navegador puede responder una vez por habilitación. Este botón hace que este navegador cuente como un
          celular nuevo.
        </p>
        <button
          type="button"
          onClick={() => {
            simularOtroDispositivo()
            setSimulado(true)
          }}
          className="mt-2 font-semibold text-acento underline underline-offset-2"
        >
          Simular otro celular
        </button>
        {simulado && <span className="ml-2 font-semibold text-ok">Listo.</span>}
      </div>
    </>
  )
}
