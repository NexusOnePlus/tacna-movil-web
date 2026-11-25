# Tacna Móvil web

Landing pública y panel de despacho del transporte urbano de Tacna. SvelteKit +
Supabase + MapLibre, desplegado en Cloudflare Workers.

## Contexto compartido

La memoria viva está fuera del repo: reference `context` → `../tacna-movil-context`.

- Al empezar una sesión: lee `.context/STATUS.md` y `.context/CONSTRAINTS.md`.
- Al terminar: actualízalos en ese repo y commitea allí, no aquí.

## Comandos

```sh
bun install
bun run dev      # local
bun run check    # svelte-check
bun run lint     # prettier + eslint
bun run format
bun run build    # vite build
bun run preview  # wrangler dev
```

Usa Bun, no npm.

## Dónde está cada cosa

- `src/hooks.server.ts`: routing por host (landing vs panel).
- `src/routes/+page.svelte`: landing.
- `src/routes/login/`: acceso de operadores.
- `src/routes/dashboard/`: mapa, flota, rutas y ajustes.
- `src/lib/stores/`: sesión y posiciones Realtime.
- `src/lib/components/`: Map, BusList, RouteSelector.
- `supabase/policies.sql` y `supabase/diagnostico.sql`: base de datos.

## Reglas

- Textos en español; iconos con `@lucide/svelte`, nunca emojis.
- El panel y el login son client-only (`ssr = false`) por MapLibre y Realtime.
- GRANT y RLS son capas distintas: `42501` = faltan permisos de tabla.
- No commitear `.env`, credenciales ni datos personales.
- No versionar `worker-configuration.d.ts` (generado).
- Commits convencionales en español.
- Si hay que reescribir y empujar: `git push --force-with-lease`.
