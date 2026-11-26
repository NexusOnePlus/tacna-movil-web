import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { BusPosition } from '#lib/types';

const MAX_BODY_BYTES = 1024;
const WEB_MERCATOR_LATITUDE = 85.05112878;

function coordinate(value: unknown, limit: number): number | null {
	if (typeof value === 'string') {
		const decimal = value.trim().replace(',', '.');
		if (!/^[+-]?\d+(?:\.\d+)?$/.test(decimal)) return null;
		value = Number(decimal);
	}
	if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > limit) {
		return null;
	}
	return Math.round(value * 1e6) / 1e6;
}

export const POST: RequestHandler = async ({ request, url, fetch }) => {
	if (!import.meta.env.DEV && url.protocol !== 'https:') {
		return json({ error: 'Usa HTTPS.' }, { status: 400 });
	}
	const contentType = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
	if (contentType !== 'application/json') {
		return json({ error: 'Se requiere application/json.' }, { status: 415 });
	}

	const reader = request.body?.getReader();
	if (!reader) return json({ error: 'Falta el reporte.' }, { status: 400 });
	const decoder = new TextDecoder('utf-8', { fatal: true });
	let report: Record<string, unknown>;
	try {
		let body = '';
		let size = 0;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > MAX_BODY_BYTES) {
				void reader.cancel().catch(() => {});
				return json({ error: 'El reporte supera 1 KiB.' }, { status: 413 });
			}
			body += decoder.decode(value, { stream: true });
		}
		report = JSON.parse(body + decoder.decode());
		if (!report || typeof report !== 'object' || Array.isArray(report)) throw new Error();
	} catch {
		return json({ error: 'Reporte JSON inválido.' }, { status: 400 });
	}

	const route = typeof report.ruta === 'string' ? report.ruta.normalize('NFKC').trim() : '';
	const plate =
		typeof report.placa_o_nombre === 'string'
			? report.placa_o_nombre.normalize('NFKC').trim().replace(/\s+/g, ' ')
			: '';
	const lat = coordinate(report.lat, WEB_MERCATOR_LATITUDE);
	const lng = coordinate(report.lng, 180);
	if (
		!/^\d{1,6}$/.test(route) ||
		!plate ||
		plate.length > 64 ||
		/\p{C}/u.test(plate) ||
		lat === null ||
		lng === null
	) {
		return json({ error: 'Ruta, placa o nombre, o coordenadas inválidas.' }, { status: 422 });
	}

	const position: BusPosition = {
		bus_id: `rastreo:${JSON.stringify([route, plate.toUpperCase()])}`,
		route_id: '',
		route_number: route,
		plate,
		lat,
		lng,
		heading: 0,
		speed: 0,
		updated_at: new Date().toISOString()
	};

	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !apiKey) {
		return json({ error: 'Realtime sin configurar.' }, { status: 503 });
	}
	try {
		const headers: Record<string, string> = { apikey: apiKey, 'content-type': 'application/json' };
		if (apiKey.startsWith('eyJ')) headers.Authorization = `Bearer ${apiKey}`;
		const response = await fetch(new URL('/realtime/v1/api/broadcast', supabaseUrl), {
			method: 'POST',
			headers,
			signal: AbortSignal.timeout(4_000),
			body: JSON.stringify({
				messages: [
					{ topic: 'buses-live', event: 'bus-location', private: false, payload: position }
				]
			})
		});
		if (response.ok) return new Response(null, { status: 204 });
	} catch {
		// El dispositivo volverá a enviar la posición más reciente.
	}
	return json({ error: 'No se pudo difundir el reporte.' }, { status: 502 });
};
