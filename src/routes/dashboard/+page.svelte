<script lang="ts">
	import { onMount } from 'svelte';
	import BusList from '#lib/components/BusList.svelte';
	import Map from '#lib/components/Map.svelte';
	import RouteSelector from '#lib/components/RouteSelector.svelte';
	import { friendlyError } from '#lib/format';
	import { MAP_STYLE, supabase } from '#lib/supabase';
	import { busTracker } from '#lib/stores/bus-tracker.svelte';
	import { session } from '#lib/stores/session.svelte';
	import type { BusPosition, BusRoute } from '#lib/types';

	let routes = $state<BusRoute[]>([]);
	let routesError = $state<string | null>(null);
	let routeFilter = $state<string | null>(null);
	let selectedBusId = $state<string | null>(null);

	let simulating = $state(false);
	let simError = $state<string | null>(null);
	let simTimer: ReturnType<typeof setInterval> | null = null;

	const visibleBuses = $derived(
		routeFilter ? busTracker.list.filter((bus) => bus.route_id === routeFilter) : busTracker.list
	);

	const filteredRoute = $derived(routes.find((route) => route.id === routeFilter) ?? null);

	onMount(() => {
		void (async () => {
			const { data, error } = await supabase
				.from('routes')
				.select('*')
				.eq('is_active', true)
				.order('short_code');

			if (error) routesError = friendlyError(error.message);
			else routes = (data ?? []) as BusRoute[];
		})();

		return () => stopSimulator();
	});

	function buildMockPosition(angle: number): BusPosition {
		const route = filteredRoute ?? routes[0] ?? null;
		return {
			bus_id: 'sim-bus-01',
			route_id: route?.id ?? 'sim',
			plate: 'SIM-001',
			lat: -18.0146 + Math.sin(angle) * 0.008,
			lng: -70.2505 + Math.cos(angle) * 0.008,
			heading: (angle * 57.2958) % 360,
			speed: 34,
			updated_at: new Date().toISOString()
		};
	}

	async function tick(angle: number) {
		const position = buildMockPosition(angle);
		const sent = await busTracker.publish(position);
		// Si el socket no está unido, el broadcast puede salir por REST y no volver
		// al emisor: aplicamos la posición localmente para que el mapa no quede vacío.
		if (!sent || busTracker.status !== 'live') busTracker.applyPosition(position);
		simError = busTracker.lastError;
	}

	function toggleSimulator() {
		if (simulating) {
			stopSimulator();
			return;
		}

		simulating = true;
		simError = null;
		let angle = 0;

		void tick(angle);
		simTimer = setInterval(() => {
			angle += 0.05;
			void tick(angle);
		}, 3_000);
	}

	function stopSimulator() {
		if (simTimer) {
			clearInterval(simTimer);
			simTimer = null;
		}
		simulating = false;
	}

	function updateRouteFilter(routeId: string | null) {
		routeFilter = routeId;
		// Si el bus seleccionado deja de estar visible, limpiamos la selección.
		if (routeId === null) return;
		const stillVisible = busTracker.list.some(
			(bus) => bus.bus_id === selectedBusId && bus.route_id === routeId
		);
		if (!stillVisible) selectedBusId = null;
	}
</script>

<div class="flex h-full min-h-0 flex-col lg:flex-row">
	<section
		class="flex w-full shrink-0 flex-col border-b border-neutral-800 lg:w-80 lg:border-r lg:border-b-0"
	>
		<div class="grid grid-cols-2 gap-2 p-3">
			<div class="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
				<p class="text-[10px] tracking-wide text-neutral-500 uppercase">En línea</p>
				<p class="mt-0.5 text-2xl font-black text-amber-400 tabular-nums">
					{busTracker.count}
				</p>
			</div>
			<div class="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
				<p class="text-[10px] tracking-wide text-neutral-500 uppercase">Visibles</p>
				<p class="mt-0.5 text-2xl font-black text-white tabular-nums">
					{visibleBuses.length}
				</p>
			</div>
		</div>

		<div class="flex items-center justify-between gap-2 px-3 pb-3">
			<RouteSelector {routes} value={routeFilter} onChange={updateRouteFilter} />
			{#if session.canManage}
				<button
					type="button"
					onclick={toggleSimulator}
					class="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition {simulating
						? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
						: 'border border-neutral-800 text-neutral-300 hover:bg-neutral-800'}"
				>
					{simulating ? 'Detener simulación' : 'Simular bus'}
				</button>
			{/if}
		</div>

		{#if routesError}
			<p
				class="mx-3 mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200"
			>
				{routesError}
			</p>
		{/if}

		{#if simError}
			<p
				class="mx-3 mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-300"
			>
				{simError}
			</p>
		{/if}

		<div class="min-h-0 flex-1 overflow-y-auto border-t border-neutral-800">
			<BusList
				buses={visibleBuses}
				selectedId={selectedBusId}
				onSelect={(busId) => (selectedBusId = selectedBusId === busId ? null : busId)}
				emptyMessage={routeFilter
					? 'Ningún bus de esta ruta está reportando.'
					: 'Aún no hay señales. Enciende el simulador o espera al conductor.'}
			/>
		</div>

		{#if selectedBusId}
			{@const selected = visibleBuses.find((bus) => bus.bus_id === selectedBusId)}
			{#if selected}
				<div class="border-t border-neutral-800 p-3">
					<p class="text-[10px] tracking-wide text-neutral-500 uppercase">Detalle</p>
					<div class="mt-1 space-y-1 text-[11px] text-neutral-300">
						<p>Placa: <span class="font-semibold text-white">{selected.plate}</span></p>
						<p>
							Coordenadas:
							<span class="tabular-nums">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</span>
						</p>
						<p>Rumbo: <span class="tabular-nums">{Math.round(selected.heading)}°</span></p>
						<p>Velocidad: <span class="tabular-nums">{Math.round(selected.speed)} km/h</span></p>
					</div>
				</div>
			{/if}
		{/if}
	</section>

	<section class="relative flex min-h-[320px] flex-1 flex-col">
		<Map buses={visibleBuses} {selectedBusId} mapStyle={MAP_STYLE} />

		<div
			class="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-neutral-800 bg-neutral-950/85 px-2.5 py-1.5 text-[10px] text-neutral-400 backdrop-blur"
		>
			Supabase Realtime · canal <code class="text-amber-400">buses-live</code> · evento
			<code class="text-amber-400">bus-location</code>
		</div>
	</section>
</div>
