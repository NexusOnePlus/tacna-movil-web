-- Políticas RLS del panel, corregidas.
-- Idempotente: puedes ejecutarlo completo las veces que quieras.
-- Supabase → SQL Editor → selecciona todo → Run.
--
-- Correcciones respecto al script anterior:
--   1. Incluye los GRANT que faltaban (sin ellos todo falla con 42501).
--   2. Borra las políticas existentes antes de crearlas (ya no da 42710).
--   3. Habilita RLS explícitamente en las cinco tablas.
--   4. Impide que un usuario se autoasigne un rol por API.
--   5. Elimina las políticas de realtime.messages: el canal `buses-live` es
--      público y no las necesita. Esas políticas son solo para canales privados.

-- ============================================================
-- Helper: rol del usuario actual. SECURITY DEFINER evita recursión con RLS.
-- ============================================================
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
	select role from public.profiles where id = (select auth.uid());
$$;

-- ============================================================
-- Limpieza: borra las políticas de estas tablas para poder reejecutar.
-- ============================================================
do $$
declare
	politica record;
begin
	for politica in
		select tablename, policyname
		from pg_policies
		where schemaname = 'public'
			and tablename in ('profiles', 'routes', 'stops', 'buses', 'bus_positions')
	loop
		execute format(
			'drop policy %I on public.%I',
			politica.policyname,
			politica.tablename
		);
	end loop;
end $$;

-- ============================================================
-- RLS y permisos base (la capa que faltaba).
-- ============================================================
alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.stops enable row level security;
alter table public.buses enable row level security;
alter table public.bus_positions enable row level security;

grant usage on schema public to anon, authenticated;

grant select
	on public.profiles, public.routes, public.stops, public.buses, public.bus_positions
	to anon, authenticated;

grant insert, update, delete
	on public.profiles, public.routes, public.stops, public.buses, public.bus_positions
	to authenticated;

grant execute on function public.current_user_role() to anon, authenticated;

-- ============================================================
-- profiles: todos leen, cada uno edita lo suyo (menos el rol).
-- ============================================================
create policy "Perfiles visibles para todos"
	on public.profiles for select
	to authenticated
	using (true);

create policy "Usuarios editan su propio perfil"
	on public.profiles for update
	to authenticated
	using ((select auth.uid()) = id)
	with check ((select auth.uid()) = id);

create policy "Solo admin elimina perfiles"
	on public.profiles for delete
	to authenticated
	using (public.current_user_role() = 'admin');

-- La política de UPDATE permite editar la fila completa. Este trigger impide
-- que el usuario se cambie el rol. El SQL/Table Editor no tiene auth.uid(),
-- así que esas sesiones siguen pudiendo asignar roles.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if new.role is distinct from old.role
		and (select auth.uid()) is not null
		and coalesce(public.current_user_role(), '') <> 'admin'
	then
		raise exception 'Solo un admin puede cambiar roles';
	end if;
	return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
	before update on public.profiles
	for each row
	execute function public.protect_profile_role();

-- ============================================================
-- routes: lectura pública, escritura solo admin.
-- ============================================================
create policy "Rutas visibles para todos"
	on public.routes for select
	to anon, authenticated
	using (true);

create policy "Solo admin crea rutas"
	on public.routes for insert
	to authenticated
	with check (public.current_user_role() = 'admin');

create policy "Solo admin edita rutas"
	on public.routes for update
	to authenticated
	using (public.current_user_role() = 'admin')
	with check (public.current_user_role() = 'admin');

create policy "Solo admin elimina rutas"
	on public.routes for delete
	to authenticated
	using (public.current_user_role() = 'admin');

-- ============================================================
-- stops: lectura pública, escritura solo admin.
-- ============================================================
create policy "Paradas visibles para todos"
	on public.stops for select
	to anon, authenticated
	using (true);

create policy "Solo admin crea paradas"
	on public.stops for insert
	to authenticated
	with check (public.current_user_role() = 'admin');

create policy "Solo admin edita paradas"
	on public.stops for update
	to authenticated
	using (public.current_user_role() = 'admin')
	with check (public.current_user_role() = 'admin');

create policy "Solo admin elimina paradas"
	on public.stops for delete
	to authenticated
	using (public.current_user_role() = 'admin');

-- ============================================================
-- buses: lectura pública, escritura admin/dispatcher.
-- ============================================================
create policy "Buses visibles para todos"
	on public.buses for select
	to anon, authenticated
	using (true);

create policy "Admin y dispatcher crean buses"
	on public.buses for insert
	to authenticated
	with check (public.current_user_role() in ('admin', 'dispatcher'));

create policy "Admin y dispatcher editan buses"
	on public.buses for update
	to authenticated
	using (public.current_user_role() in ('admin', 'dispatcher'))
	with check (public.current_user_role() in ('admin', 'dispatcher'));

create policy "Solo admin elimina buses"
	on public.buses for delete
	to authenticated
	using (public.current_user_role() = 'admin');

-- ============================================================
-- bus_positions: lectura pública, inserción del conductor asignado.
-- ============================================================
create policy "Posiciones visibles para todos"
	on public.bus_positions for select
	to anon, authenticated
	using (true);

create policy "Driver inserta posiciones de su bus"
	on public.bus_positions for insert
	to authenticated
	with check (
		exists (
			select 1
			from public.buses
			where buses.id = bus_positions.bus_id
				and buses.driver_id = (select auth.uid())
		)
	);

-- Refresca la caché de PostgREST para que tome los nuevos permisos.
notify pgrst, 'reload schema';
