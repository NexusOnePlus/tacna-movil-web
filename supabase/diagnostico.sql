-- Diagnóstico del panel de operadores.
-- Ejecuta el BLOQUE 1 completo: devuelve una sola tabla con el estado real.
-- Luego el BLOQUE 2 para comprobar qué ve el usuario autenticado con RLS.
-- Nada de esto modifica datos.

-- ============================================================
-- BLOQUE 1: resumen de usuario, tablas, políticas y permisos
-- ============================================================
select seccion, detalle
from (
	select
		'1-usuario' as seccion,
		u.email
			|| ' · confirmado: '
			|| case when u.email_confirmed_at is null then 'NO' else 'sí' end
			|| ' · rol: '
			|| coalesce(p.role::text, 'SIN FILA EN profiles') as detalle
	from auth.users u
	left join public.profiles p on p.id = u.id

	union all

	select
		'2-tablas',
		c.relname
			|| ' · RLS '
			|| case when c.relrowsecurity then 'activo' else 'INACTIVO' end
	from pg_class c
	join pg_namespace n on n.oid = c.relnamespace
	where n.nspname = 'public'
		and c.relkind = 'r'
		and c.relname in ('profiles', 'routes', 'stops', 'buses', 'bus_positions')

	union all

	select
		'3-politicas',
		tablename || ' · ' || cmd || ' · ' || policyname
	from pg_policies
	where schemaname = 'public'
		and tablename in ('profiles', 'routes', 'stops', 'buses', 'bus_positions')

	union all

	select
		'4-conteo',
		tablename || ': ' || count(*) || ' políticas'
	from pg_policies
	where schemaname = 'public'
		and tablename in ('profiles', 'routes', 'stops', 'buses', 'bus_positions')
	group by tablename

	union all

	select
		'5-grants',
		table_name || ' · ' || grantee || ' · ' || privilege_type
	from information_schema.role_table_grants
	where table_schema = 'public'
		and grantee in ('anon', 'authenticated')
		and table_name in ('profiles', 'routes', 'stops', 'buses', 'bus_positions')

	union all

	select
		'6-helper',
		case
			when exists (
				select 1
				from pg_proc p
				join pg_namespace n on n.oid = p.pronamespace
				where n.nspname = 'public' and p.proname = 'current_user_role'
			)
			then 'current_user_role existe'
			else 'FALTA current_user_role'
		end
) as diagnostico
order by seccion, detalle;

-- ============================================================
-- BLOQUE 2: simula al usuario autenticado (prueba real de RLS)
-- Reemplaza el UUID por el de Authentication → Users.
-- ============================================================
select set_config(
	'request.jwt.claims',
	json_build_object('sub', '<uuid-del-usuario>', 'role', 'authenticated')::text,
	false
);

set role authenticated;

select 'rol detectado' as prueba, coalesce(public.current_user_role()::text, 'NULL') as valor
union all
select 'rutas visibles', count(*)::text from public.routes
union all
select 'buses visibles', count(*)::text from public.buses
union all
select 'perfiles visibles', count(*)::text from public.profiles;

reset role;

-- ============================================================
-- BLOQUE 3 (opcional): asigna admin a un usuario
-- Cambia el correo antes de ejecutar.
-- ============================================================
-- with objetivo as (
-- 	select id, email, raw_user_meta_data
-- 	from auth.users
-- 	where email = '<correo-del-usuario>'
-- )
-- insert into public.profiles (id, full_name, role)
-- select
-- 	o.id,
-- 	coalesce(o.raw_user_meta_data ->> 'full_name', split_part(o.email, '@', 1)),
-- 	'admin'
-- from objetivo o
-- on conflict (id) do update set role = 'admin', updated_at = now();
