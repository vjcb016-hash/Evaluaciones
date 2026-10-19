import { useEffect, useState, type FormEvent } from 'react'
import { Link, Outlet } from 'react-router'
import { aplicarMarca, MARCAS } from '../../marcas'
import { escucharSesion, ingresar, salir, soyInstructor } from '../../datos/panel'
import { Cargando } from '../../pantallas/Aviso'
import { Aviso, BotonP, Campo, claseInput } from './ui'

type Estado = 'cargando' | 'fuera' | 'no_instructor' | 'dentro'

/** Marco del panel: pide ingresar y, si sos instructor, muestra la página pedida. */
export default function PanelLayout() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [email, setEmail] = useState('')

  useEffect(() => {
    aplicarMarca('vc')
    document.title = 'Panel del instructor'
    return escucharSesion(async (sesion) => {
      if (!sesion) {
        setEstado('fuera')
        return
      }
      setEmail(sesion.user.email ?? '')
      try {
        setEstado((await soyInstructor()) ? 'dentro' : 'no_instructor')
      } catch {
        setEstado('no_instructor')
      }
    })
  }, [])

  if (estado === 'cargando') return <Cargando />
  if (estado === 'fuera') return <Ingresar />

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[960px] items-center gap-3 px-4 py-2.5">
          <Link to="/panel" className="flex min-w-0 flex-1 items-center gap-3">
            <img src={MARCAS.vc.logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
            <span className="truncate font-semibold">Panel del instructor</span>
          </Link>
          <span className="hidden truncate text-sm text-texto-2 sm:block">{email}</span>
          <BotonP variante="texto" onClick={() => salir()}>
            Salir
          </BotonP>
        </div>
      </header>

      {estado === 'no_instructor' ? (
        <main className="mx-auto max-w-[600px] px-4 py-10">
          <Aviso tipo="error">
            La cuenta <strong>{email}</strong> no está registrada como instructor. Pedí que la agreguen a la tabla
            «instructores» en Supabase.
          </Aviso>
        </main>
      ) : (
        <main className="mx-auto max-w-[960px] px-4 pb-16 pt-6">
          <Outlet />
        </main>
      )}
    </div>
  )
}

function Ingresar() {
  const [email, setEmail] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await ingresar(email, contrasena)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[440px] px-4 py-10">
      <div className="tarjeta-principal px-6 py-8">
        <img src={MARCAS.vc.logo} alt={MARCAS.vc.nombre} className="mx-auto h-20 w-auto object-contain" />
        <h1 className="mt-4 text-center font-titulo text-[26px] font-bold">Panel del instructor</h1>
        <p className="mt-1 text-center text-texto-2">Ingresá con tu cuenta para administrar las evaluaciones.</p>

        <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
          <Campo etiqueta="Correo" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={claseInput}
            />
          </Campo>
          <Campo etiqueta="Contraseña" htmlFor="contrasena">
            <input
              id="contrasena"
              type="password"
              autoComplete="current-password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className={claseInput}
            />
          </Campo>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <BotonP type="submit" disabled={enviando} className="h-[54px] text-lg">
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </BotonP>
        </form>
      </div>
    </main>
  )
}
