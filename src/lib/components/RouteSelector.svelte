<script lang="ts">
	import type { BusRoute } from '#lib/types';

	interface Props {
		routes?: BusRoute[];
		value?: string | null;
		onChange?: (routeId: string | null) => void;
		label?: string;
	}

	let { routes = [], value = null, onChange, label = 'Filtrar por ruta' }: Props = $props();
</script>

<label class="flex items-center gap-2 text-xs text-neutral-400">
	<span class="sr-only">{label}</span>
	<select
		value={value ?? ''}
		onchange={(event) => onChange?.((event.currentTarget as HTMLSelectElement).value || null)}
		class="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 focus:border-amber-500 focus:ring-0"
	>
		<option value="">Todas las rutas</option>
		{#each routes as route (route.id)}
			<option value={route.id}>{route.short_code} · {route.name}</option>
		{/each}
	</select>
</label>
