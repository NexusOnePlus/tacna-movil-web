<script lang="ts">
	import { onMount } from 'svelte';
	import { friendlyError } from '#lib/format';
	import { supabase } from '#lib/supabase';
	import { session } from '#lib/stores/session.svelte';
	import type { BusRoute } from '#lib/types';

	type StopRow = {
		id: string;
		route_id: string;
		name: string;
		stop_order: number;
	};

	let routes = $state<BusRoute[]>([]);
	let stops = $state<StopRow[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let notice = $state<string | null>(null);
	let showForm = $state(false);

	let form = $state({
		name: '',
		short_code: '',
		color: '#4f8cff',
		description: ''
	});

	onMount(async () => {
		await Promise.all([loadRoutes(), loadStops()]);
		loading = false;
	});

	async function loadRoutes() {
		const { data, error: err } = await supabase.from('routes').select('*').order('short_code');

		if (err) {
			error = friendlyError(err.message);
			return;
		}
		routes = (data ?? []) as BusRoute[];
	}

	async function loadStops() {
		const { data, error: err } = await supabase
			.from('stops')
			.select('id, route_id, name, stop_order')
			.order('stop_order');

		if (err) {
			error ??= friendlyError(err.message);
			return;
		}
		stops = (data ?? []) as StopRow[];
	}

	const groupedStops = $derived.by(() => {
		const map: Record<string, StopRow[]> = {};
		for (const stop of stops) {
			(map[stop.route_id] ??= []).push(stop);
		}
		return map;
	});

	function resetForm() {
		form = { name: '', short_code: '', color: '#4f8cff', description: '' };
	}

	async function createRoute(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		notice = null;
		saving = true;

		const { error: err } = await supabase.from('routes').insert({
			name: form.name.trim(),
			short_code: form.short_code.trim().toUpperCase(),
			color: form.color,
			description: form.description.trim() || null
		});

		saving = false;

		if (err) {
			error = friendlyError(err.message);
			return;
		}

		notice = `Ruta ${form.short_code.trim().toUpperCase()} creada.`;
		resetForm();
		showForm = false;
		await loadRoutes();
	}

	async function toggleActive(route: BusRoute) {
		error = null;
		notice = null;

		const next = !route.is_active;
		const { error: err } = await supabase
			.from('routes')
			.update({ is_active: next, updated_at: new Date().toISOString() })
			.eq('id', route.id);

		if (err) {
			error = friendlyError(err.message);
			return;
		}

		route.is_active = next;
		notice = `Ruta ${route.short_code} ${next ? 'activada' : 'desactivada'}.`;
	}

	async function removeRoute(route: BusRoute) {
		if (
			!confirm(
				`¿Eliminar la ruta ${route.short_code}? Se eliminarán también sus paradas y los buses quedarán sin ruta.`
			)
		)
			return;

		error = null;
		notice = null;

		const { error: err } = await supabase.from('routes').delete().eq('id', route.id);
		if (err) {
			error = friendlyError(err.message);
			return;
		}

		routes = routes.filter((row) => row.id !== route.id);
		notice = `Ruta ${route.short_code} eliminada.`;
	}
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6">
	<header class="mb-5 flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class="text-[10px] tracking-[0.18em] text-muted uppercase">Operación</p>
			<h1 class="mt-1 text-xl font-semibold tracking-tight">Rutas y paradas</h1>
			<p class="mt-0.5 text-[11px] text-muted">
				{routes.length}
				{routes.length === 1 ? 'ruta registrada' : 'rutas registradas'} · {stops.length} paradas
			</p>
		</div>

		{#if session.canManage}
			<button
				type="button"
				onclick={() => (showForm = !showForm)}
				class="rounded-md bg-live px-3 py-1.5 text-[11px] font-semibold text-page transition hover:bg-live/90"
			>
				{showForm ? 'Cancelar' : '+ Nueva ruta'}
			</button>
		{:else}
			<span
				class="rounded-md border border-warn/30 bg-warn/10 px-2.5 py-1 text-[10px] font-medium text-warn"
			>
				Tu rol no permite editar rutas
			</span>
		{/if}
	</header>

	{#if error}
		<p class="mb-4 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-[11px] text-warn">
			{error}
		</p>
	{/if}
	{#if notice}
		<p class="mb-4 rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-[11px] text-ok">
			{notice}
		</p>
	{/if}

	{#if showForm && session.canManage}
		<form
			onsubmit={createRoute}
			class="mb-5 grid grid-cols-1 gap-3 rounded-md border border-hairline bg-panel p-4 sm:grid-cols-2 lg:grid-cols-6"
		>
			<div class="lg:col-span-2">
				<label for="name" class="mb-1 block text-[10px] text-muted">Nombre</label>
				<input
					id="name"
					required
					bind:value={form.name}
					placeholder="Ruta A - Alto de la Alianza"
					class="w-full rounded-md border border-hairline bg-raised px-2.5 py-1.5 text-[11px] text-ink placeholder:text-muted/60 focus:border-live focus:ring-0"
				/>
			</div>

			<div>
				<label for="short_code" class="mb-1 block text-[10px] text-muted">Código</label>
				<input
					id="short_code"
					required
					maxlength="6"
					bind:value={form.short_code}
					placeholder="A"
					class="w-full rounded-md border border-hairline bg-raised px-2.5 py-1.5 text-[11px] text-ink uppercase placeholder:text-muted/60 placeholder:normal-case focus:border-live focus:ring-0"
				/>
			</div>

			<div>
				<label for="color" class="mb-1 block text-[10px] text-muted">Color</label>
				<input
					id="color"
					type="color"
					bind:value={form.color}
					class="h-8 w-full cursor-pointer rounded-md border border-hairline bg-raised p-0.5"
				/>
			</div>

			<div class="lg:col-span-2">
				<label for="description" class="mb-1 block text-[10px] text-muted">
					Descripción <span class="text-muted/60">(opcional)</span>
				</label>
				<input
					id="description"
					bind:value={form.description}
					placeholder="Terminal → Centro → Pocollay"
					class="w-full rounded-md border border-hairline bg-raised px-2.5 py-1.5 text-[11px] text-ink placeholder:text-muted/60 focus:border-live focus:ring-0"
				/>
			</div>

			<div class="flex items-end">
				<button
					type="submit"
					disabled={saving}
					class="w-full rounded-md border border-hairline bg-raised px-3 py-1.5 text-[11px] font-medium text-ink transition hover:bg-white/[0.06] disabled:opacity-60"
				>
					{saving ? 'Guardando…' : 'Crear ruta'}
				</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<p class="py-10 text-center text-[11px] text-muted">Cargando rutas…</p>
	{:else if routes.length === 0}
		<div class="rounded-md border border-dashed border-hairline px-4 py-10 text-center">
			<p class="text-sm text-ink">Todavía no hay rutas.</p>
			<p class="mt-1 text-[11px] text-muted">
				La geometría (LineString) se carga por SQL con PostGIS; aquí solo se gestionan los metadatos
				y las paradas.
			</p>
		</div>
	{:else}
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{#each routes as route (route.id)}
				{@const routeStops = groupedStops[route.id] ?? []}
				<li class="rounded-md border border-hairline bg-panel p-4">
					<div class="flex items-start justify-between gap-2">
						<div class="flex min-w-0 items-center gap-2.5">
							<span
								class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-xs font-semibold text-white"
								style="background-color: {route.color}"
							>
								{route.short_code}
							</span>
							<div class="min-w-0">
								<p class="truncate text-[13px] font-medium text-ink">{route.name}</p>
								<p class="truncate text-[10px] text-muted">
									{route.description ?? 'Sin descripción'}
								</p>
							</div>
						</div>

						<span
							class="shrink-0 rounded border px-2 py-0.5 text-[10px] {route.is_active
								? 'border-ok/30 bg-ok/10 text-ok'
								: 'border-hairline bg-raised text-muted'}"
						>
							{route.is_active ? 'Activa' : 'Inactiva'}
						</span>
					</div>

					<div class="mt-3 border-t border-hairline pt-2">
						<div class="flex items-center justify-between text-[10px] text-muted">
							<span>Paradas</span>
							<span class="tabular-nums">{routeStops.length}</span>
						</div>
						{#if routeStops.length === 0}
							<p class="mt-1 text-[10px] text-muted/70">Sin paradas cargadas.</p>
						{:else}
							<ol class="mt-1.5 space-y-1">
								{#each routeStops.slice(0, 5) as stop (stop.id)}
									<li class="flex items-baseline gap-2 text-[11px]">
										<span class="w-4 shrink-0 text-right text-muted tabular-nums"
											>{stop.stop_order}</span
										>
										<span class="truncate text-ink/90">{stop.name}</span>
									</li>
								{/each}
							</ol>
							{#if routeStops.length > 5}
								<p class="mt-1 text-[10px] text-muted">+{routeStops.length - 5} más</p>
							{/if}
						{/if}
					</div>

					{#if session.canManage}
						<div class="mt-3 flex items-center justify-between gap-2 border-t border-hairline pt-2">
							<button
								type="button"
								onclick={() => toggleActive(route)}
								class="rounded px-2 py-1 text-[10px] text-muted transition hover:bg-white/[0.04] hover:text-ink"
							>
								{route.is_active ? 'Desactivar' : 'Activar'}
							</button>
							<button
								type="button"
								onclick={() => removeRoute(route)}
								class="rounded px-2 py-1 text-[10px] text-muted transition hover:bg-warn/10 hover:text-warn"
							>
								Eliminar
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<p class="mt-4 text-[10px] text-muted">
		Para dibujar el recorrido en el mapa, agrega la <code>geometry</code> con
		<code>ST_GeomFromText('LINESTRING(...)', 4326)</code> o desde un GeoJSON importado con PostGIS.
	</p>
</div>
