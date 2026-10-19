import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { aplicarMarca, MARCAS } from '../marcas'
import { reiniciarDemo } from '../datos/api'
import type { Marca } from '../tipos'

// Página provisoria para entrar a los ejemplos. En la etapa 3 acá va el panel del instructor.
const DEMOS: { slug: string; marca: Marca; titulo: string; nota: string }[] = [
  { slug: 'demo-vc', marca: 'vc', titulo: 'Uso de extintores portátiles', nota: 'Nota inmediata · mínimo 70%' },
  { slug: 'demo-cbvl', marca: 'cbvl', titulo: 'Control de hemorragias', nota: 'Nota la libera el instructor · sin mínimo' },
  { slug: 'demo-cerrada', marca: 'vc', titulo: 'Evaluación ya cerrada', nota: 'Para ver la pantalla «Evaluación cerrada»' },
]

export default function Portada() {
  const [reiniciado, setReiniciado] = useState(false)

  useEffect(() => {
    aplicarMarca('vc')
    document.title = 'Evaluaciones · ejemplos'
  }, [])

  return (
    <main className="mx-auto w-full max-w-[600px] px-4 py-8">
      <h1 className="font-titulo text-[28px] font-bold">Evaluaciones de ejemplo</h1>
      <p className="mt-1 text-texto-2">Datos de prueba, todavía sin base de datos.</p>

      <ul className="mt-6 flex flex-col gap-3">
        {DEMOS.map((d) => (
          <li key={d.slug}>
            <Link
              to={`/e/${d.slug}`}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <img src={MARCAS[d.marca].logo} alt="" className="h-12 w-12 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="font-semibold">{d.titulo}</p>
                <p className="text-sm text-texto-2">{MARCAS[d.marca].nombre}</p>
                <p className="text-sm text-texto-2">{d.nota}</p>
                <p className="mt-0.5 text-sm font-semibold text-acento">/e/{d.slug}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border-2 border-dashed border-black/15 p-4">
        <p className="font-semibold">¿Querés volver a responder?</p>
        <p className="mt-1 text-[15px] text-texto-2">
          Cada celular puede responder una sola vez. Este botón borra tus respuestas de prueba en este navegador.
        </p>
        <button
          type="button"
          onClick={() => {
            reiniciarDemo()
            setReiniciado(true)
          }}
          className="mt-3 h-12 rounded-xl bg-texto px-4 font-semibold text-white"
        >
          Borrar mis respuestas de prueba
        </button>
        {reiniciado && (
          <p className="mt-2 text-[15px] font-semibold text-ok" role="status">
            Listo, ya podés responder de nuevo.
          </p>
        )}
      </div>
    </main>
  )
}
