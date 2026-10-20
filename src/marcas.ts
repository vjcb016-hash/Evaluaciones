import type { Marca } from './tipos'

export interface DatosMarca {
  nombre: string
  /** Logo completo, para los lugares grandes (inicio, enviado, QR). */
  logo: string
  /** Versión cuadrada, para los lugares chicos (encabezado, listas, ícono de la pestaña). */
  icono: string
  /** Color de fondo de la página (también se usa en la barra del navegador del celular). */
  fondo: string
  /** El logo es mucho más ancho que alto: se muestra con más ancho. */
  horizontal?: boolean
}

// Los colores de cada marca están en src/index.css ([data-marca="…"]).
export const MARCAS: Record<Marca, DatosMarca> = {
  vc: {
    nombre: 'VC Prevención y Capacitación',
    logo: '/marcas/vc_logo.svg',
    icono: '/marcas/vc_logo.svg',
    fondo: '#F4F4F2',
  },
  cbvl: {
    nombre: 'Bomberos Voluntarios de Luque',
    logo: '/marcas/cbvl_logo.png',
    icono: '/marcas/cbvl_logo.png',
    fondo: '#F2F3F7',
  },
  ssma: {
    nombre: 'SSMA Consultora',
    logo: '/marcas/ssma_logo.png',
    icono: '/marcas/ssma_icono.png',
    fondo: '#F2F4F7',
    horizontal: true,
  },
}

/** Aplica los colores de la marca a toda la página. */
export function aplicarMarca(marca: Marca) {
  document.documentElement.dataset.marca = marca
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', MARCAS[marca].fondo)
  const icono = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icono) icono.href = MARCAS[marca].icono
}
