// Tipos de dominio compartidos entre el dashboard web y la app móvil.

export type UserRole = 'passenger' | 'driver' | 'dispatcher' | 'admin';

export type BusStatus = 'active' | 'inactive' | 'maintenance';

export interface Profile {
	id: string;
	full_name: string;
	role: UserRole;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
}

/** Ruta de transporte. La geometría (LineString) se omite porque PostGIS la devuelve como WKB. */
export interface BusRoute {
	id: string;
	name: string;
	short_code: string;
	color: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

export interface Bus {
	id: string;
	plate: string;
	route_id: string | null;
	driver_id: string | null;
	capacity: number;
	status: BusStatus;
	created_at: string;
	updated_at: string;
}

/**
 * Posición en vivo que viaja por Supabase Realtime Broadcast.
 * No es una fila de `bus_positions`: ese broadcast no toca la base de datos.
 */
export interface BusPosition {
	bus_id: string;
	route_id: string;
	route_number?: string;
	plate: string;
	lat: number;
	lng: number;
	heading: number;
	speed: number;
	updated_at: string;
}

export const BUS_STATUS_LABEL: Record<BusStatus, string> = {
	active: 'En servicio',
	inactive: 'Fuera de servicio',
	maintenance: 'Mantenimiento'
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
	passenger: 'Pasajero',
	driver: 'Conductor',
	dispatcher: 'Despachador',
	admin: 'Administrador'
};
