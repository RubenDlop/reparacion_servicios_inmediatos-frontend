<script>
  import { push } from 'svelte-spa-router';         // ❗ sin `link` ni `location`

  // Props
  export let brand = 'RIB';
  export let logoSrc = '/logo.png';

  // Enlaces
  export let links = {
    empresa: [
      { href: '/nosotros',  label: 'Nosotros'  },
      { href: '/servicios', label: 'Servicios' },
      { href: '/precios',   label: 'Precios'   },
      { href: '/contacto',  label: 'Contacto'  },
    ],
    legal: [
      { href: '/privacidad', label: 'Política de privacidad' },
      { href: '/terminos',   label: 'Términos y condiciones' },
    ],
    ayuda: [
      { href: '/faq',     label: 'Preguntas frecuentes' },
      { href: '/soporte', label: 'Soporte' },
      { href: '/estado',  label: 'Estado del servicio' },
    ]
  };

  const year = new Date().getFullYear();

  let email = '';
  let emailError = '';
  function subscribe(e) {
    e.preventDefault();
    emailError = '';
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      emailError = 'Introduce un correo válido';
      return;
    }
    alert(`¡Gracias! Te contactaremos a ${value}`);
    email = '';
  }

  // ✅ Navegación sin `use:link`
  const go = (href) => (e) => { e?.preventDefault?.(); push(href); };
</script>

<!-- Fondo decorativo superior (onda) -->
<div aria-hidden="true" class="relative z-0">
  <div class="pointer-events-none absolute inset-x-0 -top-6 h-6
              bg-gradient-to-b from-blue-200/50 to-transparent dark:from-blue-900/30"></div>
</div>

