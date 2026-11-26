<script lang="ts">
	import { onMount } from 'svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import BusIcon from '@lucide/svelte/icons/bus';
	import Gauge from '@lucide/svelte/icons/gauge';
	import RouteIcon from '@lucide/svelte/icons/route';
	import Wrench from '@lucide/svelte/icons/wrench';
	import { resolve } from '$app/paths';
	import HatchBar from '#lib/components/HatchBar.svelte';
	import Map from '#lib/components/Map.svelte';
	import { formatAgo } from '#lib/format';
	import { MAP_STYLE, supabase } from '#lib/supabase';
	import { busTracker } from '#lib/stores/bus-tracker.svelte';
	import type { Bus, BusRoute } from '#lib/types';

	type BusRow = Pick<Bus, 'id' | 'plate' | 'route_id' | 'status' | 'capacity'>;

	let routes = $state<BusRoute[]>([]);
	let buses = $state<BusRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let now = $state(Date.now());

	onMount(() => {
		const clock = setInterval(() => (now = Date.now()), 1_000);

		void (async () => {
			const [routesResult, busesResult] = await Promise.all([
				supabase.from('routes').select('*').eq('is_active', true).order('short_code'),
				supabase.from('buses').select('id, plate, route_id, status, capacity').order('plate')
			]);

			if (routesResult.error) error = routesResult.error.message;
			else routes = (routesResult.data ?? []) as BusRoute[];

			if (busesResult.error) error ??= busesResult.error.message;
			else buses = (busesResult.data ?? []) as BusRow[];

			loading = false;
		})();

		return () => clearInterval(clock);
	});

	const maintenance = $derived(buses.filter((bus) => bus.status === 'maintenance').length);

	const routeBars = $derived(
		routes.map((route) => ({
			...route,
			count: buses.filter((bus) => bus.route_id === route.id).length
		}))
	);

	const maxRoute = $derived(Math.max(1, ...routeBars.map((row) => row.count)));
	const maxPing = $derived(Math.max(1, ...busTracker.pingsByHour));

	const hourLabels = $derived(
		busTracker.pingsByHour.map((_, index) => {
			const hour = new Date(Date.now() - (5 - index) * 3_600_000).getHours();
			return `${hour}h`;
		})
	);

	const activity = $derived(
		busTracker.list
			.slice()
			.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
			.slice(0, 8)
	);

	const avgPing = $derived(
		busTracker.avgPingMs === null ? '—' : `${(busTracker.avgPingMs / 1_000).toFixed(1)} s`
	);

	function routeLabel(routeId: string): string {
		const route = routes.find((row) => row.id === routeId);
		return route ? `${route.short_code} · ${route.name}` : 'Sin ruta';
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4 sm:p-5">
	<header class="flex shrink-0 flex-wrap items-end justify-between gap-3">
		<div>
			<p class="text-[10px] tracking-[0.18em] text-muted uppercase">Resumen operativo</p>
			<h1 class="mt-1 text-xl font-semibold tracking-tight">Tacna Móvil</h1>
			<p class="mt-0.5 text-[11px] text-muted">
				Flota urbana · {routes.length} rutas · {buses.length} buses registrados
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-3 text-[11px] text-muted">
			<span
				class="flex items-center gap-1.5 rounded-md border border-live/30 bg-live/10 px-2 py-1 text-live"
			>
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-live"></span>
				En vivo
			</span>
			{#if busTracker.lastEventAt}
				<span>último ping {formatAgo(new Date(busTracker.lastEventAt).toISOString(), now)}</span>
			{:else}
				<span>esperando señales</span>
			{/if}
		</div>
	</header>

	{#if error}
		<p class="shrink-0 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-[11px] text-warn">
			{error}
		</p>
	{/if}

	<div class="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
		<article class="rounded-md border border-hairline bg-panel p-3">
			<div class="flex items-center justify-between gap-2">
				<p class="text-[10px] tracking-wide text-muted uppercase">Buses reportando</p>
				<BusIcon class="h-3.5 w-3.5 text-muted" />
			</div>
			<p class="mt-1.5 text-2xl font-semibold text-live tabular-nums">{busTracker.count}</p>
			<p class="mt-0.5 text-[10px] text-muted">de {buses.length} en flota</p>
		</article>

		<article class="rounded-md border border-hairline bg-panel p-3">
			<div class="flex items-center justify-between gap-2">
				<p class="text-[10px] tracking-wide text-muted uppercase">Rutas activas</p>
				<RouteIcon class="h-3.5 w-3.5 text-muted" />
			</div>
			<p class="mt-1.5 text-2xl font-semibold text-ink tabular-nums">{routes.length}</p>
			<p class="mt-0.5 text-[10px] text-muted">de 4 planificadas</p>
		</article>

		<article class="rounded-md border border-hairline bg-panel p-3">
			<div class="flex items-center justify-between gap-2">
				<p class="text-[10px] tracking-wide text-muted uppercase">Ping medio</p>
				<Gauge class="h-3.5 w-3.5 text-muted" />
			</div>
			<p class="mt-1.5 text-2xl font-semibold text-ink tabular-nums">{avgPing}</p>
			<p class="mt-0.5 text-[10px] text-muted">sesión actual</p>
		</article>

		<article class="rounded-md border border-hairline bg-panel p-3">
			<div class="flex items-center justify-between gap-2">
				<p class="text-[10px] tracking-wide text-muted uppercase">En mantenimiento</p>
				<Wrench class="h-3.5 w-3.5 text-muted" />
			</div>
			<p
				class="mt-1.5 text-2xl font-semibold tabular-nums {maintenance > 0
					? 'text-warn'
					: 'text-ink'}"
			>
				{maintenance}
			</p>
			<p class="mt-0.5 text-[10px] text-muted">unidades fuera de servicio</p>
		</article>
	</div>

	<div class="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-3">
		<div class="flex min-h-0 flex-col gap-3 xl:col-span-2">
			<section
				class="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-md border border-hairline bg-panel"
			>
				<header
					class="flex shrink-0 items-center justify-between border-b border-hairline px-3 py-2"
				>
					<h2 class="text-[11px] font-medium text-ink">Mapa en vivo</h2>
					<a
						href={resolve('/dashboard/map')}
						class="flex items-center gap-1 text-[10px] text-muted transition hover:text-live"
					>
						Abrir mapa
						<ArrowUpRight class="h-3 w-3" />
					</a>
				</header>
				<Map buses={busTracker.list} mapStyle={MAP_STYLE} />
			</section>

			<div class="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
				<section class="rounded-md border border-hairline bg-panel p-3">
					<header class="mb-2 flex items-center justify-between">
						<h2 class="text-[11px] font-medium text-ink">Buses por ruta</h2>
						<span class="text-[10px] text-muted">flota</span>
					</header>
					<div class="space-y-1.5">
						{#each routeBars as row (row.id)}
							<div class="grid grid-cols-[28px_1fr_20px] items-center gap-2 text-[10px]">
								<span class="truncate text-muted" title={row.name}>{row.short_code}</span>
								<HatchBar value={row.count} max={maxRoute} tone="live" />
								<span class="text-right text-ink tabular-nums">{row.count}</span>
							</div>
						{:else}
							<p class="py-3 text-center text-[10px] text-muted">Sin rutas activas.</p>
						{/each}
					</div>
				</section>

				<section class="rounded-md border border-hairline bg-panel p-3">
					<header class="mb-2 flex items-center justify-between">
						<h2 class="text-[11px] font-medium text-ink">Pings por hora</h2>
						<span class="text-[10px] text-muted">sesión</span>
					</header>
					<div class="space-y-1.5">
						{#each busTracker.pingsByHour as count, index}
							<div class="grid grid-cols-[24px_1fr_20px] items-center gap-2 text-[10px]">
								<span class="text-muted tabular-nums">{hourLabels[index]}</span>
								<HatchBar value={count} max={maxPing} tone="ok" />
								<span class="text-right text-ink tabular-nums">{count}</span>
							</div>
						{/each}
					</div>
				</section>
			</div>
		</div>

		<section class="flex min-h-[240px] flex-col rounded-md border border-hairline bg-panel">
			<header class="shrink-0 border-b border-hairline px-3 py-2">
				<h2 class="text-[11px] font-medium text-ink">Actividad reciente</h2>
			</header>
			<ul class="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto">
				{#each activity as bus (bus.bus_id)}
					<li class="flex items-center justify-between gap-2 px-3 py-2 text-[11px]">
						<div class="flex min-w-0 items-center gap-2">
							<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-live"></span>
							<span class="truncate font-medium text-ink">{bus.plate}</span>
							<span class="truncate text-muted">{routeLabel(bus.route_id)}</span>
						</div>
						<span class="shrink-0 text-muted tabular-nums">{formatAgo(bus.updated_at, now)}</span>
					</li>
				{:else}
					<li class="grid flex-1 place-items-center px-3 py-6 text-[11px] text-muted">
						{loading ? 'Cargando señales…' : 'Sin señales en esta sesión.'}
					</li>
				{/each}
			</ul>
		</section>
	</div>
</div>
