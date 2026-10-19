import type { Marca } from './tipos'

export interface DatosMarca {
  nombre: string
  logo: string
}

export const MARCAS: Record<Marca, DatosMarca> = {
  vc: {
    nombre: 'VC Prevención y Capacitación',
    logo: '/marcas/vc_logo.svg',
  },
  cbvl: {
    nombre: 'Bomberos Voluntarios de Luque',
    logo: '/marcas/cbvl_logo.png',
  },
}

/** Aplica los colores de la marca a toda la página. */
export function aplicarMarca(marca: Marca) {
  document.documentElement.dataset.marca = marca
  const fondo = marca === 'cbvl' ? '#F2F3F7' : '#F4F4F2'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fondo)
  const icono = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icono) icono.href = MARCAS[marca].logo
}
