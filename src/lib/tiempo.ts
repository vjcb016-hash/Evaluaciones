import { useEffect, useState } from 'react'
import type { Habilitacion } from '../tipos'

export function estaCerrada(h: Habilitacion | null, ahora = Date.now()): boolean {
  return !h || h.cerradaPorInstructor || ahora >= Date.parse(h.cierraEn)
}

/** Devuelve la hora actual y se actualiza cada `cadaMs` milisegundos. */
export function useAhora(cadaMs = 1000): number {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), cadaMs)
    return () => clearInterval(t)
  }, [cadaMs])
  return ahora
}

/** "3 días", "2 h 05 min" o, si falta menos de una hora, "12:34". */
export function formatearRestante(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const dias = Math.floor(s / 86400)
  if (dias >= 2) return `${dias} días`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function formatearHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "23:59" si cierra hoy; si no, "20 oct, 23:59". */
export function formatearCierre(iso: string): string {
  const d = new Date(iso)
  if (d.toDateString() === new Date().toDateString()) return formatearHora(iso)
  return `${d.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' }).replace('.', '')}, ${formatearHora(iso)}`
}

/** "lunes 19 de octubre, 23:59" */
export function formatearFechaHora(iso: string): string {
  const d = new Date(iso)
  const fecha = d.toLocaleDateString('es-PY', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${fecha}, ${formatearHora(iso)}`
}

/** "AAAA-MM-DD" → "19 de octubre de 2026" (sin corrimiento por zona horaria). */
export function formatearFecha(aaaammdd: string): string {
  const [a, m, d] = aaaammdd.split('-').map(Number)
  return new Date(a, m - 1, d).toLocaleDateString('es-PY', { day: 'numeric', month: 'long', year: 'numeric' })
}
