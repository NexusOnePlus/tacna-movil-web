// MapLibre v6 calcula su worker en runtime (`maplibre-gl-worker.mjs` junto al
// chunk), así que Vite no lo emite. Cloudflare además sirve .mjs con MIME
// vacío. Copiarlo como .js a static/ lo deja same-origin y con text/javascript.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const from = 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs';
const to = 'static/maplibre-gl-worker.js';

if (!existsSync(from)) {
	throw new Error(`No existe ${from}. Ejecuta bun install.`);
}

mkdirSync('static', { recursive: true });
copyFileSync(from, to);
console.log(`[maplibre] worker copiado a ${to}`);
