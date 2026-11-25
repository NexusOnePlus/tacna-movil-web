import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '#lib/supabase';
import type { BusPosition } from '#lib/types';

/**
 * Store de posiciones en vivo (Supabase Realtime Broadcast).
 *
 * Importante: NO usa `postgres_changes`, por lo que no requiere que las tablas
 * estén en la publicación `supabase_realtime`. El canal se declara con
 * `broadcast.self = true` para que el emisor (p. ej. el simulador del dashboard)
 * reciba también su propio evento y pruebe el pipeline completo.
 */

const TOPIC = 'buses-live';
const EVENT = 'bus-location';
const STALE_MS = 60_000; // un bus sin señal por 60 s desaparece del mapa
const PRUNE_MS = 10_000;

export type TrackerStatus = 'idle' | 'connecting' | 'live' | 'error';

class BusTracker {
	/** bus_id -> última posición conocida */
	positions = $state<Record<string, BusPosition>>({});
	status = $state<TrackerStatus>('idle');
	lastEventAt = $state<number | null>(null);
	lastError = $state<string | null>(null);

	list = $derived(
		Object.values(this.positions).sort((a, b) => a.plate.localeCompare(b.plate, 'es'))
	);
	count = $derived(this.list.length);

	private channel: RealtimeChannel | null = null;
	private pruneTimer: ReturnType<typeof setInterval> | null = null;

	connect(): void {
		if (this.channel) return;

		this.status = 'connecting';
		this.lastError = null;

		const channel = supabase.channel(TOPIC, { config: { broadcast: { self: true } } });

		channel.on('broadcast', { event: EVENT }, ({ payload }) => {
			this.applyPosition(payload);
		});

		channel.subscribe((state) => {
			if (state === 'SUBSCRIBED') {
				this.status = 'live';
				this.lastError = null;
			} else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
				this.status = 'error';
				this.lastError =
					state === 'TIMED_OUT'
						? 'El canal de Realtime no respondió (timeout).'
						: 'No se pudo abrir el canal de Realtime. Revisa la URL/anon key.';
			}
		});

		this.channel = channel;
		this.pruneTimer = setInterval(() => this.prune(), PRUNE_MS);
	}

	disconnect(): void {
		if (this.pruneTimer) {
			clearInterval(this.pruneTimer);
			this.pruneTimer = null;
		}
		if (this.channel) {
			void supabase.removeChannel(this.channel);
			this.channel = null;
		}
		this.positions = {};
		this.status = 'idle';
		this.lastEventAt = null;
	}

	/** Valida y aplica un payload recibido (o emitido localmente). */
	applyPosition(raw: unknown): void {
		const payload = raw as Partial<BusPosition> | null;
		if (!payload || typeof payload.bus_id !== 'string') return;
		if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') return;
		if (!Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) return;

		this.positions[payload.bus_id] = {
			bus_id: payload.bus_id,
			route_id: payload.route_id ?? '',
			plate: payload.plate ?? payload.bus_id.slice(0, 8),
			lat: payload.lat,
			lng: payload.lng,
			heading: typeof payload.heading === 'number' ? payload.heading : 0,
			speed: typeof payload.speed === 'number' ? payload.speed : 0,
			updated_at: payload.updated_at ?? new Date().toISOString()
		};
		this.lastEventAt = Date.now();
	}

	/** Emite una posición al canal. Si el socket no está unido, supabase-js cae a REST. */
	async publish(position: BusPosition): Promise<boolean> {
		if (!this.channel) this.connect();
		const channel = this.channel;
		if (!channel) return false;

		const result = await channel.send({
			type: 'broadcast',
			event: EVENT,
			payload: position
		});

		if (result !== 'ok') {
			this.lastError = `No se pudo emitir la posición (${result}).`;
			return false;
		}
		return true;
	}

	private prune(): void {
		const now = Date.now();
		for (const [busId, position] of Object.entries(this.positions)) {
			const timestamp = new Date(position.updated_at).getTime();
			if (!Number.isFinite(timestamp) || now - timestamp > STALE_MS) {
				delete this.positions[busId];
			}
		}
	}
}

export const busTracker = new BusTracker();
