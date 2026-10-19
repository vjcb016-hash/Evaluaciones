import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

function Base({ children, ...p }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  )
}

export const IconoCheck = (p: P) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
)

export const IconoX = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
)

export const IconoReloj = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
)

export const IconoCandado = (p: P) => (
  <Base {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Base>
)

export const IconoInfo = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Base>
)

export const IconoFlechaIzq = (p: P) => (
  <Base {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
)

export const IconoBuscar = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </Base>
)

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" className={`girando ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth={3} />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
