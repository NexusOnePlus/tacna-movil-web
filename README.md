# Tacna Móvil · web

Landing pública y panel de despacho del transporte urbano de Tacna. Un solo
proyecto de SvelteKit desplegado en Cloudflare Workers: el subdominio decide qué
se muestra.

| Host                    | Contenido                               |
| ----------------------- | --------------------------------------- |
| `tacna-movil.glook.pro` | Landing pública                         |
| `tacna-panel.glook.pro` | Login y panel de operadores             |
| `localhost:5173`        | Ambos (el panel se fuerza con `?panel`) |

## Acceso al panel

1. Entra a **`/login`**:
   - local: <http://localhost:5173/login>
   - producción: <https://tacna-panel.glook.pro/login>
   - en local también sirve <http://localhost:5173/dashboard?panel> (redirige al login)
2. Inicia sesión con un usuario de Supabase Auth cuyo perfil tenga rol `admin` o
   `dispatcher`. El panel vive en `/dashboard`, `/dashboard/buses`,
   `/dashboard/routes` y `/dashboard/settings`.

Para habilitar un usuario, créalo en **Supabase → Authentication → Users** y
asigna su rol en la tabla `profiles`:

```sql
insert into public.profiles (id, full_name, role)
values ('<uuid-del-usuario>', 'Nombre Apellido', 'admin')
on conflict (id) do update set role = excluded.role;
```

`admin` y `dispatcher` pueden crear y editar; `driver` ve el panel en modo
lectura. La autorización real la aplica RLS en Postgres: la UI solo oculta
botones. Sin fila en `profiles` el usuario inicia sesión pero queda sin permisos.

Si el panel dice **«Perfil sin rol»** o **«bloqueó la operación por RLS»**, ejecuta
completo `supabase/policies.sql` en el SQL Editor y pulsa **Ajustes → Recargar
perfil**. `supabase/diagnostico.sql` sirve para ver el estado de usuario, tablas y
políticas antes y después.

En producción, pedir `/login` o `/dashboard` desde el dominio de la landing
redirige al subdominio del panel. En local y en previews (`*.pages.dev`) no hay
redirecciones entre hosts.

## Requisitos

- [Bun](https://bun.sh)
- Un proyecto de Supabase con las tablas `profiles`, `routes`, `buses` y sus
  políticas RLS
- Wrangler autenticado solo para desplegar

## Configuración

```sh
cp .env.example .env
```

Variables (todas públicas, se incrustan en el cliente):

| Variable                 | Uso                                           |
| ------------------------ | --------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL del proyecto de Supabase                  |
| `VITE_SUPABASE_ANON_KEY` | Anon key (la seguridad la da RLS)             |
| `VITE_MAP_STYLE`         | Estilo de MapLibre (por defecto, OpenFreeMap) |
| `VITE_APP_ENV`           | Etiqueta de entorno mostrada en Ajustes       |
| `VITE_PANEL_BASE_DOMAIN` | Override del dominio base (opcional)          |

En Cloudflare Pages/Workers configura las mismas variables y agrega los custom
domains `tacna-movil.glook.pro` y `tacna-panel.glook.pro`.

## Comandos

```sh
bun install
bun run dev        # servidor de desarrollo
bun run check      # svelte-check
bun run lint       # prettier --check + eslint
bun run format     # prettier --write
bun run build      # build para Cloudflare
bun run preview    # sirve el build con wrangler
bun run storybook  # catálogo de componentes
```

## Despliegue en Cloudflare

El mismo Worker sirve los dos hostnames; `src/hooks.server.ts` decide si la
request es landing o panel según el host.

1. La zona `glook.pro` debe estar activa en Cloudflare.
2. Configura `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MAP_STYLE` y
   `VITE_APP_ENV` como **variables de build** del Worker. Al ser `VITE_*` se
   incrustan al compilar, así que deben existir antes del `build`.
3. Despliega:

   ```sh
   bunx wrangler login
   bun run build
   bunx wrangler deploy
   ```

4. En **Workers → tacna-movil-web → Settings → Domains & Routes** agrega los dos
   custom domains:
   - `tacna-movil.glook.pro`
   - `tacna-panel.glook.pro`
5. En **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://tacna-panel.glook.pro`
   - Redirect URLs: `https://tacna-panel.glook.pro/**`,
     `https://tacna-movil.glook.pro/**` y `http://localhost:5173/**`
6. Comprueba:
   - `https://tacna-movil.glook.pro` → landing
   - `https://tacna-panel.glook.pro` → login
   - `https://tacna-movil.glook.pro/login` → redirige al panel

El preview `https://tacna-movil-web.<cuenta>.workers.dev` no tiene subdominios:
entra directo a `/login` o usa `/dashboard?panel`.

## Cómo se mueven los datos

- **Mapa**: MapLibre GL con el estilo de `VITE_MAP_STYLE`.
- **Posiciones en vivo**: Supabase Realtime Broadcast, canal `buses-live`,
  evento `bus-location`. No usa `postgres_changes`, así que no hace falta añadir
  tablas a la publicación `supabase_realtime`. Un bus sin señal desaparece del
  mapa a los 60 s.
- **Flota y rutas**: consultas normales a Supabase protegidas por RLS.
- **Sesión**: `supabase.auth` en el cliente (localStorage); el panel se renderiza
  solo en el navegador porque MapLibre y Realtime son APIs de navegador.

## Estructura

```
src/
├─ hooks.server.ts          # routing por subdominio (landing vs panel)
├─ lib/
│  ├─ components/           # Map, BusList, RouteSelector
│  ├─ stores/               # sesión y posiciones en vivo
│  ├─ supabase.ts           # cliente y estilo del mapa
│  ├─ types.ts              # tipos de dominio
│  └─ format.ts             # formato de tiempos, velocidades y errores
└─ routes/
   ├─ +page.svelte          # landing
   ├─ login/                # acceso de operadores
   └─ dashboard/            # mapa en vivo, flota, rutas y ajustes
```
