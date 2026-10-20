import { MARCAS } from '../marcas'
import type { Marca } from '../tipos'

/** Logo completo de la marca. Los logos horizontales se muestran más anchos para que se lea el texto. */
export function LogoMarca({
  marca,
  tamano = 'mediano',
  decorativo = false,
}: {
  marca: Marca
  tamano?: 'mediano' | 'grande'
  /** true cuando el nombre de la institución ya aparece escrito al lado. */
  decorativo?: boolean
}) {
  const m = MARCAS[marca]
  const medidas = m.horizontal
    ? { mediano: 'h-auto w-[230px]', grande: 'h-auto w-[290px]' }
    : { mediano: 'h-16 w-auto', grande: 'h-24 w-auto' }
  return (
    <img
      src={m.logo}
      alt={decorativo ? '' : m.nombre}
      className={`mx-auto max-w-full object-contain ${medidas[tamano]}`}
    />
  )
}
