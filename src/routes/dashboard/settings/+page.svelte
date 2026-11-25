<script lang="ts">
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

	async function handleSignOut() {
		await session.signOut();
		await goto(resolve('/login'), { replaceState: true });
	}
</script>

<div class="h-full overflow-y-auto p-4 sm:p-6">
	<h1 class="text-lg font-bold">Ajustes</h1>
	<p class="text-xs text-neutral-500">Diagnóstico de conexión y estado de la configuración.</p>

	<div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
		<section class="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
			<h2 class="text-sm font-semibold text-white">Supabase</h2>
			<dl class="mt-3 space-y-2 text-[11px]">
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Variables de entorno</dt>
					<dd
						class={isSupabaseConfigured
							? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-300'
							: 'rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-300'}
					>
						{isSupabaseConfigured ? 'Configuradas' : 'Faltantes'}
					</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Proyecto</dt>
					<dd class="truncate text-neutral-300">{supabaseHost}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Entorno</dt>
					<dd class="text-neutral-300">{appEnv}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Canal Realtime</dt>
					<dd class={busTracker.status === 'live' ? 'text-emerald-300' : 'text-amber-300'}>
						{busTracker.status === 'live' ? 'conectado' : busTracker.status}
					</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Última señal</dt>
					<dd class="text-neutral-300">
						{busTracker.lastEventAt
							? formatAgo(new Date(busTracker.lastEventAt).toISOString())
							: 'sin datos'}
					</dd>
				</div>
			</dl>

			{#if busTracker.lastError}
				<p
					class="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200"
				>
					{busTracker.lastError}
				</p>
			{/if}
		</section>

		<section class="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
			<h2 class="text-sm font-semibold text-white">Sesión</h2>
			<dl class="mt-3 space-y-2 text-[11px]">
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Correo</dt>
					<dd class="truncate text-neutral-300">{session.email ?? '—'}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Rol</dt>
					<dd class="text-neutral-300">
						{session.role ? USER_ROLE_LABEL[session.role] : 'Sin perfil'}
					</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Permisos de escritura</dt>
					<dd class={session.canManage ? 'text-emerald-300' : 'text-neutral-400'}>
						{session.canManage ? 'admin / dispatcher' : 'solo lectura'}
					</dd>
				</div>
			</dl>

			{#if session.profileError}
				<p
					class="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200"
				>
					No se pudo leer <code>profiles</code>: {session.profileError}
				</p>
			{:else if session.session && !session.profile}
				<p
					class="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200"
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
					class="rounded-lg border border-neutral-800 px-3 py-1.5 text-[11px] text-neutral-300 transition hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-60"
				>
					{refreshing ? 'Recargando…' : 'Recargar perfil'}
				</button>
				<button
					type="button"
					onclick={handleSignOut}
					class="rounded-lg border border-neutral-800 px-3 py-1.5 text-[11px] text-neutral-300 transition hover:border-red-500/40 hover:text-red-300"
				>
					Cerrar sesión
				</button>
			</div>
		</section>

		<section class="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
			<h2 class="text-sm font-semibold text-white">Mapa</h2>
			<dl class="mt-3 space-y-2 text-[11px]">
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Estilo</dt>
					<dd class="truncate text-neutral-300" title={MAP_STYLE}>{MAP_STYLE}</dd>
				</div>
				<div class="flex items-center justify-between gap-3">
					<dt class="text-neutral-500">Motor</dt>
					<dd class="text-neutral-300">MapLibre GL</dd>
				</div>
			</dl>
			<p class="mt-3 text-[11px] text-neutral-600">
				Cambia el estilo con <code>VITE_MAP_STYLE</code> (OpenFreeMap, Carto, MapTiler…).
			</p>
		</section>

		<section class="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
			<h2 class="text-sm font-semibold text-white">Checklist de despliegue</h2>
			<ul class="mt-3 space-y-1.5 text-[11px] text-neutral-400">
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
