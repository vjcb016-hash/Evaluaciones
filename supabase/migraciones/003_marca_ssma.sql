-- ═════════════════════════════════════════════════════════════════════════════
-- App de Evaluaciones · Nueva marca: SSMA Consultora (ssma)
-- Supabase → SQL Editor → pegá este archivo y tocá «Run». Una sola vez.
-- ═════════════════════════════════════════════════════════════════════════════

alter table public.evaluaciones drop constraint if exists evaluaciones_marca_check;
alter table public.evaluaciones
  add constraint evaluaciones_marca_check check (marca in ('vc', 'cbvl', 'ssma'));
