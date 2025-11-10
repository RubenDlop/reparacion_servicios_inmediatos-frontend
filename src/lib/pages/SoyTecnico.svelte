<script>
  import { onMount } from 'svelte';
  import { listServices } from '../api/requests.js';
  import {
    getMyTechnicianProfile,
    applyTechnician,
    updateMyTechnicianProfile
  } from '../api/technicians.js';

  // =====================
  // Helpers HTTP locales
  // =====================
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

  function authHeaders(json = true) {
    const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
    const token = raw ? JSON.parse(raw).access_token : null;
    const h = json ? { 'Content-Type': 'application/json' } : {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }

  async function toJsonSafe(response) {
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { return await response.json(); } catch { return null; }
    }
    return null;
  }

  // Evita mostrar [object Object] en la UI
  function extractDetail(data) {
    if (!data) return null;
    const d = data.detail;
    if (Array.isArray(d)) return d.map(e => e.msg || JSON.stringify(e)).join(' · ');
    if (typeof d === 'object' && d !== null) return d.message || JSON.stringify(d);
    if (typeof d === 'string') return d;
    return null;
  }

  // =====================
  // Estado pantalla
  // =====================
  let loading = true;
  let saving = false;
  let services = [];
  let profile = null;
  let errorMsg = '';
  let okMsg = '';

  // formulario perfil
  let bio = '';
  let service_ids = [];
  let service_radius_km = 10;
  let latitude = '';
  let longitude = '';

  // documentos
  const kinds = [
    { value: 'identification',   label: 'Identificación' },
    { value: 'certification',    label: 'Certificación' },
    { value: 'license',          label: 'Licencia' },
    { value: 'insurance',        label: 'Seguro' },
    { value: 'background_check', label: 'Antecedentes' },
    { value: 'other',            label: 'Otro' }
  ];
  const kindLabel = (v) => kinds.find(k => k.value === v)?.label ?? v;

  let docs = [];
  let docsLoading = true;

  // formulario documento
  let up_kind = 'certification';
  let up_file = null;
  let up_issuer = '';
  let up_issued_at = '';
  let up_expires_at = '';

  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  function toggleService(id) {
    service_ids = service_ids.includes(id)
      ? service_ids.filter((x) => x !== id)
      : [...service_ids, id];
  }

  async function geo() {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        latitude = coords.latitude.toFixed(6);
        longitude = coords.longitude.toFixed(6);
      },
      () => {}
    );
  }

  // =====================
  // Carga inicial
  // =====================
  onMount(async () => {
    loading = true;
    errorMsg = '';
    okMsg = '';

    const [{ response: sRes, data: sData }, my] = await Promise.all([
      listServices({ size: 100 }),
      getMyTechnicianProfile()
    ]);

    if (sRes?.ok) services = sData?.items ?? [];

    if (my.response?.ok) {
      profile = my.data;
      bio = profile?.bio ?? '';
      service_radius_km = profile?.service_radius_km ?? 10;
      latitude = profile?.latitude ?? '';
      longitude = profile?.longitude ?? '';
      service_ids = (profile?.services ?? []).map((s) => s.id);
    } else if (my.response?.status === 404) {
      profile = null; // aún no tiene perfil
    } else if (!my.response?.ok) {
      errorMsg = extractDetail(my.data) ?? `No se pudo cargar tu perfil (HTTP ${my.response?.status ?? ''})`;
    }

    loading = false;
    if (!profile) geo();

    // cargar documentos si ya hay perfil
    if (profile) await loadDocs();
  });

  // =====================
  // Acciones perfil
  // =====================
  async function submit() {
    saving = true;
    errorMsg = '';
    okMsg = '';
    const payload = {
      bio: bio || null,
      service_radius_km: Number(service_radius_km) || null,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      service_ids
    };
    const call = profile ? updateMyTechnicianProfile : applyTechnician;
    const { response, data } = await call(payload);

    if (!response.ok) {
      errorMsg = extractDetail(data) ?? 'No se pudo guardar';
      saving = false;
      return;
    }

    okMsg = profile ? 'Perfil actualizado' : 'Solicitud enviada (estado: pendiente).';
    profile = data;
    saving = false;

    // cargar docs cuando se crea por primera vez
    if (profile && docs.length === 0) await loadDocs();
  }

  // =====================
  // API documentos
  // =====================
  async function loadDocs() {
    if (!profile) return;
    docsLoading = true;
    try {
      const res = await fetch(`${API_BASE_URL}/technicians/me/documents`, {
        headers: authHeaders()
      });
      const data = await toJsonSafe(res);
      if (!res.ok) {
        errorMsg = extractDetail(data) ?? 'No se pudieron cargar los documentos.';
        docs = [];
      } else {
        docs = data ?? [];
      }
    } catch {
      errorMsg = 'Error de red cargando documentos.';
      docs = [];
    } finally {
      docsLoading = false;
    }
  }

  async function uploadDoc() {
    if (!up_file || !profile) return;

    const fd = new FormData();
    fd.append('file', up_file);
    fd.append('kind', up_kind);
    if (up_issuer) fd.append('issuer', up_issuer);
    if (up_issued_at) fd.append('issued_at', up_issued_at);
    if (up_expires_at) fd.append('expires_at', up_expires_at);

    try {
      const res = await fetch(`${API_BASE_URL}/technicians/me/documents`, {
        method: 'POST',
        headers: authHeaders(false), // Authorization sin Content-Type
        body: fd
      });
      const data = await toJsonSafe(res);
      if (!res.ok) {
        errorMsg = extractDetail(data) ?? 'No se pudo subir el documento. Verifica formato y tamaño.';
        return;
      }
      okMsg = 'Documento subido.';

      // limpiar form
      up_file = null;
      up_issuer = '';
      up_issued_at = '';
      up_expires_at = '';

      await loadDocs();
    } catch {
      errorMsg = 'Error de red subiendo documento';
    }
  }

  async function removeDoc(docId) {
    if (!docId) return;
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/technicians/me/documents/${docId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (!res.ok) {
        const data = await toJsonSafe(res);
        errorMsg = extractDetail(data) ?? 'No se pudo eliminar el documento.';
        return;
      }
      docs = docs.filter((d) => d.id !== docId);
    } catch {
      errorMsg = 'Error de red eliminando documento.';
    }
  }
