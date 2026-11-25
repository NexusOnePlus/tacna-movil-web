<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { friendlyError } from '#lib/format';
	import { session } from '#lib/stores/session.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const landingHref = $derived(data.landingOrigin || resolve('/'));

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	// Rutas del panel a las que se puede volver tras el login.
	const PANEL_ROUTES = [
		'/dashboard',
		'/dashboard/buses',
		'/dashboard/routes',
		'/dashboard/settings'
	] as const;

	type PanelRoute = (typeof PANEL_ROUTES)[number];

	function safeRedirect(target: string | null): PanelRoute {
		const path = target?.split('?')[0] ?? '';
		return (PANEL_ROUTES as readonly string[]).includes(path) ? (path as PanelRoute) : '/dashboard';
	}

	const redirectTo = $derived(safeRedirect(page.url.searchParams.get('redirectTo')));

	onMount(() => {
		void (async () => {
			await session.init();
			if (session.session) await goto(resolve(redirectTo), { replaceState: true });
		})();
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		submitting = true;

		try {
			await session.signIn(email.trim(), password);
			await goto(resolve(redirectTo), { replaceState: true });
		} catch (err) {
			error = friendlyError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>Acceso operadores · Tacna Móvil</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
	<div class="w-full max-w-sm">
		<div class="mb-8 flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-xl font-black text-black"
			>
				T
			</div>
			<div>
				<h1 class="text-lg leading-tight font-bold">Tacna Móvil</h1>
				<p class="text-xs text-neutral-500">Panel de operadores</p>
			</div>
		</div>

		<form
			onsubmit={handleSubmit}
			class="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6"
		>
			<div>
				<label for="email" class="mb-1.5 block text-xs font-medium text-neutral-400">
					Correo
				</label>
				<input
					id="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					placeholder="operador@tacnamovil.pe"
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-amber-500 focus:ring-0"
				/>
			</div>

			<div>
				<label for="password" class="mb-1.5 block text-xs font-medium text-neutral-400">
					Contraseña
				</label>
				<input
					id="password"
					type="password"
					autocomplete="current-password"
					required
					bind:value={password}
					placeholder="••••••••"
					class="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-amber-500 focus:ring-0"
				/>
			</div>

			{#if error}
				<p class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
					{error}
				</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{submitting ? 'Verificando…' : 'Entrar al panel'}
			</button>

			<p class="text-center text-[11px] text-neutral-500">
				Solo admin, dispatcher y conductores con perfil habilitado.
			</p>
		</form>

		<!-- URL absoluta a la landing (otro subdominio): no pasa por resolve() -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={landingHref}
			class="mt-6 block text-center text-xs text-neutral-500 hover:text-neutral-300"
		>
			← Volver a la página principal
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>
</div>
