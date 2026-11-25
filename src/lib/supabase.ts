import { createClient } from '@supabase/supabase-js';

// Variables públicas (prefijo VITE_ obligatorio para exponerlas al cliente).
// Configúralas en .env local y como variables de build del Worker en Cloudflare.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
	console.warn(
		'[supabase] Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
			'Se usan valores de relleno: el dashboard cargará pero todas las queries fallarán.'
	);
}

export const supabase = createClient(
	supabaseUrl ?? 'http://127.0.0.1:54321',
	supabaseAnonKey ?? 'anon-key-placeholder',
	{
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true
		}
	}
);

export const MAP_STYLE =
	(import.meta.env.VITE_MAP_STYLE as string | undefined) ??
	'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
