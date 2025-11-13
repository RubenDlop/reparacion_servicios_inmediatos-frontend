<script>
  import MapLeaflet from '../pages/MapLeaflet.svelte';
  import { chipFor, timeAgo, fmtDate, money, getLat, getLng, I } from '../utils/formatters.js';
  export let r;
  export let onView;          // () => void
  export let onRequestTech;   // () => void
  export let creatingFor;     // number | null
</script>

<style>
  /* mismos estilos clave que AssignmentCard */
  .card{border:1px solid var(--line);background:linear-gradient(180deg,rgba(16,24,40,.85),rgba(15,23,42,.92));border-radius:16px;padding:16px;color:#e5e7eb;box-shadow:0 6px 24px rgba(2,6,23,.35)}
  .head{display:flex;gap:12px;align-items:center}
  .ico{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#111827;border:1px solid var(--line);color:#93c5fd}
  .service{font-weight:700}
  .meta{color:#b6c1d4;font-size:12px}
  .pills{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 6px}
  .pill{display:flex;align-items:center;gap:6px;padding:.45rem .7rem;border:1px solid var(--line);border-radius:999px;background:#0b1220;color:#cbd5e1;font-size:13px}
  .btn{padding:.6rem 1rem;border-radius:12px;border:0;background:var(--accent);color:#fff;font-weight:700;cursor:pointer}
  .btn.secondary{background:#0b1220;border:1px solid var(--line);color:#dbe3f2}
  .btn.ghost{background:transparent;border:1px dashed var(--line);color:#9fb7ff;margin-left:8px}
  .ctaRow{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
  .block{display:grid;gap:6px;margin:8px 0}
  .muted{color:#9aa3b2;font-size:13px}
  .timeline{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .dot{width:8px;height:8px;border-radius:999px;background:#334155}
  .step{display:flex;align-items:center;gap:6px;color:#a7b1c6}
  .step.active .dot{background:#60a5fa;box-shadow:0 0 0 4px rgba(96,165,250,.15)}
  :global(.leaflet-container){height:220px;border-radius:12px}
  .line{height:1px;background:var(--line);opacity:.6;margin:8px 0}
  .chip{padding:.25rem .6rem;border-radius:999px;font:700 12px/1 ui-sans-serif;border:1px solid #1f2937;background:#101826;color:#e5e7eb}
.chip--ok{background:var(--ok-bg);border-color:var(--ok-br);color:var(--ok)}
  .miniMap{width:100%;aspect-ratio:16/9;border-radius:12px;border:1px solid var(--line);background:#0b1220;display:grid;place-items:center;color:#93c5fd}
</style>

<div class="card">
  <div class="head">
    <div class="ico" aria-hidden="true">{@html I.service}</div>
    <div>
      <div class="service">{r?.title ?? r?.service?.name ?? r?.service_name ?? 'Servicio'}</div>
      <div class="meta">Solicitud #{r?.id ?? r?.request_id ?? '—'} • {timeAgo(r?.updated_at ?? r?.updatedAt)}</div>
    </div>
    <div style="margin-left:auto">
      <span class="{chipFor(r?.status).cls}">{chipFor(r?.status).text}</span>
    </div>
  </div>

  <div class="pills">
    <div class="pill"><span aria-hidden="true">{@html I.pin}</span>{r?.city ?? r?.location ?? r?.address ?? 'Ubicación no especificada'}</div>
    <div class="pill"><span aria-hidden="true">{@html I.clock}</span>{r?.scheduled_for ? fmtDate(r.scheduled_for) : 'Sin programar'}</div>
    <div class="pill"><span aria-hidden="true">{@html I.money}</span>{money(r?.budget)}</div>
  </div>

  <div class="ctaRow">
    <button class="btn" on:click={onView}>Ver detalle</button>
    <button class="btn ghost" disabled={creatingFor===(r?.id ?? r?.request_id)} on:click={onRequestTech}>
      {creatingFor===(r?.id ?? r?.request_id) ? 'Solicitando…' : 'Solicitar técnico'}
    </button>
  </div>

  <details>
    <summary>Detalles</summary>

    <div class="block">
      <h5>Resumen del servicio</h5>
      <div class="muted">{r?.description || 'Sin descripción proporcionada.'}</div>
    </div>

    <div class="block">
      <h5>Cliente</h5>
      <div class="muted">{r?.customer?.full_name ?? 'Cliente'} · {r?.customer?.phone ?? '—'}</div>
    </div>

    <div class="block">
      <h5>Ubicación</h5>
      {#if getLat(r) != null && getLng(r) != null}
        {#key (r?.id ?? r?.request_id)}
          <MapLeaflet lat={getLat(r)} lng={getLng(r)} zoom={15} editable={false} height="220px" />
        {/key}
      {:else}
        <div class="miniMap">Sin coordenadas — {r?.address ?? r?.city ?? '—'}</div>
      {/if}
      <div class="muted">{r?.address ?? r?.city ?? '—'}</div>
    </div>

    <div class="block">
      <h5>Estado del proceso</h5>
      <div class="timeline">
        <div class="step {['creada','pending','nuevo','created'].includes((r?.status||'').toLowerCase()) ? 'active' : ''}">
          <span class="dot"></span><span>Creada</span>
        </div>
        <div class="step {['assigned','en_proceso','in_process','aceptada'].includes((r?.status||'').toLowerCase()) ? 'active' : ''}">
          <span class="dot"></span><span>En proceso</span>
        </div>
        <div class="step {['finished','finalizada','done','completado'].includes((r?.status||'').toLowerCase()) ? 'active' : ''}">
          <span class="dot"></span><span>Finalizada</span>
        </div>
      </div>
    </div>

    <div class="line"></div>
    <div class="muted">Actualizado {timeAgo(r?.updated_at ?? r?.updatedAt)} · Creado {fmtDate(r?.created_at ?? r?.createdAt)}</div>
  </details>
</div>
