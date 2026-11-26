<script lang="ts">
	import LogOut from '@lucide/svelte/icons/log-out';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { formatAgo } from '#lib/format';
	import { isSupabaseConfigured, MAP_STYLE } from '#lib/supabase';
	import { busTracker } from '#lib/stores/bus-tracker.svelte';
	import { session } from '#lib/stores/session.svelte';
	import { USER_ROLE_LABEL } from '#lib/types';

	const appEnv = (import.meta.env.VITE_APP_ENV as string | undefined) ?? 'development';

	let refreshing = $state(false);

	async function refreshProfile() {
		refreshing = true;
		await session.loadProfile();
		refreshing = false;
	}

	const supabaseHost = $derived.by(() => {
		const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
		if (!url) return '—';
		try {
			return new URL(url).host;
		} catch {
			return url;
		}
	});

	const displayName = $derived(session.profile?.full_name ?? session.email ?? 'Operador');
	const initials = $derived(displayName.trim().slice(0, 2).toUpperCase());
	const roleLabel = $derived(session.role ? USER_ROLE_LABEL[session.role] : 'Perfil sin rol');

	async function handleSignOut() {
		await session.signOut();
		await goto(resolve('/login'), { replaceState: true });
	}
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6">
	<header class="mb-4">
		<p class="text-[10px] tracking-[0.18em] text-muted uppercase">Configuración</p>
		<h1 class="mt-1 text-xl font-semibold tracking-tight">Ajustes</h1>
		<p class="mt-0.5 text-[11px] text-muted">Diagnóstico de conexión y estado del operador.</p>
	</header>

	<section class="mb-4 overflow-hidden rounded-md border border-hairline">
		<div
			class="p-5"
			style="background: linear-gradient(120deg, #ffd8c2 0%, #ddccff 52%, #c8f5e4 100%); color: #151517;"
		>
			<div class="flex items-center gap-3">
				<div
					class="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-black/10 text-sm font-semibold"
				>
					{initials}
				</div>
				<div class="min-w-0">
					<p class="truncate text-base font-semibold">{displayName}</p>
					<p class="truncate text-[11px] opacity-70">
						{session.email ?? 'Sin sesión'} · {roleLabel}
					</p>
				</div>
				<span
					class="ml-auto shrink-0 rounded border border-black/10 bg-white/30 px-2 py-1 text-[10px]"
				>
					Operador
				</span>
			</div>
		</div>
	</section>

	<div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
		<section class="rounded-md border border-hairline bg-panel p-4">
			<h2 class="text-[11px] font-medium text-ink">Supabase</h2>
			<dl class="mt-3 space-y-2 text-[11px]">
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Variables de entorno</dt>
					<dd class={isSupabaseConfigured ? 'text-ok' : 'text-warn'}>
						{isSupabaseConfigured ? 'Configuradas' : 'Faltantes'}
					</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Proyecto</dt>
					<dd class="truncate text-ink">{supabaseHost}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Entorno</dt>
					<dd class="text-ink">{appEnv}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Canal Realtime</dt>
					<dd class={busTracker.status === 'live' ? 'text-ok' : 'text-warn'}>
						{busTracker.status === 'live' ? 'conectado' : busTracker.status}
					</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Última señal</dt>
					<dd class="text-ink">
						{busTracker.lastEventAt
							? formatAgo(new Date(busTracker.lastEventAt).toISOString())
							: 'sin datos'}
					</dd>
				</div>
			</dl>

			{#if busTracker.lastError}
				<p
					class="mt-3 rounded-md border border-warn/40 bg-warn/10 px-2.5 py-1.5 text-[10px] text-warn"
				>
					{busTracker.lastError}
				</p>
			{/if}
		</section>

		<section class="rounded-md border border-hairline bg-panel p-4">
			<h2 class="text-[11px] font-medium text-ink">Sesión</h2>
			<dl class="mt-3 space-y-2 text-[11px]">
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Correo</dt>
					<dd class="truncate text-ink">{session.email ?? '—'}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Rol</dt>
					<dd class="text-ink">{roleLabel}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Permisos de escritura</dt>
					<dd class={session.canManage ? 'text-ok' : 'text-muted'}>
						{session.canManage ? 'admin / dispatcher' : 'solo lectura'}
					</dd>
				</div>
			</dl>

			{#if session.profileError}
				<p
					class="mt-3 rounded-md border border-warn/40 bg-warn/10 px-2.5 py-1.5 text-[10px] text-warn"
				>
					No se pudo leer <code>profiles</code>: {session.profileError}
				</p>
			{:else if session.session && !session.profile}
				<p
					class="mt-3 rounded-md border border-warn/40 bg-warn/10 px-2.5 py-1.5 text-[10px] text-warn"
				>
					No hay fila en <code>profiles</code> para este usuario. Créala en Supabase con
					<code>role = 'admin'</code> y pulsa «Recargar perfil».
				</p>
			{/if}

			<div class="mt-4 flex flex-wrap gap-2">
				<button
					type="button"
					onclick={refreshProfile}
					disabled={refreshing}
					class="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[10px] text-muted transition hover:border-live/40 hover:text-live disabled:opacity-60"
				>
					<RefreshCw class="h-3 w-3" />
					{refreshing ? 'Recargando…' : 'Recargar perfil'}
				</button>
				<button
					type="button"
					onclick={handleSignOut}
					class="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[10px] text-muted transition hover:border-warn/40 hover:text-warn"
				>
					<LogOut class="h-3 w-3" />
					Cerrar sesión
				</button>
			</div>
		</section>

		<section class="rounded-md border border-hairline bg-panel p-4">
			<h2 class="text-[11px] font-medium text-ink">Mapa</h2>
			<dl class="mt-3 space-y-2 text-[11px]">
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Estilo</dt>
					<dd class="truncate text-ink" title={MAP_STYLE}>{MAP_STYLE}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-muted">Motor</dt>
					<dd class="text-ink">MapLibre GL</dd>
				</div>
			</dl>
			<p class="mt-3 text-[10px] text-muted">
				Cambia el estilo con <code>VITE_MAP_STYLE</code> (OpenFreeMap, Carto, MapTiler…).
			</p>
		</section>

		<section class="rounded-md border border-hairline bg-panel p-4">
			<h2 class="text-[11px] font-medium text-ink">Checklist de despliegue</h2>
			<ul class="mt-3 space-y-1.5 text-[10px] text-muted">
				<li>· Schema, RLS, grants y seed ejecutados en Supabase.</li>
				<li>
					· <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>,
					<code>VITE_MAP_STYLE</code> y <code>VITE_APP_ENV</code> como variables de build del Worker.
				</li>
				<li>
					· Custom domains: <code>tacna-movil.glook.pro</code> y <code>tacna-panel.glook.pro</code>
					apuntando al mismo Worker.
				</li>
				<li>· Zona <code>glook.pro</code> activa en Cloudflare.</li>
				<li>· Realtime solo si usas <code>postgres_changes</code> (el GPS va por Broadcast).</li>
			</ul>
		</section>
	</div>
</div>
