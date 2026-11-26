<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import logoMark from '#lib/assets/brand/logo-icon-64.png';
	import BusIcon from '@lucide/svelte/icons/bus';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import MapIcon from '@lucide/svelte/icons/map';
	import RouteIcon from '@lucide/svelte/icons/route';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import LogOut from '@lucide/svelte/icons/log-out';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatAgo } from '#lib/format';
	import { busTracker, type TrackerStatus } from '#lib/stores/bus-tracker.svelte';
	import { session } from '#lib/stores/session.svelte';
	import { USER_ROLE_LABEL } from '#lib/types';

	let { children }: { children: Snippet } = $props();

	const NAV = [
		{ path: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
		{ path: '/dashboard/map', label: 'Mapa', icon: MapIcon },
		{ path: '/dashboard/buses', label: 'Flota', icon: BusIcon },
		{ path: '/dashboard/routes', label: 'Rutas', icon: RouteIcon },
		{ path: '/dashboard/settings', label: 'Ajustes', icon: SettingsIcon }
	] as const;

	let now = $state(Date.now());

	onMount(() => {
		const clock = setInterval(() => (now = Date.now()), 1_000);

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

		return () => {
			clearInterval(clock);
			busTracker.disconnect();
		};
	});

	function isActive(path: string): boolean {
		if (path === '/dashboard') return page.url.pathname === '/dashboard';
		return page.url.pathname.startsWith(path);
	}

	async function handleSignOut() {
		await session.signOut();
		await goto(resolve('/login'), { replaceState: true });
	}

	const initials = $derived(
		(session.profile?.full_name ?? session.email ?? '?').trim().slice(0, 2).toUpperCase()
	);

	const lastName = $derived(
		busTracker.lastEventAt ? formatAgo(new Date(busTracker.lastEventAt).toISOString(), now) : null
	);

	const STATUS_LABEL: Record<TrackerStatus, string> = {
		idle: 'Inactivo',
		connecting: 'Conectando',
		live: 'En vivo',
		error: 'Sin conexión'
	};

	const STATUS_PILL: Record<TrackerStatus, string> = {
		idle: 'border-hairline bg-white/[0.03] text-muted',
		connecting: 'border-hairline bg-white/[0.03] text-muted',
		live: 'border-live/30 bg-live/10 text-live',
		error: 'border-warn/30 bg-warn/10 text-warn'
	};

	const STATUS_DOT: Record<TrackerStatus, string> = {
		idle: 'bg-muted',
		connecting: 'bg-muted',
		live: 'animate-pulse bg-live',
		error: 'bg-warn'
	};
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>Panel de despacho · Tacna Móvil</title>
</svelte:head>

{#if session.loading}
	<div class="flex min-h-screen items-center justify-center bg-page">
		<div class="flex items-center gap-3 text-sm text-muted">
			<span class="h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-live"></span>
			Cargando panel…
		</div>
	</div>
{:else if !session.session}
	<div class="flex min-h-screen items-center justify-center bg-page">
		<p class="text-sm text-muted">Redirigiendo al login…</p>
	</div>
{:else}
	<div class="flex h-screen w-full overflow-hidden bg-page text-ink">
		<aside class="hidden w-56 shrink-0 flex-col border-r border-hairline bg-panel md:flex">
			<div class="flex h-14 items-center gap-2.5 border-b border-hairline px-4">
				<img
					src={logoMark}
					alt=""
					width="32"
					height="32"
					class="h-8 w-8 rounded-md object-cover ring-1 ring-hairline"
				/>
				<div class="leading-tight">
					<p class="text-xs font-semibold tracking-tight">Tacna Móvil</p>
					<p class="text-[10px] text-muted">Despacho</p>
				</div>
			</div>

			<nav class="flex-1 space-y-0.5 p-2">
				{#each NAV as item (item.path)}
					{@const Icon = item.icon}
					<a
						href={resolve(item.path)}
						aria-current={isActive(item.path) ? 'page' : undefined}
						class="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition {isActive(
							item.path
						)
							? 'bg-white/[0.06] font-medium text-ink'
							: 'text-muted hover:bg-white/[0.03] hover:text-ink'}"
					>
						<Icon class="h-4 w-4 shrink-0" />
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="border-t border-hairline p-3">
				<div class="flex items-center gap-2.5">
					<div
						class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[11px] font-semibold text-[#151517]"
						style="background: linear-gradient(135deg, #ffd8c2, #ddccff 55%, #c8f5e4);"
					>
						{initials}
					</div>
					<div class="min-w-0 leading-tight">
						<p class="truncate text-[11px] font-medium text-ink">{session.email ?? 'Sin sesión'}</p>
						<p class="truncate text-[10px] text-muted">
							{session.role ? USER_ROLE_LABEL[session.role] : 'Perfil sin rol'}
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={handleSignOut}
					class="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-hairline px-2 py-1.5 text-[11px] text-muted transition hover:border-warn/40 hover:text-warn"
				>
					<LogOut class="h-3.5 w-3.5" />
					Cerrar sesión
				</button>
			</div>
		</aside>

		<div class="flex min-w-0 flex-1 flex-col">
			<header
				class="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-hairline bg-panel px-4"
			>
				<div class="flex items-center gap-2 md:hidden">
					<img
						src={logoMark}
						alt=""
						width="28"
						height="28"
						class="h-7 w-7 rounded-md object-cover ring-1 ring-hairline"
					/>
					<span class="text-xs font-semibold tracking-tight">Tacna Móvil</span>
				</div>

				<div class="hidden items-center gap-3 md:flex">
					<span
						class="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium {STATUS_PILL[
							busTracker.status
						]}"
					>
						<span class="h-1.5 w-1.5 rounded-full {STATUS_DOT[busTracker.status]}"></span>
						{STATUS_LABEL[busTracker.status]}
					</span>

					<span class="text-[11px] text-muted">
						{busTracker.count}
						{busTracker.count === 1 ? 'bus reportando' : 'buses reportando'}
					</span>

					{#if lastName}
						<span class="text-[11px] text-muted">último ping {lastName}</span>
					{/if}

					{#if busTracker.lastError}
						<TriangleAlert class="h-3.5 w-3.5 text-warn" title={busTracker.lastError} />
					{/if}
				</div>

				<div class="flex items-center gap-3">
					{#if !session.canManage}
						<span
							class="rounded-md border border-warn/30 bg-warn/10 px-2 py-1 text-[10px] font-medium text-warn"
						>
							Modo lectura
						</span>
					{/if}
				</div>
			</header>

			<nav class="flex gap-1 overflow-x-auto border-b border-hairline bg-panel px-2 py-2 md:hidden">
				{#each NAV as item (item.path)}
					{@const Icon = item.icon}
					<a
						href={resolve(item.path)}
						class="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] transition {isActive(
							item.path
						)
							? 'bg-white/[0.05] font-medium text-ink'
							: 'text-muted hover:bg-white/[0.03]'}"
					>
						<Icon class="h-3.5 w-3.5" />
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
