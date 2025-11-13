<!-- src/lib/pages/SolicitudDetalle.svelte -->
<script>
  import { onMount } from 'svelte';
  import MapLeaflet from './MapLeaflet.svelte';
  import { getRequestById, cancelRequest } from '../api/requests.js';
  import { createAssignment } from '../api/assignments.js';

  // svelte-spa-router entrega params como prop
  export let params = {};
  let id = Number(params?.id);

  // Estado base
  let loading = true;
  let error = '';
  let r = null;                // solicitud
  let chip = { text: '—', cls: 'chip' };

  // Mapa
  let latNum = 4.6486, lngNum = -74.0875; // Bogotá fallback
  let mapRef;

  // UI local
  let acting = false;          // spinner de acciones
  let toast = null;            // { kind:'ok'|'warn'|'bad'|'info', text:string }

  // Utils ---------------------------------------------------------
  const fmtDate = (s) => (s ? new Date(s).toLocaleString() : '—');
  const money = (n) =>
    (typeof n === 'number')
      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n)
      : '—';

  const chipFor = (status) => {
    const s = (status || '').toLowerCase();
    if (['pending','creada','nuevo'].includes(s))   return { text:'Pendiente',  cls:'chip chip--warn' };
    if (['assigned','in_process','en_proceso'].includes(s)) return { text:'En proceso',  cls:'chip chip--info' };
    if (['finished','finalizada','done','completado'].includes(s)) return { text:'Finalizada', cls:'chip chip--ok' };
    if (['cancelled','canceled','rechazada'].includes(s))  return { text:'Cancelada',  cls:'chip chip--bad' };
    return { text: status || '—', cls: 'chip' };
  };

  const age = (s) => {
    if (!s) return '—';
    const ms = Date.now() - new Date(s).getTime();
    const m = Math.floor(ms/60000); if (m<60) return `${m} min`;
    const h = Math.floor(m/60);     if (h<24) return `${h} h`;
    return `${Math.floor(h/24)} d`;
  };

  function show(kind, text, ttl = 3000) {
    toast = { kind, text };
    setTimeout(() => (toast = null), ttl);
  }

  // Carga ---------------------------------------------------------
  async function load() {
    loading = true; error = ''; r = null;
    if (!Number.isFinite(id) || id <= 0) {
      error = 'ID de solicitud inválido.'; loading = false; return;
    }
    const { response, data } = await getRequestById(id);
    if (!response?.ok) {
      error = data?.detail ?? data?.message ?? `HTTP ${response?.status}`; loading = false; return;
    }
    r = data?.item ?? data?.data ?? data ?? null;
    const lat = Number(r?.latitude ?? r?.lat), lng = Number(r?.longitude ?? r?.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) { latNum = lat; lngNum = lng; }
    chip = chipFor(r?.status);
    loading = false;
  }

  onMount(load);

  // Acciones ------------------------------------------------------
  async function asignarTecnico() {
    if (!r?.id) return;
    acting = true;
    const { response, data } = await createAssignment(r.id);
    acting = false;
    if (!response?.ok) {
      show('bad', data?.detail ?? 'No fue posible solicitar técnico.');
      return;
    }
    show('ok', 'Técnico solicitado correctamente.');
    await load();
  }

  async function anularSolicitud() {
    if (!r?.id) return;
    if (!confirm('¿Seguro que deseas cancelar esta solicitud?')) return;
    acting = true;
    const { response, data } = await cancelRequest(r.id);
    acting = false;
    if (!response?.ok) {
      show('bad', data?.detail ?? 'No se pudo cancelar la solicitud.');
      return;
    }
    show('ok', 'Solicitud cancelada.');
    await load();
  }

  function openRutas() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latNum},${lngNum}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function copyDireccion() {
    const text = `${r?.address ?? ''} ${r?.city ? '· ' + r.city : ''}`.trim();
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => show('info', 'Dirección copiada'));
  }

  function goBack() {
    history.length > 1 ? history.back() : (window.location.hash = '/mis-trabajos');
  }

  // Íconos inline (sin libs) -------------------------------------
  const I = {
    back:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2Z"/></svg>',
    pin:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>',
    phone:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1A17.5 17.5 0 0 1 2.5 6a1 1 0 0 1 1-1H7a1 1 0 0 1 1 1c0 1.21.2 2.42.57 3.57a1 1 0 0 1-.25 1.02Z"/></svg>',
    mail:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v.4l10 5.55L22 6.4V6Zm0 2.24-9.55 5.3a1 1 0 0 1-.9 0L2 8.24V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.24Z"/></svg>',
    calendar:'<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v3H2V6a2 2 0 0 1 2-2h3V2Zm15 8v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8h20Z"/></svg>',
    peso:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h7a6 6 0 0 1 0 12H8v6H6V3Zm2 2v8h5a4 4 0 0 0 0-8H8Z"/></svg>',
    route:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"/></svg>'
  };
