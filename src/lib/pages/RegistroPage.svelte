<script>
  import { link, push } from 'svelte-spa-router';
  import { register } from '../api/auth.js';
  import { fade, fly } from 'svelte/transition';

  export let brand = 'RIB';
  export let logoSrc = '/logo.png';

  let full_name = '';
  let phone_number = '';
  let email = '';
  let password = '';
  let confirm = '';
  let remember = true;
  let acceptTerms = true;

  let showPass = false;
  let showConfirm = false;
  let loading = false;
  let message = '';
  let messageKind = 'info';

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const passScore = (v) => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^a-zA-Z0-9]/.test(v)) s++;
    if (v.length >= 12) s++;
    return Math.min(s, 5);
  };
  $: score = passScore(password);
  $: strengthPct = (score / 5) * 100;
  $: strengthLabel = ['Muy débil','Débil','Aceptable','Fuerte','Excelente'][Math.max(0, score-1)] || 'Muy débil';
  $: strengthClass = score <= 2 ? 'bg-rose-500' : score === 3 ? 'bg-amber-500' : 'bg-emerald-500';
  $: canSubmit = emailOk(email) && password.length >= 6 && password === confirm && acceptTerms && !loading;

  function formatPhone(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
    phone_number = digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim();
  }

  function genStrongPassword() {
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}?';
    let out=''; for (let i=0;i<16;i++) out += chars[Math.floor(Math.random()*chars.length)];
    password = out; confirm = out;
  }

  async function handleRegister(e) {
    e.preventDefault();
    message = ''; messageKind = 'info';
    if (!canSubmit) { message='Revisa los campos marcados y acepta los términos.'; messageKind='error'; return; }

    loading = true;
    try {
      const { response, data } = await register({ email, password, full_name, phone_number });
      if (!response.ok) {
        const detail = data?.detail ?? 'No se pudo registrar el usuario.';
        message = typeof detail === 'string' ? detail : JSON.stringify(detail);
        messageKind = 'error';
        return;
      }
      if (typeof window !== 'undefined' && data?.access_token) {
        const storageKey='auth';
        const target = remember ? window.localStorage : window.sessionStorage;
        const other  = remember ? window.sessionStorage : window.localStorage;
        other.removeItem(storageKey);
        target.setItem(storageKey, JSON.stringify(data));
      }
      message='¡Cuenta creada con éxito! Redirigiendo…'; messageKind='success';
      setTimeout(()=>{ full_name=phone_number=email=password=confirm=''; push('/dashboard'); }, 600);
    } catch (err) {
      console.error(err); message='No se pudo conectar con el servidor.'; messageKind='error';
    } finally { loading=false; }
  }
</script>

