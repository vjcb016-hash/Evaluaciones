-- ═════════════════════════════════════════════════════════════════════════════
-- Evaluaciones de ejemplo: demo-vc, demo-cbvl y demo-cerrada.
-- Pegalo en Supabase → SQL Editor y tocá «Run» DESPUÉS de 001_esquema.sql.
-- Si ya existen, no las duplica.
-- ═════════════════════════════════════════════════════════════════════════════

insert into public.evaluaciones (slug, marca, titulo, instructor, fecha, lugar, nota_minima, modo_resultado)
values
  ('demo-vc',      'vc',   'Uso de extintores portátiles', 'Vidal Caballero', current_date, 'Empresa Demo S.A.', 70,   'inmediato'),
  ('demo-cbvl',    'cbvl', 'Control de hemorragias',       'Vidal Caballero', current_date, null,                null, 'liberar'),
  ('demo-cerrada', 'vc',   'Uso de extintores portátiles', 'Vidal Caballero', null,         null,                70,   'inmediato')
on conflict (slug) do nothing;

-- ── Extintores (VC) ──────────────────────────────────────────────────────────
insert into public.preguntas
  (evaluacion_id, orden, tipo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, justificacion)
select e.id, v.*
  from public.evaluaciones e,
  (values
    (1, 'multiple', '¿Qué clase de fuego corresponde a líquidos inflamables como nafta, gasoil o aceite?',
        'Clase A', 'Clase B', 'Clase C', 'Clase D', 'B',
        'La clase B agrupa los líquidos y gases inflamables: nafta, gasoil, aceites, pinturas y solventes.'),
    (2, 'vf', 'Un extintor de agua se puede usar sobre un tablero eléctrico con corriente.',
        null, null, null, null, 'F',
        'El agua conduce la electricidad y hay riesgo de electrocución. En equipos con corriente (clase C) se usa CO₂ o polvo químico seco.'),
    (3, 'multiple', 'Al usar un extintor, ¿hacia dónde hay que dirigir la descarga?',
        'Hacia la parte más alta de las llamas', 'Hacia el humo', 'A la base del fuego', 'Al centro del ambiente', 'C',
        'En la base está el material que se quema. Apuntar a las llamas o al humo gasta el extintor sin apagar el fuego.'),
    (4, 'escala', 'El contenido fue útil para mi trabajo.', null, null, null, null, null, null),
    (5, 'escala', 'El instructor explicó con claridad.', null, null, null, null, null, null),
    (6, 'escala', 'La práctica con extintores fue suficiente.', null, null, null, null, null, null)
  ) as v (orden, tipo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, justificacion)
 where e.slug in ('demo-vc', 'demo-cerrada')
on conflict (evaluacion_id, orden) do nothing;

-- ── Hemorragias (CBVL) ───────────────────────────────────────────────────────
insert into public.preguntas
  (evaluacion_id, orden, tipo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, justificacion)
select e.id, v.*
  from public.evaluaciones e,
  (values
    (1, 'multiple', '¿Cuál es la primera acción ante una hemorragia externa abundante en un brazo?',
        'Elevar el brazo y esperar', 'Hacer presión directa y firme sobre la herida',
        'Colocar un torniquete en todos los casos', 'Lavar la herida con abundante agua', 'B',
        'La presión directa es el primer paso y controla la mayoría de las hemorragias externas. El torniquete se reserva para cuando la presión no alcanza.'),
    (2, 'vf', 'Si la gasa se empapa de sangre, hay que sacarla y poner una nueva.',
        null, null, null, null, 'F',
        'Al sacarla se arranca el coágulo que se está formando. Se coloca otra gasa encima y se sigue presionando.'),
    (3, 'multiple', 'Sangre roja brillante que sale a chorros, al ritmo del pulso, indica una hemorragia:',
        'Venosa', 'Capilar', 'Arterial', 'Interna', 'C',
        'La sangre arterial es rojo brillante y sale a presión con cada latido. Es la más urgente de controlar.'),
    (4, 'escala', 'El contenido fue útil para mi labor.', null, null, null, null, null, null),
    (5, 'escala', 'El instructor explicó con claridad.', null, null, null, null, null, null),
    (6, 'escala', 'Me siento capaz de aplicar lo aprendido.', null, null, null, null, null, null)
  ) as v (orden, tipo, enunciado, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, justificacion)
 where e.slug = 'demo-cbvl'
on conflict (evaluacion_id, orden) do nothing;

-- ── Habilitaciones ───────────────────────────────────────────────────────────
-- Los ejemplos quedan abiertos 30 días; demo-cerrada cerró ayer.
insert into public.habilitaciones (evaluacion_id, abierta_en, cierra_en)
select e.id, now(), now() + interval '30 days'
  from public.evaluaciones e
 where e.slug in ('demo-vc', 'demo-cbvl')
   and not exists (select 1 from public.habilitaciones h where h.evaluacion_id = e.id);

insert into public.habilitaciones (evaluacion_id, abierta_en, cierra_en)
select e.id, now() - interval '2 days', now() - interval '1 day'
  from public.evaluaciones e
 where e.slug = 'demo-cerrada'
   and not exists (select 1 from public.habilitaciones h where h.evaluacion_id = e.id);
