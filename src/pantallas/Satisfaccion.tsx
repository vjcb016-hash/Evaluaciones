import type { PreguntaPublica, Respuestas } from '../tipos'

/** Pantalla 4: encuesta de satisfacción (1 a 5). No suma puntaje. */
export function Satisfaccion({
  items,
  respuestas,
  comentario,
  onElegir,
  onComentario,
}: {
  items: PreguntaPublica[]
  respuestas: Respuestas
  comentario: string
  onElegir: (preguntaId: string, v: string) => void
  onComentario: (texto: string) => void
}) {
  return (
    <div>
      <h2 className="font-titulo text-[24px] font-bold leading-tight">¿Qué te pareció la capacitación?</h2>
      <p className="mt-1 text-texto-2">
        Marcá del 1 al 5. Esto no suma puntaje: nos ayuda a mejorar.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        {items.map((item) => (
          <fieldset key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <legend className="sr-only">{item.enunciado}</legend>
            <p aria-hidden="true" className="mb-3 font-semibold leading-snug">
              {item.enunciado}
            </p>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const elegida = respuestas[item.id] === String(n)
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={elegida}
                    aria-label={`${n} de 5`}
                    onClick={() => onElegir(item.id, String(n))}
                    className={`h-[52px] rounded-xl border-2 text-lg font-bold transition active:scale-95 ${
                      elegida
                        ? 'border-acento bg-acento text-white'
                        : 'border-black/10 bg-white text-texto hover:border-black/25'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-texto-2">
              <span>Muy en desacuerdo</span>
              <span>Muy de acuerdo</span>
            </div>
          </fieldset>
        ))}

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <label htmlFor="comentario" className="mb-2 block font-semibold">
            Sugerencias o comentarios <span className="font-normal text-texto-2">(opcional)</span>
          </label>
          <textarea
            id="comentario"
            rows={3}
            maxLength={1000}
            value={comentario}
            onChange={(e) => onComentario(e.target.value)}
            placeholder="Escribí lo que quieras contarnos…"
            className="w-full resize-y rounded-xl border-2 border-black/15 bg-white px-3 py-2.5 text-[17px] outline-none transition placeholder:text-black/35 focus:border-acento"
          />
        </div>
      </div>
    </div>
  )
}
