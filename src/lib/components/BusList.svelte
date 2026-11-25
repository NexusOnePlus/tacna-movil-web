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
	<p class="px-4 py-8 text-center text-sm text-neutral-500">{emptyMessage}</p>
{:else}
	<ul class="divide-y divide-neutral-800">
		{#each buses as bus (bus.bus_id)}
			{@const selected = bus.bus_id === selectedId}
			<li>
				<button
					type="button"
					onclick={() => onSelect?.(bus.bus_id)}
					class="flex w-full items-center gap-3 px-4 py-3 text-left transition {selected
						? 'bg-amber-500/10'
						: 'hover:bg-neutral-800/60'}"
				>
					<span
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base {selected
							? 'bg-amber-400 text-black'
							: 'bg-neutral-800 text-amber-400'}"
					>
						<BusIcon size={16} strokeWidth={2.4} />
					</span>

					<span class="min-w-0 flex-1">
						<span class="flex items-baseline justify-between gap-2">
							<span class="truncate text-sm font-semibold text-white">{bus.plate}</span>
							<span class="shrink-0 text-[11px] text-neutral-500"
								>{formatAgo(bus.updated_at, now)}</span
							>
						</span>
						<span class="mt-0.5 flex items-center gap-2 text-[11px] text-neutral-400">
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
