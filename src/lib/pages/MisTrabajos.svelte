<!-- src/routes/MisTrabajos.svelte -->
<script>
  import { onMount } from 'svelte';
  import { authedFetch } from '../api/auth.js';
  import { getMyTechnicianProfile } from '../api/technicians.js';

  // hash-router: para redirigir a login con ?next
  function goLogin() {
    const next = encodeURIComponent('/mis-trabajos');
    window.location.hash = `/login?next=${next}`;
  }

  // pestaña inicial; la ajustaremos en onMount según si es técnico o no
  let tab = 'asignaciones'; // 'asignaciones' | 'solicitudes'
  let hasTech = false;      // ¿este usuario tiene perfil técnico?

  // datos
  let assignments = [];
  let requests = [];

  // estados
  let loadingA = true;
  let loadingR = true;
  let errA = '';
  let errR = '';
  let techError = '';

  const fmtDate = (s) => (s ? new Date(s).toLocaleString() : '—');

  function detailFrom(data) {
    const d = data?.detail;
    if (!d) return null;
    if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(' · ');
    if (typeof d === 'object') return d.message || JSON.stringify(d);
    return String(d);
  }

  async function loadAssignments(page = 1, size = 10) {
    loadingA = true; errA = '';
    const { response, data } = await authedFetch(`/assignments/?page=${page}&size=${size}`);
    if (response.status === 401) { goLogin(); return; }
    if (!response.ok) {
      // Si no es técnico el backend puede devolver 403 (cuando intentas ver asignaciones "como técnico");
      // Aun así, si eres cliente y hay asignaciones de tus solicitudes, el backend también las devuelve.
      errA = detailFrom(data) ?? `No se pudieron cargar (HTTP ${response.status})`;
      assignments = [];
    } else {
      assignments = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    }
    loadingA = false;
  }

  async function loadRequests(page = 1, size = 10) {
    loadingR = true; errR = '';
    const { response, data } = await authedFetch(`/requests/?page=${page}&size=${size}`);
    if (response.status === 401) { goLogin(); return; }
    if (!response.ok) {
      errR = detailFrom(data) ?? `No se pudieron cargar (HTTP ${response.status})`;
      requests = [];
    } else {
      requests = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    }
    loadingR = false;
  }

  onMount(async () => {
    // 1) ¿tiene perfil técnico?
    techError = '';
    try {
      const { response } = await getMyTechnicianProfile();
      hasTech = !!response?.ok; // 200 => sí; 404 => no tiene perfil técnico
    } catch (e) {
      // si hay 404 simplemente no es técnico; otros errores los mostramos
      techError = String(e);
      hasTech = false;
    }

    // 2) pestaña inicial: si no es técnico, abre "Mis solicitudes"
    tab = hasTech ? 'asignaciones' : 'solicitudes';

    // 3) carga datos
    await Promise.all([loadAssignments(), loadRequests()]);
  });
</script>

<style>
  .wrap { max-width: 1100px; margin: 0 auto; padding: 1rem; }
  .tabs { display:flex; gap:.5rem; margin-bottom:1rem }
  .tab { padding:.5rem .9rem; border-radius:.6rem; cursor:pointer; background:#0f172a; color:#9aa3b2; border:1px solid #1f2937 }
  .tab.active { background:#2563eb; color:#fff; border-color:#2563eb }
  .grid { display:grid; grid-template-columns:1fr; gap:.8rem }
  @media (min-width: 720px){ .grid{ grid-template-columns:1fr 1fr } }
  .card { border:1px solid #e5e7eb; border-radius:.8rem; padding:1rem; background:#fff }
  .muted { color:#6b7280; font-size:.9rem }
  .chip { padding:.15rem .5rem; border-radius:999px; background:#eef2ff; color:#1e3a8a; font-size:.8rem }
  .error { color:#b91c1c; background:#fee2e2; border:1px solid #fecaca; padding:.75rem; border-radius:.6rem }
  .hint  { color:#0369a1; background:#e0f2fe; border:1px solid #bae6fd; padding:.75rem; border-radius:.6rem; font-size:.9rem }
  .skeleton { height:90px; border-radius:.8rem; background:linear-gradient(90deg,#f3f4f6,#e5e7eb,#f3f4f6); background-size:200% 100%; animation:shimmer 1.2s infinite }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:.82rem }
</style>

<div class="wrap">
  <h1 style="margin:.25rem 0 1rem 0;">Mis trabajos</h1>

  <div class="tabs">
    <button class="tab {tab==='asignaciones' ? 'active' : ''}" on:click={() => tab='asignaciones'}>Asignaciones</button>
    <button class="tab {tab==='solicitudes' ? 'active' : ''}" on:click={() => tab='solicitudes'}>Mis solicitudes</button>
  </div>

  {#if tab === 'asignaciones'}
    {#if !hasTech}
      <div class="hint" style="margin-bottom: .8rem">
        No tienes perfil técnico. Crea tu perfil desde <strong>Perfil técnico</strong> para poder recibir asignaciones.
        Si solo eres cliente, esta sección puede estar vacía hasta que un admin asigne un técnico a tus solicitudes.
      </div>
    {/if}
    {#if techError}<div class="error" style="margin-bottom:.8rem">{techError}</div>{/if}
    {#if errA}<div class="error">{errA}</div>{/if}
    {#if loadingA}
      <div class="grid"><div class="skeleton"></div><div class="skeleton"></div></div>
    {:else if assignments.length === 0}
      <p class="muted">No hay asignaciones para mostrar.</p>
    {:else}
      <div class="grid">
        {#each assignments as a}
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:.5rem">
              <strong>Asignación #{a.id ?? a.assignment_id ?? '—'}</strong>
              {#if a.status}<span class="chip">{a.status}</span>{/if}
            </div>
            <div class="muted" style="margin-top:.25rem">
              {a.service?.name ?? a.service_name ?? 'Servicio'} · {a.city ?? a.location ?? a.address ?? ''}
            </div>
            <div class="muted">
              Creado: {fmtDate(a.created_at ?? a.createdAt)} · Actualizado: {fmtDate(a.updated_at ?? a.updatedAt)}
            </div>
            <details style="margin-top:.5rem">
              <summary class="muted">Detalles</summary>
              <pre class="mono">{JSON.stringify(a, null, 2)}</pre>
            </details>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    {#if errR}<div class="error">{errR}</div>{/if}
    {#if loadingR}
      <div class="grid"><div class="skeleton"></div><div class="skeleton"></div></div>
    {:else if requests.length === 0}
      <p class="muted">Aún no has creado solicitudes.</p>
    {:else}
      <div class="grid">
        {#each requests as r}
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:.5rem">
              <strong>Solicitud #{r.id ?? r.request_id ?? '—'}</strong>
              {#if r.status}<span class="chip">{r.status}</span>{/if}
            </div>
            <div class="muted" style="margin-top:.25rem">
              {r.title ?? r.service?.name ?? r.service_name ?? 'Servicio'} · {r.city ?? r.location ?? r.address ?? ''}
            </div>
            <div class="muted">
              Creado: {fmtDate(r.created_at ?? r.createdAt)} · Actualizado: {fmtDate(r.updated_at ?? r.updatedAt)}
            </div>
            <details style="margin-top:.5rem">
              <summary class="muted">Detalles</summary>
              <pre class="mono">{JSON.stringify(r, null, 2)}</pre>
            </details>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
