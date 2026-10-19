import type { PreguntaPublica } from '../tipos'
import { IconoCheck, IconoX } from '../componentes/Iconos'

/** Pantalla 2: opción múltiple (A–D). */
export function PreguntaMultiple({
  pregunta,
  valor,
  onElegir,
}: {
  pregunta: PreguntaPublica
  valor: string | undefined
  onElegir: (v: string) => void
}) {
  return (
    <fieldset>
      <legend className="mb-5 font-titulo text-[22px] font-bold leading-snug">{pregunta.enunciado}</legend>
      <div className="flex flex-col gap-3">
        {pregunta.opciones.map((op) => {
          const elegida = valor === op.letra
          return (
            <button
              key={op.letra}
              type="button"
              aria-pressed={elegida}
              onClick={() => onElegir(op.letra)}
              className={`flex min-h-[60px] w-full items-center gap-3 rounded-[14px] border-2 px-4 py-3 text-left text-[17px] transition active:scale-[0.99] ${
                elegida ? 'border-acento bg-tinte' : 'border-black/10 bg-white hover:border-black/25'
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-base font-bold transition ${
                  elegida ? 'bg-acento text-white' : 'bg-tinte-2 text-acento'
                }`}
              >
                {op.letra}
              </span>
              <span className={elegida ? 'font-semibold' : ''}>{op.texto}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Pantalla 3: verdadero / falso. */
export function PreguntaVF({
  pregunta,
  valor,
  onElegir,
}: {
  pregunta: PreguntaPublica
  valor: string | undefined
  onElegir: (v: string) => void
}) {
  const opciones = [
    { v: 'V', texto: 'Verdadero', Icono: IconoCheck },
    { v: 'F', texto: 'Falso', Icono: IconoX },
  ]
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold uppercase tracking-wide text-texto-2">Verdadero o falso</legend>
      <p className="mb-6 font-titulo text-[22px] font-bold leading-snug">{pregunta.enunciado}</p>
      <div className="grid grid-cols-2 gap-3">
        {opciones.map(({ v, texto, Icono }) => {
          const elegida = valor === v
          return (
            <button
              key={v}
              type="button"
              aria-pressed={elegida}
              onClick={() => onElegir(v)}
              className={`flex min-h-[136px] flex-col items-center justify-center gap-3 rounded-[14px] border-2 p-4 text-lg font-semibold transition active:scale-[0.99] ${
                elegida ? 'border-acento bg-tinte' : 'border-black/10 bg-white hover:border-black/25'
              }`}
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-full text-[28px] transition ${
                  elegida ? 'bg-acento text-white' : 'bg-tinte-2 text-acento'
                }`}
              >
                <Icono />
              </span>
              {texto}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