</script>

<div class="min-h-screen bg-slate-950 text-white/90">
  <div class="mx-auto max-w-3xl px-6 py-8">
    <h1 class="mb-6 text-2xl font-bold">
      {profile ? 'Mi perfil de técnico' : 'Quiero trabajar como técnico'}
    </h1>

    {#if loading}
      <div class="h-40 animate-pulse rounded-2xl bg-white/10" />
    {:else}
      <form
        class="space-y-5 rounded-2xl border border-white/10 bg-white/10 p-6"
        on:submit|preventDefault={submit}
      >
        {#if profile}
          <div class="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/80">
            Estado: <b>{profile.status}</b> · Verificado:
            <b>{profile.verified ? 'sí' : 'no'}</b>
          </div>
        {/if}

        <div>
          <label class="mb-1 block text-sm text-white/80">Sobre ti</label>
          <textarea
            rows="3"
            class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
            bind:value={bio}
            placeholder="Experiencia, herramientas, zonas..."
          ></textarea>
        </div>

        <div>
          <label class="mb-2 block text-sm text-white/80">Servicios que ofreces</label>
          <div class="grid gap-2 sm:grid-cols-2">
            {#each services as s}
              <label class="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={service_ids.includes(s.id)}
                  on:change={() => toggleService(s.id)}
                />
                <span>{s.name}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm text-white/80">Radio de servicio (km)</label>
            <input
              type="number"
              min="1"
              step="0.5"
              class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
              bind:value={service_radius_km}
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/80">Latitud</label>
            <input
              class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
              bind:value={latitude}
              inputmode="decimal"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/80">Longitud</label>
            <input
              class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
              bind:value={longitude}
              inputmode="decimal"
            />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-xl bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
            on:click={geo}
          >
            Usar mi ubicación
          </button>
        </div>

        {#if errorMsg}
          <div class="rounded-xl border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {errorMsg}
          </div>
        {/if}
        {#if okMsg}
          <div class="rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {okMsg}
          </div>
        {/if}

        <button
          class="rounded-xl bg-indigo-600 px-4 py-2 hover:brightness-110 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Guardando…' : (profile ? 'Guardar cambios' : 'Enviar solicitud')}
        </button>
      </form>

      <!-- ========================= -->
      <!-- Sección: documentos       -->
      <!-- ========================= -->
      {#if profile}
        <div class="mt-10 rounded-2xl border border-white/10 bg-white/10 p-6">
          <h2 class="mb-4 text-xl font-semibold">Documentos del técnico</h2>

          <!-- Subir -->
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm text-white/80">Tipo</label>
              <select
                class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                bind:value={up_kind}
              >
                {#each kinds as k}
                  <option value={k.value}>{k.label}</option>
                {/each}
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm text-white/80">Archivo (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                on:change={(e) => (up_file = e.currentTarget.files?.[0] ?? null)}
              />
            </div>

            <div>
              <label class="mb-1 block text-sm text-white/80">Emisor</label>
              <input
                class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                bind:value={up_issuer}
                placeholder="Entidad que lo emite"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1 block text-sm text-white/80">Fecha emisión</label>
                <input
                  type="date"
                  class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                  bind:value={up_issued_at}
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-white/80">Fecha vencimiento</label>
                <input
                  type="date"
                  class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                  bind:value={up_expires_at}
                />
              </div>
            </div>
          </div>

          <div class="mt-3">
            <button
              class="rounded-xl bg-indigo-600 px-4 py-2 hover:brightness-110 disabled:opacity-60"
              on:click={uploadDoc}
              disabled={!up_file}
            >
              Subir documento
            </button>
          </div>

          <!-- Listado -->
          <div class="mt-6">
            <h3 class="mb-2 text-sm uppercase tracking-wide text-white/60">
              Tus documentos
            </h3>

            {#if docsLoading}
              <div class="h-24 animate-pulse rounded-xl bg-white/10" />
            {:else if docs.length === 0}
              <div class="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/70">
                Aún no has subido documentos.
              </div>
            {:else}
              <div class="space-y-2">
                {#each docs as d}
                  <div class="flex items-start justify-between rounded-xl bg-white/10 p-3">
                    <div class="text-sm leading-6">
                      <div class="font-medium">{kindLabel(d.kind)}</div>
                      <div class="opacity-80">
                        <span class="mr-2">Archivo: <b>{d.filename}</b></span>
                        <span class="mr-2">Emisor: {d.issuer || '—'}</span>
                        <span class="mr-2">Emisión: {fmt(d.issued_at)}</span>
                        <span class="mr-2">Vence: {fmt(d.expires_at)}</span>
                      </div>
                      <div class="opacity-80">
                        Verificado: <b>{d.verified ? 'sí' : 'no'}</b>
                        {#if d.review_comment}
                          · Observación: <i>{d.review_comment}</i>
                        {/if}
                      </div>
                      {#if d.url}
                        <div class="mt-1">
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener"
                            class="text-indigo-300 underline"
                          >Ver / descargar</a>
                        </div>
                      {/if}
                    </div>

                    <div class="ml-3">
                      <button
                        class="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                        on:click={() => removeDoc(d.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}  <!-- 👈 cierra el if/else-if/else de docsLoading -->
          </div>
        </div>
      {/if}
    {/if}  <!-- 👈 cierra el {#if loading} exterior -->
  </div>
</div>
    