import type { ReactNode } from 'react'
import { MARCAS } from '../marcas'
import type { EvaluacionPublica } from '../tipos'
import { formatearRestante, useAhora } from '../lib/tiempo'
import { IconoReloj } from './Iconos'

/** Barra superior durante la evaluación: logo, título, participante y tiempo restante. */
export function Encabezado({ evaluacion, nombre }: { evaluacion: EvaluacionPublica; nombre: string }) {
  const ahora = useAhora(1000)
  const cierre = evaluacion.habilitacion ? Date.parse(evaluacion.habilitacion.cierraEn) : ahora
  const restante = cierre - ahora
  const poco = restante < 5 * 60 * 1000

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[600px] items-center gap-3 px-4 py-2.5">
        <img src={MARCAS[evaluacion.marca].icono} alt="" className="h-10 w-10 shrink-0 object-contain" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-semibold">{evaluacion.titulo}</p>
          <p className="truncate text-sm text-texto-2">{nombre}</p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums ${
            poco ? 'bg-error-fondo text-error' : 'bg-tinte-2 text-texto'
          }`}
          aria-label={`Tiempo restante: ${formatearRestante(restante)}`}
        >
          <IconoReloj className="text-base" />
          {formatearRestante(restante)}
        </div>
      </div>
    </header>
  )
}

export function Progreso({ actual, total, etiqueta }: { actual: number; total: number; etiqueta?: string }) {
  const pct = total > 0 ? Math.round((actual / total) * 100) : 0
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-baseline justify-between text-sm font-semibold text-texto-2">
        <span>{etiqueta ?? `Pregunta ${actual} de ${total}`}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-black/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={actual}
      >
        <div className="h-full rounded-full bg-acento transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/** Barra de botones fija abajo, cómoda para el pulgar. */
export function BarraAcciones({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-fondo from-70% to-transparent pb-[max(16px,env(safe-area-inset-bottom))] pt-6">
      <div className="flex items-center gap-3">{children}</div>
    </div>
  )
}

export function Contenedor({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[600px] px-4 pt-5">{children}</main>
}
