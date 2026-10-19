import { MARCAS } from '../marcas'
import type { Marca } from '../tipos'
import { IconoCheck, Spinner } from '../componentes/Iconos'

/** Pantalla 5: confirmación de envío. Si la nota la libera el instructor, queda esperando. */
export function Enviado({ marca, nombre }: { marca: Marca; nombre: string }) {
  return (
    <main className="mx-auto w-full max-w-[600px] px-4 pb-8 pt-6">
      <div className="tarjeta-principal px-5 py-8 text-center">
        <img src={MARCAS[marca].logo} alt={MARCAS[marca].nombre} className="mx-auto h-16 w-auto object-contain" />
        <div className="mx-auto mt-6 grid h-20 w-20 place-items-center rounded-full bg-ok-fondo text-[44px] text-ok">
          <IconoCheck />
        </div>
        <h1 className="mt-5 font-titulo text-[26px] font-bold leading-tight">¡Listo, {primerNombre(nombre)}!</h1>
        <p className="mt-2 text-lg">Tus respuestas se enviaron correctamente.</p>

        <div className="mt-6 rounded-2xl bg-tinte px-4 py-4 text-left" role="status" aria-live="polite">
          <div className="flex items-center gap-3">
            <Spinner className="shrink-0 text-2xl text-acento" />
            <p className="font-semibold">Esperando que el instructor libere los resultados</p>
          </div>
          <p className="mt-2 text-[15px] text-texto-2">
            Dejá esta pantalla abierta: se actualiza sola cuando tu nota esté disponible.
          </p>
        </div>
      </div>
    </main>
  )
}

function primerNombre(nombre: string) {
  return nombre.split(' ')[0]
}
