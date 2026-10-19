import { useState, type FormEvent, type ReactNode } from 'react'
import { MARCAS } from '../marcas'
import type { EvaluacionPublica } from '../tipos'
import { formatearCierre, formatearFecha } from '../lib/tiempo'
import { Boton } from '../componentes/Boton'
import { IconoInfo } from '../componentes/Iconos'

/** Pantalla 1: datos de la evaluación y nombre del participante. */
export function Inicio({
  evaluacion,
  nombreInicial,
  onComenzar,
}: {
  evaluacion: EvaluacionPublica
  nombreInicial: string
  onComenzar: (nombre: string) => void
}) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [tocado, setTocado] = useState(false)
  const marca = MARCAS[evaluacion.marca]
  const cantidad = evaluacion.preguntas.filter((p) => p.tipo !== 'escala').length
  const limpio = nombre.trim().replace(/\s+/g, ' ')
  const valido = limpio.split(' ').filter((p) => p.length >= 2).length >= 2

  function enviar(e: FormEvent) {
    e.preventDefault()
    setTocado(true)
    if (valido) onComenzar(limpio)
  }

  const detalle = [evaluacion.fecha && formatearFecha(evaluacion.fecha), evaluacion.lugar].filter(Boolean).join(' · ')

  return (
    <main className="mx-auto w-full max-w-[600px] px-4 pb-8 pt-6">
      <div className="tarjeta-principal">
        <div className="px-5 pb-6 pt-6 text-center">
          <img src={marca.logo} alt={marca.nombre} className="mx-auto h-24 w-auto max-w-[220px] object-contain" />
          <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-texto-2">{marca.nombre}</p>
          <h1 className="mt-3 font-titulo text-[28px] font-bold leading-tight">{evaluacion.titulo}</h1>
          <p className="mt-2 text-texto-2">
            Instructor: <span className="font-semibold text-texto">{evaluacion.instructor}</span>
          </p>
          {detalle && <p className="mt-1 text-texto-2">{detalle}</p>}

          <ul className="mt-5 flex flex-wrap justify-center gap-2">
            <Chip>{cantidad === 1 ? '1 pregunta' : `${cantidad} preguntas`}</Chip>
            <Chip>{evaluacion.notaMinima === null ? 'Sin nota mínima' : `Nota mínima ${evaluacion.notaMinima}%`}</Chip>
            {evaluacion.habilitacion && <Chip>Cierra {formatearCierre(evaluacion.habilitacion.cierraEn)}</Chip>}
          </ul>
        </div>

        <form onSubmit={enviar} className="border-t border-black/5 px-5 pb-6 pt-5" noValidate>
          <label htmlFor="nombre" className="mb-2 block font-semibold">
            Nombre y apellido
          </label>
          <input
            id="nombre"
            type="text"
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="go"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => setTocado(true)}
            placeholder="Ej.: María González"
            aria-invalid={tocado && !valido}
            aria-describedby="ayuda-nombre"
            className="h-[54px] w-full rounded-[14px] border-2 border-black/15 bg-white px-4 text-lg outline-none transition placeholder:text-black/35 focus:border-acento aria-[invalid=true]:border-error"
          />
          <p id="ayuda-nombre" className={`mt-1.5 min-h-5 text-sm ${tocado && !valido ? 'text-error' : 'text-texto-2'}`}>
            {tocado && !valido ? 'Escribí tu nombre y tu apellido.' : 'Así va a aparecer en tu resultado.'}
          </p>

          <Boton type="submit" className="mt-3">
            Comenzar evaluación
          </Boton>

          <p className="mt-4 flex items-start gap-2 rounded-xl bg-tinte px-3 py-2.5 text-left text-[15px] text-texto-2">
            <IconoInfo className="mt-0.5 shrink-0 text-lg text-acento" />
            <span>
              Tenés <strong className="text-texto">un solo intento</strong>. Una vez que envíes, no vas a poder cambiar
              tus respuestas.
            </span>
          </p>
        </form>
      </div>
    </main>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <li className="rounded-full bg-tinte-2 px-3 py-1.5 text-sm font-semibold">{children}</li>
}
