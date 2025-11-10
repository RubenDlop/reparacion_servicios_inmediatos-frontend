<script>
  import { onMount } from 'svelte';
  import { link, push } from 'svelte-spa-router';
  import { clearAuth, me } from '../api/auth.js';
  import { fetchRequests, fetchAssignments } from '../api/dashboard.js';

  let loading = true;
  let user = null;
  let kpis = { requestsTotal: 0, assignmentsTotal: 0 };
  let lastRequests = [];
  let lastAssignments = [];
  let errorMsg = '';

  function logout() {
    clearAuth();
    push('/login');
  }

  onMount(async () => {
    loading = true; errorMsg = '';
    // 1) usuario
    const { response: r1, data: d1 } = await me();
    if (r1?.status === 401) { logout(); return; }
    if (!r1?.ok) { errorMsg = 'No se pudo cargar tu sesión.'; loading = false; return; }
    user = d1;

    // 2) datos dashboard (en paralelo)
    const [reqRes, asgRes] = await Promise.all([
      fetchRequests({ size: 5 }),
      fetchAssignments({ size: 5 })
    ]);

    if (reqRes.response?.ok) {
      kpis.requestsTotal = reqRes.total ?? 0;
      lastRequests = reqRes.items ?? [];
    }
    if (asgRes.response?.ok) {
      kpis.assignmentsTotal = asgRes.total ?? 0;
      lastAssignments = asgRes.items ?? [];
    }

    loading = false;
  });

  function fmtDate(v) {
    try { return new Date(v).toLocaleString(); } catch { return v ?? '—'; }
  }
</script>

<div class="min-h-screen bg-slate-950 text-white/90">

  <main class="mx-auto max-w-7xl px-6 py-8">
    {#if loading}
      <div class="grid gap-6 md:grid-cols-3">
        {#each Array.from({ length: 6 }) as _}
          <div class="h-28 animate-pulse rounded-2xl bg-white/10"></div>
        {/each}
      </div>
    {:else}
      {#if errorMsg}
        <div class="rounded-2xl border border-rose-400/50 bg-rose-500/10 p-4 text-rose-100">{errorMsg}</div>
      {:else}
        <!-- Saludo -->
        <section class="mb-6">
          <h1 class="text-2xl font-bold">Hola{user?.full_name ? `, ${user.full_name}` : ''} 👋</h1>
          <p class="text-white/70">Bienvenido a tu panel. Aquí verás tus solicitudes y asignaciones recientes.</p>
        </section>

        <!-- KPIs -->
        <section class="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div class="text-sm text-white/70">Solicitudes totales</div>
            <div class="mt-1 text-3xl font-semibold">{kpis.requestsTotal}</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div class="text-sm text-white/70">Asignaciones totales</div>
            <div class="mt-1 text-3xl font-semibold">{kpis.assignmentsTotal}</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div class="text-sm text-white/70">Usuario</div>
            <div class="mt-1 truncate text-xl">{user?.email}</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/10 p-5">
            <div class="text-sm text-white/70">Estado</div>
            <div class="mt-1 text-xl">{user?.is_active ? 'Activo' : 'Inactivo'}</div>
          </div>
        </section>

        <section class="grid gap-6 lg:grid-cols-2">
          <!-- Últimas solicitudes -->
          <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            <div class="flex items-center justify-between border-b border-white/10 p-4">
              <h2 class="text-lg font-semibold">Últimas solicitudes</h2>
              <a href="/requests" use:link class="text-sm underline hover:opacity-80">Ver todas</a>
            </div>
            <div class="divide-y divide-white/10">
              {#if lastRequests.length === 0}
                <div class="p-4 text-white/70">Sin solicitudes recientes.</div>
              {:else}
                {#each lastRequests as r}
                  <div class="p-4">
                    <div class="flex items-center justify-between gap-4">
                      <div>
                        <div class="font-medium">{r?.service?.name ?? 'Servicio'}</div>
                        <div class="text-sm text-white/70">{r?.address ?? '—'}</div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm">{r?.status ?? '—'}</div>
                        <div class="text-xs text-white/60">{fmtDate(r?.created_at)}</div>
                      </div>
                    </div>
                    {#if r?.description}
                      <p class="mt-2 line-clamp-2 text-sm text-white/80">{r.description}</p>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          </div>

          <!-- Últimas asignaciones -->
          <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            <div class="flex items-center justify-between border-b border-white/10 p-4">
              <h2 class="text-lg font-semibold">Últimas asignaciones</h2>
              <a href="/assignments" use:link class="text-sm underline hover:opacity-80">Ver todas</a>
            </div>
            <div class="divide-y divide-white/10">
              {#if lastAssignments.length === 0}
                <div class="p-4 text-white/70">Sin asignaciones recientes.</div>
              {:else}
                {#each lastAssignments as a}
                  <div class="p-4">
                    <div class="flex items-center justify-between gap-4">
                      <div>
                        <div class="font-medium">#{a?.id ?? '—'} · {a?.status ?? '—'}</div>
                        <div class="text-sm text-white/70">
                          Técnico: {a?.technician?.user?.full_name ?? a?.technician_id ?? '—'}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xs text-white/60">{fmtDate(a?.created_at)}</div>
                      </div>
                    </div>
                    {#if a?.notes}
                      <p class="mt-2 line-clamp-2 text-sm text-white/80">{a.notes}</p>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </section>
      {/if}
    {/if}
  </main>
</div>

<style>
  /* util para cortar texto */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
