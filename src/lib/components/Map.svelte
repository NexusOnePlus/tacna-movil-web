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
		setWorkerUrl,
		type GeoJSONSource
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { SvelteMap } from 'svelte/reactivity';
	import type { RouteLines } from '#lib/route-lines';
	import { MAP_STYLE } from '#lib/supabase';
	import type { BusPosition } from '#lib/types';

	interface Props {
		buses?: BusPosition[];
		center?: [number, number];
		zoom?: number;
		selectedBusId?: string | null;
		mapStyle?: string;
		routeLines?: RouteLines | null;
	}

	let {
		buses = [],
		center = [-70.2505, -18.0146],
		zoom = 13,
		selectedBusId = null,
		mapStyle = MAP_STYLE,
		routeLines = null
	}: Props = $props();

	let container: HTMLDivElement;
	let map = $state<MapLibreMap | null>(null);
	let mapReady = $state(false);
	let mapError = $state<string | null>(null);
	let followedId: string | null = null;

	type MarkerView = { marker: Marker; icon: ReturnType<typeof mount> };

	const markers = new SvelteMap<string, MarkerView>();

	function markerClass(selected: boolean): string {
		return [
			'flex items-center justify-center w-8 h-8 rounded-md text-sm',
			'ring-2 transition-transform duration-200 will-change-transform',
			selected ? 'bg-ok text-page ring-white scale-125' : 'bg-panel/95 text-live ring-live/60'
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
			mapReady = true;
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
			mapReady = false;
		};
	});

	// Dibuja las líneas de ruta cuando llega la geometría.
	$effect(() => {
		const instance = map;
		const ready = mapReady;
		const data = routeLines;
		if (!instance || !ready || !data) return;

		const sourceId = 'route-lines';
		const source = instance.getSource(sourceId) as GeoJSONSource | undefined;
		if (source) {
			source.setData(data);
			return;
		}

		instance.addSource(sourceId, { type: 'geojson', data });
		instance.addLayer({
			id: 'route-lines-casing',
			type: 'line',
			source: sourceId,
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: { 'line-color': '#0e0e10', 'line-width': 7, 'line-opacity': 0.9 }
		});
		instance.addLayer({
			id: 'route-lines',
			type: 'line',
			source: sourceId,
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': ['get', 'color'],
				'line-width': 3,
				'line-opacity': 0.95
			}
		});
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

<div class="relative flex min-h-[320px] w-full flex-1 flex-col">
	<div bind:this={container} class="min-h-0 w-full flex-1"></div>

	{#if mapError}
		<p
			class="pointer-events-none absolute inset-x-3 top-3 rounded-md border border-warn/40 bg-page/95 px-3 py-2 text-[11px] text-warn"
		>
			Mapa: {mapError}
		</p>
	{/if}
</div>

<style>
	:global(.maplibregl-ctrl-group) {
		background: #151517;
		border: 1px solid #ffffff14;
	}

	:global(.maplibregl-ctrl-group button + button) {
		border-top-color: #ffffff14;
	}

	:global(.maplibregl-ctrl-group button .maplibregl-ctrl-icon) {
		filter: invert(0.85);
	}

	:global(.maplibregl-ctrl-scale) {
		background: #151517cc !important;
		border-color: #ffffff14 !important;
		color: #8c8c96 !important;
	}

	:global(.maplibregl-ctrl-attrib),
	:global(.maplibregl-ctrl-attrib.maplibregl-compact),
	:global(.maplibregl-ctrl-attrib.maplibregl-compact-show) {
		background: #151517cc !important;
		color: #8c8c96 !important;
	}

	:global(.maplibregl-ctrl-attrib a) {
		color: #8c8c96 !important;
	}

	:global(.maplibregl-ctrl-attrib-button) {
		filter: invert(0.85);
	}
</style>
