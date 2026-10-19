// Identificador anónimo del dispositivo, guardado en el navegador.
// Sirve para limitar a un intento por habilitación sin pedir cuenta.

const CLAVE = 'dispositivo_id'
let enMemoria: string | null = null

/** Genera un UUID v4. Funciona también en http:// (red local), donde crypto.randomUUID no existe. */
export function generarId(): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function obtenerDispositivoId(): string {
  try {
    let id = localStorage.getItem(CLAVE)
    if (!id) {
      id = generarId()
      localStorage.setItem(CLAVE, id)
    }
    return id
  } catch {
    // Navegación privada u otro bloqueo: vale solo mientras la página esté abierta
    enMemoria ??= generarId()
    return enMemoria
  }
}
