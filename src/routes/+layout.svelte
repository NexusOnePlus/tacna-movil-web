<script lang="ts">
	import './layout.css';
	import logoMark from '#lib/assets/brand/logo-icon-64.png';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={logoMark} />
</svelte:head>

{@render children()}
