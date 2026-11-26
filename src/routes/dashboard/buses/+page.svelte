<script lang="ts">
	import { onMount } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
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
	<header class="mb-5 flex flex-wrap items-end justify-between gap-3">
		<div>
			<p class="text-[10px] tracking-[0.18em] text-muted uppercase">Operación</p>
			<h1 class="mt-1 text-xl font-semibold tracking-tight">Flota</h1>
			<p class="mt-0.5 text-[11px] text-muted">
				{buses.length}
				{buses.length === 1 ? 'bus registrado' : 'buses registrados'}
			</p>
		</div>

		{#if session.canManage}
			<button
				type="button"
				onclick={() => (showForm = !showForm)}
				class="rounded-md bg-live px-3 py-1.5 text-[11px] font-semibold text-page transition hover:bg-live/90"
			>
				{showForm ? 'Cancelar' : '+ Nuevo bus'}
			</button>
		{:else}
			<span
				class="rounded-md border border-warn/30 bg-warn/10 px-2.5 py-1 text-[10px] font-medium text-warn"
			>
				Tu rol no permite editar la flota
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
			onsubmit={createBus}
			class="mb-5 grid grid-cols-1 gap-3 rounded-md border border-hairline bg-panel p-4 sm:grid-cols-2 lg:grid-cols-5"
		>
			<div class="lg:col-span-1">
				<label for="plate" class="mb-1 block text-[10px] text-muted">Placa</label>
				<input
					id="plate"
					required
					maxlength="10"
					bind:value={form.plate}
					placeholder="T1A-234"
					class="w-full rounded-md border border-hairline bg-raised px-2.5 py-1.5 text-[11px] text-ink uppercase placeholder:text-muted/60 placeholder:normal-case focus:border-live focus:ring-0"
				/>
			</div>

			<div class="lg:col-span-1">
				<label for="route" class="mb-1 block text-[10px] text-muted">Ruta</label>
				<div class="relative">
					<select
						id="route"
						bind:value={form.route_id}
						class="w-full appearance-none rounded-md border border-hairline bg-raised py-1.5 pr-7 pl-2.5 text-[11px] text-ink focus:border-white/20 focus:ring-0"
					>
						<option value="">Sin asignar</option>
						{#each routes as route (route.id)}
							<option value={route.id}>{route.short_code} · {route.name}</option>
						{/each}
					</select>
					<ChevronDown
						class="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
					/>
				</div>
			</div>

			<div>
				<label for="capacity" class="mb-1 block text-[10px] text-muted">Capacidad</label>
				<input
					id="capacity"
					type="number"
					min="1"
					max="120"
					bind:value={form.capacity}
					class="w-full rounded-md border border-hairline bg-raised px-2.5 py-1.5 text-[11px] text-ink focus:border-live focus:ring-0"
				/>
			</div>

			<div>
				<label for="status" class="mb-1 block text-[10px] text-muted">Estado</label>
				<div class="relative">
					<select
						id="status"
						bind:value={form.status}
						class="w-full appearance-none rounded-md border border-hairline bg-raised py-1.5 pr-7 pl-2.5 text-[11px] text-ink focus:border-white/20 focus:ring-0"
					>
						{#each STATUSES as status (status)}
							<option value={status}>{BUS_STATUS_LABEL[status]}</option>
						{/each}
					</select>
					<ChevronDown
						class="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
					/>
				</div>
			</div>

			<div class="flex items-end">
				<button
					type="submit"
					disabled={saving}
					class="w-full rounded-md border border-hairline bg-raised px-3 py-1.5 text-[11px] font-medium text-ink transition hover:bg-white/[0.06] disabled:opacity-60"
				>
					{saving ? 'Guardando…' : 'Registrar bus'}
				</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<p class="py-10 text-center text-[11px] text-muted">Cargando flota…</p>
	{:else if buses.length === 0}
		<div class="rounded-md border border-dashed border-hairline px-4 py-10 text-center">
			<p class="text-sm text-ink">Todavía no hay buses registrados.</p>
			<p class="mt-1 text-[11px] text-muted">
				Crea el primero o aplica el seed data de la sección 7.5 del plan.
			</p>
		</div>
	{:else}
		<div class="overflow-x-auto rounded-md border border-hairline">
			<table class="w-full min-w-[640px] text-left text-[11px]">
				<thead class="bg-raised text-[10px] tracking-wide text-muted uppercase">
					<tr>
						<th class="px-3 py-2 font-medium">Placa</th>
						<th class="px-3 py-2 font-medium">Ruta</th>
						<th class="px-3 py-2 font-medium">Capacidad</th>
						<th class="px-3 py-2 font-medium">Estado</th>
						<th class="px-3 py-2 font-medium">Conductor</th>
						<th class="px-3 py-2 text-right font-medium">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-hairline">
					{#each buses as bus (bus.id)}
						<tr class="transition hover:bg-white/[0.02]">
							<td class="px-3 py-2 font-medium text-ink">{bus.plate}</td>
							<td class="px-3 py-2">
								{#if session.canManage}
									<div class="relative inline-block">
										<select
											value={bus.route_id ?? ''}
											onchange={(event) =>
												updateRoute(bus, (event.currentTarget as HTMLSelectElement).value)}
											class="w-48 appearance-none rounded border border-hairline bg-raised py-1 pr-6 pl-1.5 text-[10px] text-ink focus:border-white/20 focus:ring-0"
										>
											<option value="">Sin asignar</option>
											{#each routes as route (route.id)}
												<option value={route.id}>{route.short_code} · {route.name}</option>
											{/each}
										</select>
										<ChevronDown
											class="pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 -translate-y-1/2 text-muted"
										/>
									</div>
								{:else}
									<span class="text-muted">
										{bus.routes ? `${bus.routes.short_code} · ${bus.routes.name}` : 'Sin asignar'}
									</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-muted tabular-nums">{bus.capacity}</td>
							<td class="px-3 py-2">
								{#if session.canManage}
									<div class="relative inline-block">
										<select
											value={bus.status}
											onchange={(event) =>
												updateStatus(
													bus,
													(event.currentTarget as HTMLSelectElement).value as BusStatus
												)}
											class="appearance-none rounded border py-1 pr-6 pl-1.5 text-[10px] focus:border-white/20 focus:ring-0 {bus.status ===
											'active'
												? 'border-ok/30 bg-ok/10 text-ok'
												: bus.status === 'maintenance'
													? 'border-warn/30 bg-warn/10 text-warn'
													: 'border-hairline bg-raised text-muted'}"
										>
											{#each STATUSES as status (status)}
												<option value={status}>{BUS_STATUS_LABEL[status]}</option>
											{/each}
										</select>
										<ChevronDown
											class="pointer-events-none absolute top-1/2 right-1.5 h-3 w-3 -translate-y-1/2 text-muted"
										/>
									</div>
								{:else}
									<span
										class="rounded border px-2 py-0.5 text-[10px] {bus.status === 'active'
											? 'border-ok/30 text-ok'
											: bus.status === 'maintenance'
												? 'border-warn/30 text-warn'
												: 'border-hairline text-muted'}"
									>
										{BUS_STATUS_LABEL[bus.status]}
									</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-muted">
								{bus.driver_id ? bus.driver_id.slice(0, 8) : '—'}
							</td>
							<td class="px-3 py-2 text-right">
								{#if session.canManage}
									<button
										type="button"
										onclick={() => removeBus(bus)}
										class="rounded px-2 py-1 text-[10px] text-muted transition hover:bg-warn/10 hover:text-warn"
									>
										Eliminar
									</button>
								{:else}
									<span class="text-[10px] text-muted">—</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<p class="mt-4 text-[10px] text-muted">
		Los conductores se asignan desde Supabase Auth → <code>profiles.role = 'driver'</code>. Los
		cambios de estado se propagan al panel sin recargar si habilitas Realtime en la tabla
		<code>buses</code>.
	</p>
</div>
