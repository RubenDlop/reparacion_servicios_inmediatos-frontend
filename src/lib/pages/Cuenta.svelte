<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';

  // APIs existentes en tu app
  import { me, clearAuth } from '../api/auth';
  import { fetchRequests, fetchAssignments } from '../api/dashboard';
  import { getMyTechnicianProfile } from '../api/technicians';

  let loading = true;
  let user = null;
  let technician = null;               // perfil técnico si existe
  let reqCount = 0;                    // total de solicitudes
  let assignCount = 0;                 // total de asignaciones (si técnico)
  let message = '';
  let kind = 'info';

  const fmtDate = (s) => {
    try { return new Date(s).toLocaleString(); } catch { return s || ''; }
  };
  const initial = (s) => (s || '?').trim().charAt(0).toUpperCase();

  onMount(async () => {
    // 1) Datos del usuario autenticado
    const { response, data } = await me();
    if (!response?.ok) {
      // Sin sesión -> al login
      push('/login');
      return;
    }
    user = data;

    // 2) En paralelo: totales y perfil técnico (si lo hay)
    const [reqsP, assignsP, techP] = await Promise.allSettled([
      fetchRequests({ size: 1, page: 1 }),
      fetchAssignments({ size: 1, page: 1 }),
      getMyTechnicianProfile(), // si no existe devolverá 404
    ]);

    if (reqsP.status === 'fulfilled' && reqsP.value?.response?.ok) {
      reqCount = Number(reqsP.value.total ?? 0);
    }
    if (assignsP.status === 'fulfilled') {
      // Puede ser 403 si no es técnico; ignora en ese caso
      if (assignsP.value?.response?.ok) assignCount = Number(assignsP.value.total ?? 0);
    }
    if (techP.status === 'fulfilled' && techP.value?.response?.ok) {
      technician = techP.value.data;
    }

    loading = false;
  });

  function logout() {
    clearAuth();
    push('/login');
  }
</script>

<div class="min-h-screen bg-slate-950 text-white/90">
  <div class="mx-auto max-w-5xl px-6 py-8">
    <h1 class="mb-6 text-2xl font-bold">Mi cuenta</h1>

    {#if loading}
      <div class="h-40 animate-pulse rounded-2xl bg-white/10" />
    {:else}
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Perfil -->
        <section class="rounded-2xl border border-white/10 bg-white/10 p-6 lg:col-span-2">
          <div class="flex items-center gap-4">
            <div class="grid h-14 w-14 place-items-center rounded-full bg-indigo-500 text-xl font-bold">
              {initial(user?.full_name || user?.email)}
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-lg font-semibold">
                {user?.full_name || 'Sin nombre'}
              </h2>
              <p class="truncate text-sm text-white/70">{user?.email}</p>
            </div>
            <div class="ml-auto">
              <span class="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                {user?.is_superuser ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>

          <div class="mt-6 grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
              <p class="text-xs text-white/60">Teléfono</p>
              <p class="mt-1 text-sm">{user?.phone_number || '—'}</p>
            </div>
            <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
              <p class="text-xs text-white/60">Estado</p>
              <p class="mt-1 text-sm">{user?.is_active ? 'Activo' : 'Inactivo'}</p>
            </div>
            <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
              <p class="text-xs text-white/60">Creado</p>
              <p class="mt-1 text-sm">{fmtDate(user?.created_at)}</p>
            </div>
            <div class="rounded-xl border border-white/10 bg-slate-900/40 p-4">
              <p class="text-xs text-white/60">Actualizado</p>
              <p class="mt-1 text-sm">{fmtDate(user?.updated_at)}</p>
            </div>
          </div>

          {#if message}
            <div class={`mt-6 rounded-xl border px-3 py-2 text-sm
              ${kind === 'error' ? 'border-rose-400/50 bg-rose-500/10 text-rose-100'
                : kind === 'success' ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
                : 'border-white/30 bg-white/10 text-white/90'}`}>
              {message}
            </div>
          {/if}

          <div class="mt-6">
            <button
              on:click={logout}
              class="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110">
              Cerrar sesión
            </button>
          </div>
        </section>

        <!-- Resumen -->
        <aside class="space-y-6">
          <div class="rounded-2xl border border-white/10 bg-white/10 p-6">
            <h3 class="mb-3 text-sm font-semibold text-white/80">Resumen</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between rounded-xl bg-slate-900/40 p-3">
                <div class="text-sm text-white/70">Mis solicitudes</div>
                <div class="text-lg font-semibold">{reqCount}</div>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-slate-900/40 p-3">
                <div class="text-sm text-white/70">Mis asignaciones</div>
                <div class="text-lg font-semibold">{assignCount}</div>
              </div>
            </div>
            <div class="mt-4 text-xs text-white/60">
              * Las asignaciones aparecen si tienes perfil técnico.
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/10 p-6">
            <h3 class="mb-3 text-sm font-semibold text-white/80">Perfil técnico</h3>

            {#if technician}
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-white/70">Estado</span>
                  <span class="rounded-full bg-white/10 px-2 py-0.5">
                    {technician.status}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-white/70">Verificado</span>
                  <span>{technician.verified ? 'Sí' : 'No'}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-white/70">Radio servicio</span>
                  <span>{technician.service_radius_km ?? '—'} km</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-white/70">Trabajos completados</span>
                  <span>{technician.completed_jobs ?? 0}</span>
                </div>
              </div>
              <div class="mt-4 text-xs text-white/60">
                Puedes gestionar documentos y datos desde <em>Perfil técnico</em>.
              </div>
            {:else}
              <p class="text-sm text-white/70">
                Aún no tienes perfil técnico. Crea uno desde el menú <strong>Perfil técnico</strong>.
              </p>
            {/if}
          </div>
        </aside>
      </div>
    {/if}
  </div>
</div>
