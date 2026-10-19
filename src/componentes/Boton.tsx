import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'texto'

const ESTILOS: Record<Variante, string> = {
  primario:
    'h-[54px] w-full rounded-[14px] bg-acento px-5 text-lg font-semibold text-white shadow-sm hover:bg-acento-hover',
  secundario:
    'h-[54px] w-full rounded-[14px] border-2 border-acento bg-white px-5 text-lg font-semibold text-acento hover:bg-tinte',
  texto: 'h-[54px] rounded-[14px] px-4 text-base font-semibold text-texto-2 hover:bg-black/5',
}

export function Boton({
  variante = 'primario',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-acento ${ESTILOS[variante]} ${className}`}
      {...props}
    />
  )
}
