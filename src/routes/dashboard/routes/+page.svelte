<script lang="ts">
	import { onMount } from 'svelte';
	import { friendlyError } from '#lib/format';
	import { supabase } from '#lib/supabase';
	import { session } from '#lib/stores/session.svelte';
	import type { BusRoute } from '#lib/types';

	let routes = $state<BusRoute[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let notice = $state<string | null>(null);
	let showForm = $state(false);

	let form = $state({
		name: '',
		short_code: '',
		color: '#f59e0b',
		description: ''
	});

	onMount(async () => {
		await loadRoutes();
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

	function resetForm() {
		form = { name: '', short_code: '', color: '#f59e0b', description: '' };
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
	<header class="mb-5 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-lg font-bold">Rutas</h1>
			<p class="text-xs text-neutral-500">
				{routes.length}
				{routes.length === 1 ? 'ruta registrada' : 'rutas registradas'}
			</p>
		</div>

		{#if session.canManage}
			<button
				type="button"
				onclick={() => (showForm = !showForm)}
				class="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-amber-400"
			>
				{showForm ? 'Cancelar' : '+ Nueva ruta'}
			</button>
		{:else}
			<span
				class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-300"
			>
				Tu rol no permite editar rutas
			</span>
		{/if}
	</header>

	{#if error}
		<p
			class="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
		>
			{error}
		</p>
	{/if}
	{#if notice}
		<p
			class="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
		>
			{notice}
		</p>
	{/if}

	{#if showForm && session.canManage}
		<form
			onsubmit={createRoute}
			class="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:grid-cols-2 lg:grid-cols-6"
		>
			<div class="lg:col-span-2">
				<label for="name" class="mb-1 block text-[11px] text-neutral-400">Nombre</label>
				<input
					id="name"
					required
					bind:value={form.name}
					placeholder="Ruta A - Alto de la Alianza"
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:ring-0"
				/>
			</div>

			<div>
				<label for="short_code" class="mb-1 block text-[11px] text-neutral-400">Código</label>
				<input
					id="short_code"
					required
					maxlength="6"
					bind:value={form.short_code}
					placeholder="A"
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white uppercase placeholder:text-neutral-600 placeholder:normal-case focus:border-amber-500 focus:ring-0"
				/>
			</div>

			<div>
				<label for="color" class="mb-1 block text-[11px] text-neutral-400">Color</label>
				<input
					id="color"
					type="color"
					bind:value={form.color}
					class="h-8 w-full cursor-pointer rounded-lg border border-neutral-800 bg-neutral-950 p-0.5"
				/>
			</div>

			<div class="lg:col-span-2">
				<label for="description" class="mb-1 block text-[11px] text-neutral-400">
					Descripción <span class="text-neutral-600">(opcional)</span>
				</label>
				<input
					id="description"
					bind:value={form.description}
					placeholder="Terminal → Centro → Pocollay"
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:ring-0"
				/>
			</div>

			<div class="flex items-end">
				<button
					type="submit"
					disabled={saving}
					class="w-full rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-60"
				>
					{saving ? 'Guardando…' : 'Crear ruta'}
				</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<p class="py-10 text-center text-xs text-neutral-500">Cargando rutas…</p>
	{:else if routes.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-800 px-4 py-10 text-center">
			<p class="text-sm text-neutral-400">Todavía no hay rutas.</p>
			<p class="mt-1 text-xs text-neutral-600">
				La geometría (LineString) se carga por SQL con PostGIS; aquí solo se gestionan los
				metadatos.
			</p>
		</div>
	{:else}
		<ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{#each routes as route (route.id)}
				<li class="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
					<div class="flex items-start justify-between gap-2">
						<div class="flex min-w-0 items-center gap-2.5">
							<span
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black text-black"
								style="background-color: {route.color}"
							>
								{route.short_code}
							</span>
							<div class="min-w-0">
								<p class="truncate text-sm font-semibold text-white">{route.name}</p>
								<p class="truncate text-[11px] text-neutral-500">
									{route.description ?? 'Sin descripción'}
								</p>
							</div>
						</div>

						<span
							class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] {route.is_active
								? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
								: 'border-neutral-700 bg-neutral-800/60 text-neutral-400'}"
						>
							{route.is_active ? 'Activa' : 'Inactiva'}
						</span>
					</div>

					{#if session.canManage}
						<div
							class="mt-3 flex items-center justify-between gap-2 border-t border-neutral-800 pt-3"
						>
							<button
								type="button"
								onclick={() => toggleActive(route)}
								class="rounded px-2 py-1 text-[11px] text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
							>
								{route.is_active ? 'Desactivar' : 'Activar'}
							</button>
							<button
								type="button"
								onclick={() => removeRoute(route)}
								class="rounded px-2 py-1 text-[11px] text-neutral-500 transition hover:bg-red-500/10 hover:text-red-300"
							>
								Eliminar
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<p class="mt-4 text-[11px] text-neutral-600">
		Para dibujar el recorrido en el mapa, agrega la <code>geometry</code> con
		<code>ST_GeomFromText('LINESTRING(...)', 4326)</code> o desde un GeoJSON importado con PostGIS.
	</p>
</div>
