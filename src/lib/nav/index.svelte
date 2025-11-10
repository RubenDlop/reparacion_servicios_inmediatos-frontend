<script>
  import { onMount } from 'svelte';
  import { link, push } from 'svelte-spa-router';
  import { clearAuth } from '../api/auth.js';

  let loggedIn = false;

  function readAuth() {
    try {
      const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
      const tok = raw ? JSON.parse(raw) : null;
      loggedIn = Boolean(tok?.access_token);
    } catch {
      loggedIn = false;
    }
  }

  function logout() {
    clearAuth();
    readAuth();
    push('/login');
  }

  onMount(() => {
    readAuth();
    // refresca este header si otro tab cambia el token
    const onStorage = (e) => {
      if (e.key === 'auth') readAuth();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  });
</script>

<header class="sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur">
  <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 text-white/90">
    <a href="/" use:link class="flex items-center gap-2">
      <img src="/logo.png" alt="RIB" class="h-8 w-8 rounded-lg ring-1 ring-white/15 object-cover" />
      <span class="font-semibold">RIB</span>
    </a>

    <nav class="flex items-center gap-4 text-sm">
      <a href="/" use:link class="rounded px-2 py-1 hover:bg-white/10">Inicio</a>
      <a href="/servicios" use:link class="rounded px-2 py-1 hover:bg-white/10">Servicios</a>
      <a href="/precios" use:link class="rounded px-2 py-1 hover:bg-white/10">Precios</a>
      <a href="/contacto" use:link class="rounded px-2 py-1 hover:bg-white/10">Contacto</a>
      <span class="opacity-40">|</span>

      {#if loggedIn}
        <a href="/dashboard" use:link class="rounded px-2 py-1 hover:bg-white/10">Dashboard</a>
        <!-- 👇 Botón para pedir técnico -->
        <a href="/solicitar" use:link class="rounded bg-indigo-600 px-3 py-1 hover:brightness-110">Pedir técnico</a>
        <button class="rounded bg-white/10 px-3 py-1 hover:bg-white/20" on:click={logout}>Salir</button>
      {:else}
        <a href="/login" use:link class="rounded px-2 py-1 hover:bg-white/10">Iniciar sesión</a>
        <a href="/registro" use:link class="rounded bg-indigo-600 px-3 py-1 hover:brightness-110">Registrarse</a>
      {/if}
    </nav>
  </div>
</header>
