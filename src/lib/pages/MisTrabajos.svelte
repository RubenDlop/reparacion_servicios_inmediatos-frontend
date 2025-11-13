<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { authedFetch } from '../api/auth.js';
  import { getMyTechnicianProfile } from '../api/technicians.js';
  import { createAssignment, setAssignmentStatus } from '../api/assignments.js';
  import AssignmentCard from '../components/AssignmentCard.svelte';
  import RequestCard from '../components/RequestCard.svelte';

  let tab = 'asignaciones';
  let hasTech = false;

  let assignments = [];
  let requests = [];

  let loadingA = true, loadingR = true;
  let errA = '', errR = '', techError = '';

  let creatingFor = null;
  let switchingId = null;

  function goLogin() {
    const next = encodeURIComponent('/mis-trabajos');
    window.location.hash = `/login?next=${next}`;
  }

  async function loadAssignments(page=1, size=10) {
    loadingA = true; errA = '';
    const { response, data } = await authedFetch(`/assignments/?page=${page}&size=${size}`);
    if (response.status === 401) { goLogin(); return; }
    if (!response.ok) { errA = (data?.detail && (Array.isArray(data.detail) ? data.detail.map(x=>x.msg).join(' · ') : data.detail)) ?? `No se pudieron cargar (HTTP ${response.status})`; assignments = []; }
    else { assignments = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []); }
    loadingA = false;
  }

  async function loadRequests(page=1, size=10) {
    loadingR = true; errR = '';
    const { response, data } = await authedFetch(`/requests/?page=${page}&size=${size}`);
    if (response.status === 401) { goLogin(); return; }
    if (!response.ok) { errR = (data?.detail && (Array.isArray(data.detail) ? data.detail.map(x=>x.msg).join(' · ') : data.detail)) ?? `No se pudieron cargar (HTTP ${response.status})`; requests = []; }
    else { requests = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []); }
    loadingR = false;
  }

  onMount(async () => {
    try { const { response } = await getMyTechnicianProfile(); hasTech = !!response?.ok; } catch { hasTech = false; }
    tab = hasTech ? 'asignaciones' : 'solicitudes';
    await Promise.all([loadAssignments(), loadRequests()]);
  });

  // acciones
  const viewRequest  = (r) => { const id = r?.id ?? r?.request_id; if (id) push(`/solicitud/${id}`); };
  const viewAssign   = (a) => { const id = a?.id ?? a?.assignment_id; if (id) push(`/asignacion/${id}`); };

  async function requestTechnician(r){
    const reqId = r?.id ?? r?.request_id; if (!reqId) return;
    creatingFor = reqId;
    const { response, data } = await createAssignment(reqId);
    if (!response?.ok) alert(data?.detail ?? 'No se pudo crear la asignación');
    else { await Promise.all([loadAssignments(), loadRequests()]); alert('¡Técnico solicitado!'); }
    creatingFor = null;
  }

  async function acceptAssignment(a){
    const id = a?.id ?? a?.assignment_id; if (!id) return;
    switchingId = id;
    const { response, data } = await setAssignmentStatus(id, 'in_process');
    if (!response?.ok) alert(data?.detail ?? 'No se pudo aceptar');
    else await loadAssignments();
    switchingId = null;
  }

  async function finishAssignment(a){
    const id = a?.id ?? a?.assignment_id; if (!id) return;
    switchingId = id;
    const { response, data } = await setAssignmentStatus(id, 'finished');
    if (!response?.ok) alert(data?.detail ?? 'No se pudo finalizar');
    else { await loadAssignments(); alert('Trabajo finalizado.'); }
    switchingId = null;
  }
</script>

<style>
  :root{
    --bg:#0B1220; --card:#0f172a; --muted:#9aa3b2; --line:#1f2937; --accent:#2563eb;
    --ok:#166534; --ok-bg:#dcfce7; --ok-br:#bbf7d0; --warn:#8A4B00; --warn-bg:#fff7e6; --warn-br:#ffd699;
    --info:#075985; --info-bg:#e0f2fe; --info-br:#bae6fd; --bad:#991b1b; --bad-bg:#fee2e2; --bad-br:#fecaca;
  }
  .page{max-width:1100px;margin:0 auto;padding:20px}
  .title{color:#fff;margin:.25rem 0 1rem;font:600 1.35rem/1.2 ui-sans-serif,system-ui}
  .tabs{display:flex;gap:.5rem;margin-bottom:14px}
  .tab{padding:.55rem .95rem;border-radius:999px;border:1px solid var(--line);background:#0f172a;color:#d1d5db;cursor:pointer}
  .tab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
  .grid{display:grid;grid-template-columns:1fr;gap:14px}
  @media(min-width:880px){.grid{grid-template-columns:1fr 1fr}}
  .cardInfo{border:1px dashed var(--line);border-radius:16px;padding:16px;color:#e5e7eb;background:linear-gradient(180deg,rgba(16,24,40,.85),rgba(15,23,42,.92))}
  .muted{color:#9aa3b2}
  .skeleton{height:150px;border-radius:16px;border:1px solid var(--line);background:linear-gradient(90deg,#101827,#0f172a,#101827);background-size:200% 100%;animation:shimmer 1.2s infinite}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
</style>

<div class="page">
  <h1 class="title">Mis trabajos</h1>

  <div class="tabs">
    <button class="tab {tab==='asignaciones' ? 'active' : ''}" on:click={() => tab='asignaciones'}>Asignaciones</button>
    <button class="tab {tab==='solicitudes' ? 'active' : ''}" on:click={() => tab='solicitudes'}>Mis solicitudes</button>
  </div>

  {#if tab==='asignaciones'}
    {#if !hasTech}
      <div class="cardInfo">
        <b>Sin perfil técnico</b>
        <div class="muted">Crea tu perfil desde <b>Perfil técnico</b> para recibir asignaciones.</div>
      </div>
    {/if}
    {#if errA}<div class="cardInfo"><div class="muted">{errA}</div></div>{/if}

    {#if loadingA}
      <div class="grid"><div class="skeleton"></div><div class="skeleton"></div></div>
    {:else if assignments.length===0}
      <div class="muted">No hay asignaciones para mostrar.</div>
    {:else}
      <div class="grid">
        {#each assignments as a (a.id ?? a.assignment_id)}
          <AssignmentCard
            {a}
            {switchingId}
            onView={() => viewAssign(a)}
            onAccept={() => acceptAssignment(a)}
            onFinish={() => finishAssignment(a)}
          />
        {/each}
      </div>
    {/if}
  {:else}
    {#if errR}<div class="cardInfo"><div class="muted">{errR}</div></div>{/if}
    {#if loadingR}
      <div class="grid"><div class="skeleton"></div><div class="skeleton"></div></div>
    {:else if requests.length===0}
      <div class="muted">Aún no has creado solicitudes.</div>
    {:else}
      <div class="grid">
        {#each requests as r (r.id ?? r.request_id)}
          <RequestCard
            {r}
            {creatingFor}
            onView={() => viewRequest(r)}
            onRequestTech={() => requestTechnician(r)}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>
