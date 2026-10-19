import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { IconoCheck, IconoInfo, IconoX } from '../../componentes/Iconos'
import type { EstadoHabilitacion } from '../../datos/panel'
import { formatearCierre } from '../../lib/tiempo'

type Variante = 'primario' | 'secundario' | 'peligro' | 'texto'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-acento text-white hover:bg-acento-hover shadow-sm',
  secundario: 'border border-black/15 bg-white text-texto hover:bg-black/5',
  peligro: 'border border-error/30 bg-white text-error hover:bg-error-fondo',
  texto: 'text-texto-2 hover:bg-black/5',
}

/** Botón compacto para el panel. */
export function BotonP({
  variante = 'primario',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type={type}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-acento ${VARIANTES[variante]} ${className}`}
      {...props}
    />
  )
}

export function Tarjeta({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string
  descripcion?: ReactNode
  accion?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-titulo text-[21px] font-bold leading-tight">{titulo}</h2>
          {descripcion && <p className="mt-1 text-[15px] text-texto-2">{descripcion}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  )
}

export function Campo({
  etiqueta,
  ayuda,
  htmlFor,
  children,
}: {
  etiqueta: string
  ayuda?: ReactNode
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block font-semibold">
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="mt-1 text-sm text-texto-2">{ayuda}</p>}
    </div>
  )
}

export const claseInput =
  'h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-[16px] outline-none transition placeholder:text-black/35 focus:border-acento focus:ring-2 focus:ring-acento/15'

export function Aviso({ tipo, children }: { tipo: 'error' | 'ok' | 'info'; children: ReactNode }) {
  const estilos = {
    error: 'bg-error-fondo text-error',
    ok: 'bg-ok-fondo text-ok',
    info: 'bg-tinte text-texto',
  }[tipo]
  const Icono = { error: IconoX, ok: IconoCheck, info: IconoInfo }[tipo]
  return (
    <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-[15px] ${estilos}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono className="mt-0.5 shrink-0 text-lg" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export function ChipEstado({ estado }: { estado: EstadoHabilitacion }) {
  if (estado.tipo === 'abierta') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-fondo px-2.5 py-1 text-sm font-bold text-ok">
        <span className="h-2 w-2 rounded-full bg-ok" /> Abierta · cierra {formatearCierre(estado.habilitacion.cierra_en)}
      </span>
    )
  }
  if (estado.tipo === 'cerrada') {
    return <span className="rounded-full bg-black/5 px-2.5 py-1 text-sm font-bold text-texto-2">Cerrada</span>
  }
  return <span className="rounded-full bg-tinte-2 px-2.5 py-1 text-sm font-bold text-acento">Sin habilitar</span>
}
