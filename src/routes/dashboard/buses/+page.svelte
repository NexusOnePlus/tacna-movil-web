<script lang="ts">
	import { onMount } from 'svelte';
	import { friendlyError } from '#lib/format';
	import { supabase } from '#lib/supabase';
	import { session } from '#lib/stores/session.svelte';
	import { BUS_STATUS_LABEL, type Bus, type BusRoute, type BusStatus } from '#lib/types';

	type BusRow = Bus & {
		routes: Pick<BusRoute, 'id' | 'name' | 'short_code' | 'color'> | null;
	};

	const STATUSES: BusStatus[] = ['active', 'inactive', 'maintenance'];

	let buses = $state<BusRow[]>([]);
	let routes = $state<BusRoute[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let notice = $state<string | null>(null);
	let showForm = $state(false);

	let form = $state({
		plate: '',
		route_id: '',
		capacity: 40,
		status: 'inactive' as BusStatus
	});

	onMount(async () => {
		await Promise.all([loadBuses(), loadRoutes()]);
		loading = false;
	});

	async function loadBuses() {
		const { data, error: err } = await supabase
			.from('buses')
			.select('*, routes(id, name, short_code, color)')
			.order('plate');

		if (err) {
			error = friendlyError(err.message);
			return;
		}
		buses = (data ?? []) as unknown as BusRow[];
	}

	async function loadRoutes() {
		const { data, error: err } = await supabase.from('routes').select('*').order('short_code');

		if (err) {
			error ??= friendlyError(err.message);
			return;
		}
		routes = (data ?? []) as BusRoute[];
	}

	function resetForm() {
		form = { plate: '', route_id: '', capacity: 40, status: 'inactive' };
	}

	async function createBus(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		notice = null;
		saving = true;

		const { error: err } = await supabase.from('buses').insert({
			plate: form.plate.trim().toUpperCase(),
			route_id: form.route_id || null,
			capacity: form.capacity,
			status: form.status
		});

		saving = false;

		if (err) {
			error = friendlyError(err.message);
			return;
		}

		notice = `Bus ${form.plate.trim().toUpperCase()} registrado.`;
		resetForm();
		showForm = false;
		await loadBuses();
	}

	async function updateStatus(bus: BusRow, status: BusStatus) {
		error = null;
		notice = null;

		const { error: err } = await supabase
			.from('buses')
			.update({ status, updated_at: new Date().toISOString() })
			.eq('id', bus.id);

		if (err) {
			error = friendlyError(err.message);
			return;
		}

		bus.status = status;
		notice = `${bus.plate}: ${BUS_STATUS_LABEL[status].toLowerCase()}.`;
	}

	async function updateRoute(bus: BusRow, routeId: string) {
		error = null;
		notice = null;

		const { error: err } = await supabase
			.from('buses')
			.update({ route_id: routeId || null, updated_at: new Date().toISOString() })
			.eq('id', bus.id);

		if (err) {
			error = friendlyError(err.message);
			return;
		}

		bus.route_id = routeId || null;
		bus.routes = routes.find((route) => route.id === routeId) ?? null;
	}

	async function removeBus(bus: BusRow) {
		if (!confirm(`¿Eliminar el bus ${bus.plate}? Esta acción no se puede deshacer.`)) return;

		error = null;
		notice = null;

		const { error: err } = await supabase.from('buses').delete().eq('id', bus.id);
		if (err) {
			error = friendlyError(err.message);
			return;
		}

		buses = buses.filter((row) => row.id !== bus.id);
		notice = `Bus ${bus.plate} eliminado.`;
	}
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6">
	<header class="mb-5 flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-lg font-bold">Flota</h1>
			<p class="text-xs text-neutral-500">
				{buses.length}
				{buses.length === 1 ? 'bus registrado' : 'buses registrados'}
			</p>
		</div>

		{#if session.canManage}
			<button
				type="button"
				onclick={() => (showForm = !showForm)}
				class="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-amber-400"
			>
				{showForm ? 'Cancelar' : '+ Nuevo bus'}
			</button>
		{:else}
			<span
				class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-300"
			>
				Tu rol no permite editar la flota
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
			onsubmit={createBus}
			class="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:grid-cols-2 lg:grid-cols-5"
		>
			<div class="lg:col-span-1">
				<label for="plate" class="mb-1 block text-[11px] text-neutral-400">Placa</label>
				<input
					id="plate"
					required
					maxlength="10"
					bind:value={form.plate}
					placeholder="T1A-234"
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white uppercase placeholder:text-neutral-600 placeholder:normal-case focus:border-amber-500 focus:ring-0"
				/>
			</div>

			<div class="lg:col-span-1">
				<label for="route" class="mb-1 block text-[11px] text-neutral-400">Ruta</label>
				<select
					id="route"
					bind:value={form.route_id}
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:ring-0"
				>
					<option value="">Sin asignar</option>
					{#each routes as route (route.id)}
						<option value={route.id}>{route.short_code} · {route.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="capacity" class="mb-1 block text-[11px] text-neutral-400">Capacidad</label>
				<input
					id="capacity"
					type="number"
					min="1"
					max="120"
					bind:value={form.capacity}
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:ring-0"
				/>
			</div>

			<div>
				<label for="status" class="mb-1 block text-[11px] text-neutral-400">Estado</label>
				<select
					id="status"
					bind:value={form.status}
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-500 focus:ring-0"
				>
					{#each STATUSES as status (status)}
						<option value={status}>{BUS_STATUS_LABEL[status]}</option>
					{/each}
				</select>
			</div>

			<div class="flex items-end">
				<button
					type="submit"
					disabled={saving}
					class="w-full rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-60"
				>
					{saving ? 'Guardando…' : 'Registrar bus'}
				</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<p class="py-10 text-center text-xs text-neutral-500">Cargando flota…</p>
	{:else if buses.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-800 px-4 py-10 text-center">
			<p class="text-sm text-neutral-400">Todavía no hay buses registrados.</p>
			<p class="mt-1 text-xs text-neutral-600">
				Crea el primero o aplica el seed data de la sección 7.5 del plan.
			</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-xl border border-neutral-800">
			<table class="w-full min-w-[640px] text-left text-xs">
				<thead class="bg-neutral-900/80 text-[10px] tracking-wide text-neutral-500 uppercase">
					<tr>
						<th class="px-3 py-2 font-medium">Placa</th>
						<th class="px-3 py-2 font-medium">Ruta</th>
						<th class="px-3 py-2 font-medium">Capacidad</th>
						<th class="px-3 py-2 font-medium">Estado</th>
						<th class="px-3 py-2 font-medium">Conductor</th>
						<th class="px-3 py-2 text-right font-medium">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-neutral-800">
					{#each buses as bus (bus.id)}
						<tr class="hover:bg-neutral-900/40">
							<td class="px-3 py-2 font-semibold text-white">{bus.plate}</td>
							<td class="px-3 py-2">
								{#if session.canManage}
									<select
										value={bus.route_id ?? ''}
										onchange={(event) =>
											updateRoute(bus, (event.currentTarget as HTMLSelectElement).value)}
										class="max-w-48 rounded border border-neutral-800 bg-neutral-950 px-1.5 py-1 text-[11px] text-neutral-200 focus:border-amber-500 focus:ring-0"
									>
										<option value="">Sin asignar</option>
										{#each routes as route (route.id)}
											<option value={route.id}>{route.short_code} · {route.name}</option>
										{/each}
									</select>
								{:else}
									<span class="text-neutral-300">
										{bus.routes ? `${bus.routes.short_code} · ${bus.routes.name}` : 'Sin asignar'}
									</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-neutral-400 tabular-nums">{bus.capacity}</td>
							<td class="px-3 py-2">
								{#if session.canManage}
									<select
										value={bus.status}
										onchange={(event) =>
											updateStatus(
												bus,
												(event.currentTarget as HTMLSelectElement).value as BusStatus
											)}
										class="rounded border px-1.5 py-1 text-[11px] focus:ring-0 {bus.status ===
										'active'
											? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
											: bus.status === 'maintenance'
												? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
												: 'border-neutral-800 bg-neutral-950 text-neutral-400'}"
									>
										{#each STATUSES as status (status)}
											<option value={status}>{BUS_STATUS_LABEL[status]}</option>
										{/each}
									</select>
								{:else}
									<span
										class="rounded-full border px-2 py-0.5 text-[10px] {bus.status === 'active'
											? 'border-emerald-500/30 text-emerald-300'
											: 'border-neutral-800 text-neutral-400'}"
									>
										{BUS_STATUS_LABEL[bus.status]}
									</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-neutral-500">
								{bus.driver_id ? bus.driver_id.slice(0, 8) : '—'}
							</td>
							<td class="px-3 py-2 text-right">
								{#if session.canManage}
									<button
										type="button"
										onclick={() => removeBus(bus)}
										class="rounded px-2 py-1 text-[11px] text-neutral-500 transition hover:bg-red-500/10 hover:text-red-300"
									>
										Eliminar
									</button>
								{:else}
									<span class="text-[11px] text-neutral-600">—</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<p class="mt-4 text-[11px] text-neutral-600">
		Los conductores se asignan desde Supabase Auth → <code>profiles.role = 'driver'</code>. Los
		cambios de estado se propagan al panel sin recargar si habilitas Realtime en la tabla
		<code class="text-neutral-500">buses</code>.
	</p>
</div>
