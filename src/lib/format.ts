/** Formatea un timestamp ISO como tiempo relativo corto ("hace 3 s"). */
export function formatAgo(iso: string, now: number = Date.now()): string {
	const timestamp = new Date(iso).getTime();
	if (!Number.isFinite(timestamp)) return '—';

	const diff = Math.max(0, now - timestamp);
	if (diff < 5_000) return 'ahora';
	if (diff < 60_000) return `hace ${Math.floor(diff / 1_000)} s`;

	const minutes = Math.floor(diff / 60_000);
	if (minutes < 60) return `hace ${minutes} min`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `hace ${hours} h`;

	return `hace ${Math.floor(hours / 24)} d`;
}

export function formatSpeed(kmh: number): string {
	if (!Number.isFinite(kmh)) return '—';
	return `${Math.round(kmh)} km/h`;
}

/** Traduce errores crudos de Postgres/PostgREST a algo accionable en la UI. */
export function friendlyError(message: string): string {
	if (/relation .* does not exist|no existe la relación/i.test(message)) {
		return 'La tabla no existe en Supabase. Ejecuta el SQL del plan (secciones 1 y 2) en el SQL Editor antes de usar el panel.';
	}
	if (/row-level security|permission denied|violates row-level/i.test(message)) {
		return 'RLS bloqueó la operación. Revisa que tu perfil tenga rol admin/dispatcher y que las políticas de la tabla estén aplicadas.';
	}
	if (/Invalid API key|apikey/i.test(message)) {
		return 'Las credenciales de Supabase no son válidas. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.';
	}
	if (/JWT|token is expired/i.test(message)) {
		return 'La sesión expiró. Vuelve a iniciar sesión.';
	}
	return message;
}
