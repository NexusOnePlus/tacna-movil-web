<script lang="ts">
	import { onMount } from 'svelte';
	import BusIcon from '@lucide/svelte/icons/bus';
	import { formatAgo, formatSpeed } from '#lib/format';
	import type { BusPosition } from '#lib/types';

	interface Props {
		buses?: BusPosition[];
		selectedId?: string | null;
		onSelect?: (busId: string) => void;
		emptyMessage?: string;
	}

	let {
		buses = [],
		selectedId = null,
		onSelect,
		emptyMessage = 'Sin buses reportando posición.'
	}: Props = $props();

	let now = $state(Date.now());

	onMount(() => {
		const timer = setInterval(() => (now = Date.now()), 1_000);
		return () => clearInterval(timer);
	});
</script>

{#if buses.length === 0}
	<p class="px-4 py-8 text-center text-[11px] text-muted">{emptyMessage}</p>
{:else}
	<ul class="divide-y divide-hairline">
		{#each buses as bus (bus.bus_id)}
			{@const selected = bus.bus_id === selectedId}
			<li>
				<button
					type="button"
					onclick={() => onSelect?.(bus.bus_id)}
					class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition {selected
						? 'bg-white/[0.05]'
						: 'hover:bg-white/[0.03]'}"
				>
					<span
						class="grid h-8 w-8 shrink-0 place-items-center rounded-md {selected
							? 'bg-live text-white'
							: 'bg-raised text-live'}"
					>
						<BusIcon size={15} strokeWidth={2.4} />
					</span>

					<span class="min-w-0 flex-1">
						<span class="flex items-baseline justify-between gap-2">
							<span class="truncate text-[13px] font-medium text-ink">{bus.plate}</span>
							<span class="shrink-0 text-[10px] text-muted">{formatAgo(bus.updated_at, now)}</span>
						</span>
						<span class="mt-0.5 flex items-center gap-2 text-[10px] text-muted">
							<span class="truncate">{bus.route_id || 'Sin ruta'}</span>
							<span aria-hidden="true">·</span>
							<span class="shrink-0 tabular-nums">{formatSpeed(bus.speed)}</span>
						</span>
					</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