<footer class="relative z-10 mt-12 border-t border-slate-200/70 bg-white/90 backdrop-blur
                dark:bg-slate-900/80 dark:border-slate-700">
  <!-- Glow radial -->
  <div aria-hidden="true"
       class="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-48 max-w-[1100px]
              rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/30"></div>

  <!-- TOP -->
  <div class="relative mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 py-12 md:grid-cols-5">
    <!-- Marca & redes -->
    <div class="space-y-5 md:col-span-2">
      <a href="/" class="group flex items-center gap-3" on:click={go('/')}>
        <img src={logoSrc} alt={brand}
             class="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow
                    group-hover:scale-[1.02] transition" />
        <span class="text-xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
          {brand}
        </span>
      </a>

      <p class="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Expertos en reparación, mantenimiento y remodelación. Profesionales verificados,
        precios claros y garantía real de satisfacción.
      </p>

      <div class="flex items-center gap-3 pt-2" aria-label="Redes sociales">
        {#each [
          { href: 'https://x.com',        label:'X (Twitter)',
            path:'M18.244 3H21l-6.55 7.48L22.5 21h-6.9l-4.4-5.34L5.1 21H2l7.02-8.01L1.8 3h6.95l4 4.86L18.244 3Zm-2.41 16.2h1.96L7.26 4.7H5.2l10.634 14.5Z' },
          { href: 'https://facebook.com', label:'Facebook',
            path:'M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06C2 17.06 5.66 21.2 10.44 22v-7.02H7.9v-2.92h2.54V9.8c0-2.5 1.48-3.89 3.75-3.89 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.58v1.9h2.78l-.44 2.92h-2.34V22C18.34 21.2 22 17.06 22 12.06Z' },
          { href: 'https://instagram.com',label:'Instagram',
            path:'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5ZM18 7.25a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 18 7.25Z' }
        ] as s}
          <a href={s.href} target="_blank" rel="noopener"
             class="grid h-10 w-10 place-items-center rounded-full border border-slate-300/80
                    text-slate-600 hover:bg-slate-50 hover:text-blue-700
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60
                    dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800"
             aria-label={s.label}>
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor">
              <path d={s.path} />
            </svg>
          </a>
        {/each}
      </div>

      <!-- Distintivos -->
      <div class="flex flex-wrap items-center gap-2 pt-3">
        <span class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"/></svg>
          Garantía 30 días
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          Técnicos verificados
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          +1,000 clientes
        </span>
      </div>
    </div>

    <!-- Listas -->
    <div class="grid gap-8 md:col-span-2 md:grid-cols-3">
      <nav aria-label="Empresa" class="space-y-3">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Empresa</h3>
        <ul class="space-y-2">
          {#each links.empresa as l}
            <li>
              <a href={l.href} class="group inline-flex items-center gap-2 rounded text-slate-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-slate-300" on:click={go(l.href)}>
                <span class="h-1.5 w-1.5 rounded-full bg-slate-300 group-hover:bg-blue-600"></span>
                {l.label}
              </a>
            </li>
          {/each}
        </ul>
      </nav>

      <nav aria-label="Ayuda" class="space-y-3">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Ayuda</h3>
        <ul class="space-y-2">
          {#each links.ayuda as l}
            <li><a href={l.href} class="rounded text-slate-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-slate-300" on:click={go(l.href)}>{l.label}</a></li>
          {/each}
        </ul>
      </nav>

      <nav aria-label="Legal" class="space-y-3">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Legal</h3>
        <ul class="space-y-2">
          {#each links.legal as l}
            <li><a href={l.href} class="rounded text-slate-600 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:text-slate-300" on:click={go(l.href)}>{l.label}</a></li>
          {/each}
        </ul>
      </nav>
    </div>

    <!-- Newsletter -->
    <div class="space-y-4 md:col-span-1">
      <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Novedades</h3>
      <p class="text-sm text-slate-600 dark:text-slate-300">Recibe tips y promociones.</p>

      <form class="space-y-2" on:submit={subscribe} aria-label="suscripción">
        <div>
          <label class="sr-only" for="email">Correo</label>
          <input id="email" name="email" bind:value={email} type="email" placeholder="tu@email.com"
            class="w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-sm shadow-sm
                   placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20
                   dark:bg-slate-900/60 dark:border-slate-700 dark:placeholder:text-slate-500" />
          {#if emailError}
            <p class="mt-1 text-xs text-rose-600">{emailError}</p>
          {/if}
        </div>

        <button type="submit"
                class="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow
                       hover:brightness-110 active:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30">
          Suscribirme
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 12h12l-4-4 1.4-1.4L21.8 12l-7.4 5.4L13 16l4-4H5z"/></svg>
        </button>
      </form>

      <div class="flex flex-wrap items-center gap-2 pt-1 text-slate-500 dark:text-slate-400">
        <span class="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium dark:border-slate-600">Visa</span>
        <span class="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium dark:border-slate-600">Mastercard</span>
        <span class="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium dark:border-slate-600">PayPal</span>
        <span class="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium dark:border-slate-600">Transferencia</span>
      </div>
    </div>
  </div>

  <!-- BOTTOM -->
  <div class="border-t border-slate-200/70 bg-slate-50 dark:bg-slate-900/60 dark:border-slate-700">
    <div class="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-slate-600 dark:text-slate-400 md:flex-row">
      <p>© {year} {brand}. Todos los derechos reservados.</p>
      <div class="flex items-center gap-4">
        <a href="/privacidad" class="hover:text-blue-700 dark:hover:text-blue-300" on:click={go('/privacidad')}>Privacidad</a>
        <a href="/terminos"   class="hover:text-blue-700 dark:hover:text-blue-300" on:click={go('/terminos')}>Términos</a>

        <!-- Volver arriba sin hash -->
        <button type="button"
          class="hover:text-blue-700 dark:hover:text-blue-300"
          on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Volver arriba ↑
        </button>
      </div>
    </div>
  </div>
</footer>

<style>
  .sr-only{
    position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
    clip:rect(0,0,0,0);white-space:nowrap;border:0;
  }
</style>
