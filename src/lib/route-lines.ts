import type { FeatureCollection, LineString } from 'geojson';
import { supabase } from '#lib/supabase';

export interface RouteLineProperties {
	short_code: string;
	name: string;
	color: string;
}

export type RouteLines = FeatureCollection<LineString, RouteLineProperties>;

export async function loadRouteLines(): Promise<RouteLines | null> {
	const { data, error } = await supabase
		.from('routes_geojson')
		.select('short_code, name, color, geometry')
		.eq('is_active', true);

	if (error) return null;

	const features = (data ?? []).flatMap((row) => {
		if (!row.geometry) return [];
		return [
			{
				type: 'Feature' as const,
				properties: {
					short_code: row.short_code,
					name: row.name,
					color: row.color
				},
				geometry: row.geometry as LineString
			}
		];
	});

	return { type: 'FeatureCollection', features };
}
