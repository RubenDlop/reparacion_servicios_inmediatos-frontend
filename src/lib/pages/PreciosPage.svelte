<!-- src/routes/precios.svelte -->
<script>
  // Toggle de facturación
  let yearly = true; // por defecto anual (ahorro)

  // Planes para PROFESIONALES (proveedores de servicios)
  const plans = [
    {
      name: 'Starter',
      desc: 'Ideal para comenzar y validar tu perfil.',
      priceM: 0,
      priceY: 0,
      badge: 'Gratis',
      features: [
        'Perfil profesional verificado',
        'Hasta 10 postulaciones/mes',
        'Mensajería básica',
        'Reseñas y calificaciones',
      ],
      cta: 'Comenzar gratis',
      highlight: false,
    },
    {
      name: 'Pro',
      desc: 'Para profesionales con flujo estable de trabajos.',
      priceM: 39,
      priceY: 390, // 2 meses de ahorro (39*10)
      badge: 'Más popular',
      features: [
        'Postulaciones ILIMITADAS',
        'Mensajería avanzada (adjuntos)',
        'Recomendación en resultados',
        'Calendario y bloqueos',
        'Soporte prioritario',
      ],
      cta: 'Elegir Pro',
      highlight: true,
    },
    {
      name: 'Empresa',
      desc: 'Para cuadrillas y empresas con múltiples técnicos.',
      priceM: 99,
      priceY: 990, // 2 meses de ahorro
      badge: 'Equipos',
      features: [
        'Múltiples perfiles por equipo',
        'Asignación y seguimiento de trabajos',
        'Reportes y exportación',
        'API/Integraciones',
        'Gerencia de reputación',
      ],
      cta: 'Contactar ventas',
      highlight: false,
    },
  ];

  const faqs = [
    {
      q: '¿Los clientes pagan suscripción?',
      a: 'No. Los clientes no tienen suscripción: solo pagan el servicio contratado al profesional, según el precio acordado en la plataforma.',
    },
    {
      q: '¿Hay comisión por trabajo?',
      a: 'Para el plan Starter se aplica una pequeña comisión por trabajo completado. En Pro y Empresa, la comisión es reducida.',
    },
    {
      q: '¿Puedo cambiar de plan cuando quiera?',
      a: 'Sí, puedes cambiar de plan o cancelar cuando quieras. Al pasar a anual obtienes un ahorro equivalente a 2 meses.',
    },
    {
      q: '¿Qué métodos de pago aceptan?',
      a: 'Tarjetas de crédito y débito, y billeteras digitales soportadas localmente.',
    },
  ];
</script>

<section class="bg-white dark:bg-slate-950">
  <div class="mx-auto max-w-6xl px-4 md:px-8 pt-10 pb-6">
    <header class="text-center max-w-3xl mx-auto">
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Planes y Precios
      </h1>
      <p class="mt-3 text-slate-600 dark:text-slate-300">
        Impulsa tu negocio de servicios. Elige un plan para destacar, recibir más solicitudes y
        gestionar tus trabajos con herramientas profesionales.
      </p>

      <!-- Toggle Mensual / Anual (✅ sin class:hover) -->
      <div class="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 p-1">
        <button
          class={
            `px-4 py-2 rounded-full text-sm font-medium transition
             hover:bg-slate-100 dark:hover:bg-slate-800
             ${!yearly ? 'bg-slate-900 text-white' : ''}`
          }
          on:click={() => yearly = false}
          aria-pressed={!yearly}
        >
          Mensual
        </button>
        <button
          class={
            `px-4 py-2 rounded-full text-sm font-medium transition
             hover:bg-slate-100 dark:hover:bg-slate-800
             ${yearly ? 'bg-slate-900 text-white' : ''}`
          }
          on:click={() => yearly = true}
          aria-pressed={yearly}
        >
          Anual
          <span class="ml-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200 px-2 py-0.5 text-xs">
            Ahorra 2 meses
          </span>
        </button>
      </div>
    </header>

    <!-- Grid de planes -->
    <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each plans as p}
        <article
          class="relative rounded-2xl border p-6 transition
                 border-slate-200 bg-white/80 shadow-sm backdrop-blur
                 dark:border-slate-700 dark:bg-slate-900/70
                 hover:shadow-lg hover:-translate-y-0.5">
          {#if p.badge}
            <span class="absolute -top-3 right-4 rounded-full px-3 py-1 text-xs font-semibold
                         bg-indigo-600 text-white shadow-md">
              {p.badge}
            </span>
          {/if}

          <h3 class="text-xl font-semibold text-slate-900 dark:text-white">{p.name}</h3>
          <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.desc}</p>

          <!-- Precio -->
          <div class="mt-4 flex items-end gap-1">
            {#if p.priceM === 0 && p.priceY === 0}
              <span class="text-3xl font-extrabold text-slate-900 dark:text-white">Gratis</span>
            {:else}
              <span class="text-3xl font-extrabold text-slate-900 dark:text-white">
                ${yearly ? p.priceY : p.priceM}
              </span>
              <span class="text-sm text-slate-500 dark:text-slate-400">
                /{yearly ? 'año' : 'mes'}
              </span>
            {/if}
          </div>

          <!-- CTA -->
          <a
            href="/registro"
            class="mt-5 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium
                   transition ring-1 ring-inset
                   {p.highlight
                     ? 'bg-indigo-600 text-white ring-indigo-600 hover:brightness-105'
                     : 'bg-white text-slate-900 ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-white dark:ring-slate-600'}"
          >
            {p.cta}
          </a>

          <!-- Features -->
          <ul class="mt-5 space-y-2 text-sm">
            {#each p.features as f}
              <li class="flex items-start gap-2">
                <svg class="h-5 w-5 mt-0.5 flex-none text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span class="text-slate-700 dark:text-slate-300">{f}</span>
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>

    <!-- Bloque para clientes -->
    <div class="mt-12 rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center
                dark:border-slate-700 dark:bg-slate-900/50">
      <h4 class="text-lg font-semibold text-slate-900 dark:text-white">¿Eres cliente?</h4>
      <p class="mt-2 text-slate-600 dark:text-slate-300">
        No necesitas suscripción. Publica tu necesidad, compara propuestas y paga solo por el servicio realizado.
      </p>
      <div class="mt-4 flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span> Sin mensualidad
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-indigo-500"></span> Soporte al cliente
        </span>
        <span class="inline-flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-sky-500"></span> Protección de pago
        </span>
      </div>
      <a href="/publicar" class="mt-5 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white
                                hover:brightness-110 dark:bg-white dark:text-slate-950">
        Publicar una solicitud
      </a>
    </div>

    <!-- FAQ -->
    <div class="mt-12">
      <h3 class="text-2xl font-bold text-slate-900 dark:text-white text-center">Preguntas frecuentes</h3>
      <dl class="mt-6 grid gap-4 md:grid-cols-2">
        {#each faqs as item}
          <div class="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <dt class="font-medium text-slate-900 dark:text-white">{item.q}</dt>
            <dd class="mt-1 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.a}</dd>
          </div>
        {/each}
      </dl>
    </div>
  </div>
</section>
