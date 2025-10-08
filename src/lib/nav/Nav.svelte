<script>
  import { link, location } from 'svelte-spa-router';
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // Props
  export let brand = 'RIB';
  export let logoSrc = '/logo.png';

  // Links
  export let links = {
    empresa: [
      { href: '/',           label: 'Inicio'     },
      { href: '/servicios',  label: 'Servicios'  },
      { href: '/precios',    label: 'Precios'    },
      { href: '/contacto',   label: 'Contacto'   },
    ],
    ayuda: [
      { href: '/faq',     label: 'FAQ'     },
      { href: '/soporte', label: 'Soporte' },
      { href: '/estado',  label: 'Estado'  },
    ],
    legal: [
      { href: '/privacidad', label: 'Privacidad' },
      { href: '/terminos',   label: 'Términos'   },
    ]
  };

  // Demo auth (cámbialo por tu store real)
  export let isLogged = false;
  export let userName = 'Invitado';
  function logout() { isLogged = false; dispatch('logout'); }

  let menuOpen = false;

  // Cierra el menú al navegar
  let prevPath = '';
  const unsubscribe = location.subscribe(($loc) => {
    if ($loc !== prevPath && menuOpen) menuOpen = false;
    prevPath = $loc;
  });
  onMount(() => () => unsubscribe());

  // Ruta actual reactiva
  $: current = $location;

  // Helpers de ruta
  const normalize = (p) => {
    if (!p) return '/';
    try { if (p.startsWith('http')) { const u = new URL(p); p = u.pathname + u.search + u.hash; } } catch {}
    p = p.replace(/^#\//, '/').replace(/#.*/, '').replace(/\?.*/, '');
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p || '/';
  };
  const isActive = (href) => {
    const a = normalize(current); const b = normalize(href);
    if (b === '/') return a === '/';
    return a === b || a.startsWith(b + '/');
  };

  // 👉 Cuando estamos en /login, /registro o /recuperar, mostramos SOLO “Inicio”
  $: path = normalize(current);
  $: authRoute = path === '/login' || path === '/registro' || path === '/recuperar';
</script>

<style>
  nav { position: sticky; top: 0; z-index: 50; background: #0b1220; color: #e5e7eb; }
  .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
  .brand { display:flex; align-items:center; gap:.5rem; font-weight:700; text-decoration:none; color:inherit; }
  .brand img { width: 32px; height: 32px; object-fit: contain; }
  .btn { padding:.5rem .75rem; border-radius:.5rem; text-decoration:none; display:inline-block; }
  .btn-ghost { color:#e5e7eb; }
  .btn-ghost:hover { background: rgba(255,255,255,.08); }
  .btn-primary { background:#6366f1; color:white; }
  .btn-primary:hover { filter:brightness(1.05); }
  .btn-outline { color:#e5e7eb; box-shadow: inset 0 0 0 1px rgba(255,255,255,.25); }
  .btn-outline:hover { background: rgba(255,255,255,.08); }
  .active { color:#a5b4fc; font-weight:700; position:relative; }
  .active::after { content:''; position:absolute; left:.5rem; right:.5rem; bottom:.35rem; height:2px; background:#a5b4fc; border-radius:2px; opacity:.9; }
  .section-title { font-size:.75rem; opacity:.6; margin:.75rem 0 .25rem; }
  .divider { height:1px; background:rgba(255,255,255,.08); margin:.5rem 0; }
  .shadow-soft { box-shadow: 0 10px 30px rgba(0,0,0,.25); }
  .avatar { width: 28px; height: 28px; border-radius: 999px; background: #94a3b8; display:inline-grid; place-items:center; font-size:.75rem; font-weight:700; }
  .menu { position: absolute; right: 0; top: 100%; background: #0b1220; border: 1px solid rgba(255,255,255,.1); border-radius: .5rem; padding: .25rem; min-width: 180px; }
  .menu a, .menu button { display:block; width:100%; text-align:left; padding:.5rem .75rem; border-radius:.375rem; color:#e5e7eb; text-decoration:none; }
  .menu a:hover, .menu button:hover { background: rgba(255,255,255,.08); }
</style>

<nav class="shadow-soft">
  <div class="container">
    <div class="h-14 flex items-center justify-between">
      <!-- Brand -->
      <a href="/" use:link class="brand" aria-label="Inicio">
        <img src={logoSrc} alt={brand} />
        <span>{brand}</span>
      </a>

      <!-- Desktop menu -->
      <div class="hidden md:flex items-center gap-1">
        <!-- Empresa -->
        {#if !authRoute}
          {#each links.empresa as item}
            <a href={item.href} use:link class="btn btn-ghost" class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
              {item.label}
            </a>
          {/each}

          <div class="mx-2 opacity-30">|</div>

          <!-- Ayuda -->
          {#each links.ayuda as item}
            <a href={item.href} use:link class="btn btn-ghost" class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
              {item.label}
            </a>
          {/each}

          <!-- Auth desktop -->
          {#if !isLogged}
            <a href="/login" use:link class="btn btn-outline ml-2">Iniciar sesión</a>
            <a href="/registro" use:link class="btn btn-primary ml-2">Registrarse</a>
          {:else}
            <div class="relative ml-2">
              <button class="btn btn-outline" aria-haspopup="menu" aria-expanded="false">
                <span class="avatar">{userName?.[0]?.toUpperCase() || 'U'}</span>
                <span class="ml-2">{userName}</span>
              </button>
              <div class="menu mt-2">
                <a href="/cuenta" use:link>Mi cuenta</a>
                <a href="/mis-trabajos" use:link>Mis trabajos</a>
                <button on:click={logout}>Cerrar sesión</button>
              </div>
            </div>
          {/if}
        {:else}
          <!-- Solo Inicio cuando estás en /login /registro /recuperar -->
          <a href="/" use:link class="btn btn-ghost" class:active={isActive('/')}>Inicio</a>
        {/if}
      </div>

      <!-- Mobile toggle -->
      <button aria-label="Abrir menú" class="md:hidden btn btn-ghost" on:click={() => (menuOpen = !menuOpen)}>
        {#if menuOpen} ✕ {:else} ☰ {/if}
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  {#if menuOpen}
    <div class="md:hidden">
      <div class="container pb-3">
        {#if !authRoute}
          <div class="section-title">Empresa</div>
          <div class="grid grid-cols-2 gap-2">
            {#each links.empresa as item}
              <a href={item.href} use:link class="btn btn-ghost" class:active={isActive(item.href)}>
                {item.label}
              </a>
            {/each}
          </div>

          <div class="divider" />

          <div class="section-title">Ayuda</div>
          <div class="grid grid-cols-2 gap-2">
            {#each links.ayuda as item}
              <a href={item.href} use:link class="btn btn-ghost" class:active={isActive(item.href)}>
                {item.label}
              </a>
            {/each}
          </div>

          <div class="divider" />

          <div class="section-title">Legal</div>
          <div class="grid grid-cols-2 gap-2">
            {#each links.legal as item}
              <a href={item.href} use:link class="btn btn-ghost" class:active={isActive(item.href)}>
                {item.label}
              </a>
            {/each}
          </div>

          <div class="divider" />

          <!-- Auth móvil -->
          {#if !isLogged}
            <a href="/login" use:link class="btn btn-outline w-full">Iniciar sesión</a>
            <a href="/registro" use:link class="btn btn-primary w-full mt-2">Registrarse</a>
          {:else}
            <a href="/cuenta" use:link class="btn btn-ghost w-full">Mi cuenta</a>
            <a href="/mis-trabajos" use:link class="btn btn-ghost w-full">Mis trabajos</a>
            <button class="btn btn-outline w-full mt-2" on:click={logout}>Cerrar sesión</button>
          {/if}
        {:else}
          <!-- Solo Inicio en rutas de auth -->
          <div class="grid grid-cols-1 gap-2">
            <a href="/" use:link class="btn btn-ghost" class:active={isActive('/')}>
              Inicio
            </a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>
