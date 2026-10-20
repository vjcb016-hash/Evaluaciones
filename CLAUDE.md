# App de Evaluaciones — VC Prevención y CBVL

Aplicación web para tomar evaluaciones al final de capacitaciones y charlas. Los participantes entran desde el celular con un QR o link, sin crear cuenta. El instructor (Vidal Caballero) crea las evaluaciones, las habilita y descarga los resultados en Excel.

Idioma: todo en **español de Paraguay** (voseo: «tenés», «podés»). Código y nombres de tablas también en español cuando sea natural.

## Reglas del proyecto

- **Costo cero.** Solo servicios con plan gratuito: Supabase (base de datos y login del instructor) y Vercel (hosting). Nada que requiera tarjeta.
- **Trabajo por etapas.** Hacé solo lo que pide la etapa actual. Al terminar cada etapa, explicá qué hiciste en lenguaje simple y cómo probarlo. No avances a la siguiente sin confirmación.
- **El usuario no es programador.** Antes de comandos que instalan algo o borran archivos, explicá en una línea qué hacen. Si falta una herramienta (por ejemplo Node.js), guiá la instalación paso a paso.
- **Seguridad de las respuestas correctas.** El celular del participante NUNCA debe recibir la respuesta correcta ni la justificación antes de enviar. La corrección se calcula en la base de datos (función de Postgres), no en el navegador.
- **Claves.** Solo la clave pública (anon / publishable) va en el frontend, en `.env.local`, que no se sube a GitHub. La clave secreta (service_role / secret) no se usa en el frontend ni se pega en el chat.
- Pensado primero para celular (390 px de ancho), que también funcione bien en tablet.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Supabase (`@supabase/supabase-js`)
- Exportar Excel en el navegador con SheetJS (`xlsx`)
- Hosting: Vercel (etapa 4)

## Marcas

Una sola app, varias marcas. Cada evaluación tiene una marca y el participante ve el logo y colores de esa marca.

| Token | VC Prevención (`vc`) | CBVL (`cbvl`) | SSMA (`ssma`) |
| --- | --- | --- | --- |
| Nombre visible | VC Prevención y Capacitación | Bomberos Voluntarios de Luque | SSMA Consultora |
| Logo | `public/marcas/vc_logo.svg` | `public/marcas/cbvl_logo.png` | `public/marcas/ssma_logo.png` (horizontal) |
| Ícono cuadrado | el mismo logo | el mismo logo | `public/marcas/ssma_icono.png` |
| Acento (botones, selección) | `#C8140A` | `#2B2A7C` | `#1E2A5E` |
| Acento hover | `#9E0F07` | `#1E1D5C` | `#151E45` |
| Tinte suave (selección, chips) | `#FDF1EF` / `#FCE9E7` | `#EFEFF8` / `#E9E9F5` | `#EEF0F6` / `#E5E8F1` |
| Fondo | `#F4F4F2` | `#F2F3F7` | `#F2F4F7` |
| Texto | `#1B1B1B` | `#1B1B22` | `#1A1D29` |
| Texto secundario | `#5A5A57` | `#55556A` | `#545B70` |
| Detalle especial | — | Franja superior amarilla `#F2D30F` en tarjetas principales | — |

Agregar una marca: logo (y un ícono cuadrado si el logo es horizontal) en `public/marcas`, entrada en `src/marcas.ts`, colores en `src/index.css` (`[data-marca="…"]`), el tipo `Marca` en `src/tipos.ts` y una migración que amplíe el `check` de `evaluaciones.marca`.

Colores comunes: correcta `#135C33` sobre `#E3F1E8`; incorrecta `#8F0D06` sobre `#FCE9E7`. Siempre acompañar el color con ícono y texto («Correcta» / «Incorrecta»).

Tipografía (Google Fonts): títulos en **Source Serif 4** (700), texto en **Source Sans 3** (400–700). Botones de 54 px de alto, bordes redondeados de 14 px, opciones de respuesta de al menos 60 px de alto.

## Pantallas del participante (diseño aprobado)

1. **Inicio:** logo, nombre de la institución, título de la evaluación, instructor, fecha y lugar (opcional), chips (cantidad de preguntas, nota mínima o «Sin nota mínima», hora de cierre), campo «Nombre y apellido», botón «Comenzar evaluación», aviso de intento único.
2. **Pregunta de opción múltiple:** encabezado con logo, título, nombre del participante, tiempo restante; barra de progreso «Pregunta N de M»; opciones A–D como botones grandes.
3. **Verdadero / Falso:** dos botones grandes lado a lado con ícono.
4. **Satisfacción (siempre al final, no suma puntaje):** ítems con escala 1 a 5 y campo opcional «Sugerencias o comentarios».
5. **Enviado:** confirmación; si el resultado lo libera el instructor, mensaje de espera que se actualiza solo.
6. **Resultado:** porcentaje, «X de Y correctas», «Aprobado · mínimo N%» (o «Participación registrada» si no hay mínimo), y la revisión de cada pregunta con tu respuesta, la correcta si te equivocaste y el «Por qué».
7. **Evaluación cerrada:** cuando pasó la hora de cierre o el instructor la cerró.

## Reglas de negocio

- Tipos de pregunta: `multiple` (opción múltiple), `vf` (verdadero/falso), `escala` (satisfacción 1–5, sin puntaje).
- Datos del participante: solo nombre y apellido.
- **Un intento por habilitación.** Se limita por dispositivo (identificador guardado en el navegador). Si el instructor vuelve a habilitar la evaluación, es una habilitación nueva y se puede responder otra vez. Avisar al instructor si se repite un nombre.
- **Cierre automático:** el instructor define cuántas horas dura abierta la habilitación.
- **Nota mínima opcional**, definida por el instructor en cada evaluación.
- **Resultado:** el instructor elige «nota inmediata» o «liberar yo». En el segundo caso, el participante espera hasta que el instructor libere.
- Fecha y lugar o empresa: opcionales.
- Hasta ~50 participantes simultáneos por sesión.

## Etapas

1. ✅ Diseño de pantallas (aprobado).
2. Proyecto base y base de datos: el participante responde y se guarda de verdad.
3. Panel del instructor: crear evaluaciones, importar preguntas desde Excel, generar QR, habilitar o cerrar, liberar notas, descargar Excel.
4. Publicación en Vercel y prueba con un grupo real.
5. Después: certificados automáticos, modo sin internet, reportes.

## Importación de preguntas (etapa 3)

Las preguntas se generan con Claude a partir del material de la capacitación y se importan con una planilla Excel de formato fijo: `orden`, `tipo`, `enunciado`, `opcion_a`, `opcion_b`, `opcion_c`, `opcion_d`, `respuesta_correcta`, `justificacion`. El instructor siempre revisa antes de publicar.
