import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { MARCAS } from '../../marcas'
import type { Marca } from '../../tipos'
import { crearEvaluacion, crearSlug, type DatosEvaluacion } from '../../datos/panel'
import { Aviso, BotonP, Campo, claseInput } from './ui'

const VACIA: DatosEvaluacion = {
  slug: '',
  marca: 'vc',
  titulo: '',
  instructor: 'Vidal Caballero',
  fecha: null,
  lugar: null,
  nota_minima: 70,
  modo_resultado: 'inmediato',
}

/** Formulario de datos de la evaluación (para crear y para editar). */
export function FormularioDatos({
  inicial,
  textoBoton,
  onGuardar,
  onCancelar,
}: {
  inicial: DatosEvaluacion
  textoBoton: string
  onGuardar: (datos: DatosEvaluacion) => Promise<void>
  onCancelar?: () => void
}) {
  const [d, setD] = useState<DatosEvaluacion>(inicial)
  const [slugTocado, setSlugTocado] = useState(Boolean(inicial.slug))
  const [conMinima, setConMinima] = useState(inicial.nota_minima !== null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = <K extends keyof DatosEvaluacion>(clave: K, valor: DatosEvaluacion[K]) =>
    setD((x) => ({ ...x, [clave]: valor }))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const datos: DatosEvaluacion = {
      ...d,
      titulo: d.titulo.trim(),
      instructor: d.instructor.trim() || 'Vidal Caballero',
      lugar: d.lugar?.trim() || null,
      fecha: d.fecha || null,
      slug: crearSlug(d.slug),
      nota_minima: conMinima ? d.nota_minima : null,
    }
    if (!datos.titulo) return setError('Escribí el título de la evaluación.')
    if (!datos.slug) return setError('Escribí el link de la evaluación.')
    if (conMinima && (datos.nota_minima === null || datos.nota_minima < 0 || datos.nota_minima > 100))
      return setError('La nota mínima tiene que estar entre 0 y 100.')

    setGuardando(true)
    try {
      await onGuardar(datos)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <Campo etiqueta="Título" htmlFor="titulo">
        <input
          id="titulo"
          required
          value={d.titulo}
          onChange={(e) => {
            cambiar('titulo', e.target.value)
            if (!slugTocado) cambiar('slug', crearSlug(e.target.value))
          }}
          placeholder="Ej.: Uso de extintores portátiles"
          className={claseInput}
        />
      </Campo>

      <fieldset>
        <legend className="mb-1.5 font-semibold">Marca</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(MARCAS) as Marca[]).map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition ${
                d.marca === m ? 'border-acento bg-tinte' : 'border-black/10 bg-white hover:border-black/25'
              }`}
            >
              <input
                type="radio"
                name="marca"
                value={m}
                checked={d.marca === m}
                onChange={() => cambiar('marca', m)}
                className="sr-only"
              />
              <img src={MARCAS[m].logo} alt="" className="h-10 w-10 object-contain" />
              <span className="font-semibold leading-snug">{MARCAS[m].nombre}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Campo
        etiqueta="Link para los participantes"
        htmlFor="slug"
        ayuda="Solo minúsculas, números y guiones. Es lo que va en el QR."
      >
        <div className="flex items-center overflow-hidden rounded-xl border border-black/15 bg-white focus-within:border-acento focus-within:ring-2 focus-within:ring-acento/15">
          <span className="shrink-0 pl-3 text-[15px] text-texto-2">/e/</span>
          <input
            id="slug"
            required
            value={d.slug}
            onChange={(e) => {
              setSlugTocado(true)
              cambiar('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
            }}
            className="h-11 w-full bg-transparent px-1 text-[16px] outline-none"
          />
        </div>
      </Campo>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Campo etiqueta="Instructor" htmlFor="instructor">
          <input
            id="instructor"
            value={d.instructor}
            onChange={(e) => cambiar('instructor', e.target.value)}
            className={claseInput}
          />
        </Campo>
        <Campo etiqueta="Fecha (opcional)" htmlFor="fecha">
          <input
            id="fecha"
            type="date"
            value={d.fecha ?? ''}
            onChange={(e) => cambiar('fecha', e.target.value || null)}
            className={claseInput}
          />
        </Campo>
      </div>

      <Campo etiqueta="Lugar o empresa (opcional)" htmlFor="lugar">
        <input
          id="lugar"
          value={d.lugar ?? ''}
          onChange={(e) => cambiar('lugar', e.target.value)}
          placeholder="Ej.: Empresa Demo S.A."
          className={claseInput}
        />
      </Campo>

      <fieldset>
        <legend className="mb-1.5 font-semibold">Nota mínima</legend>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={conMinima} onChange={(e) => setConMinima(e.target.checked)} className="h-5 w-5 accent-acento" />
            Tiene nota mínima
          </label>
          {conMinima && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                aria-label="Porcentaje mínimo"
                value={d.nota_minima ?? ''}
                onChange={(e) => cambiar('nota_minima', e.target.value === '' ? null : Number(e.target.value))}
                className={`${claseInput} w-24`}
              />
              <span>%</span>
            </div>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 font-semibold">Resultado para el participante</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(
            [
              ['inmediato', 'Nota inmediata', 'Ve su nota y la revisión apenas envía.'],
              ['liberar', 'La libero yo', 'Espera hasta que vos liberes las notas desde el panel.'],
            ] as const
          ).map(([valor, titulo, texto]) => (
            <label
              key={valor}
              className={`cursor-pointer rounded-xl border-2 p-3 transition ${
                d.modo_resultado === valor ? 'border-acento bg-tinte' : 'border-black/10 bg-white hover:border-black/25'
              }`}
            >
              <input
                type="radio"
                name="modo"
                checked={d.modo_resultado === valor}
                onChange={() => cambiar('modo_resultado', valor)}
                className="sr-only"
              />
              <span className="block font-semibold">{titulo}</span>
              <span className="block text-sm text-texto-2">{texto}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <Aviso tipo="error">{error}</Aviso>}

      <div className="flex flex-wrap gap-2">
        <BotonP type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : textoBoton}
        </BotonP>
        {onCancelar && (
          <BotonP variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </BotonP>
        )}
      </div>
    </form>
  )
}

/** Página «Nueva evaluación». */
export default function NuevaEvaluacion() {
  const navegar = useNavigate()
  return (
    <>
      <Link to="/panel" className="text-[15px] font-semibold text-texto-2 hover:text-texto">
        ← Evaluaciones
      </Link>
      <h1 className="mb-5 mt-2 font-titulo text-[28px] font-bold">Nueva evaluación</h1>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <FormularioDatos
          inicial={VACIA}
          textoBoton="Crear evaluación"
          onGuardar={async (datos) => {
            const id = await crearEvaluacion(datos)
            navegar(`/panel/e/${id}`)
          }}
        />
      </div>
    </>
  )
}
