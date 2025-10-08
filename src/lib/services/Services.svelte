<script>
  import { SERVICES, REASONS, ICONS } from './services.data.js';

  // Props opcionales
  export let heading    = 'Servicios que ofrecemos';
  export let subheading = 'Encuentra el profesional adecuado para cada necesidad en tu hogar.';
  export let reasonsTitle = '¿Por qué usar nuestra app?';
  export let reasonsSub  = 'Hacemos que las reparaciones y mantenimiento sean más fáciles y seguras.';

  // Util para renderizar un path como SVG
  const Icon = ({ name, className = 'h-7 w-7' }) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="currentColor" class="${className}" aria-hidden="true">
       <path d="${ICONS[name] ?? ''}"/>
     </svg>`;
</script>

<section class="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950">
  <!-- decor -->
  <div aria-hidden="true"
       class="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-blue-200/40 to-transparent blur-2xl dark:from-blue-900/30"></div>

  <div class="mx-auto max-w-[1200px] px-4 py-12 sm:py-14 md:py-16">
    <!-- header -->
    <header class="mx-auto max-w-3xl text-center">
      <h2 class="text-3xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300 sm:text-4xl">
        {heading}
      </h2>
      <p class="mt-2 text-slate-600 dark:text-slate-300">
        {subheading}
      </p>
    </header>

    <!-- grid servicios -->
    <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each SERVICES as s, i}
        <article
          class="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur
                 transition hover:-translate-y-0.5 hover:shadow-lg focus-within:shadow-lg dark:border-slate-700 dark:bg-slate-900/70"
          tabindex="0" aria-label={s.name}>
          <div class="flex items-start gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200
                         group-hover:scale-105 transition dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800"
                  aria-hidden="true">
              {@html Icon({ name: s.icon, className: 'h-6 w-6' })}
            </span>
            <div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{s.name}</h3>
              <p class="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {s.description}
              </p>
            </div>
          </div>

          <!-- borde animado decorativo -->
          <div class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent
                      opacity-0 transition-opacity group-hover:opacity-100"></div>
        </article>
      {/each}
    </div>

    <!-- beneficios -->
    <div class="mt-12">
      <header class="mx-auto max-w-2xl text-center">
        <h3 class="text-2xl font-bold text-blue-700 dark:text-blue-300">{reasonsTitle}</h3>
        <p class="mt-2 text-slate-600 dark:text-slate-300">{reasonsSub}</p>
      </header>

      <div class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {#each REASONS as r}
          <div
            class="rounded-2xl border border-slate-200 bg-white/80 p-5 text-center shadow-sm backdrop-blur
                   transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/70">
            <div class="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700 ring-1 ring-sky-200
                        dark:bg-sky-900/40 dark:text-sky-200 dark:ring-sky-800">
              {@html Icon({ name: r.icon, className: 'h-6 w-6' })}
            </div>
            <h4 class="font-semibold text-slate-900 dark:text-white">{r.title}</h4>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.description}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
