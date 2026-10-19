-- ═════════════════════════════════════════════════════════════════════════════
-- Consultas útiles para probar mientras no existe el panel del instructor.
-- En Supabase → SQL Editor, pegá SOLO la consulta que necesites y tocá «Run».
-- ═════════════════════════════════════════════════════════════════════════════

-- Ver quién respondió (más recientes primero)
select ev.slug, en.nombre, en.correctas, en.total, en.porcentaje, en.comentario, en.enviado_en
  from public.envios en
  join public.habilitaciones h on h.id = en.habilitacion_id
  join public.evaluaciones ev on ev.id = h.evaluacion_id
 order by en.enviado_en desc;

-- Liberar las notas de demo-cbvl (habilitación vigente)
update public.habilitaciones set notas_liberadas = true
 where id = (select h.id from public.habilitaciones h
               join public.evaluaciones e on e.id = h.evaluacion_id
              where e.slug = 'demo-cbvl'
              order by h.abierta_en desc limit 1);

-- Volver a habilitar una evaluación (habilitación nueva: todos pueden responder otra vez)
-- Cambiá 'demo-vc' por el slug que quieras y '3 hours' por la duración.
insert into public.habilitaciones (evaluacion_id, cierra_en)
select id, now() + interval '3 hours' from public.evaluaciones where slug = 'demo-vc';

-- Cerrar ya la habilitación vigente de una evaluación
update public.habilitaciones set cerrada_por_instructor = true
 where id = (select h.id from public.habilitaciones h
               join public.evaluaciones e on e.id = h.evaluacion_id
              where e.slug = 'demo-vc'
              order by h.abierta_en desc limit 1);
