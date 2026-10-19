-- ═════════════════════════════════════════════════════════════════════════════
-- App de Evaluaciones · Panel del instructor (Etapa 3)
--
-- Cómo usarlo: Supabase → SQL Editor → New query, pegá TODO este archivo y
-- tocá «Run». Se ejecuta una sola vez, después de 001_esquema.sql.
--
-- Seguridad:
--   · Solo los usuarios anotados en la tabla «instructores» pueden ver y
--     cambiar evaluaciones, preguntas, habilitaciones y resultados.
--   · Tener cuenta en Supabase no alcanza: además hay que estar en esa tabla.
-- ═════════════════════════════════════════════════════════════════════════════

create table public.instructores (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  creado_en  timestamptz not null default now()
);
alter table public.instructores enable row level security;
revoke all on public.instructores from anon;

create policy "Cada instructor ve su propia fila"
  on public.instructores for select to authenticated
  using (user_id = auth.uid());

create or replace function public.es_instructor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.instructores where user_id = auth.uid())
$$;
revoke all on function public.es_instructor() from public, anon;
grant execute on function public.es_instructor() to authenticated;

-- ── Políticas: el instructor puede todo; nadie más puede nada ────────────────

create policy "Instructor: acceso completo" on public.evaluaciones
  for all to authenticated using (public.es_instructor()) with check (public.es_instructor());
create policy "Instructor: acceso completo" on public.preguntas
  for all to authenticated using (public.es_instructor()) with check (public.es_instructor());
create policy "Instructor: acceso completo" on public.habilitaciones
  for all to authenticated using (public.es_instructor()) with check (public.es_instructor());
create policy "Instructor: acceso completo" on public.envios
  for all to authenticated using (public.es_instructor()) with check (public.es_instructor());
create policy "Instructor: acceso completo" on public.respuestas
  for all to authenticated using (public.es_instructor()) with check (public.es_instructor());

-- ── Funciones del panel ──────────────────────────────────────────────────────

-- Abre una habilitación nueva por N horas. La anterior, si seguía abierta, se cierra.
create or replace function public.habilitar_evaluacion(p_evaluacion_id uuid, p_horas numeric)
returns public.habilitaciones
language plpgsql
security invoker
set search_path = ''
as $$
declare
  h public.habilitaciones;
begin
  if not public.es_instructor() then
    raise exception 'No tenés permiso para habilitar evaluaciones';
  end if;
  if p_horas is null or p_horas <= 0 or p_horas > 720 then
    raise exception 'La duración debe estar entre unos minutos y 30 días';
  end if;
  if not exists (select 1 from public.preguntas where evaluacion_id = p_evaluacion_id and tipo <> 'escala') then
    raise exception 'Primero cargá las preguntas de la evaluación';
  end if;

  update public.habilitaciones
     set cerrada_por_instructor = true
   where evaluacion_id = p_evaluacion_id
     and not cerrada_por_instructor
     and cierra_en > now();

  insert into public.habilitaciones (evaluacion_id, cierra_en)
  values (p_evaluacion_id, now() + make_interval(secs => round(p_horas * 3600)))
  returning * into h;

  return h;
end
$$;

-- Reemplaza todas las preguntas (importación desde Excel).
-- No se permite si ya hay respuestas, para no perder resultados.
create or replace function public.reemplazar_preguntas(p_evaluacion_id uuid, p_preguntas jsonb)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n int;
begin
  if not public.es_instructor() then
    raise exception 'No tenés permiso para cambiar preguntas';
  end if;
  if exists (select 1
               from public.envios en
               join public.habilitaciones h on h.id = en.habilitacion_id
              where h.evaluacion_id = p_evaluacion_id) then
    raise exception 'Esta evaluación ya tiene respuestas. Para cambiar las preguntas, duplicala y cargalas en la copia.';
  end if;

  delete from public.preguntas where evaluacion_id = p_evaluacion_id;

  insert into public.preguntas
    (evaluacion_id, orden, tipo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, justificacion)
  select p_evaluacion_id, x.orden, x.tipo, trim(x.enunciado),
         nullif(trim(x.opcion_a), ''), nullif(trim(x.opcion_b), ''),
         nullif(trim(x.opcion_c), ''), nullif(trim(x.opcion_d), ''),
         nullif(trim(x.respuesta_correcta), ''), nullif(trim(x.justificacion), '')
    from jsonb_to_recordset(p_preguntas) as x (
      orden int, tipo text, enunciado text,
      opcion_a text, opcion_b text, opcion_c text, opcion_d text,
      respuesta_correcta text, justificacion text
    );

  get diagnostics n = row_count;
  return n;
end
$$;

-- Copia una evaluación con sus preguntas (sin habilitaciones ni resultados).
create or replace function public.duplicar_evaluacion(p_evaluacion_id uuid, p_slug text, p_titulo text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  nueva uuid;
begin
  if not public.es_instructor() then
    raise exception 'No tenés permiso para duplicar evaluaciones';
  end if;

  insert into public.evaluaciones (slug, marca, titulo, instructor, fecha, lugar, nota_minima, modo_resultado)
  select p_slug, marca, p_titulo, instructor, fecha, lugar, nota_minima, modo_resultado
    from public.evaluaciones
   where id = p_evaluacion_id
  returning id into nueva;

  if nueva is null then
    raise exception 'No se encontró la evaluación';
  end if;

  insert into public.preguntas
    (evaluacion_id, orden, tipo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, justificacion)
  select nueva, orden, tipo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, justificacion
    from public.preguntas
   where evaluacion_id = p_evaluacion_id;

  return nueva;
end
$$;

revoke all on function public.habilitar_evaluacion(uuid, numeric) from public, anon;
revoke all on function public.reemplazar_preguntas(uuid, jsonb) from public, anon;
revoke all on function public.duplicar_evaluacion(uuid, text, text) from public, anon;
grant execute on function public.habilitar_evaluacion(uuid, numeric) to authenticated;
grant execute on function public.reemplazar_preguntas(uuid, jsonb) to authenticated;
grant execute on function public.duplicar_evaluacion(uuid, text, text) to authenticated;
