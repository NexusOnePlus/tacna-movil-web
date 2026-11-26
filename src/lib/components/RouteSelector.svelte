<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { BusRoute } from '#lib/types';

	interface Props {
		routes?: BusRoute[];
		value?: string | null;
		onChange?: (routeId: string | null) => void;
		label?: string;
	}

	let { routes = [], value = null, onChange, label = 'Filtrar por ruta' }: Props = $props();
</script>

<label class="flex items-center gap-2 text-[11px] text-muted">
	<span class="sr-only">{label}</span>
	<div class="relative">
		<select
			value={value ?? ''}
			onchange={(event) => onChange?.((event.currentTarget as HTMLSelectElement).value || null)}
			class="appearance-none rounded-md border border-hairline bg-raised py-1.5 pr-7 pl-2.5 text-[11px] font-medium text-ink focus:border-white/20 focus:ring-0"
		>
			<option value="">Todas las rutas</option>
			{#each routes as route (route.id)}
				<option value={route.id}>{route.short_code} · {route.name}</option>
			{/each}
		</select>
		<ChevronDown
			class="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
		/>
	</div>
</label>
