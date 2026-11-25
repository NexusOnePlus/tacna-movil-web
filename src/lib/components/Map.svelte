<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AttributionControl,
		Map as MapLibreMap,
		Marker,
		NavigationControl,
		ScaleControl
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
	let followedId: string | null = null;

	const markers = new SvelteMap<string, Marker>();

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

		map = instance;

		return () => {
			for (const marker of markers.values()) marker.remove();
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

		for (const [busId, marker] of markers) {
			if (!activeIds.has(busId)) {
				marker.remove();
				markers.delete(busId);
			}
		}

		for (const bus of buses) {
			const selected = bus.bus_id === selectedBusId;
			let marker = markers.get(bus.bus_id);

			if (!marker) {
				const element = document.createElement('div');
				marker = new Marker({ element, anchor: 'center' })
					.setLngLat([bus.lng, bus.lat])
					.addTo(instance);
				markers.set(bus.bus_id, marker);
			}

			const element = marker.getElement();
			element.className = markerClass(selected);
			element.textContent = '🚌';
			element.title = `${bus.plate} · ${Math.round(bus.speed)} km/h`;

			marker.setLngLat([bus.lng, bus.lat]);
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

<div bind:this={container} class="h-full w-full"></div>
