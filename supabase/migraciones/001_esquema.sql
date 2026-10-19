-- ═════════════════════════════════════════════════════════════════════════════
-- App de Evaluaciones · Esquema inicial (Etapa 2, parte 2)
--
-- Cómo usarlo: en Supabase → SQL Editor → New query, pegá TODO este archivo y
-- tocá «Run». Se ejecuta una sola vez por proyecto.
--
-- Seguridad:
--   · Todas las tablas tienen RLS activado y SIN políticas para el público
--     (anon): el celular no puede leer ni escribir tablas directamente.
--   · El participante solo usa 4 funciones (RPC). Ninguna devuelve la
--     respuesta correcta ni la justificación antes de enviar.
--   · La corrección se calcula acá, en Postgres, no en el navegador.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Tablas ───────────────────────────────────────────────────────────────────

create table public.evaluaciones (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  marca           text not null check (marca in ('vc', 'cbvl')),
  titulo          text not null check (length(trim(titulo)) > 0),
  instructor      text not null default 'Vidal Caballero',
  fecha           date,
  lugar           text,
  nota_minima     int check (nota_minima between 0 and 100),
  modo_resultado  text not null default 'inmediato' check (modo_resultado in ('inmediato', 'liberar')),
  propietario     uuid references auth.users (id) on delete set null default auth.uid(),
  creada_en       timestamptz not null default now()
);

-- Mismo formato que la planilla de importación (etapa 3)
create table public.preguntas (
  id                  uuid primary key default gen_random_uuid(),
  evaluacion_id       uuid not null references public.evaluaciones (id) on delete cascade,
  orden               int not null,
  tipo                text not null check (tipo in ('multiple', 'vf', 'escala')),
  enunciado           text not null check (length(trim(enunciado)) > 0),
  opcion_a            text,
  opcion_b            text,
  opcion_c            text,
  opcion_d            text,
  respuesta_correcta  text,
  justificacion       text,
  unique (evaluacion_id, orden),
  constraint respuesta_valida check (
    (tipo = 'multiple'
      and opcion_a is not null and opcion_b is not null
      and respuesta_correcta in ('A', 'B', 'C', 'D')
      and (respuesta_correcta <> 'C' or opcion_c is not null)
      and (respuesta_correcta <> 'D' or opcion_d is not null))
    or (tipo = 'vf' and respuesta_correcta in ('V', 'F'))
    or (tipo = 'escala' and respuesta_correcta is null)
  )
);

-- Cada vez que el instructor habilita una evaluación se crea una fila nueva.
-- Vale siempre la más reciente.
create table public.habilitaciones (
  id                      uuid primary key default gen_random_uuid(),
  evaluacion_id           uuid not null references public.evaluaciones (id) on delete cascade,
  abierta_en              timestamptz not null default now(),
  cierra_en               timestamptz not null,
  cerrada_por_instructor  boolean not null default false,
  notas_liberadas         boolean not null default false,
  check (cierra_en > abierta_en)
);
create index habilitaciones_vigente on public.habilitaciones (evaluacion_id, abierta_en desc);

create table public.envios (
  id               uuid primary key default gen_random_uuid(),
  habilitacion_id  uuid not null references public.habilitaciones (id) on delete cascade,
  dispositivo_id   uuid not null,
  nombre           text not null check (length(nombre) between 3 and 120),
  comentario       text not null default '' check (length(comentario) <= 1000),
  correctas        int not null default 0,
  total            int not null default 0,
  porcentaje       int not null default 0,
  enviado_en       timestamptz not null default now(),
  -- Un intento por dispositivo y por habilitación
  unique (habilitacion_id, dispositivo_id)
);
create index envios_por_nombre on public.envios (habilitacion_id, lower(nombre));

create table public.respuestas (
  envio_id     uuid not null references public.envios (id) on delete cascade,
  pregunta_id  uuid not null references public.preguntas (id) on delete cascade,
  valor        text not null,
  es_correcta  boolean, -- null en las preguntas de satisfacción
  primary key (envio_id, pregunta_id)
);
create index respuestas_por_pregunta on public.respuestas (pregunta_id);

-- ── Seguridad: nadie del público toca las tablas directamente ────────────────

alter table public.evaluaciones   enable row level security;
alter table public.preguntas      enable row level security;
alter table public.habilitaciones enable row level security;
alter table public.envios         enable row level security;
alter table public.respuestas     enable row level security;

