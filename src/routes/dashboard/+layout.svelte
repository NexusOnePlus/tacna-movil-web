<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { busTracker, type TrackerStatus } from '#lib/stores/bus-tracker.svelte';
	import { session } from '#lib/stores/session.svelte';
	import { USER_ROLE_LABEL } from '#lib/types';

	let { children }: { children: Snippet } = $props();

	const NAV = [
		{ path: '/dashboard', label: 'Mapa en vivo', icon: '🗺️' },
		{ path: '/dashboard/buses', label: 'Buses', icon: '🚌' },
		{ path: '/dashboard/routes', label: 'Rutas', icon: '🛣️' },
		{ path: '/dashboard/settings', label: 'Ajustes', icon: '⚙️' }
	] as const;

	onMount(() => {
		void (async () => {
			await session.init();
			if (!session.session) {
				const target = page.url.pathname + page.url.search;
				// resolve() no acepta query: se concatena al path ya resuelto.
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				await goto(`${resolve('/login')}?redirectTo=${encodeURIComponent(target)}`, {
					replaceState: true
				});
				return;
			}
			busTracker.connect();
		})();

		return () => busTracker.disconnect();
	});

	function isActive(path: string): boolean {
		if (path === '/dashboard') return page.url.pathname === '/dashboard';
		return page.url.pathname.startsWith(path);
	}

	async function handleSignOut() {
		await session.signOut();
		await goto(resolve('/login'), { replaceState: true });
	}

	const STATUS_LABEL: Record<TrackerStatus, string> = {
		idle: 'Inactivo',
		connecting: 'Conectando…',
		live: 'En vivo',
		error: 'Sin conexión'
	};

	const STATUS_PILL: Record<TrackerStatus, string> = {
		idle: 'border-neutral-700 bg-neutral-800/60 text-neutral-400',
		connecting: 'border-neutral-700 bg-neutral-800/60 text-neutral-400',
		live: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
		error: 'border-red-500/30 bg-red-500/10 text-red-300'
	};

	const STATUS_DOT: Record<TrackerStatus, string> = {
		idle: 'bg-neutral-500',
		connecting: 'bg-neutral-500',
		live: 'animate-pulse bg-emerald-400',
		error: 'bg-red-400'
	};
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>Panel de despacho · Tacna Móvil</title>
</svelte:head>

{#if session.loading}
	<div class="flex min-h-screen items-center justify-center bg-neutral-950">
		<div class="flex items-center gap-3 text-sm text-neutral-400">
			<span class="h-4 w-4 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-500"
			></span>
			Cargando panel…
		</div>
	</div>
{:else if !session.session}
	<div class="flex min-h-screen items-center justify-center bg-neutral-950">
		<p class="text-sm text-neutral-400">Redirigiendo al login…</p>
	</div>
{:else}
	<div class="flex h-screen w-full overflow-hidden bg-neutral-950 font-sans text-white">
		<aside
			class="hidden w-56 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900/50 md:flex"
		>
			<div class="flex h-14 items-center gap-2.5 border-b border-neutral-800 px-4">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-black text-black"
				>
					T
				</div>
				<div class="leading-tight">
					<p class="text-xs font-bold">Tacna Móvil</p>
					<p class="text-[10px] text-neutral-500">Despacho</p>
				</div>
			</div>

			<nav class="flex-1 space-y-1 p-3">
				{#each NAV as item (item.path)}
					<a
						href={resolve(item.path)}
						aria-current={isActive(item.path) ? 'page' : undefined}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition {isActive(
							item.path
						)
							? 'bg-amber-500/15 font-semibold text-amber-400'
							: 'text-neutral-400 hover:bg-neutral-800/60 hover:text-white'}"
					>
						<span aria-hidden="true">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="border-t border-neutral-800 p-3">
				<p class="truncate text-xs font-medium text-neutral-300">{session.email ?? 'Sin sesión'}</p>
				<p class="mt-0.5 text-[10px] text-neutral-500">
					{session.role ? USER_ROLE_LABEL[session.role] : 'Perfil sin rol'}
				</p>
				<button
					type="button"
					onclick={handleSignOut}
					class="mt-2 w-full rounded-lg border border-neutral-800 px-2 py-1.5 text-[11px] text-neutral-400 transition hover:border-red-500/40 hover:text-red-300"
				>
					Cerrar sesión
				</button>
			</div>
		</aside>

		<div class="flex min-w-0 flex-1 flex-col">
			<header
				class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900/90 px-4"
			>
				<div class="flex items-center gap-2 md:hidden">
					<div
						class="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-xs font-black text-black"
					>
						T
					</div>
					<span class="text-xs font-bold">Tacna Móvil</span>
				</div>

				<div class="hidden items-center gap-3 md:flex">
					<span
						class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium {STATUS_PILL[
							busTracker.status
						]}"
					>
						<span class="h-1.5 w-1.5 rounded-full {STATUS_DOT[busTracker.status]}"></span>
						{STATUS_LABEL[busTracker.status]}
					</span>

					<span class="text-[11px] text-neutral-500">
						{busTracker.count}
						{busTracker.count === 1 ? 'bus reportando' : 'buses reportando'}
					</span>

					{#if busTracker.lastError}
						<span class="text-[11px] text-amber-400" title={busTracker.lastError}>⚠︎</span>
					{/if}
				</div>

				<div class="flex items-center gap-3">
					{#if !session.canManage}
						<span
							class="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-300"
						>
							Modo lectura
						</span>
					{/if}
				</div>
			</header>

			<nav class="flex gap-1 overflow-x-auto border-b border-neutral-800 px-2 py-2 md:hidden">
				{#each NAV as item (item.path)}
					<a
						href={resolve(item.path)}
						class="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] transition {isActive(item.path)
							? 'bg-amber-500/15 font-semibold text-amber-400'
							: 'text-neutral-400 hover:bg-neutral-800/60'}"
					>
						{item.icon}
						{item.label}
					</a>
				{/each}
			</nav>

			<main class="min-h-0 flex-1 overflow-hidden">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
