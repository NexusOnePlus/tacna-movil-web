<script lang="ts">
	import logoMark from '#lib/assets/brand/logo-icon-256.png';

	const routes = [
		{ code: 'A', name: 'Alto de la Alianza' },
		{ code: 'B', name: 'Pocollay' },
		{ code: 'C', name: 'Cono Sur' },
		{ code: 'D', name: 'Ciudad Nueva' }
	];
</script>

<svelte:head>
	<title>Tacna Móvil: la app del bus urbano de Tacna</title>
	<meta
		name="description"
		content="La app que muestra dónde está cada bus de las cuatro rutas urbanas de Tacna, con la posición actualizada cada 3 segundos."
	/>
	<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0b0b0b" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Tacna Móvil: la app del bus urbano de Tacna" />
	<meta
		property="og:description"
		content="Cuatro rutas urbanas y la posición de cada bus cada 3 segundos, en el teléfono."
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<style>
		html {
			background: #ffffff;
		}
		@media (prefers-color-scheme: dark) {
			html {
				background: #0b0b0b;
			}
		}
	</style>
</svelte:head>

<div class="ly">
	<a class="skip" href="#contenido">Saltar al contenido</a>

	<header class="nav">
		<div class="wrap nav__bar">
			<a class="logo" href="#top">
				<img class="logo__mark" src={logoMark} alt="" width="34" height="34" />
				Tacna Móvil
			</a>

			<a class="btn btn--primary" href="#descargar">Descargar la app</a>
		</div>
	</header>

	<main id="contenido">
		<section class="hero" id="top" aria-labelledby="hero-h">
			<div class="hero__pattern" aria-hidden="true"></div>

			<div class="wrap hero__grid">
				<div class="hero__copy">
					<p class="kicker mono">Tacna · 4 rutas urbanas</p>
					<h1 id="hero-h">Mapa de buses<br />en vivo para Tacna</h1>
					<p class="lead">
						La app muestra dónde está cada bus de las cuatro rutas urbanas y qué tan lejos está de
						tu paradero. La posición se actualiza cada 3 segundos.
					</p>
					<div class="hero__actions">
						<a class="btn btn--primary" href="#descargar">Descargar la app</a>
						<a class="btn btn--ghost" href="#rutas">Ver las rutas</a>
					</div>

					<dl class="facts">
						<div>
							<dt>Rutas</dt>
							<dd>4</dd>
						</div>
						<div>
							<dt>Buses</dt>
							<dd>12</dd>
						</div>
						<div>
							<dt>Posición</dt>
							<dd>3 s</dd>
						</div>
					</dl>
				</div>

				<div
					class="phone"
					role="img"
					aria-label="App en un teléfono: mapa con la ruta A trazada, el bus T1A-234 a 34 kilómetros por hora y la última señal hace 2 segundos"
				>
					<div class="phone__frame">
						<div class="phone__screen">
							<div class="phone__status">
								<span class="mono">9:41</span>
								<span class="phone__notch" aria-hidden="true"></span>
								<span class="phone__bars" aria-hidden="true"><i></i><i></i><i></i></span>
							</div>

							<div class="phone__head">
								<img src={logoMark} alt="" width="22" height="22" />
								<span>Tacna Móvil</span>
								<span class="phone__live mono"
									><span class="dot" aria-hidden="true"></span> En vivo</span
								>
							</div>

							<div class="phone__map">
								<svg viewBox="0 0 300 430" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
									<rect width="300" height="430" fill="var(--phone-map)" />
									<rect x="176" y="56" width="86" height="64" fill="var(--phone-block)" />
									<rect x="24" y="286" width="74" height="72" fill="var(--phone-block)" />
									<g stroke="var(--phone-street)" stroke-width="10" fill="none">
										<path d="M0 120h300M0 232h300M0 344h300" />
										<path d="M64 0v430M160 0v430M252 0v430" />
									</g>
									<g stroke="var(--phone-line)" stroke-width="1.5" fill="none">
										<path d="M0 120h300M0 232h300M0 344h300" />
										<path d="M64 0v430M160 0v430M252 0v430" />
									</g>
									<path
										d="M18 356C96 322 104 244 160 226S248 150 284 112"
										fill="none"
										stroke="var(--ink)"
										stroke-width="5"
										stroke-linecap="round"
									/>
									<g fill="var(--bg)" stroke="var(--ink)" stroke-width="3">
										<circle cx="18" cy="356" r="6" />
										<circle cx="160" cy="226" r="6" />
										<circle cx="284" cy="112" r="6" />
									</g>
									<circle class="pulse" cx="196" cy="192" r="14" fill="var(--ink)" opacity="0.18" />
									<circle
										cx="196"
										cy="192"
										r="8"
										fill="var(--ink)"
										stroke="var(--bg)"
										stroke-width="3"
									/>
								</svg>
							</div>

							<div class="phone__sheet">
								<div class="phone__sheet-head">
									<span class="chip">A</span>
									<div>
										<b>Ruta A</b>
										<span>Alto de la Alianza</span>
									</div>
									<em class="mono">hace 2 s</em>
								</div>
								<div class="phone__sheet-row">
									<span>T1A-234</span>
									<b class="mono">34 km/h</b>
								</div>
								<div class="phone__bar" aria-hidden="true"><i></i></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<section class="sec" id="app" aria-labelledby="app-h">
			<div class="wrap">
				<div class="sec__head">
					<p class="kicker mono">La app</p>
					<h2 id="app-h">Lo que ves al abrirla</h2>
					<p class="sub">
						El bus en el mapa, las rutas separadas y la posición al día. Sin cuenta.
					</p>
				</div>

				<div class="cards">
					<article class="card">
						<svg class="card__icon" viewBox="0 0 56 56" aria-hidden="true">
							<path
								d="M28 6c-7 0-12 5-12 11 0 8 12 21 12 21s12-13 12-21c0-6-5-11-12-11z"
								fill="none"
								stroke="currentColor"
								stroke-width="2.4"
								stroke-linejoin="round"
							/>
							<circle cx="28" cy="17" r="4" fill="currentColor" />
						</svg>
						<h3>El bus en el mapa</h3>
						<p>
							El marcador se mueve cada 3 segundos. Si el bus deja de reportar, desaparece a los 60
							segundos.
						</p>
					</article>

					<article class="card">
						<svg class="card__icon" viewBox="0 0 56 56" aria-hidden="true">
							<path
								d="M8 14h40M8 28h40M8 42h40"
								stroke="currentColor"
								stroke-width="1.6"
								opacity="0.28"
							/>
							<circle cx="16" cy="14" r="5" fill="currentColor" />
							<circle cx="30" cy="28" r="5" fill="currentColor" opacity="0.62" />
							<circle cx="40" cy="42" r="5" fill="currentColor" opacity="0.42" />
							<circle cx="46" cy="14" r="5" fill="currentColor" opacity="0.82" />
						</svg>
						<h3>Cuatro rutas separadas</h3>
						<p>
							Alto de la Alianza, Pocollay, Cono Sur y Ciudad Nueva, cada una con su propia línea en
							el mapa.
						</p>
					</article>

					<article class="card">
						<svg class="card__icon" viewBox="0 0 56 56" aria-hidden="true">
							<circle cx="28" cy="28" r="18" fill="none" stroke="currentColor" stroke-width="2.4" />
							<path
								d="M19 28.5l6 6 11-12"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<h3>Sin cuenta ni registro</h3>
						<p>
							El pasajero abre la app y ve el mapa. No hay contraseña ni datos personales de por
							medio.
						</p>
					</article>
				</div>

				<div class="buslist">
					<div class="buslist__head">
						<span class="mono">Buses reportando</span>
						<span class="mono buslist__live">3 en vivo</span>
					</div>
					<ul>
						<li>
							<span class="chip">A</span>
							<span class="buslist__name">T1A-234<small>Alto de la Alianza</small></span>
							<span class="mono">34 km/h</span>
							<span class="mono buslist__age">hace 2 s</span>
						</li>
						<li>
							<span class="chip">B</span>
							<span class="buslist__name">T2B-118<small>Pocollay</small></span>
							<span class="mono">28 km/h</span>
							<span class="mono buslist__age">hace 5 s</span>
						</li>
						<li>
							<span class="chip">C</span>
							<span class="buslist__name">T3C-047<small>Cono Sur</small></span>
							<span class="mono">31 km/h</span>
							<span class="mono buslist__age">hace 1 s</span>
						</li>
						<li>
							<span class="chip">D</span>
							<span class="buslist__name">T4D-092<small>Ciudad Nueva</small></span>
							<span class="mono">26 km/h</span>
							<span class="mono buslist__age">hace 4 s</span>
						</li>
					</ul>
				</div>
			</div>
		</section>

		<section class="sec sec--rutas" id="rutas" aria-labelledby="rutas-h">
			<div class="wrap">
				<div class="sec__head sec__head--wide">
					<p class="kicker mono">Rutas</p>
					<h2 id="rutas-h">Las cuatro rutas urbanas</h2>
					<p class="sub">Las mismas rutas del panel de despacho.</p>
				</div>

				<div class="routes">
					<div>
						<ul class="rows">
							{#each routes as route (route.code)}
								<li>
									<span class="chip chip--lg">{route.code}</span>
									<span class="route-name">{route.name}</span>
									<span class="route-live">
										<span class="dot" aria-hidden="true"></span>
										En vivo
									</span>
								</li>
							{/each}
						</ul>

						<p class="rows__note">
							Si una ruta no tiene buses en la calle, aparece sin marcadores hasta que un conductor
							inicie turno.
						</p>
					</div>

					<div
						class="routemap"
						role="img"
						aria-label="Las cuatro rutas cruzando el centro de Tacna"
					>
						<svg viewBox="0 0 400 400" aria-hidden="true">
							<rect width="400" height="400" fill="var(--phone-map)" />
							<g stroke="var(--phone-street)" stroke-width="9">
								<path d="M0 100h400M0 200h400M0 300h400M100 0v400M200 0v400M300 0v400" />
							</g>
							<g stroke="var(--phone-line)" stroke-width="1.4">
								<path d="M0 100h400M0 200h400M0 300h400M100 0v400M200 0v400M300 0v400" />
							</g>
							<path
								d="M28 352C132 312 148 210 236 196S344 118 380 88"
								fill="none"
								stroke="var(--ink)"
								stroke-width="6"
								stroke-linecap="round"
							/>
							<path
								d="M14 120C118 152 166 216 258 238S352 312 388 356"
								fill="none"
								stroke="var(--ink)"
								stroke-width="4"
								stroke-linecap="round"
								stroke-dasharray="10 7"
								opacity="0.62"
							/>
							<path
								d="M26 246C136 224 196 152 266 122S350 78 386 64"
								fill="none"
								stroke="var(--ink)"
								stroke-width="4"
								stroke-linecap="round"
								stroke-dasharray="2 7"
								opacity="0.78"
							/>
							<path
								d="M52 52C148 96 218 268 288 300S352 344 384 328"
								fill="none"
								stroke="var(--ink)"
								stroke-width="4"
								stroke-linecap="round"
								stroke-dasharray="18 6 4 6"
								opacity="0.5"
							/>
							<g font-family="JetBrains Mono, monospace" font-size="13">
								<circle cx="380" cy="88" r="13" fill="var(--ink)" />
								<text x="380" y="93" text-anchor="middle" fill="var(--bg)">A</text>
								<circle cx="388" cy="356" r="13" fill="var(--ink)" />
								<text x="388" y="361" text-anchor="middle" fill="var(--bg)">B</text>
								<circle cx="386" cy="64" r="13" fill="var(--ink)" />
								<text x="386" y="69" text-anchor="middle" fill="var(--bg)">C</text>
								<circle cx="384" cy="328" r="13" fill="var(--ink)" />
								<text x="384" y="333" text-anchor="middle" fill="var(--bg)">D</text>
							</g>
						</svg>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="download" id="descargar" aria-labelledby="descargar-h">
		<div class="wrap download__in">
			<div class="download__grid">
				<div class="download__copy">
					<p class="kicker mono">Descargar</p>
					<h2 id="descargar-h">La app sale primero en Android</h2>
					<p class="sub">
						Estamos probando la app con la flota de las cuatro rutas. Deja tu correo y te escribimos
						el día que el APK esté publicado.
					</p>
				</div>

				<form
					class="form"
					action="mailto:hola@tacnamovil.example"
					method="post"
					enctype="text/plain"
				>
					<label for="correo">Correo</label>
					<input
						id="correo"
						name="correo"
						type="email"
						autocomplete="email"
						placeholder="tu@correo.com"
						required
					/>
					<button class="btn btn--primary" type="submit">Recibir el APK</button>
					<p class="form__note">Un solo correo, el día que esté publicado.</p>
				</form>
			</div>

			<div class="foot">
				<a class="logo" href="#top">
					<img class="logo__mark" src={logoMark} alt="" width="34" height="34" />
					Tacna Móvil
				</a>
				<p class="foot__legal">© 2026 Tacna Móvil · Datos del mapa: OpenStreetMap</p>
			</div>
		</div>
	</footer>
</div>

<style>
	.ly {
		--bg: #ffffff;
		--surface: #f5f5f5;
		--ink: #0a0a0a;
		--muted: #666666;
		--line: #e6e6e6;
		--accent: #e8c43c;
		--btn-bg: var(--accent);
		--btn-ink: #0a0a0a;
		--phone-map: #ededed;
		--phone-block: #e0e0e0;
		--phone-street: #ffffff;
		--phone-line: #d6d6d6;
		--nav-h: 64px;
		--gut: clamp(20px, 5vw, 80px);
		--wrap: min(100% - 2 * var(--gut), 1160px);

		background: var(--bg);
		color: var(--ink);
		font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif;
		font-size: 16px;
		line-height: 1.6;
		overflow-x: clip;
		-webkit-font-smoothing: antialiased;
	}

	@media (prefers-color-scheme: dark) {
		.ly {
			--bg: #0b0b0b;
			--surface: #141414;
			--ink: #f5f5f5;
			--muted: #a3a3a3;
			--line: #262626;
			--accent: #e8c43c;
			--btn-bg: var(--accent);
			--btn-ink: #0a0a0a;
			--phone-map: #1a1a1a;
			--phone-block: #242424;
			--phone-street: #2e2e2e;
			--phone-line: #3a3a3a;
		}
	}

	.ly :global(*) {
		box-sizing: border-box;
	}

	.wrap {
		width: var(--wrap);
		margin-inline: auto;
	}

	.mono {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
	}

	h1,
	h2,
	h3,
	p,
	ul,
	dl,
	dd {
		margin: 0;
	}

	h1 {
		font-size: clamp(38px, 4.8vw, 62px);
		font-weight: 600;
		line-height: 1.02;
		letter-spacing: -0.045em;
		text-wrap: balance;
	}

	h2 {
		font-size: clamp(28px, 3vw, 42px);
		font-weight: 600;
		line-height: 1.07;
		letter-spacing: -0.034em;
		text-wrap: balance;
	}

	h3 {
		font-size: 19px;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.012em;
	}

	.lead {
		font-size: clamp(17px, 1.4vw, 19px);
		line-height: 1.55;
		color: var(--muted);
		max-width: 46ch;
	}

	.sub {
		font-size: 17px;
		line-height: 1.6;
		color: var(--muted);
		max-width: 50ch;
	}

	.kicker {
		font-size: 13px;
		font-weight: 500;
		color: var(--muted);
	}

	/* ---------- nav con blur ---------- */

	.skip {
		position: absolute;
		left: -9999px;
		top: 0;
		z-index: 100;
		background: var(--ink);
		color: var(--bg);
		padding: 10px 16px;
		border-radius: 0 0 8px 0;
		font-size: 14px;
	}

	.skip:focus {
		left: 0;
	}

	.nav {
		position: fixed;
		inset: 0 0 auto;
		z-index: 50;
		height: var(--nav-h);
		background: color-mix(in srgb, var(--bg) 72%, transparent);
		backdrop-filter: blur(16px) saturate(140%);
		-webkit-backdrop-filter: blur(16px) saturate(140%);
		border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
	}

	.nav__bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		height: 100%;
	}

	.logo {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: 17px;
		font-weight: 700;
		letter-spacing: -0.025em;
		color: var(--ink);
		text-decoration: none;
	}

	.logo__mark {
		display: block;
		width: 36px;
		height: 36px;
		border-radius: 11px;
		object-fit: cover;
		flex-shrink: 0;
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 14%, transparent);
	}

	/* ---------- botones ---------- */

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 46px;
		padding: 0 22px;
		border: 1px solid transparent;
		border-radius: 10px;
		font-size: 15px;
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
		transition:
			transform 0.18s ease,
			background-color 0.18s ease,
			border-color 0.18s ease;
	}

	.btn--primary {
		background: var(--btn-bg);
		color: var(--btn-ink);
	}

	.btn--primary:hover {
		transform: translateY(-1px);
		opacity: 0.88;
	}

	.btn--ghost {
		background: transparent;
		border-color: var(--line);
		color: var(--ink);
	}

	.btn--ghost:hover {
		border-color: var(--ink);
		transform: translateY(-1px);
	}

	.btn:active {
		transform: translateY(1px);
	}

	.btn:focus-visible,
	.logo:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 3px;
	}

	/* ---------- hero ---------- */

	.hero {
		position: relative;
		min-height: 100svh;
		display: flex;
		align-items: center;
		padding: calc(var(--nav-h) + 40px) 0 44px;
		overflow: hidden;
	}

	.hero__pattern {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image:
			linear-gradient(
				to right,
				color-mix(in srgb, var(--ink) 6%, transparent) 1px,
				transparent 1px
			),
			linear-gradient(
				to bottom,
				color-mix(in srgb, var(--ink) 6%, transparent) 1px,
				transparent 1px
			);
		background-size: 72px 72px;
		mask-image: radial-gradient(120% 90% at 50% 10%, #000 20%, transparent 78%);
	}

	.hero__grid {
		position: relative;
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		gap: clamp(32px, 6vw, 88px);
		align-items: center;
	}

	.hero__copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.hero h1 {
		margin-top: 12px;
	}

	.hero .lead {
		margin-top: 18px;
	}

	.hero__actions {
		display: flex;
		gap: 10px;
		margin-top: 26px;
	}

	.facts {
		display: flex;
		gap: clamp(24px, 4vw, 48px);
		margin-top: 36px;
		padding-top: 22px;
		border-top: 1px solid var(--line);
		width: 100%;
		max-width: 420px;
	}

	.facts dt {
		font-size: 12px;
		color: var(--muted);
	}

	.facts dd {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 21px;
		font-weight: 500;
		line-height: 1.2;
	}

	/* ---------- teléfono ---------- */

	.phone {
		justify-self: center;
		width: min(300px, 100%);
		padding: 10px;
		border-radius: 42px;
		background: #0a0a0a;
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--ink) 16%, transparent),
			0 40px 90px -40px rgba(0, 0, 0, 0.5);
	}

	.phone__frame {
		border-radius: 34px;
		overflow: hidden;
		background: var(--bg);
	}

	.phone__screen {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 536px;
	}

	.phone__status {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px 8px;
		font-size: 10px;
		color: var(--muted);
	}

	.phone__notch {
		width: 64px;
		height: 5px;
		border-radius: 99px;
		background: color-mix(in srgb, var(--ink) 22%, transparent);
	}

	.phone__bars {
		display: flex;
		align-items: flex-end;
		gap: 2px;
	}

	.phone__bars i {
		width: 3px;
		height: 6px;
		border-radius: 1px;
		background: var(--muted);
	}

	.phone__bars i:nth-child(2) {
		height: 9px;
	}

	.phone__bars i:nth-child(3) {
		height: 12px;
	}

	.phone__map {
		position: relative;
		flex: 1;
		min-height: 0;
	}

	.phone__map svg {
		display: block;
		width: 100%;
		height: 100%;
	}

	.phone__live {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 10px;
		color: var(--muted);
	}

	.phone__head {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 14px 10px;
		font-size: 11px;
		font-weight: 600;
	}

	.phone__head img {
		width: 24px;
		height: 24px;
		border-radius: 7px;
	}

	.phone__sheet {
		position: relative;
		margin: -18px 10px 10px;
		padding: 12px 14px 14px;
		border-radius: 18px;
		background: color-mix(in srgb, var(--bg) 74%, transparent);
		backdrop-filter: blur(18px) saturate(150%);
		-webkit-backdrop-filter: blur(18px) saturate(150%);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--line) 70%, transparent);
	}

	.phone__sheet-head {
		display: flex;
		align-items: center;
		gap: 9px;
	}

	.phone__sheet b {
		display: block;
		font-size: 12px;
		font-weight: 600;
	}

	.phone__sheet span {
		display: block;
		font-size: 11px;
		color: var(--muted);
	}

	.phone__sheet em {
		margin-left: auto;
		font-size: 10px;
		font-style: normal;
		color: var(--muted);
	}

	.phone__sheet-row {
		display: flex;
		justify-content: space-between;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid var(--line);
		font-size: 11px;
		color: var(--muted);
	}

	.phone__sheet-row b {
		font-size: 11px;
		color: var(--ink);
	}

	.phone__bar {
		height: 7px;
		margin-top: 10px;
		border-radius: 99px;
		background: color-mix(in srgb, var(--ink) 10%, transparent);
		overflow: hidden;
	}

	.phone__bar i {
		display: block;
		width: 64%;
		height: 100%;
		border-radius: 99px;
		background: var(--ink);
	}

	.chip {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 7px;
		background: var(--ink);
		color: var(--bg);
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 11px;
		font-weight: 500;
	}

	.chip--lg {
		width: 34px;
		height: 34px;
		border-radius: 9px;
		font-size: 13px;
	}

	.pulse {
		transform-box: fill-box;
		transform-origin: center;
	}

	/* ---------- secciones ---------- */

	.sec {
		min-height: 100svh;
		display: grid;
		align-content: start;
		padding: clamp(96px, 12vh, 136px) 0 clamp(48px, 8vh, 96px);
		scroll-margin-top: 72px;
	}

	.sec__head {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: clamp(32px, 5vh, 56px);
	}

	.sec__head h2 {
		max-width: 20ch;
	}

	/* ---------- tarjetas ---------- */

	.cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: clamp(24px, 3vw, 40px);
	}

	.card {
		padding-top: 22px;
		border-top: 1px solid var(--ink);
	}

	.card__icon {
		width: 56px;
		height: 56px;
		color: var(--ink);
	}

	.card h3 {
		margin-top: 18px;
	}

	.card p {
		margin-top: 8px;
		font-size: 16px;
		color: var(--muted);
		max-width: 36ch;
	}

	.buslist {
		margin-top: clamp(28px, 4vh, 44px);
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--surface);
		overflow: hidden;
	}

	.buslist__head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 11px 16px;
		border-bottom: 1px solid var(--line);
		font-size: 11px;
		color: var(--muted);
	}

	.buslist__live {
		color: var(--ink);
	}

	.buslist ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.buslist li {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 14px;
		padding: 10px 16px;
		border-bottom: 1px solid var(--line);
		font-size: 13px;
		color: var(--muted);
	}

	.buslist li:last-child {
		border-bottom: 0;
	}

	.buslist .chip {
		width: 26px;
		height: 26px;
		border-radius: 7px;
		font-size: 11px;
	}

	.buslist__name {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink);
	}

	.buslist__name small {
		display: block;
		font-size: 11px;
		font-weight: 400;
		color: var(--muted);
	}

	.buslist__age {
		font-size: 11px;
	}

	/* ---------- rutas ---------- */

	.routes {
		display: grid;
		grid-template-columns: 7fr 5fr;
		gap: clamp(32px, 5vw, 72px);
		align-items: start;
	}

	.rows {
		list-style: none;
		padding: 0;
		border-top: 1px solid var(--line);
	}

	.rows li {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		align-items: center;
		gap: 16px;
		padding: 18px 0;
		border-bottom: 1px solid var(--line);
	}

	.route-name {
		font-size: 19px;
		font-weight: 600;
		letter-spacing: -0.015em;
	}

	.route-live {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-size: 13px;
		color: var(--muted);
	}

	.dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent);
	}

	.rows__note {
		margin-top: 18px;
		font-size: 14px;
		color: var(--muted);
		max-width: 56ch;
	}

	.routemap {
		border: 1px solid var(--line);
		border-radius: 16px;
		overflow: hidden;
		background: var(--phone-map);
	}

	.routemap svg {
		display: block;
		width: 100%;
		height: auto;
	}

	/* ---------- descarga ---------- */

	.download {
		min-height: 100svh;
		display: flex;
		flex-direction: column;
		padding: calc(var(--nav-h) + clamp(56px, 8vh, 96px)) 0 32px;
		background: var(--surface);
		border-top: 1px solid var(--line);
		scroll-margin-top: 72px;
	}

	.download__in {
		display: flex;
		flex-direction: column;
		flex: 1;
		gap: clamp(40px, 7vh, 80px);
	}

	.download__grid {
		flex: 1;
		display: grid;
		grid-template-columns: 6fr 5fr;
		gap: clamp(32px, 6vw, 96px);
		align-content: center;
	}

	.download h2 {
		margin-top: 10px;
		max-width: 16ch;
	}

	.download .sub {
		margin-top: 14px;
	}

	.form {
		display: grid;
		gap: 10px;
		padding-top: 6px;
	}

	.form label {
		font-size: 13px;
		font-weight: 600;
	}

	.form input {
		height: 50px;
		padding: 0 14px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--bg);
		color: var(--ink);
		font-family: inherit;
		font-size: 16px;
	}

	.form input::placeholder {
		color: var(--muted);
	}

	.form input:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}

	.form .btn {
		margin-top: 6px;
	}

	.form__note {
		font-size: 13px;
		color: var(--muted);
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 26px;
		border-top: 1px solid var(--line);
	}

	.foot__legal {
		font-size: 12px;
		color: var(--muted);
	}

	/* ---------- movimiento ---------- */

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes pulse {
		0% {
			transform: scale(0.55);
			opacity: 0.8;
		}
		70% {
			transform: scale(1.7);
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.hero__copy > * {
			animation: rise 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) both;
		}

		.hero__copy > :nth-child(2) {
			animation-delay: 0.06s;
		}
		.hero__copy > :nth-child(3) {
			animation-delay: 0.12s;
		}
		.hero__copy > :nth-child(4) {
			animation-delay: 0.18s;
		}
		.hero__copy > :nth-child(5) {
			animation-delay: 0.24s;
		}

		.phone {
			animation: rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 0.16s both;
		}

		.pulse {
			animation: pulse 2.6s ease-out infinite;
		}

		.dot {
			animation: pulse 2.6s ease-out infinite;
		}
	}

	/* ---------- responsive ---------- */

	@media (max-width: 1023px) {
		.hero {
			min-height: auto;
			padding-top: calc(var(--nav-h) + 56px);
			padding-bottom: 64px;
		}

		.hero__grid {
			grid-template-columns: 1fr;
			gap: 48px;
		}

		.hero__copy {
			align-items: flex-start;
		}

		.phone {
			width: min(280px, 100%);
		}

		.cards {
			grid-template-columns: 1fr;
			max-width: 620px;
		}

		.routes {
			grid-template-columns: 1fr;
		}

		.routemap {
			max-width: 480px;
		}

		.download__grid {
			grid-template-columns: 1fr;
			gap: 36px;
		}
	}

	@media (max-width: 520px) {
		.hero h1 br {
			display: none;
		}

		.hero__actions {
			flex-direction: column;
			width: 100%;
		}

		.hero__actions .btn {
			width: 100%;
		}

		.facts {
			gap: 20px;
		}

		.phone__screen {
			height: 460px;
		}

		.rows li {
			grid-template-columns: 38px 1fr;
			gap: 6px 14px;
			padding: 16px 0;
		}

		.route-live {
			grid-column: 2;
		}

		.buslist__age {
			display: none;
		}
	}
</style>
