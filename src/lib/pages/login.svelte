<script>
  import { link, push } from 'svelte-spa-router';
  import { login as loginRequest, setAuth, me } from '../api/auth.js';
  import { loginSet } from '../stores/auth.js';

  // Props opcionales
  export let brand = 'RIB';
  export let logoSrc = '/logo.png';
  export let bgImage = '/hero.jpg'; // cambia por tu imagen: /assets/...

  // Estado local (solo UI)
  let email = '';
  let password = '';
  let remember = true;
  let showPass = false;
  let loading = false;
  let message = '';
  let authData = null;

  // Validaciones simples (UI)
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const passOk  = (v) => v.length >= 6;

  // Sanitiza un destino para evitar URLs externas
  function sanitizeNext(p) {
    if (!p || typeof p !== 'string') return '';
    try {
      // Solo aceptamos rutas internas que empiecen con "/"
      return p.startsWith('/') ? p : '';
    } catch {
      return '';
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    message = '';
    authData = null;

    if (!emailOk(email) || !passOk(password)) {
      message = 'Verifica tu correo y una contraseña de al menos 6 caracteres.';
      return;
    }

    loading = true;

    try {
      const { response, data } = await loginRequest(email, password);

      if (!response.ok) {
        const detail = data?.detail ?? data?.message ?? data?.error ?? data?.errors;
        let errorMessage = 'Correo o contraseña incorrectos. Intenta de nuevo.';

        if (Array.isArray(detail)) {
          const joined = detail
            .map((item) => {
              if (typeof item === 'string') return item;
              if (item?.msg) return item.msg;
              if (item?.message) return item.message;
              return null;
            })
            .filter(Boolean)
            .join(' ');
          if (joined) errorMessage = joined;
        } else if (detail && typeof detail === 'object') {
          errorMessage = detail.msg ?? detail.message ?? JSON.stringify(detail);
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }

        message = errorMessage;
        return;
      }

      authData = data;
      message = '';

      // 1) Guardar credenciales/tokens en storage unificado
      setAuth(data, remember);

      // 2) Actualizar store global con el usuario
      let user = data?.user;
      if (!user) {
        try {
          const { response: r2, data: d2 } = await me();
          if (r2?.ok) user = d2;
        } catch {}
      }
      loginSet(user ?? null);

      // 3) Limpiar UI
      email = '';
      password = '';

      // 4) Redirigir
      const params = new URLSearchParams(window.location.search);
      let next = sanitizeNext(params.get('next'));

      // Si no viene next, elige destino por rol
      // - superusuario → /admin
      // - usuario normal → /dashboard
      const defaultNext = user?.is_superuser ? '/admin' : '/dashboard';

      // Si el next apunta a páginas de auth o es vacío, usa defaultNext
      const isAuthPage =
        next === '/login' || next === '/registro' || next === '/recuperar';

      // También si next es "/" preferimos el destino por rol
      if (!next || isAuthPage || next === '/') {
        next = defaultNext;
      }

      // Seguridad extra: si el usuario ES admin y next NO es /admin
      // pero venía vacío o apuntaba a dashboard, fuerza /admin.
      if (user?.is_superuser && (next === '/dashboard' || next === '/')) {
        next = '/admin';
      }

      push(next);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      message = 'No se pudo conectar con el servidor. Intenta nuevamente más tarde.';
    } finally {
      loading = false;
    }
  }
</script>

<!-- Fondo a pantalla completa con imagen + capa -->
<section
  class="relative min-h-screen w-full overflow-hidden"
  style={`background-image:url('${bgImage}'); background-size:cover; background-position:center;`}
  aria-label="Fondo de inicio de sesión"
>
  <div class="absolute inset-0 bg-slate-900/50"></div>
  <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/60"></div>

  <div class="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4">
    <div
      class="w-full max-w-md rounded-2xl border border-white/15 bg-white/80 p-6 shadow-2xl backdrop-blur-xl
             dark:bg-slate-900/70 dark:border-white/10 md:p-8"
      role="dialog" aria-labelledby="login-title"
    >
      <div class="mb-6 flex items-center justify-center gap-3">
        <img src={logoSrc} alt={brand} class="h-12 w-12 rounded-full object-contain ring-1 ring-white/20" />
        <div class="text-center">
          <h1 id="login-title" class="text-xl font-semibold text-slate-900 dark:text-white">{brand}</h1>
          <p class="text-sm text-slate-600 dark:text-slate-300">Bienvenido de vuelta</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-center">
        Iniciar sesión
      </h2>

      <form class="mt-6 space-y-4" on:submit|preventDefault={handleLogin}>
        <div>
          <label for="email" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Correo electrónico
          </label>
          <div class="relative">
            <input
              id="email"
              type="email"
              bind:value={email}
              autocomplete="email"
              placeholder="tu@correo.com"
              class="w-full rounded-xl border bg-white/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition
                     placeholder:text-slate-400
                     border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                     dark:bg-slate-800/70 dark:text-white dark:border-slate-600 dark:focus:border-indigo-400"
              aria-invalid={!email ? undefined : !emailOk(email)}
              aria-describedby="email-hint"
              required
            />
            <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400"
                 viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 13.065 2 6.5V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6.5l-10 6.565Zm9-9.065H3l9 5.9 9-5.9Z"/>
            </svg>
          </div>
          <p id="email-hint" class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Usa un correo válido (ej. nombre@dominio.com)
          </p>
        </div>

        <div>
          <label for="password" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Contraseña
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              bind:value={password}
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full rounded-xl border bg-white/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition
                     placeholder:text-slate-400
                     border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                     dark:bg-slate-800/70 dark:text-white dark:border-slate-600 dark:focus:border-indigo-400"
              aria-invalid={!password ? undefined : !passOk(password)}
              required
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-600
                     hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-slate-700"
              on:click={() => (showPass = !showPass)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {#if showPass}
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="m3 4.27 1.28-1.27 18 18-1.27 1.27-3.2-3.2A10.73 10.73 0 0 1 12 20c-5.05 0-9.38-3.2-11-8 1-2.95 3.12-5.35 5.77-6.67L3 4.27Zm6.82 6.82a2.22 2.22 0 0 0 3.06 3.06l-3.06-3.06ZM12 6c5.05 0 9.38 3.2 11 8-.64 1.88-1.79 3.54-3.27 4.87l-1.43-1.43A8.67 8.67 0 0 0 20.88 14c-1.46-3.67-4.93-6-8.88-6-1 0-1.96.13-2.86.38L7.85 6.1A10.72 10.72 0 0 1 12 6Z"/></svg>
              {:else}
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c5.05 0 9.38 3.2 11 8-1.62 4.8-5.95 8-11 8s-9.38-3.2-11-8c1.62-4.8 5.95-8 11-8Zm0 3a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 8Z"/></svg>
              {/if}
            </button>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <label class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" bind:checked={remember}
                     class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
              Recuérdame
            </label>
            <a href="/recuperar" use:link class="text-sm text-indigo-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        {#if message}
          <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800
                      dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            {message}
          </div>
        {/if}

        <button
          type="submit"
          class="group relative inline-flex w-full items-center justify-center gap-2 rounded-xl
                 bg-indigo-600 px-4 py-3 text-white shadow-lg shadow-indigo-600/30
                 transition hover:brightness-110 active:scale-[.99] disabled:opacity-60"
          disabled={loading}
        >
          {#if loading}
            <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 4v2m0 12v2m8-8h-2M6 12H4m12.95 5.657-1.414-1.414M8.464 8.464 7.05 7.05m10.607 0-1.414 1.414M8.464 15.536 7.05 16.95"/>
            </svg>
            Ingresando…
          {:else}
            Iniciar sesión
            <svg class="h-5 w-5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 5l7 7-7 7v-4H4v-6h9V5z"/>
            </svg>
          {/if}
        </button>
      </form>

      <div class="my-6 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div class="h-px flex-1 bg-slate-200/60 dark:bg-white/10"></div>
        O continuar con
        <div class="h-px flex-1 bg-slate-200/60 dark:bg-white/10"></div>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <button class="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-700
                       hover:bg-slate-50 active:scale-95 dark:bg-slate-800/60 dark:text-white dark:border-slate-600">
          Google
        </button>
        <button class="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-700
                       hover:bg-slate-50 active:scale-95 dark:bg-slate-800/60 dark:text-white dark:border-slate-600">
          Facebook
        </button>
        <button class="rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm text-slate-700
                       hover:bg-slate-50 active:scale-95 dark:bg-slate-800/60 dark:text-white dark:border-slate-600">
          Apple
        </button>
      </div>

      <p class="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        ¿No tienes una cuenta?
        <a href="/registro" use:link class="font-medium text-indigo-600 hover:underline"> Regístrate aquí</a>.
      </p>
    </div>
  </div>
</section>
