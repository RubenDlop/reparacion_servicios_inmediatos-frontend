<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { push } from 'svelte-spa-router';
  import { authedFetch, me } from '../api/auth.js';
  import {
    fetchRequests as apiFetchRequests,
    fetchAssignments as apiFetchAssignments,
    listServices as apiListServices,
  } from '../api/dashboard.js';

  // =========================
  // Helpers de UI y formato
  // =========================
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

  const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleString();
  };

  function unwrapList(payload) {
    if (!payload) return { items: [], total: 0 };
    if (Array.isArray(payload)) return { items: payload, total: payload.length };
    const items = payload.items ?? payload.data ?? [];
    const total = payload.total ?? payload.count ?? items.length ?? 0;
    return { items, total };
  }

  function chipClass(status) {
    const s = String(status || '').toLowerCase();
    if (['aprobado','completada','complete','done','approved'].some(x=>s.includes(x))) return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30';
    if (['rechazado','cancel','denied','rejected'].some(x=>s.includes(x))) return 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30';
    if (['pendiente','pending','open','nuevo','nueva'].some(x=>s.includes(x))) return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30';
    return 'bg-slate-500/15 text-slate-300 ring-1 ring-white/10';
  }

  // ===== Verificación por documentos (UI derivada + sync opcional con backend) ====
  function isDocValid(d) {
    const notExpired = !d?.expires_at || new Date(d.expires_at) > new Date();
    return !!d?.verified && notExpired;
  }

  // Si usas documentos requeridos específicos, define aquí:
  // const REQUIRED_KINDS = ['dni','certification','background'];
  // y reemplaza docsProgress con el filtrado por REQUIRED_KINDS.
  function docsProgress(t) {
    const docs = t?.documents ?? [];
    const ok = docs.filter(isDocValid).length;
    return { ok, total: docs.length, all: docs.length > 0 && ok === docs.length };
  }

  function isTechVerifiedLocal(t) {
    if (t?.verified) return true;
    const { all } = docsProgress(t);
    return all;
  }

  async function maybeMarkTechVerified(techId) {
    try {
      const { response, data } = await authedFetch(`/technicians/${techId}`);
      if (!response?.ok || !data) return;

      if (isTechVerifiedLocal(data) && !data.verified) {
        // 1) Endpoint dedicado (si existe)
        let res = await authedFetch(`/technicians/${techId}/verify`, { method: 'POST' });

        // 2) Fallback PATCH
        if (!res?.response?.ok) {
          await authedFetch(`/technicians/${techId}`, {
            method: 'PATCH',
            body: JSON.stringify({ verified: true }),
          });
        }
      }
    } catch {
      // Silencioso: si falla, la UI derivada igual muestra el estado correcto
    }
  }

  // =========================
  // Guardia: solo admin
  // =========================
  let isAdmin = false;
  let checking = true;

  async function guard() {
    checking = true;
    try {
      const { response, data } = await me();
      if (response?.ok && data?.is_superuser) {
        isAdmin = true;
      } else {
        isAdmin = false;
        push('/dashboard');
      }
    } catch {
      isAdmin = false;
      push('/login');
    } finally {
      checking = false;
    }
  }

  // =========================
  // Estado de pestañas
  // =========================
  let tab = 'resumen'; // 'resumen' | 'solicitudes' | 'asignaciones' | 'tecnicos'

  // =========================
  // Datos de Resumen
  // =========================
  let kpis = { requests: 0, assignments: 0, technicians: 0 };
  let services = [];
  let kpiLoading = false;

  async function loadKpis() {
    try {
      kpiLoading = true;
      const [req, asg, tech] = await Promise.all([
        apiFetchRequests({ size: 1 }),
        apiFetchAssignments({ size: 1 }),
        fetchTechnicians({ size: 1 }),
      ]);
      kpis.requests = req?.total ?? 0;
      kpis.assignments = asg?.total ?? 0;
      kpis.technicians = tech?.total ?? 0;

      const ls = await apiListServices({ size: 200 });
      services = ls?.items ?? [];
    } finally {
      kpiLoading = false;
    }
  }

  // =========================
  // Solicitudes
  // =========================
  let reqItems = [];
  let reqTotal = 0;
  let reqPage = 1;
  let reqSize = 10;
  let reqLoading = false;
  let reqErr = '';

  async function loadRequests() {
    reqLoading = true; reqErr = '';
    try {
      const { response, items, total } = await apiFetchRequests({ page: reqPage, size: reqSize });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      reqItems = items; reqTotal = total;
    } catch (e) {
      reqErr = e?.message || 'No se pudieron cargar las solicitudes';
      reqItems = []; reqTotal = 0;
    } finally {
      reqLoading = false;
    }
  }

  // =========================
  // Asignaciones
  // =========================
  let asgItems = [];
  let asgTotal = 0;
  let asgPage = 1;
  let asgSize = 10;
  let asgLoading = false;
  let asgErr = '';

  async function loadAssignments() {
    asgLoading = true; asgErr = '';
    try {
      const { response, items, total } = await apiFetchAssignments({ page: asgPage, size: asgSize });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      asgItems = items; asgTotal = total;
    } catch (e) {
      asgErr = e?.message || 'No se pudieron cargar las asignaciones';
      asgItems = []; asgTotal = 0;
    } finally {
      asgLoading = false;
    }
  }

  // =========================
  // Técnicos + docs
  // =========================
  let techItems = [];
  let techTotal = 0;
  let techPage = 1;
  let techSize = 10;
  let techLoading = false;
  let techErr = '';
  let techSearch = '';

  async function fetchTechnicians({ page = 1, size = 10, q = '' } = {}) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.set('q', q);
    const { response, data } = await authedFetch(`/technicians?${params.toString()}`);
    if (!response.ok) return { response, ...unwrapList(null) };
    return { response, ...unwrapList(data) };
  }

  async function loadTechnicians() {
    techLoading = true; techErr = '';
    try {
      const { response, items, total } = await fetchTechnicians({ page: techPage, size: techSize, q: techSearch });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      techItems = items; techTotal = total;
    } catch (e) {
      techErr = e?.message || 'No se pudieron cargar los técnicos';
      techItems = []; techTotal = 0;
    } finally {
      techLoading = false;
    }
  }

  async function reloadTechWithDocs(t) {
    const { response, data } = await authedFetch(`/technicians/${t.id}`);
    if (response.ok && data) {
      const idx = techItems.findIndex(x => x.id === t.id);
      if (idx >= 0) techItems[idx] = data;
    }
  }

  // ====== MODIFICADO: revisa doc, recarga y sincroniza verificación ======
  async function reviewDoc(techId, docId, verified, comment = '') {
    const fd = new FormData();
    fd.set('verified', verified ? 'true' : 'false');
    if (comment) fd.set('comment', comment);

    const { response } = await authedFetch(`/technicians/${techId}/documents/${docId}/review`, {
      method: 'PATCH',
      body: fd,
    });

    if (!response.ok) {
      alert(`No se pudo actualizar el documento (HTTP ${response.status})`);
      return false;
    }

    // 1) Recarga documentos del técnico
    await reloadTechWithDocs({ id: techId });

    // 2) Si todos ok, intenta marcar técnico verificado en backend
    await maybeMarkTechVerified(techId);

    // 3) Recarga de nuevo por si cambió el flag verified en servidor
    await reloadTechWithDocs({ id: techId });

    return true;
  }

  // =========================
  // Crear asignación (modal)
  // =========================
  let showAssignModal = false;
  let assignForRequest = null;
  let assignTechId = '';
  let assignWhen = '';
  let assignNotes = '';
  let assignLoading = false;
  let assignErr = '';

  function openAssign(req) {
    assignForRequest = req;
    assignTechId = '';
    assignWhen = '';
    assignNotes = '';
    showAssignModal = true;
  }
  function closeAssign() {
    showAssignModal = false;
    assignForRequest = null;
  }

  async function createAssignment() {
    if (!assignForRequest || !assignTechId) return;
    assignLoading = true; assignErr = '';
    try {
      const payload = {
        request_id: assignForRequest.id,
        technician_id: Number(assignTechId),
        notes: assignNotes || null,
        scheduled_at: assignWhen ? new Date(assignWhen).toISOString() : null,
      };
      const { response, data } = await authedFetch(`/assignments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const reason =
          (data?.detail && (Array.isArray(data.detail) ? data.detail.map(d => d.msg || d).join(' · ')
          : (data.detail?.message || data.detail))) || `HTTP ${response.status}`;
        throw new Error(reason);
      }
      await Promise.all([loadAssignments(), loadRequests(), loadKpis()]);
      closeAssign();
    } catch (e) {
      assignErr = e?.message || 'No se pudo crear la asignación';
    } finally {
      assignLoading = false;
    }
  }

  onMount(async () => {
    await guard();
    if (!isAdmin) return;
    await Promise.all([loadKpis(), loadRequests(), loadAssignments(), loadTechnicians()]);
  });
</script>

<!-- ======= BACKDROP + GRADIENT HERO ======= -->
<div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
  <div class="mx-auto max-w-7xl px-4 pb-16">

    <!-- Header/Hero -->
    <header class="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/30 via-indigo-500/20 to-cyan-500/20 backdrop-blur-xl shadow-2xl mt-6">
      <div class="absolute inset-0 opacity-20 pointer-events-none">
        <div class="absolute -top-24 -left-24 size-[40rem] bg-indigo-500/40 blur-[100px] rounded-full"></div>
        <div class="absolute -bottom-24 -right-24 size-[40rem] bg-cyan-500/40 blur-[100px] rounded-full"></div>
      </div>
      <div class="relative px-6 py-6 lg:px-10 lg:py-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="grid place-items-center size-12 rounded-2xl bg-white/10 ring-1 ring-white/20">
            <span class="text-xl font-black tracking-wider">RIB</span>
          </div>
          <div>
            <h1 class="text-xl md:text-2xl font-bold">Panel de administración</h1>
            <p class="text-slate-300/90 text-sm">Operaciones · Solicitudes · Técnicos · Asignaciones</p>
          </div>
        </div>

        <!-- Segmented tabs -->
        <nav class="bg-slate-900/60 border border-white/10 rounded-2xl p-1 flex gap-1">
          <button class="seg {tab==='resumen' ? 'active' : ''}" on:click={() => tab='resumen'}>Resumen</button>
          <button class="seg {tab==='solicitudes' ? 'active' : ''}" on:click={() => tab='solicitudes'}>Solicitudes</button>
          <button class="seg {tab==='asignaciones' ? 'active' : ''}" on:click={() => tab='asignaciones'}>Asignaciones</button>
          <button class="seg {tab==='tecnicos' ? 'active' : ''}" on:click={() => tab='tecnicos'}>Técnicos</button>
        </nav>
      </div>
    </header>

    {#if checking}
      <div class="mt-8 grid gap-4 md:grid-cols-3">
        {#each Array(3) as _}
          <div class="card skeleton h-32"></div>
        {/each}
      </div>
    {:else if !isAdmin}
      <div class="mt-8 card">Redirigiendo…</div>
    {:else}
      <!-- ================== -->
      <!-- CONTENIDO TABS     -->
      <!-- ================== -->
      {#if tab === 'resumen'}
        <section in:fade>
          <div class="mt-8 grid gap-4 md:grid-cols-3">
            <div class="card">
              <div class="text-slate-300">Solicitudes</div>
              {#if kpiLoading}
                <div class="skeleton mt-2 h-9 w-24"></div>
              {:else}
                <div class="text-4xl font-bold">{kpis.requests}</div>
              {/if}
              <div class="mt-1 text-slate-400 text-sm">Totales en el sistema</div>
            </div>
            <div class="card">
              <div class="text-slate-300">Asignaciones</div>
              {#if kpiLoading}
                <div class="skeleton mt-2 h-9 w-24"></div>
              {:else}
                <div class="text-4xl font-bold">{kpis.assignments}</div>
              {/if}
              <div class="mt-1 text-slate-400 text-sm">Programadas / completadas</div>
            </div>
            <div class="card">
              <div class="text-slate-300">Técnicos</div>
              {#if kpiLoading}
                <div class="skeleton mt-2 h-9 w-24"></div>
              {:else}
                <div class="text-4xl font-bold">{kpis.technicians}</div>
              {/if}
              <div class="mt-1 text-slate-400 text-sm">Perfiles creados</div>
            </div>
          </div>

          <div class="panel mt-6">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="font-semibold">Servicios disponibles</h2>
                <p class="text-slate-400 text-sm">Listado de referencia</p>
              </div>
              <button class="btn ghost" on:click={loadKpis}>Actualizar</button>
            </div>

            {#if services.length === 0}
              <div class="empty">
                <p>No hay servicios cargados.</p>
              </div>
            {:else}
              <ul class="mt-3 grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                {#each services as s}
                  <li class="chip-row">
                    <span class="chip-id">#{s.id}</span>
                    <span class="truncate">{s.name}</span>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </section>

      {:else if tab === 'solicitudes'}
        <section class="mt-8" in:fade>
          <div class="panel">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Solicitudes</h2>
              <div class="flex items-center gap-2">
                <button class="btn ghost" on:click={loadRequests}>Actualizar</button>
                <span class="text-slate-400 text-sm">Total: {reqTotal}</span>
              </div>
            </div>

            {#if reqErr}
              <div class="alert error mt-3">Error: {reqErr}</div>
            {/if}

            {#if reqLoading}
              <div class="skeleton h-10 w-full mt-4"></div>
              <div class="skeleton h-10 w-full mt-2"></div>
              <div class="skeleton h-10 w-full mt-2"></div>
            {:else}
              {#if reqItems.length === 0}
                <div class="empty"><p>No hay solicitudes.</p></div>
              {:else}
                <div class="tbl">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Servicio</th>
                        <th>Cliente</th>
                        <th>Estado</th>
                        <th>Creado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each reqItems as r}
                        <tr>
                          <td class="mono">#{r.id}</td>
                          <td class="truncate">{r.service?.name ?? r.service_name ?? '—'}</td>
                          <td class="truncate">{r.customer?.full_name ?? r.customer?.email ?? '—'}</td>
                          <td><span class={"chip " + chipClass(r.status)}>{r.status ?? '—'}</span></td>
                          <td>{fmtDate(r.created_at)}</td>
                          <td class="text-right">
                            <button class="btn primary" on:click={() => openAssign(r)}>Asignar</button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>

                <div class="pager">
                  <button class="btn ghost" disabled={reqPage<=1} on:click={() => { reqPage--; loadRequests(); }}>«</button>
                  <span class="text-slate-400 text-sm">Página {reqPage}</span>
                  <button class="btn ghost" disabled={reqItems.length < reqSize} on:click={() => { reqPage++; loadRequests(); }}>»</button>
                </div>
              {/if}
            {/if}
          </div>
        </section>

      {:else if tab === 'asignaciones'}
        <section class="mt-8" in:fade>
          <div class="panel">
            <div class="flex items-center justify-between">
              <h2 class="font-semibold">Asignaciones</h2>
              <div class="flex items-center gap-2">
                <button class="btn ghost" on:click={loadAssignments}>Actualizar</button>
                <span class="text-slate-400 text-sm">Total: {asgTotal}</span>
              </div>
            </div>

            {#if asgErr}
              <div class="alert error mt-3">Error: {asgErr}</div>
            {/if}

            {#if asgLoading}
              <div class="skeleton h-10 w-full mt-4"></div>
              <div class="skeleton h-10 w-full mt-2"></div>
              <div class="skeleton h-10 w-full mt-2"></div>
            {:else}
              {#if asgItems.length === 0}
                <div class="empty"><p>No hay asignaciones.</p></div>
              {:else}
                <div class="tbl">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Solicitud</th>
                        <th>Técnico</th>
                        <th>Estado</th>
                        <th>Programada</th>
                        <th>Actualizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each asgItems as a}
                        <tr>
                          <td class="mono">#{a.id}</td>
                          <td>#{a.request_id}</td>
                          <td>#{a.technician_id}</td>
                          <td><span class={"chip " + chipClass(a.status)}>{a.status ?? '—'}</span></td>
                          <td>{fmtDate(a.scheduled_at)}</td>
                          <td>{fmtDate(a.updated_at)}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>

                <div class="pager">
                  <button class="btn ghost" disabled={asgPage<=1} on:click={() => { asgPage--; loadAssignments(); }}>«</button>
                  <span class="text-slate-400 text-sm">Página {asgPage}</span>
                  <button class="btn ghost" disabled={asgItems.length < asgSize} on:click={() => { asgPage++; loadAssignments(); }}>»</button>
                </div>
              {/if}
            {/if}
          </div>
        </section>

      {:else if tab === 'tecnicos'}
        <section class="mt-8" in:fade>
          <div class="panel">
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">Técnicos</h2>
              <div class="flex items-center gap-2">
                <input class="input w-60" placeholder="Buscar…" bind:value={techSearch}
                       on:keydown={(e)=>{ if(e.key==='Enter'){ techPage=1; loadTechnicians(); }}} />
                <button class="btn ghost" on:click={() => { techPage=1; loadTechnicians(); }}>Buscar</button>
                <button class="btn ghost" on:click={loadTechnicians}>Actualizar</button>
                <span class="text-slate-400 text-sm">Total: {techTotal}</span>
              </div>
            </div>

            {#if techErr}
              <div class="alert error mt-3">Error: {techErr}</div>
            {/if}

            {#if techLoading}
              {#each Array(3) as _}
                <div class="card mt-3 skeleton h-32"></div>
              {/each}
            {:else if techItems.length === 0}
              <div class="empty"><p>No hay técnicos.</p></div>
            {:else}
              <div class="grid gap-3 mt-3">
                {#each techItems as t}
                  <div class="card">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="font-semibold">#{t.id} · {t.user?.full_name ?? t.user?.email ?? 'Técnico'}</div>

                        <!-- Estado derivado + progreso -->
                        <div class="flex flex-wrap items-center gap-2 text-sm">
                          <span class="text-slate-400">Estado: {t.status}</span>
                          {#if isTechVerifiedLocal(t)}
                            <span class="chip bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">Verificado</span>
                          {:else}
                            <span class="chip bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30">Pendiente</span>
                          {/if}
                          {#if (t.documents ?? []).length > 0}
                            <span class="text-slate-500">
                              {docsProgress(t).ok}/{docsProgress(t).total} docs
                            </span>
                          {/if}
                        </div>
                      </div>
                      <button class="btn ghost" on:click={() => reloadTechWithDocs(t)}>Recargar</button>
                    </div>

                    <details class="mt-3 group">
                      <summary class="cursor-pointer text-slate-300/90 hover:text-white transition-colors">
                        Documentos
                      </summary>
                      <div class="mt-3 grid gap-3">
                        {#if (t.documents ?? []).length === 0}
                          <div class="text-slate-400">Sin documentos.</div>
                        {:else}
                          {#each t.documents as d}
                            <div class="subcard">
                              <div class="flex flex-col sm:flex-row justify-between gap-3">
                                <div>
                                  <div class="font-medium">{d.kind}</div>
                                  <div class="text-slate-400 text-sm">
                                    Archivo: <b>{d.filename}</b> · Emisor: {d.issuer || '—'} · Emisión: {fmtDate(d.issued_at)} · Vence: {fmtDate(d.expires_at)}
                                  </div>
                                  <div class="text-slate-400 text-sm">
                                    Verificado: <b>{d.verified ? 'sí' : 'no'}</b>
                                    {#if d.review_comment} · Nota: <i>{d.review_comment}</i>{/if}
                                  </div>
                                  {#if d.url}
                                    <div class="mt-2">
                                      <a href={d.url} target="_blank" rel="noopener" class="btn ghost">Ver</a>
                                    </div>
                                  {/if}
                                </div>
                                <form class="w-full sm:w-72" on:submit|preventDefault={(e)=>{
                                  const form = e.currentTarget;
                                  const txt = form.querySelector('textarea')?.value || '';
                                  reviewDoc(t.id, d.id, true, txt);
                                }}>
                                  <textarea class="textarea" rows="2" placeholder="Comentario (opcional)"></textarea>
                                  <div class="flex gap-2 mt-2">
                                    <button type="submit" class="btn primary w-full">Aprobar</button>
                                    <button type="button" class="btn danger w-full" on:click={(e)=>{
                                      const txt = e.currentTarget.closest('form').querySelector('textarea')?.value || '';
                                      reviewDoc(t.id, d.id, false, txt);
                                    }}>Rechazar</button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          {/each}
                        {/if}
                      </div>
                    </details>
                  </div>
                {/each}
              </div>

              <div class="pager">
                <button class="btn ghost" disabled={techPage<=1} on:click={() => { techPage--; loadTechnicians(); }}>«</button>
                <span class="text-slate-400 text-sm">Página {techPage}</span>
                <button class="btn ghost" disabled={techItems.length < techSize} on:click={() => { techPage++; loadTechnicians(); }}>»</button>
              </div>
            {/if}
          </div>
        </section>
      {/if}         <!-- cierra el switch de tabs -->
    {/if}           <!-- cierra el if principal: checking / !isAdmin / else -->
  </div>

  <!-- Modal: Crear Asignación -->
  {#if showAssignModal}
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/60 px-3"
         on:click={(e)=>{ if(e.target===e.currentTarget) closeAssign(); }}>
      <div class="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl"
           role="dialog" aria-modal="true" aria-label="Crear asignación" in:fade>
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-lg font-semibold">Crear asignación</h3>
          <button class="btn ghost" on:click={closeAssign}>✕</button>
        </div>

        <p class="text-slate-400 text-sm mt-1">
          Solicitud #{assignForRequest?.id} · {assignForRequest?.service?.name ?? assignForRequest?.service_name ?? 'Servicio'}
        </p>

        {#if assignErr}
          <div class="alert error mt-3">Error: {assignErr}</div>
        {/if}

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Técnico (ID)</label>
            <input class="input" placeholder="Ej: 3" bind:value={assignTechId} />
            <div class="hint">* Puedes ver IDs en la pestaña Técnicos.</div>
          </div>
          <div>
            <label class="label">Programar (opcional)</label>
            <input class="input" type="datetime-local" bind:value={assignWhen} />
          </div>
        </div>

        <div class="mt-4">
          <label class="label">Notas (opcional)</label>
          <textarea class="textarea" rows="3" bind:value={assignNotes} placeholder="Instrucciones, detalles…"></textarea>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button class="btn ghost" on:click={closeAssign}>Cancelar</button>
          <button class="btn primary" disabled={assignLoading || !assignTechId} on:click={createAssignment}>
            {assignLoading ? 'Creando…' : 'Crear asignación'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(:root) {
    --elev-1: 0 10px 30px -12px rgba(0,0,0,.45), 0 10px 14px -8px rgba(0,0,0,.25);
  }
  .card { @apply rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-4 shadow-[var(--elev-1)]; }
  .subcard { @apply rounded-xl border border-white/10 bg-slate-900/60 p-4; }
  .panel { @apply rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl p-5 shadow-[var(--elev-1)]; }
  .btn { @apply inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition active:scale-[.98] disabled:opacity-50; }
  .btn.primary { @apply bg-indigo-500 text-white hover:bg-indigo-400; }
  .btn.ghost { @apply border border-white/10 bg-transparent text-slate-200 hover:bg-white/5; }
  .btn.danger { @apply bg-rose-500 text-white hover:bg-rose-400; }
  .input, .textarea { @apply w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-400/60; }
  .label { @apply block text-sm text-slate-300; }
  .hint { @apply text-xs text-slate-400 mt-1; }
  .tbl { @apply mt-4 overflow-hidden rounded-2xl border border-white/10; }
  .tbl table { @apply w-full border-collapse; }
  .tbl thead th { @apply sticky top-0 bg-slate-800/80 backdrop-blur px-3 py-2 text-left text-xs font-semibold tracking-wide text-slate-200; }
  .tbl tbody td { @apply px-3 py-2 align-middle text-sm; }
  .tbl tbody tr { @apply border-t border-white/5 hover:bg-white/5 transition; }
  .pager { @apply mt-3 flex items-center gap-2; }
  .chip { @apply inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1; }
  .chip-row { @apply flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2; }
  .chip-id { @apply inline-flex items-center justify-center rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
  .empty { @apply mt-4 grid place-items-center rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-slate-300; }
  .alert.error { @apply rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-rose-200; }
  .seg { @apply rounded-xl px-3 py-1.5 text-sm text-slate-300 hover:text-white transition; }
  .seg.active { @apply bg-white text-slate-900 shadow; }
  .skeleton {
    position: relative; overflow: hidden;
    background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 37%, rgba(255,255,255,0.06) 63%);
    background-size: 400% 100%; animation: shimmer 1.25s infinite linear;
    @apply rounded-xl;
  }
  @keyframes shimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
</style>
