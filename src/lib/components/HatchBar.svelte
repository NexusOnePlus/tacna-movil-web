<script lang="ts">
	type Tone = 'live' | 'warn' | 'ok' | 'muted';

	interface Props {
		value?: number;
		max?: number;
		tone?: Tone;
		class?: string;
	}

	let { value = 0, max = 1, tone = 'live', class: className = '' }: Props = $props();

	const COLORS: Record<Tone, string> = {
		live: '#4f8cff',
		warn: '#ff9f43',
		ok: '#3ddc97',
		muted: '#6e6e78'
	};

	const width = $derived(
		value <= 0 ? 0 : Math.max(3, Math.min(100, (value / Math.max(1, max)) * 100))
	);
</script>

<div
	class="h-2 w-full overflow-hidden rounded-[3px] border border-hairline bg-white/[0.03] {className}"
>
	<div
		class="h-full rounded-[2px] border"
		style="width: {width}%; border-color: {COLORS[
			tone
		]}66; background-image: repeating-linear-gradient(135deg, {COLORS[
			tone
		]} 0 2px, transparent 2px 5px);"
	></div>
</div>
