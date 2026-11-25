<script lang="ts">
	import { onMount } from 'svelte';
	import { mount, unmount } from 'svelte';
	import BusIcon from '@lucide/svelte/icons/bus';
	import {
		AttributionControl,
		Map as MapLibreMap,
		Marker,
		NavigationControl,
		ScaleControl,
		setWorkerUrl
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { SvelteMap } from 'svelte/reactivity';
	import { MAP_STYLE } from '#lib/supabase';
	import type { BusPosition } from '#lib/types';

	interface Props {
		buses?: BusPosition[];
		center?: [number, number];
		zoom?: number;
		selectedBusId?: string | null;
		mapStyle?: string;
	}

	let {
		buses = [],
		center = [-70.2505, -18.0146],
		zoom = 13,
		selectedBusId = null,
		mapStyle = MAP_STYLE
	}: Props = $props();

	let container: HTMLDivElement;
	let map = $state<MapLibreMap | null>(null);
	let mapError = $state<string | null>(null);
	let followedId: string | null = null;

	type MarkerView = { marker: Marker; icon: ReturnType<typeof mount> };

	const markers = new SvelteMap<string, MarkerView>();

	function markerClass(selected: boolean): string {
		return [
			'flex items-center justify-center w-9 h-9 rounded-full text-sm font-black',
			'shadow-lg ring-2 transition-transform duration-200 will-change-transform',
			selected
				? 'bg-amber-400 text-black ring-white scale-125'
				: 'bg-neutral-900/90 text-amber-400 ring-amber-500/70'
		].join(' ');
	}

	onMount(() => {
		// Vite no emite el worker dinámico de MapLibre; se copia a static/ como .js.
		setWorkerUrl('/maplibre-gl-worker.js');

		const instance = new MapLibreMap({
			container,
			style: mapStyle,
			center,
			zoom,
			attributionControl: false
		});

		instance.addControl(new NavigationControl({ showCompass: true }), 'top-right');
		instance.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');
		// MapLibre/OSM exigen atribución visible: nunca desactivarla.
		instance.addControl(
			new AttributionControl({ compact: true, customAttribution: '© OpenStreetMap' }),
			'bottom-right'
		);

		instance.on('load', () => {
			mapError = null;
		});
		instance.on('error', (event) => {
			mapError ??= event.error?.message || 'No se pudo cargar un recurso del mapa.';
		});

		// El contenedor cambia de tamaño al montar (flex) y con la ventana.
		// Sin resize() MapLibre se queda con el tamaño inicial y dibuja en una franja.
		const observer = new ResizeObserver(() => instance.resize());
		observer.observe(container);
		requestAnimationFrame(() => instance.resize());

		map = instance;

		return () => {
			observer.disconnect();
			for (const view of markers.values()) {
				unmount(view.icon);
				view.marker.remove();
			}
			markers.clear();
			instance.remove();
			map = null;
		};
	});

	// Sincroniza marcadores con la lista de buses en vivo.
	$effect(() => {
		const instance = map;
		if (!instance) return;

		const activeIds = new Set(buses.map((bus) => bus.bus_id));

		for (const [busId, view] of markers) {
			if (!activeIds.has(busId)) {
				unmount(view.icon);
				view.marker.remove();
				markers.delete(busId);
			}
		}

		for (const bus of buses) {
			const selected = bus.bus_id === selectedBusId;
			let view = markers.get(bus.bus_id);

			if (!view) {
				const element = document.createElement('div');
				const marker = new Marker({ element, anchor: 'center' })
					.setLngLat([bus.lng, bus.lat])
					.addTo(instance);
				const icon = mount(BusIcon, { target: element, props: { size: 18, strokeWidth: 2.5 } });
				view = { marker, icon };
				markers.set(bus.bus_id, view);
			}

			const element = view.marker.getElement();
			element.className = markerClass(selected);
			element.title = `${bus.plate} · ${Math.round(bus.speed)} km/h`;

			view.marker.setLngLat([bus.lng, bus.lat]);
		}
	});

	// Sigue al bus seleccionado sin pelear con el usuario en cada actualización.
	$effect(() => {
		const instance = map;
		const busId = selectedBusId;
		if (!instance || !busId) {
			followedId = null;
			return;
		}

		const bus = buses.find((candidate) => candidate.bus_id === busId);
		if (!bus) return;

		if (followedId === busId) {
			instance.jumpTo({ center: [bus.lng, bus.lat] });
		} else {
			followedId = busId;
			instance.easeTo({
				center: [bus.lng, bus.lat],
				zoom: Math.max(instance.getZoom(), 14),
				duration: 700
			});
		}
	});
</script>

<div class="relative min-h-[320px] w-full flex-1">
	<div bind:this={container} class="absolute inset-0"></div>

	{#if mapError}
		<p
			class="pointer-events-none absolute inset-x-3 top-3 rounded-lg border border-red-500/40 bg-neutral-950/95 px-3 py-2 text-[11px] text-red-300"
		>
			Mapa: {mapError}
		</p>
	{/if}
</div>
