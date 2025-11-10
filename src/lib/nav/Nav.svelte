<script>
  import { location, push } from 'svelte-spa-router';
  import { onDestroy, onMount, createEventDispatcher } from 'svelte';
  import { session, isLoggedIn } from '../stores/auth.js';

  const dispatch = createEventDispatcher();

  export let brand = 'RIB';
  export let logoSrc = '/logo.png';
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

  // Estado desde stores
  $: logged = $isLoggedIn;
  $: userName = $session?.user?.full_name ?? $session?.user?.email ?? 'Invitado';

  let menuOpen = false;
  let accountOpen = false;

  // Detecta cambios de ruta para cerrar menús
  let prevPath = '';
  const unsub = location.subscribe(($loc) => {
    if ($loc !== prevPath) {
      menuOpen = false;
      accountOpen = false;
      prevPath = $loc;
    }
  });
  onDestroy(() => unsub());

  // Ruta actual y helpers
  $: current = $location;
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

  // Detecta rutas de auth
  $: path = normalize(current);
  $: authRoute = path.startsWith('/login') || path.startsWith('/registro') || path.startsWith('/recuperar');

  function logout() { dispatch('logout'); accountOpen = false; }

  // Navegación SPA
  const go = (href) => (e) => { e?.preventDefault?.(); push(href); };

  // --------- DETECCIÓN DE PERFIL DE TÉCNICO (sin http.js) ----------
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

  function authHeaders() {
    try {
      const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
      const token = raw ? JSON.parse(raw).access_token : null;
      const h = { 'Content-Type': 'application/json' };
      if (token) h.Authorization = `Bearer ${token}`;
      return h;
    } catch { return { 'Content-Type': 'application/json' }; }
  }

  let tech = null;          // objeto perfil si existe
  let techLoading = false;  // por si quieres mostrar loader algún día

  async function checkTechProfile() {
    if (!logged) { tech = null; return; }
    techLoading = true;
    try {
      const res = await fetch(`${API_BASE_URL}/technicians/me`, { headers: authHeaders() });
      if (res.status === 200) {
        const ct = res.headers.get('content-type') || '';
        tech = ct.includes('application/json') ? await res.json() : null;
      } else if (res.status === 404) {
        tech = null; // no tiene perfil aún
      } else {
        tech = null; // otro error: lo tratamos como que no tiene
      }
    } catch {
      tech = null;
    } finally {
      techLoading = false;
    }
  }

  // Chequea al montar y cuando cambia el login o el usuario
  let lastUserId = null;
  onMount(() => { if (logged) checkTechProfile(); });
  $: if (logged && $session?.user?.id !== lastUserId) {
    lastUserId = $session?.user?.id ?? null;
    checkTechProfile();
  }
  $: if (!logged) { tech = null; lastUserId = null; }
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
      <a href="/" class="brand" aria-label="Inicio" on:click={go('/')}>
        <img src={logoSrc} alt={brand} />
        <span>{brand}</span>
      </a>

      <!-- Desktop -->
      <div class="hidden md:flex items-center gap-1">
        {#if authRoute}
          <!-- En rutas de auth solo Inicio -->
          <a href="/" class="btn btn-ghost" class:active={isActive('/')} on:click={go('/')}>Inicio</a>

        {:else if logged}
          <!-- Nav LOGUEADO -->
          <a href="/dashboard"
             class="btn btn-ghost"
             class:active={isActive('/dashboard')}
             aria-current={isActive('/dashboard') ? 'page' : undefined}
             on:click={go('/dashboard')}>
            Dashboard
          </a>

          <a href="/solicitar" class="btn btn-primary ml-1" on:click={go('/solicitar')}>Pedir técnico</a>

          {#if tech}
            <!-- Tiene perfil de técnico -->
            <a href="/mis-trabajos" class="btn btn-ghost" class:active={isActive('/mis-trabajos')} on:click={go('/mis-trabajos')}>Mis trabajos</a>
            <a href="/perfil-tecnico" class="btn btn-ghost" class:active={isActive('/perfil-tecnico')} on:click={go('/perfil-tecnico')}>Perfil técnico</a>
          {:else}
            <!-- NO tiene perfil todavía -->
            <a href="/soy-tecnico" class="btn btn-outline ml-1" on:click={go('/soy-tecnico')}>Soy técnico</a>
          {/if}

          <div class="relative ml-2">
            <button class="btn btn-outline flex items-center"
                    aria-haspopup="menu" aria-expanded={accountOpen}
                    on:click={() => (accountOpen = !accountOpen)}>
              <span class="avatar">{userName?.[0]?.toUpperCase() || 'U'}</span>
              <span class="ml-2 truncate max-w-[12rem]">{userName}</span>
            </button>
            {#if accountOpen}
              <div class="menu mt-2">
                <a href="/cuenta" on:click={go('/cuenta')}>Mi cuenta</a>
                {#if tech}
                  <a href="/perfil-tecnico" on:click={go('/perfil-tecnico')}>Perfil técnico</a>
                {:else}
                  <a href="/soy-tecnico" on:click={go('/soy-tecnico')}>Quiero ser técnico</a>
                {/if}
                <button on:click={logout}>Cerrar sesión</button>
              </div>
            {/if}
          </div>

        {:else}
          <!-- Nav NO LOGUEADO -->
          {#each links.empresa as item}
            <a href={item.href}
               class="btn btn-ghost"
               class:active={isActive(item.href)}
               aria-current={isActive(item.href) ? 'page' : undefined}
               on:click={go(item.href)}>
              {item.label}
            </a>
          {/each}
          <div class="mx-2 opacity-30">|</div>
          {#each links.ayuda as item}
            <a href={item.href}
               class="btn btn-ghost"
               class:active={isActive(item.href)}
               aria-current={isActive(item.href) ? 'page' : undefined}
               on:click={go(item.href)}>
              {item.label}
            </a>
          {/each}
          <div class="mx-2 opacity-30">|</div>
          {#each links.legal as item}
            <a href={item.href}
               class="btn btn-ghost"
               class:active={isActive(item.href)}
               aria-current={isActive(item.href) ? 'page' : undefined}
               on:click={go(item.href)}>
              {item.label}
            </a>
          {/each}
          <a href="/login" class="btn btn-outline ml-2" on:click={go('/login')}>Iniciar sesión</a>
          <a href="/registro" class="btn btn-primary ml-2" on:click={go('/registro')}>Registrarse</a>
        {/if}
      </div>

      <!-- Mobile toggle -->
      <button aria-label="Abrir menú" class="md:hidden btn btn-ghost" on:click={() => (menuOpen = !menuOpen)}>
        {#if menuOpen} ✕ {:else} ☰ {/if}
      </button>
    </div>
  </div>

  <!-- Mobile -->
  {#if menuOpen}
    <div class="md:hidden">
      <div class="container pb-3">
        {#if authRoute}
          <div class="grid grid-cols-1 gap-2">
            <a href="/" class="btn btn-ghost" class:active={isActive('/')} on:click={go('/')}>Inicio</a>
          </div>

        {:else if logged}
          <div class="grid grid-cols-1 gap-2">
            <a href="/dashboard" class="btn btn-ghost" class:active={isActive('/dashboard')} on:click={go('/dashboard')}>Dashboard</a>
            <a href="/solicitar" class="btn btn-primary" on:click={go('/solicitar')}>Pedir técnico</a>
            {#if tech}
              <a href="/mis-trabajos" class="btn btn-ghost" class:active={isActive('/mis-trabajos')} on:click={go('/mis-trabajos')}>Mis trabajos</a>
              <a href="/perfil-tecnico" class="btn btn-ghost" class:active={isActive('/perfil-tecnico')} on:click={go('/perfil-tecnico')}>Perfil técnico</a>
            {:else}
              <a href="/soy-tecnico" class="btn btn-outline" on:click={go('/soy-tecnico')}>Soy técnico</a>
            {/if}
            <a href="/cuenta" class="btn btn-ghost" on:click={go('/cuenta')}>Mi cuenta</a>
            <button class="btn btn-ghost" on:click={logout}>Cerrar sesión</button>
          </div>

        {:else}
          <div class="section-title">Empresa</div>
          <div class="grid grid-cols-2 gap-2">
            {#each links.empresa as item}
              <a href={item.href} class="btn btn-ghost" class:active={isActive(item.href)} on:click={go(item.href)}>{item.label}</a>
            {/each}
          </div>
          <div class="divider" />
          <div class="section-title">Ayuda</div>
          <div class="grid grid-cols-2 gap-2">
            {#each links.ayuda as item}
              <a href={item.href} class="btn btn-ghost" class:active={isActive(item.href)} on:click={go(item.href)}>{item.label}</a>
            {/each}
          </div>
          <div class="divider" />
          <div class="section-title">Legal</div>
          <div class="grid grid-cols-2 gap-2">
            {#each links.legal as item}
              <a href={item.href} class="btn btn-ghost" class:active={isActive(item.href)} on:click={go(item.href)}>{item.label}</a>
            {/each}
          </div>
          <div class="grid grid-cols-1 gap-2 mt-2">
            <a href="/login" class="btn btn-ghost" on:click={go('/login')}>Iniciar sesión</a>
            <a href="/registro" class="btn btn-primary" on:click={go('/registro')}>Registrarse</a>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>
