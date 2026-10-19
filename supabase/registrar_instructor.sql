-- Registra como instructor a un usuario que ya existe en Authentication → Users.
-- Cambiá el correo por el de la cuenta que creaste.
insert into public.instructores (user_id)
select id from auth.users where lower(email) = lower('vjcb016@gmail.com')
on conflict (user_id) do nothing;

-- Para comprobar: tiene que aparecer una fila con tu correo
select u.email, i.creado_en
  from public.instructores i
  join auth.users u on u.id = i.user_id;
