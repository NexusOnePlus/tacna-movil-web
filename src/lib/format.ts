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
		return 'La tabla no existe en Supabase. Ejecuta el esquema inicial en el SQL Editor antes de usar el panel.';
	}
	if (/email not confirmed/i.test(message)) {
		return 'El correo no está confirmado. Confírmalo en Supabase → Authentication → Users.';
	}
	if (/invalid login credentials/i.test(message)) {
		return 'Correo o contraseña incorrectos.';
	}
	if (/permission denied for table/i.test(message)) {
		const table = message.match(/permission denied for table ["']?([a-z0-9_]+)["']?/i)?.[1];
		return `El rol de PostgREST no tiene permisos sobre ${table ?? 'la tabla'}. Ejecuta los GRANT de supabase/policies.sql.`;
	}
	if (/row-level security|violates row-level/i.test(message)) {
		const table = message.match(/table ["']?([a-z0-9_]+)["']?/i)?.[1];
		const target = table ? ` la tabla ${table}` : ' la operación';
		return `Postgres bloqueó${target} por RLS: para escribir tu perfil debe ser admin/dispatcher; para leer falta la política SELECT.`;
	}
	if (/Invalid API key|apikey/i.test(message)) {
		return 'Las credenciales de Supabase no son válidas. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.';
	}
	if (/JWT|token is expired/i.test(message)) {
		return 'La sesión expiró. Vuelve a iniciar sesión.';
	}
	return message;
}