</script>

<style>
  :root{
    --bg:#0B1220; --card:#0f172a; --muted:#9aa3b2; --line:#1f2937; --accent:#2563eb;
    --ok:#166534; --ok-bg:#dcfce7; --ok-br:#bbf7d0;
    --warn:#8A4B00; --warn-bg:#fff7e6; --warn-br:#ffd699;
    --info:#075985; --info-bg:#e0f2fe; --info-br:#bae6fd;
    --bad:#991b1b; --bad-bg:#fee2e2; --bad-br:#fecaca;
  }
  .page{max-width:1200px;margin:0 auto;padding:20px;color:#e5e7eb}
  .topbar{display:flex;gap:10px;align-items:center;margin-bottom:14px}
  .back{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#0b1220;color:#dbe3f2;padding:.5rem .8rem;border-radius:10px;cursor:pointer}
  .title{font:800 1.15rem/1 ui-sans-serif,system-ui;margin:0}
  .chip{padding:.28rem .65rem;border-radius:999px;font:700 12px/1 ui-sans-serif;border:1px solid #1f2937;background:#101826;color:#e5e7eb}
  .chip--ok{background:var(--ok-bg);border-color:var(--ok-br);color:var(--ok)}
  .chip--warn{background:var(--warn-bg);border-color:var(--warn-br);color:var(--warn)}
  .chip--info{background:var(--info-bg);border-color:var(--info-br);color:var(--info)}
  .chip--bad{background:var(--bad-bg);border-color:var(--bad-br);color:var(--bad)}

  .grid{display:grid;gap:16px}
  @media(min-width:980px){.grid{grid-template-columns:1.35fr .65fr}}

  .card{
    border:1px solid var(--line);
    background:linear-gradient(180deg,rgba(16,24,40,.9),rgba(15,23,42,.97));
    border-radius:18px;padding:16px;box-shadow:0 10px 30px rgba(2,6,23,.4)
  }
  .sectionHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  .kv{display:grid;grid-template-columns:160px 1fr;gap:7px;font-size:14px}
  .muted{color:#b6c1d4}
  .soft{color:#9fb2d4}

  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px}
  .kpi{border:1px solid var(--line);border-radius:14px;padding:10px;background:#0c1426}
  .kpi .label{font-size:12px;color:#a8b6cc}
  .kpi .val{font-weight:800;font-size:18px}

  .tagline{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
  .pill{display:inline-flex;align-items:center;gap:6px;padding:.45rem .7rem;border:1px solid var(--line);border-radius:999px;background:#0b1220;color:#d2d9e6;font-size:12.5px}

  .actions{display:flex;gap:10px;flex-wrap:wrap}
  .btn{padding:.65rem 1rem;border-radius:12px;border:1px solid transparent;background:var(--accent);color:#fff;font-weight:800;cursor:pointer}
  .btn.secondary{background:#0b1220;border-color:var(--line);color:#e7ecf7}
  .btn.danger{background:#7f1d1d}
  .btn:disabled{opacity:.6;cursor:not-allowed}

  .mapBox{border:1px solid var(--line);border-radius:16px;background:#0b1220;padding:10px}
  .mini{display:flex;gap:6px;align-items:center}

  .timeline{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:6px}
  .step{display:flex;align-items:center;gap:6px;color:#a7b1c6}
  .dot{width:9px;height:9px;border-radius:999px;background:#334155}
  .step.active .dot{background:#60a5fa;box-shadow:0 0 0 5px rgba(96,165,250,.12)}
  .step.active{color:#dbeafe}

  .divider{height:1px;background:var(--line);opacity:.5;margin:10px 0}

  .toast{position:fixed;right:16px;bottom:16px;z-index:50;border-radius:12px;padding:.7rem 1rem;border:1px solid}
  .toast.ok{border-color:var(--ok-br);background:var(--ok-bg);color:var(--ok)}
  .toast.warn{border-color:var(--warn-br);background:var(--warn-bg);color:var(--warn)}
  .toast.bad{border-color:var(--bad-br);background:var(--bad-bg);color:var(--bad)}
  .toast.info{border-color:var(--info-br);background:var(--info-bg);color:var(--info)}

  .skeleton{height:220px;border-radius:18px;border:1px solid var(--line);
    background:linear-gradient(90deg,#101827,#0f172a,#101827);background-size:200% 100%;animation:shimmer 1.1s infinite}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
</style>

<div class="page">
  <div class="topbar">
    <button class="back" on:click={goBack} aria-label="Volver">{@html I.back}<span>Volver</span></button>
    <h1 class="title">Solicitud #{id}</h1>
    <span class={chip.cls} style="margin-left:auto">{chip.text}</span>
  </div>

  {#if loading}
    <div class="skeleton"></div>
  {:else if error}
    <div class="card" style="border-color:var(--bad-br);background:var(--bad-bg);color:var(--bad)">{error}</div>
  {:else if !r}
    <div class="card">No se encontró la solicitud.</div>
  {:else}
    <div class="grid">
      <!-- IZQUIERDA -->
      <div class="card">
        <div class="sectionHead">
          <div>
            <div style="font-weight:800;font-size:18px">
              {r.title ?? r.service?.name ?? r.service_name ?? 'Servicio'}
            </div>
            <div class="soft" style="margin-top:2px">{r.description || 'Sin descripción proporcionada.'}</div>
          </div>
          <div class="actions">
            <button class="btn" on:click={asignarTecnico} disabled={acting || ['cancelled','finished','done','finalizada'].includes((r.status||'').toLowerCase())}>
              {acting ? 'Procesando…' : 'Solicitar técnico'}
            </button>
            <button class="btn secondary" on:click={copyDireccion}>Copiar dirección</button>
            <button class="btn danger" on:click={anularSolicitud} disabled={acting || (r.status||'').toLowerCase()==='cancelled'}>Cancelar</button>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi">
            <div class="label">Antigüedad</div>
            <div class="val">{age(r.created_at ?? r.createdAt)}</div>
          </div>
          <div class="kpi">
            <div class="label">Presupuesto</div>
            <div class="val">{r.budget ? money(r.budget) : '—'}</div>
          </div>
          <div class="kpi">
            <div class="label">Agendado</div>
            <div class="val">{r.scheduled_for ? fmtDate(r.scheduled_for) : 'Sin programar'}</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="tagline">
          <span class="pill mini">{@html I.pin} {r.address ?? 'Dirección —'}{r.city ? `, ${r.city}` : ''}</span>
          <span class="pill mini">{@html I.calendar} Creado: {fmtDate(r.created_at ?? r.createdAt)}</span>
          <span class="pill mini">{@html I.calendar} Actualizado: {fmtDate(r.updated_at ?? r.updatedAt)}</span>
        </div>

        <div class="divider"></div>

        <div style="display:grid;grid-template-columns:1fr;gap:10px">
          <div>
            <div class="muted" style="font-weight:700;margin-bottom:6px">Datos del cliente</div>
            <div class="kv">
              <div class="muted">Nombre</div><div>{r.customer?.full_name ?? '—'}</div>
              <div class="muted">Teléfono</div><div class="mini">{@html I.phone} {r.customer?.phone ?? r.customer?.phone_number ?? '—'}</div>
              <div class="muted">Correo</div><div class="mini">{@html I.mail} {r.customer?.email ?? '—'}</div>
            </div>
          </div>

          <div>
            <div class="muted" style="font-weight:700;margin:10px 0 6px">Ubicación</div>
            <div class="kv">
              <div class="muted">Dirección</div><div>{r.address ?? '—'}</div>
              <div class="muted">Ciudad</div><div>{r.city ?? '—'}</div>
              <div class="muted">Coordenadas</div>
              <div>{Number.isFinite(latNum) && Number.isFinite(lngNum) ? `${latNum}, ${lngNum}` : '—'}</div>
            </div>

            <div class="mapBox" style="margin-top:8px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div class="muted">Ubicación exacta</div>
                <div class="actions">
                  <button class="btn secondary" on:click={() => mapRef?.locateMe?.()}>Usar mi ubicación</button>
                  <button class="btn secondary" on:click={openRutas}>Abrir rutas</button>
                </div>
              </div>
              <MapLeaflet bind:this={mapRef} bind:lat={latNum} bind:lng={lngNum} editable={false} />
            </div>
          </div>
        </div>
      </div>

      <!-- DERECHA -->
      <div class="card">
        <div class="sectionHead">
          <div style="font-weight:800">Resumen</div>
          <span class={chip.cls}>{chip.text}</span>
        </div>

        <div class="kv" style="margin-bottom:8px">
          <div class="muted">Estado</div><div>{r.status ?? '—'}</div>
          <div class="muted">Servicio</div><div>{r.service?.name ?? r.service_name ?? '—'}</div>
          <div class="muted">Presupuesto</div><div>{r.budget ? money(r.budget) : 'Por definir'}</div>
          <div class="muted">Agendado</div><div>{r.scheduled_for ? fmtDate(r.scheduled_for) : 'Sin programar'}</div>
        </div>

        <div class="muted" style="font-weight:700;margin-top:8px">Estado del proceso</div>
        <div class="timeline">
          <div class="step {['pending','creada','nuevo'].includes((r.status||'').toLowerCase()) ? 'active' : ''}">
            <span class="dot"></span><span>Creada</span>
          </div>
          <div class="step {['assigned','in_process','en_proceso'].includes((r.status||'').toLowerCase()) ? 'active' : ''}">
            <span class="dot"></span><span>Asignada</span>
          </div>
          <div class="step {['in_process','en_proceso'].includes((r.status||'').toLowerCase()) ? 'active' : ''}">
            <span class="dot"></span><span>En proceso</span>
          </div>
          <div class="step {['finished','finalizada','done','completado'].includes((r.status||'').toLowerCase()) ? 'active' : ''}">
            <span class="dot"></span><span>Finalizada</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="muted" style="font-weight:700;margin:6px 0">Acciones rápidas</div>
        <div class="actions">
          <button class="btn" on:click={asignarTecnico} disabled={acting || ['cancelled','finished','done','finalizada'].includes((r.status||'').toLowerCase())}>
            {acting ? 'Procesando…' : 'Solicitar técnico'}
          </button>
          <button class="btn secondary" on:click={copyDireccion}>Copiar dirección</button>
          <button class="btn danger" on:click={anularSolicitud} disabled={acting || (r.status||'').toLowerCase()==='cancelled'}>Cancelar</button>
        </div>
      </div>
    </div>
  {/if}

  {#if toast}
    <div class="toast {toast.kind==='ok'?'ok':toast.kind==='warn'?'warn':toast.kind==='bad'?'bad':'info'}">{toast.text}</div>
  {/if}
</div>