revoke all on public.evaluaciones, public.preguntas, public.habilitaciones,
              public.envios, public.respuestas from anon;

-- ── Funciones internas ───────────────────────────────────────────────────────

-- "B) Clase B", "Verdadero", "Sin responder"
create or replace function public.texto_respuesta(p public.preguntas, valor text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when valor is null or valor = '' then 'Sin responder'
    when p.tipo = 'vf' then case valor when 'V' then 'Verdadero' else 'Falso' end
    else valor || ') ' || coalesce(case valor
      when 'A' then p.opcion_a when 'B' then p.opcion_b
      when 'C' then p.opcion_c when 'D' then p.opcion_d end, '')
  end
$$;

-- ── Funciones para el participante (las únicas que puede usar el celular) ────

-- 1. Datos de la evaluación SIN respuestas correctas.
--    Las preguntas solo se entregan mientras la habilitación vigente está abierta.
create or replace function public.obtener_evaluacion(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  e public.evaluaciones;
  h public.habilitaciones;
  abierta boolean;
begin
  select * into e from public.evaluaciones where slug = p_slug;
  if not found then
    return null;
  end if;

  select * into h from public.habilitaciones
   where evaluacion_id = e.id
   order by abierta_en desc
   limit 1;

  abierta := h.id is not null and not h.cerrada_por_instructor and now() < h.cierra_en;

  return jsonb_build_object(
    'slug', e.slug,
    'marca', e.marca,
    'titulo', e.titulo,
    'instructor', e.instructor,
    'fecha', e.fecha,
    'lugar', e.lugar,
    'notaMinima', e.nota_minima,
    'modoResultado', e.modo_resultado,
    'habilitacion', case when h.id is null then null else jsonb_build_object(
      'id', h.id,
      'cierraEn', h.cierra_en,
      'cerradaPorInstructor', h.cerrada_por_instructor
    ) end,
    'preguntas', case when not abierta then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id,
               'orden', p.orden,
               'tipo', p.tipo,
               'enunciado', p.enunciado,
               'opciones', case when p.tipo <> 'multiple' then '[]'::jsonb else (
                 select coalesce(jsonb_agg(jsonb_build_object('letra', o.letra, 'texto', o.texto) order by o.letra), '[]'::jsonb)
                   from (values ('A', p.opcion_a), ('B', p.opcion_b), ('C', p.opcion_c), ('D', p.opcion_d)) as o (letra, texto)
                  where o.texto is not null and length(trim(o.texto)) > 0
               ) end
             ) order by p.orden)
        from public.preguntas p
       where p.evaluacion_id = e.id
    ), '[]'::jsonb) end
  );
end
$$;

