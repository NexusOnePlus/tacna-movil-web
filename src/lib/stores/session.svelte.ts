import type { Session } from '@supabase/supabase-js';
import { supabase } from '#lib/supabase';
import type { Profile, UserRole } from '#lib/types';

/**
 * Sesión + perfil del operador.
 * La autorización real la aplica RLS en Postgres; esto solo controla qué
 * botones se muestran en la UI.
 */
class SessionStore {
	session = $state<Session | null>(null);
	profile = $state<Profile | null>(null);
	loading = $state(true);
	profileError = $state<string | null>(null);

	role = $derived<UserRole | null>(this.profile?.role ?? null);
	canManage = $derived(this.role === 'admin' || this.role === 'dispatcher');
	email = $derived(this.session?.user.email ?? null);

	private started = false;

	/** Idempotente: se puede llamar desde cualquier layout o página. */
	async init(): Promise<void> {
		if (this.started) return;
		this.started = true;

		const { data } = await supabase.auth.getSession();
		this.session = data.session;
		await this.loadProfile();
		this.loading = false;

		supabase.auth.onAuthStateChange((_event, next) => {
			this.session = next;
			if (next) {
				void this.loadProfile();
			} else {
				this.profile = null;
				this.profileError = null;
			}
		});
	}

	async loadProfile(): Promise<void> {
		const userId = this.session?.user.id;
		if (!userId) {
			this.profile = null;
			return;
		}

		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', userId)
			.maybeSingle();

		if (error) {
			// Si el schema aún no está aplicado, no bloqueamos el login.
			this.profileError = error.message;
			this.profile = null;
			return;
		}

		this.profileError = null;
		this.profile = (data as Profile | null) ?? null;
	}

	async signIn(email: string, password: string): Promise<void> {
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) throw error;
	}

	async signOut(): Promise<void> {
		await supabase.auth.signOut();
		this.session = null;
		this.profile = null;
		this.profileError = null;
	}
}

export const session = new SessionStore();