<!-- Fondo aurora -->
<div class="relative min-h-screen overflow-hidden bg-slate-950">
  <div class="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
    <div class="aurora aurora-1"></div>
    <div class="aurora aurora-2"></div>
    <div class="aurora aurora-3"></div>
  </div>

  <div class="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-8 px-6 py-10 md:grid-cols-2">
    <!-- Lado branding -->
    <div in:fly={{ x: -16, duration: 350 }} class="text-white/90">
      <div class="mb-6 flex items-center gap-3">
        <img src={logoSrc} alt={brand} class="h-12 w-12 rounded-xl ring-1 ring-white/20 object-cover" />
        <div>
          <h1 class="text-2xl font-semibold">{brand}</h1>
          <p class="text-sm text-white/60">Servicios inmediatos, sin complicaciones.</p>
        </div>
      </div>
      <h2 class="mb-4 text-4xl font-bold tracking-tight">
        Crea tu cuenta <span class="text-indigo-300">en segundos</span>
      </h2>
      <ul class="space-y-3 text-sm text-white/80">
        <li class="flex items-start gap-3">
          <!-- check -->
          <svg class="mt-0.5 h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z"/></svg>
          Solicita y gestiona reparaciones en tiempo real
        </li>
        <li class="flex items-start gap-3">
          <svg class="mt-0.5 h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z"/></svg>
          Geolocalización de técnicos y seguimiento del servicio
        </li>
        <li class="flex items-start gap-3">
          <svg class="mt-0.5 h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z"/></svg>
          Historial, calificaciones y soporte dedicado
        </li>
      </ul>
    </div>

    <!-- Form -->
    <form
      on:submit|preventDefault={handleRegister}
      class="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-8"
      in:fly={{ x: 16, duration: 350 }}
      aria-labelledby="title-reg"
    >
      <div class="mb-6 text-center">
        <h3 id="title-reg" class="text-2xl font-bold text-white">Crear cuenta</h3>
        <p class="text-sm text-white/70">Completa tus datos para comenzar</p>
      </div>

      <!-- Nombre -->
      <div class="mb-4">
        <label class="mb-1 block text-sm text-white/80">Nombre completo</label>
        <div class="relative">
          <input
            class="w-full rounded-2xl border border-white/15 bg-white/70 px-4 py-3 text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            bind:value={full_name}
            placeholder="Tu nombre" aria-label="Nombre completo" />
          <!-- user icon -->
          <svg class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5.33 0-8 2.67-8 6h16c0-3.33-2.67-6-8-6Z"/></svg>
        </div>
      </div>

      <!-- Teléfono -->
      <div class="mb-4">
        <label class="mb-1 block text-sm text-white/80">Teléfono</label>
        <div class="relative">
          <input
            class="w-full rounded-2xl border border-white/15 bg-white/70 px-4 py-3 text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            value={phone_number}
            on:input={formatPhone}
            placeholder="300 123 4567" aria-label="Teléfono (opcional)" />
          <!-- phone icon -->
          <svg class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.1 15.1 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24 11.36 11.36 0 0 0 3.56.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A16 16 0 0 1 3 8a1 1 0 0 1 1-1h2.49a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.56 1 1 0 0 1-.24 1.05Z"/></svg>
        </div>
      </div>

      <!-- Email -->
      <div class="mb-4">
        <label class="mb-1 block text-sm text-white/80">Correo</label>
        <div class="relative">
          <input
            type="email"
            class="w-full rounded-2xl border border-white/15 bg-white/70 px-4 py-3 text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            bind:value={email}
            placeholder="tu@correo.com"
            aria-invalid={!email ? undefined : !emailOk(email)}
            required />
          {#if email && emailOk(email)}
            <svg class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41Z"/></svg>
          {/if}
        </div>
      </div>

      <!-- Password -->
      <div class="mb-3">
        <label class="mb-1 block text-sm text-white/80">Contraseña</label>
        <div class="relative">
          <input
            id="password"
            type={showPass ? 'text' : 'password'}
            class="w-full rounded-2xl border border-white/15 bg-white/70 px-4 py-3 text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            bind:value={password}
            placeholder="••••••••"
            aria-describedby="pwd-hint"
            required />
          <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-slate-700 hover:bg-white/60"
            on:click={() => (showPass = !showPass)} aria-label="Mostrar u ocultar contraseña">
            {#if showPass}
              <!-- eye-off -->
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="m3 4.27 1.28-1.27 18 18-1.27 1.27-3.2-3.2A10.73 10.73 0 0 1 12 20c-5.05 0-9.38-3.2-11-8 1-2.95 3.12-5.35 5.77-6.67L3 4.27Zm6.82 6.82a2.22 2.22 0 0 0 3.06 3.06l-3.06-3.06ZM12 6c5.05 0 9.38 3.2 11 8-.64 1.88-1.79 3.54-3.27 4.87l-1.43-1.43A8.67 8.67 0 0 0 20.88 14c-1.46-3.67-4.93-6-8.88-6-1 0-1.96.13-2.86.38L7.85 6.1A10.72 10.72 0 0 1 12 6Z"/></svg>
            {:else}
              <!-- eye -->
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c5.05 0 9.38 3.2 11 8-1.62 4.8-5.95 8-11 8s-9.38-3.2-11-8c1.62-4.8 5.95-8 11-8Zm0 3a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 8Z"/></svg>
            {/if}
          </button>
        </div>

        <!-- Fuerza -->
        <div class="mt-2 h-2 w-full rounded-full bg-white/20">
          <div class={`h-2 rounded-full ${strengthClass}`} style={`width:${strengthPct}%; transition:width .25s`}></div>
        </div>
        <div id="pwd-hint" class="mt-1 flex items-center justify-between text-xs text-white/80">
          <span>Fuerza: <b>{strengthLabel}</b></span>
          <button type="button" class="underline hover:opacity-80" on:click={genStrongPassword}>Generar segura</button>
        </div>
      </div>

      <!-- Confirmación -->
      <div class="mb-4">
        <label class="mb-1 block text-sm text-white/80">Confirmar contraseña</label>
        <div class="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            class="w-full rounded-2xl border border-white/15 bg-white/70 px-4 py-3 text-slate-900 outline-none shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
            bind:value={confirm}
            placeholder="••••••••" required />
          <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-slate-700 hover:bg-white/60"
            on:click={() => (showConfirm = !showConfirm)} aria-label="Mostrar u ocultar confirmación">
            {#if showConfirm}
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="m3 4.27 1.28-1.27 18 18-1.27 1.27-3.2-3.2A10.73 10.73 0 0 1 12 20c-5.05 0-9.38-3.2-11-8 1-2.95 3.12-5.35 5.77-6.67L3 4.27Zm6.82 6.82a2.22 2.22 0 0 0 3.06 3.06l-3.06-3.06ZM12 6c5.05 0 9.38 3.2 11 8-.64 1.88-1.79 3.54-3.27 4.87l-1.43-1.43A8.67 8.67 0 0 0 20.88 14c-1.46-3.67-4.93-6-8.88-6-1 0-1.96.13-2.86.38L7.85 6.1A10.72 10.72 0 0 1 12 6Z"/></svg>
            {:else}
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c5.05 0 9.38 3.2 11 8-1.62 4.8-5.95 8-11 8s-9.38-3.2-11-8c1.62-4.8 5.95-8 11-8Zm0 3a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 8Z"/></svg>
            {/if}
          </button>
        </div>
        {#if confirm && confirm !== password}
          <p class="mt-1 text-xs text-rose-300">Las contraseñas no coinciden.</p>
        {/if}
      </div>

      <!-- Switches -->
      <div class="mb-4 flex flex-col gap-2 text-sm text-white/80 md:flex-row md:items-center md:justify-between">
        <label class="inline-flex items-center gap-2">
          <input type="checkbox" bind:checked={remember} class="h-4 w-4 rounded border-white/30 text-indigo-500" />
          Recuérdame
        </label>
        <label class="inline-flex items-center gap-2">
          <input type="checkbox" bind:checked={acceptTerms} class="h-4 w-4 rounded border-white/30 text-indigo-500" />
          Acepto los <a href="/terminos" use:link class="underline">términos</a>
        </label>
      </div>

      <!-- Mensaje -->
      {#if message}
        <div class={`mb-4 rounded-2xl border px-4 py-3 text-sm ${messageKind === 'error'
          ? 'border-rose-400/50 bg-rose-500/10 text-rose-100'
          : messageKind === 'success'
          ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
          : 'border-white/30 bg-white/10 text-white/90'}`} in:fade>
          {message}
        </div>
      {/if}

      <!-- Botón -->
      <button
        class="group relative inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-white shadow-lg shadow-indigo-600/30 transition hover:brightness-110 active:scale-[.99] disabled:opacity-60"
        disabled={!canSubmit}
      >
        {#if loading}
          <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 4v2m0 12v2m8-8h-2M6 12H4m12.95 5.657-1.414-1.414M8.464 8.464 7.05 7.05m10.607 0-1.414 1.414M8.464 15.536 7.05 16.95"/>
          </svg>
          Creando cuenta…
        {:else}
          Crear cuenta
          <svg class="h-5 w-5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 5l7 7-7 7v-4H4v-6h9V5z"/>
          </svg>
        {/if}
      </button>

      <p class="mt-6 text-center text-sm text-white/80">
        ¿Ya tienes cuenta? <a href="/login" use:link class="font-medium underline">Inicia sesión</a>
      </p>
    </form>
  </div>
</div>

<style>
  .aurora { position:absolute; inset:-20%; filter: blur(60px); }
  .aurora-1 { background: radial-gradient(600px 300px at 10% 10%, rgba(99,102,241,.55), transparent 60%); animation: float1 16s ease-in-out infinite; }
  .aurora-2 { background: radial-gradient(500px 260px at 80% 30%, rgba(216,180,254,.5), transparent 60%); animation: float2 18s ease-in-out infinite; }
  .aurora-3 { background: radial-gradient(520px 280px at 50% 80%, rgba(16,185,129,.45), transparent 60%); animation: float3 22s ease-in-out infinite; }
  @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }
  @keyframes float2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-20px)} }
  @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(15px,-10px)} }
</style>
