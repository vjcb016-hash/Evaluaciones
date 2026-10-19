import { useCallback, useEffect, useState } from 'react'
import {
  borrarEnvio,
  estadoDe,
  listarEnvios,
  type EnvioFila,
  type EvaluacionFila,
  type HabilitacionFila,
  type PreguntaFila,
} from '../../datos/panel'
import { exportarResultados } from '../../lib/excel'
import { claveNombre, nombresRepetidos, resumir } from '../../lib/resultados'
import { formatearHora } from '../../lib/tiempo'
import { Spinner } from '../../componentes/Iconos'
import { Aviso, BotonP, Tarjeta, claseInput } from './ui'

/** Cada cuántos segundos se actualiza la lista mientras la evaluación está abierta. */
const SEGUNDOS_ACTUALIZAR = 10

function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SeccionResultados({
  evaluacion,
  preguntas,
  habilitaciones,
}: {
  evaluacion: EvaluacionFila
  preguntas: PreguntaFila[]
  habilitaciones: HabilitacionFila[]
}) {
  const vigenteId = habilitaciones[0].id
  const [habId, setHabId] = useState(vigenteId)
  const [envios, setEnvios] = useState<EnvioFila[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hab = habilitaciones.find((h) => h.id === habId) ?? habilitaciones[0]
  const abierta = hab.id === vigenteId && estadoDe(habilitaciones).tipo === 'abierta'

  // Si se crea una habilitación nueva, mostrar esa
  useEffect(() => setHabId(vigenteId), [vigenteId])

  const cargar = useCallback(async () => {
    try {
      setEnvios(await listarEnvios(hab.id))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [hab.id])

  useEffect(() => {
    setEnvios(null)
    cargar()
  }, [cargar])

  useEffect(() => {
    if (!abierta) return
    const t = setInterval(cargar, SEGUNDOS_ACTUALIZAR * 1000)
    return () => clearInterval(t)
  }, [abierta, cargar])

  const lista = envios ?? []
  const res = resumir(lista, preguntas, evaluacion.nota_minima)
  const repetidos = nombresRepetidos(lista)

  async function quitar(e: EnvioFila) {
    if (!confirm(`¿Borrar la respuesta de «${e.nombre}»? No se puede deshacer.`)) return
    try {
      await borrarEnvio(e.id)
      await cargar()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <Tarjeta
      titulo="Resultados"
      descripcion={abierta ? `Se actualiza solo cada ${SEGUNDOS_ACTUALIZAR} segundos mientras está abierta.` : undefined}
      accion={
        <div className="flex flex-wrap gap-2">
          <BotonP variante="secundario" onClick={cargar}>
            Actualizar
          </BotonP>
          <BotonP
            disabled={!envios?.length}
            onClick={() => exportarResultados(evaluacion, hab, preguntas, lista)}
          >
            Descargar Excel
          </BotonP>
        </div>
      }
    >
      {habilitaciones.length > 1 && (
        <label className="mb-4 flex flex-col gap-1.5">
          <span className="font-semibold">Habilitación</span>
          <select value={hab.id} onChange={(e) => setHabId(e.target.value)} className={`${claseInput} sm:w-80`}>
            {habilitaciones.map((h, i) => (
              <option key={h.id} value={h.id}>
                {fechaCorta(h.abierta_en)} {formatearHora(h.abierta_en)}
                {i === 0 ? ' (la más reciente)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && <Aviso tipo="error">{error}</Aviso>}
      {!envios && !error && (
        <div className="grid place-items-center py-8 text-2xl text-acento">
          <Spinner />
        </div>
      )}

      {envios && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-3 gap-2">
            <Dato titulo="Respondieron" valor={String(res.participantes)} />
            <Dato titulo="Promedio" valor={res.promedio === null ? '—' : `${res.promedio}%`} />
            <Dato
              titulo="Aprobados"
              valor={res.aprobados === null ? 'Sin mínimo' : `${res.aprobados} de ${res.participantes}`}
            />
          </dl>

          {repetidos.size > 0 && (
            <Aviso tipo="info">
              <strong>Nombres repetidos:</strong>{' '}
              {lista
                .filter((e, i, todos) => repetidos.has(claveNombre(e.nombre)) && todos.findIndex((x) => claveNombre(x.nombre) === claveNombre(e.nombre)) === i)
                .map((e) => e.nombre)
                .join(', ')}
              . Puede ser la misma persona desde dos celulares.
            </Aviso>
          )}

          {envios.length === 0 ? (
            <p className="rounded-xl bg-black/[0.03] p-4 text-center text-texto-2">Todavía nadie respondió.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-[15px]">
                <thead className="border-b border-black/10 text-sm text-texto-2">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Nombre</th>
                    <th className="py-2 pr-3 font-semibold">Hora</th>
                    <th className="py-2 pr-3 font-semibold">Nota</th>
                    <th className="py-2 pr-3 font-semibold">Estado</th>
                    <th className="py-2" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {envios.map((e) => (
                    <tr key={e.id} className="border-b border-black/5 last:border-0">
                      <td className="py-2 pr-3 font-semibold">
                        {e.nombre}
                        {repetidos.has(claveNombre(e.nombre)) && (
                          <span className="ml-2 rounded-full bg-tinte-2 px-2 py-0.5 text-xs font-bold text-acento">
                            Repetido
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 tabular-nums text-texto-2">{formatearHora(e.enviado_en)}</td>
                      <td className="py-2 pr-3 tabular-nums">
                        {e.correctas}/{e.total} · <strong>{e.porcentaje}%</strong>
                      </td>
                      <td className="py-2 pr-3">
                        <EstadoNota porcentaje={e.porcentaje} minima={evaluacion.nota_minima} />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => quitar(e)}
                          className="rounded-lg px-2 py-1 text-sm text-texto-2 hover:bg-error-fondo hover:text-error"
                          aria-label={`Borrar respuesta de ${e.nombre}`}
                        >
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {envios.length > 0 && (
            <details className="rounded-xl border border-black/10 p-4">
              <summary className="cursor-pointer font-semibold">Detalle por pregunta, satisfacción y comentarios</summary>
              <div className="mt-4 flex flex-col gap-5">
                <div>
                  <h3 className="mb-2 font-semibold">Aciertos por pregunta</h3>
                  <ol className="flex flex-col gap-2">
                    {res.porPregunta.map(({ pregunta, aciertos, porcentaje }, i) => (
                      <li key={pregunta.id}>
                        <div className="flex justify-between gap-3 text-[15px]">
                          <span>
                            {i + 1}. {pregunta.enunciado}
                          </span>
                          <span className="shrink-0 tabular-nums text-texto-2">
                            {aciertos}/{res.participantes} · {porcentaje}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/10">
                          <div className="h-full rounded-full bg-acento" style={{ width: `${porcentaje ?? 0}%` }} />
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                {res.satisfaccion.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">Satisfacción (promedio de 1 a 5)</h3>
                    <ul className="flex flex-col gap-1 text-[15px]">
                      {res.satisfaccion.map((s) => (
                        <li key={s.pregunta.id} className="flex justify-between gap-3">
                          <span>{s.pregunta.enunciado}</span>
                          <strong className="shrink-0 tabular-nums">{s.promedio ?? '—'}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3 className="mb-2 font-semibold">Comentarios</h3>
                  {res.comentarios.length === 0 ? (
                    <p className="text-[15px] text-texto-2">Nadie dejó comentarios.</p>
                  ) : (
                    <ul className="flex flex-col gap-2 text-[15px]">
                      {res.comentarios.map((c, i) => (
                        <li key={i} className="rounded-lg bg-black/[0.03] px-3 py-2">
                          «{c.texto}» <span className="text-texto-2">— {c.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>
      )}
    </Tarjeta>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-black/[0.03] px-3 py-2.5">
      <dt className="text-sm text-texto-2">{titulo}</dt>
      <dd className="text-[20px] font-bold tabular-nums">{valor}</dd>
    </div>
  )
}

function EstadoNota({ porcentaje, minima }: { porcentaje: number; minima: number | null }) {
  if (minima === null) return <span className="text-texto-2">Participó</span>
  return porcentaje >= minima ? (
    <span className="rounded-full bg-ok-fondo px-2 py-0.5 text-sm font-bold text-ok">Aprobado</span>
  ) : (
    <span className="rounded-full bg-error-fondo px-2 py-0.5 text-sm font-bold text-error">No aprobado</span>
  )
}
