import type { ReactNode } from 'react'
import { MARCAS } from '../marcas'
import type { EvaluacionPublica } from '../tipos'
import { formatearFechaHora } from '../lib/tiempo'
import { IconoBuscar, IconoCandado, Spinner } from '../componentes/Iconos'

function TarjetaAviso({
  logo,
  icono,
  titulo,
  children,
}: {
  logo?: string
  icono: ReactNode
  titulo: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-[600px] px-4 pb-8 pt-6">
      <div className="tarjeta-principal px-5 py-8 text-center">
        {logo && <img src={logo} alt="" className="mx-auto mb-6 h-16 w-auto object-contain" />}
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-tinte-2 text-[40px] text-acento">
          {icono}
        </div>
        <h1 className="mt-5 font-titulo text-[26px] font-bold leading-tight">{titulo}</h1>
        <div className="mt-3 text-lg text-texto-2">{children}</div>
      </div>
    </main>
  )
}

/** Pantalla 7: evaluación cerrada. */
export function Cerrada({ evaluacion }: { evaluacion: EvaluacionPublica }) {
  const h = evaluacion.habilitacion
  return (
    <TarjetaAviso logo={MARCAS[evaluacion.marca].logo} icono={<IconoCandado />} titulo="Esta evaluación está cerrada">
      <p className="font-semibold text-texto">{evaluacion.titulo}</p>
      <p className="mt-2">
        {h.cerradaPorInstructor
          ? 'El instructor cerró la evaluación.'
          : `Cerró el ${formatearFechaHora(h.cierraEn)}.`}
      </p>
      <p className="mt-4 text-base">Si creés que es un error, hablá con el instructor.</p>
    </TarjetaAviso>
  )
}

export function NoEncontrada() {
  return (
    <TarjetaAviso icono={<IconoBuscar />} titulo="No encontramos esta evaluación">
      <p>Revisá que el link esté completo o volvé a escanear el código QR.</p>
    </TarjetaAviso>
  )
}

export function ErrorConexion({ onReintentar }: { onReintentar: () => void }) {
  return (
    <TarjetaAviso icono="!" titulo="No pudimos conectarnos">
      <p>Revisá tu conexión a internet e intentá de nuevo.</p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-5 h-[54px] w-full rounded-[14px] bg-acento text-lg font-semibold text-white"
      >
        Reintentar
      </button>
    </TarjetaAviso>
  )
}

export function Cargando() {
  return (
    <div className="grid min-h-dvh place-items-center text-4xl text-acento" role="status" aria-label="Cargando">
      <Spinner />
    </div>
  )
}
