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
	pingCount = $state(0);
	avgPingMs = $state<number | null>(null);
	pingsByHour = $state<number[]>(Array(6).fill(0));

	list = $derived(
		Object.values(this.positions).sort((a, b) => a.plate.localeCompare(b.plate, 'es'))
	);
	count = $derived(this.list.length);

	private channel: RealtimeChannel | null = null;
	private pruneTimer: ReturnType<typeof setInterval> | null = null;
	private pingTimes: number[] = [];

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
		this.pingTimes = [];
		this.pingCount = 0;
		this.avgPingMs = null;
		this.pingsByHour = Array(6).fill(0);
	}

	/** Valida y aplica un payload recibido (o emitido localmente). */
	applyPosition(raw: unknown): void {
		const payload = raw as Partial<BusPosition> | null;
		if (!payload || typeof payload.bus_id !== 'string') return;
		if (typeof payload.lat !== 'number' || typeof payload.lng !== 'number') return;
		if (!Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) return;

		const previous = this.positions[payload.bus_id];
		if (previous && payload.updated_at && payload.updated_at < previous.updated_at) return;

		this.positions[payload.bus_id] = {
			bus_id: payload.bus_id,
			route_id: payload.route_id ?? '',
			route_number:
				typeof payload.route_number === 'string' && /^\d{1,6}$/.test(payload.route_number)
					? payload.route_number
					: undefined,
			plate: payload.plate ?? payload.bus_id.slice(0, 8),
			lat: payload.lat,
			lng: payload.lng,
			heading: typeof payload.heading === 'number' ? payload.heading : 0,
			speed: typeof payload.speed === 'number' ? payload.speed : 0,
			updated_at: payload.updated_at ?? new Date().toISOString()
		};
		const now = Date.now();
		this.lastEventAt = now;
		this.recordPing(now);
	}

	private recordPing(at: number): void {
		this.pingTimes.push(at);
		if (this.pingTimes.length > 240) this.pingTimes.shift();
		this.pingCount = this.pingTimes.length;

		if (this.pingTimes.length > 1) {
			let total = 0;
			for (let i = 1; i < this.pingTimes.length; i++) {
				total += this.pingTimes[i] - this.pingTimes[i - 1];
			}
			this.avgPingMs = total / (this.pingTimes.length - 1);
		}

		const buckets = Array(6).fill(0);
		for (const time of this.pingTimes) {
			const index = 5 - Math.floor((at - time) / 3_600_000);
			if (index >= 0 && index < 6) buckets[index] += 1;
		}
		this.pingsByHour = buckets;
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
