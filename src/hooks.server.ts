import type { Handle } from '@sveltejs/kit/hooks';

/**
 * La landing y el panel comparten el mismo despliegue, así que el host es lo
 * único que distingue a un pasajero de un operador:
 *   tacna-movil.<dominio> -> landing pública
 *   tacna-panel.<dominio> -> dashboard
 *
 * El dominio base se deduce del host; VITE_PANEL_BASE_DOMAIN es solo un override.
 */

const PANEL_SUBDOMAIN = 'tacna-panel';
const LANDING_SUBDOMAIN = 'tacna-movil';
const PANEL_ROUTES = ['/dashboard', '/login'];

/** tacna-panel.glook.pro / tacna-movil.glook.pro / www.glook.pro -> glook.pro */
function baseDomainFrom(hostname: string): string {
	const panelPrefix = `${PANEL_SUBDOMAIN}.`;
	if (hostname.startsWith(panelPrefix)) return hostname.slice(panelPrefix.length);

	const landingPrefix = `${LANDING_SUBDOMAIN}.`;
	if (hostname.startsWith(landingPrefix)) return hostname.slice(landingPrefix.length);

	if (hostname.startsWith('www.')) return hostname.slice(4);
	return hostname;
}

/** En local y en previews no hay subdominios: no se redirige entre hosts. */
function isLocalHost(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '[::1]' ||
		hostname.endsWith('.local') ||
		hostname.endsWith('.pages.dev') ||
		hostname.endsWith('.workers.dev') ||
		/^(10|192\.168)\./.test(hostname)
	);
}

function isPanelHost(hostname: string, baseDomain: string): boolean {
	return (
		hostname === `${PANEL_SUBDOMAIN}.${baseDomain}` || hostname.startsWith(`${PANEL_SUBDOMAIN}.`)
	);
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url } = event;
	// Sin dominio fijo: se deduce del host. El env solo existe para forzarlo.
	const configuredDomain = import.meta.env.VITE_PANEL_BASE_DOMAIN as string | undefined;
	const baseDomain = configuredDomain || baseDomainFrom(url.hostname);
	const local = isLocalHost(url.hostname);
	const panelHost = isPanelHost(url.hostname, baseDomain);
	// ?panel fuerza el modo panel en local sin tocar hosts ni DNS.
	const forcePanel = url.searchParams.has('panel');
	const port = url.port ? `:${url.port}` : '';

	event.locals.landingOrigin = local
		? ''
		: `${url.protocol}//${url.hostname.replace(`${PANEL_SUBDOMAIN}.`, `${LANDING_SUBDOMAIN}.`)}${port}`;

	const wantsPanelRoute = PANEL_ROUTES.some(
		(route) => url.pathname === route || url.pathname.startsWith(`${route}/`)
	);

	if (!local && !panelHost && !forcePanel && wantsPanelRoute) {
		return new Response(null, {
			status: 308,
			headers: {
				location: `${url.protocol}//${PANEL_SUBDOMAIN}.${baseDomain}${port}${url.pathname}${url.search}`
			}
		});
	}

	if ((panelHost || forcePanel) && url.pathname === '/') {
		return new Response(null, { status: 307, headers: { location: '/dashboard' } });
	}

	const response = await resolve(event);

	if (panelHost || forcePanel) {
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
	}

	return response;
};
