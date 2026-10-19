# App de Evaluaciones — VC Prevención y CBVL

Evaluaciones al final de capacitaciones. Los participantes entran desde el celular con un QR, sin crear cuenta; el instructor administra todo desde `/panel`.

- Participante: `/e/<link-de-la-evaluacion>`
- Instructor: `/panel`

## Desarrollo local

1. Copiá `.env.example` como `.env.local` y completá la URL y la clave **pública** de Supabase.
2. `npm install`
3. `npm run dev` y abrí http://localhost:5173

## Base de datos (Supabase)

Ejecutar en el SQL Editor, en orden:

1. `supabase/migraciones/001_esquema.sql`
2. `supabase/migraciones/002_panel_instructor.sql`
3. `supabase/registrar_instructor.sql` (después de crear el usuario en Authentication → Users)

Opcional: `supabase/datos_demo.sql` (evaluaciones de ejemplo) y `supabase/consultas_utiles.sql`.

## Publicación (Vercel)

Variables de entorno en Vercel: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. La clave secreta de Supabase nunca va en el frontend.