-- 2. ¿Este dispositivo ya respondió en esta habilitación?
create or replace function public.buscar_envio_previo(p_habilitacion_id uuid, p_dispositivo_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.envios
   where habilitacion_id = p_habilitacion_id
     and dispositivo_id = p_dispositivo_id
$$;

-- 3. Guarda las respuestas y calcula la nota.
create or replace function public.enviar_respuestas(
  p_slug            text,
  p_habilitacion_id uuid,
  p_dispositivo_id  uuid,
  p_nombre          text,
  p_respuestas      jsonb,
  p_comentario      text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  e public.evaluaciones;
  h public.habilitaciones;
  v_nombre    text := regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g');
  v_envio     uuid;
  v_correctas int;
  v_total     int;
begin
  select * into e from public.evaluaciones where slug = p_slug;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'no_encontrada');
  end if;

  select * into h from public.habilitaciones where id = p_habilitacion_id and evaluacion_id = e.id;
  if not found then
    return jsonb_build_object('ok', false, 'motivo', 'no_encontrada');
  end if;

  -- Solo se acepta la habilitación vigente y abierta
  if h.cerrada_por_instructor
     or now() >= h.cierra_en
     or exists (select 1 from public.habilitaciones x
                 where x.evaluacion_id = e.id and x.abierta_en > h.abierta_en) then
    return jsonb_build_object('ok', false, 'motivo', 'cerrada');
  end if;

  if p_dispositivo_id is null then
    raise exception 'Falta el identificador del dispositivo';
  end if;
  if length(v_nombre) < 3 or length(v_nombre) > 120 then
    raise exception 'El nombre debe tener entre 3 y 120 caracteres';
  end if;
  if p_respuestas is null or jsonb_typeof(p_respuestas) <> 'object' then
    raise exception 'Formato de respuestas inválido';
  end if;

  insert into public.envios (habilitacion_id, dispositivo_id, nombre, comentario)
  values (h.id, p_dispositivo_id, v_nombre, left(trim(coalesce(p_comentario, '')), 1000))
  on conflict (habilitacion_id, dispositivo_id) do nothing
  returning id into v_envio;

  if v_envio is null then
    return jsonb_build_object('ok', false, 'motivo', 'ya_respondio');
  end if;

  -- Solo se guardan respuestas válidas para preguntas de esta evaluación
  insert into public.respuestas (envio_id, pregunta_id, valor, es_correcta)
  select v_envio, p.id, r.valor,
         case when p.tipo = 'escala' then null else r.valor = p.respuesta_correcta end
    from public.preguntas p
    cross join lateral (select p_respuestas ->> p.id::text as valor) r
   where p.evaluacion_id = e.id
     and ((p.tipo = 'multiple' and r.valor in ('A', 'B', 'C', 'D'))
       or (p.tipo = 'vf'       and r.valor in ('V', 'F'))
       or (p.tipo = 'escala'   and r.valor in ('1', '2', '3', '4', '5')));

  select count(*) into v_total from public.preguntas where evaluacion_id = e.id and tipo <> 'escala';
  select count(*) into v_correctas from public.respuestas where envio_id = v_envio and es_correcta;

  update public.envios
     set correctas  = v_correctas,
         total      = v_total,
         porcentaje = case when v_total > 0 then round(v_correctas * 100.0 / v_total) else 0 end
   where id = v_envio;

  return jsonb_build_object('ok', true, 'envioId', v_envio);
end
$$;

-- 4. Resultado con revisión. Si el instructor todavía no liberó las notas: «pendiente».
create or replace function public.obtener_resultado(p_envio_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.envios;
  h public.habilitaciones;
  e public.evaluaciones;
begin
  select * into v from public.envios where id = p_envio_id;
  if not found then
    return null;
  end if;
  select * into h from public.habilitaciones where id = v.habilitacion_id;
  select * into e from public.evaluaciones where id = h.evaluacion_id;

  if e.modo_resultado = 'liberar' and not h.notas_liberadas then
    return jsonb_build_object('estado', 'pendiente', 'nombre', v.nombre);
  end if;

  return jsonb_build_object(
    'estado', 'listo',
    'nombre', v.nombre,
    'correctas', v.correctas,
    'total', v.total,
    'porcentaje', v.porcentaje,
    'notaMinima', e.nota_minima,
    'aprobado', case when e.nota_minima is null then null else v.porcentaje >= e.nota_minima end,
    'revision', coalesce((
      select jsonb_agg(jsonb_build_object(
               'preguntaId', p.id,
               'orden', p.orden,
               'tipo', p.tipo,
               'enunciado', p.enunciado,
               'tuRespuesta', public.texto_respuesta(p, r.valor),
               'esCorrecta', coalesce(r.es_correcta, false),
               'respuestaCorrecta', public.texto_respuesta(p, p.respuesta_correcta),
               'justificacion', coalesce(p.justificacion, '')
             ) order by p.orden)
        from public.preguntas p
        left join public.respuestas r on r.pregunta_id = p.id and r.envio_id = v.id
       where p.evaluacion_id = e.id and p.tipo <> 'escala'
    ), '[]'::jsonb)
  );
end
$$;

-- ── Permisos de las funciones ────────────────────────────────────────────────

revoke all on function public.texto_respuesta(public.preguntas, text) from public, anon, authenticated;

revoke all on function public.obtener_evaluacion(text) from public, anon, authenticated;
revoke all on function public.buscar_envio_previo(uuid, uuid) from public, anon, authenticated;
revoke all on function public.enviar_respuestas(text, uuid, uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.obtener_resultado(uuid) from public, anon, authenticated;

grant execute on function public.obtener_evaluacion(text) to anon, authenticated;
grant execute on function public.buscar_envio_previo(uuid, uuid) to anon, authenticated;
grant execute on function public.enviar_respuestas(text, uuid, uuid, text, jsonb, text) to anon, authenticated;
grant execute on function public.obtener_resultado(uuid) to anon, authenticated;
