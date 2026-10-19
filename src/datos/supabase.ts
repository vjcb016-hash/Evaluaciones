import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configuracionFaltante = !url || !clave

if (configuracionFaltante) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env.local')
}

// Solo la clave pública (publishable / anon). La secreta nunca va en el frontend.
export const supabase = createClient(url ?? 'http://localhost', clave ?? 'sin-clave')
