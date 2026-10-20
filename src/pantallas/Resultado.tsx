import { MARCAS } from '../marcas'
import type { EvaluacionPublica, ResultadoEnvio } from '../tipos'
import { IconoCheck, IconoX } from '../componentes/Iconos'

type Listo = Extract<ResultadoEnvio, { estado: 'listo' }>

/** Pantalla 6: nota y revisión de cada pregunta. */
export function Resultado({
  evaluacion,
  resultado,
  recienEnviado,
}: {
  evaluacion: EvaluacionPublica
  resultado: Listo
  recienEnviado: boolean
}) {
  const marca = MARCAS[evaluacion.marca]

  return (
    <main className="mx-auto w-full max-w-[600px] px-4 pb-10 pt-6">
      {recienEnviado && (
        <p className="mb-4 flex items-center justify-center gap-2 text-[15px] font-semibold text-ok" role="status">
          <IconoCheck /> Tus respuestas se enviaron
        </p>
      )}

      <section className="tarjeta-principal px-5 py-7 text-center" aria-labelledby="titulo-resultado">
        <div className="flex items-center justify-center gap-3">
          <img src={marca.icono} alt="" className="h-11 w-11 object-contain" />
          <div className="min-w-0 text-left leading-tight">
            <p className="truncate font-semibold">{evaluacion.titulo}</p>
            <p className="truncate text-sm text-texto-2">{resultado.nombre}</p>
          </div>
        </div>

        <h1 id="titulo-resultado" className="sr-only">
          Tu resultado
        </h1>
        <p className="mt-6 font-titulo text-[64px] font-bold leading-none tabular-nums">{resultado.porcentaje}%</p>
        <p className="mt-2 text-lg text-texto-2">
          <strong className="text-texto">{resultado.correctas}</strong> de {resultado.total} correctas
        </p>

        <div className="mt-5 flex justify-center">
          <Estado resultado={resultado} />
        </div>
      </section>

      <h2 className="mb-3 mt-8 font-titulo text-[22px] font-bold">Revisá tus respuestas</h2>
      <ol className="flex flex-col gap-3">
        {resultado.revision.map((item, i) => (
          <li key={item.preguntaId} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-texto-2">Pregunta {i + 1}</span>
              <MarcaCorreccion correcta={item.esCorrecta} />
            </div>
            <p className="font-semibold leading-snug">{item.enunciado}</p>

            <dl className="mt-3 flex flex-col gap-2 text-[16px]">
              <div
                className={`rounded-xl px-3 py-2 ${item.esCorrecta ? 'bg-ok-fondo text-ok' : 'bg-error-fondo text-error'}`}
              >
                <dt className="text-xs font-bold uppercase tracking-wide opacity-80">Tu respuesta</dt>
                <dd className="font-semibold">{item.tuRespuesta}</dd>
              </div>
              {!item.esCorrecta && (
                <div className="rounded-xl bg-ok-fondo px-3 py-2 text-ok">
                  <dt className="text-xs font-bold uppercase tracking-wide opacity-80">Respuesta correcta</dt>
                  <dd className="font-semibold">{item.respuestaCorrecta}</dd>
                </div>
              )}
              {item.justificacion && (
                <div className="px-1 pt-1">
                  <dt className="text-xs font-bold uppercase tracking-wide text-texto-2">Por qué</dt>
                  <dd className="text-texto">{item.justificacion}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-[15px] text-texto-2">Gracias por participar. Ya podés cerrar esta página.</p>
    </main>
  )
}

function Estado({ resultado }: { resultado: Listo }) {
  if (resultado.aprobado === null) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-tinte-2 px-4 py-2 font-semibold">
        <IconoCheck className="text-acento" /> Participación registrada
      </span>
    )
  }
  return resultado.aprobado ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-ok-fondo px-4 py-2 font-semibold text-ok">
      <IconoCheck /> Aprobado · mínimo {resultado.notaMinima}%
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-error-fondo px-4 py-2 font-semibold text-error">
      <IconoX /> No aprobado · mínimo {resultado.notaMinima}%
    </span>
  )
}

function MarcaCorreccion({ correcta }: { correcta: boolean }) {
  return correcta ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ok-fondo px-2.5 py-1 text-sm font-bold text-ok">
      <IconoCheck /> Correcta
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-error-fondo px-2.5 py-1 text-sm font-bold text-error">
      <IconoX /> Incorrecta
    </span>
  )
}
