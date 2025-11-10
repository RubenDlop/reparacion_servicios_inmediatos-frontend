<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { createRequest, listServices, nearbyTechnicians } from '../api/requests.js';
  import MapLeaflet from '../pages/MapLeaflet.svelte';

  // ---------- Fallback local (frontend) ----------
  const FALLBACK_SERVICES = [
    { slug: 'electricidad',       name: 'Electricidad (cableado, tomas, cortos)' },
    { slug: 'plomeria',           name: 'Plomería (fugas, grifería, destapes)' },
    { slug: 'electrodomesticos',  name: 'Electrodomésticos (lavadora, nevera, microondas)' },
  ];
  let usingFallback = false;

  // ---------- estado ----------
  let loading = true, saving = false;
  let services = [], message = '', kind = 'info';

  let service_id = ''; // puede ser id (string numérica) o slug (string)
  let description = '', address = '', city = '', budget = '';
  let scheduled_for = ''; // input datetime-local

  // Coordenadas. Centro por defecto: Bogotá
  let latNum = 4.6486, lngNum = -74.0875;

  // Referencia al mapa para llamar locateMe()
  let mapRef;

  let suggestions = [];
  const canSubmit = () => service_id && address && !saving;

  // Utils
  const slugify = (s) =>
    (s || '')
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  onMount(async () => {
    // Carga desde API con tolerancia a forma {items} o array plano
    try {
      const res = await listServices({ page: 1, size: 100 });
      const ok = res?.response?.ok;
      const apiItems =
        res?.items ??
        (Array.isArray(res?.data) ? res.data : res?.data?.items) ??
        [];

      if (ok && apiItems.length) {
        services = apiItems;              // objetos con {id, name}
        usingFallback = false;
      } else {
        services = FALLBACK_SERVICES;     // objetos con {slug, name}
        usingFallback = true;
      }
    } catch {
      services = FALLBACK_SERVICES;
      usingFallback = true;
    } finally {
      loading = false;
    }

    // Prefijar geolocalización (opcional)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          latNum = Number(coords.latitude.toFixed(6));
          lngNum = Number(coords.longitude.toFixed(6));
          loadNearby();
        },
        () => {}
      );
    }
  });

  async function loadNearby() {
    suggestions = [];
    const { response, data } = await nearbyTechnicians({
      latitude: Number(latNum), longitude: Number(lngNum),
    });
    if (response?.ok) suggestions = data ?? [];
  }

  // Intenta obtener el ID real del servicio si el valor es un slug (fallback)
  async function resolveServiceId(value) {
    // si ya es id numérico válido
    const asNum = Number(value);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;

    // si es slug, reintenta contra API por nombre parecido
    const res = await listServices({ page: 1, size: 200 });
    const apiItems =
      res?.items ??
      (Array.isArray(res?.data) ? res.data : res?.data?.items) ??
      [];

    const picked = services.find(s => (s.id ?? s.slug) == value);
    const targetSlug = slugify(picked?.name ?? value);

    const match = apiItems.find(it => slugify(it.name) === targetSlug);
    return match?.id ? Number(match.id) : null;
  }

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit()) return;

    saving = true; message = ''; kind = 'info';

    // Resuelve id real (si estamos usando fallback)
    let resolvedId = await resolveServiceId(service_id);
    if (!resolvedId) {
      message = 'Ese servicio todavía no está creado en el servidor. ' +
                'Crea los servicios en el backend o habilita el seed.';
      kind = 'error'; saving = false; return;
    }

    const payload = {
      service_id: resolvedId,
      description: description || null,
      address,
      city: city || null,
      budget: budget ? Number(budget) : null,
      latitude: Number.isFinite(latNum) ? Number(latNum) : null,
      longitude: Number.isFinite(lngNum) ? Number(lngNum) : null,
      scheduled_for: scheduled_for ? new Date(scheduled_for).toISOString() : null,
    };

    const { response, data } = await createRequest(payload);
    if (!response.ok) {
      message = data?.detail ?? 'No se pudo crear la solicitud';
      kind = 'error'; saving = false; return;
    }

    message = '¡Solicitud enviada! Te avisaremos cuando sea asignada.';
    kind = 'success';
    setTimeout(() => push('/dashboard'), 700);
  }

  // 📍 Botón "Usar mi ubicación"
  function usarMiUbicacion() {
    mapRef?.locateMe(); // actualiza lat/lng y centra el mapa
  }
</script>

<div class="min-h-screen bg-slate-950 text-white/90">
  <div class="mx-auto max-w-3xl px-6 py-8">
    <h1 class="mb-2 text-2xl font-bold">Nueva solicitud</h1>
    {#if usingFallback}
      <p class="mb-4 text-xs text-amber-300">
        Usando catálogo de servicios temporal del frontend. Crea los servicios en el backend para que el envío funcione.
      </p>
    {/if}

    {#if loading}
      <div class="h-40 animate-pulse rounded-2xl bg-white/10" />
    {:else}
      <form on:submit={submit}
            class="space-y-5 rounded-2xl border border-white/10 bg-white/10 p-6">

        <div>
          <label class="mb-1 block text-sm text-white/80">Servicio</label>
          <select class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                  bind:value={service_id} required>
            <option value="" disabled>Selecciona un servicio…</option>
            {#each services as s}
              <!-- value puede ser s.id (API) o s.slug (fallback) -->
              <option value={(s.id ?? s.slug) + ''}>{s.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="mb-1 block text-sm text-white/80">Descripción</label>
          <textarea class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                    rows="3" bind:value={description}
                    placeholder="Describe el problema…"/>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm text-white/80">Dirección</label>
            <input class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                   bind:value={address} placeholder="Calle 123 #45-67" required />
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/80">Ciudad</label>
            <input class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                   bind:value={city} placeholder="Bogotá" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1 block text-sm text-white/80">Presupuesto (opcional)</label>
            <input type="number" min="0" step="1"
                   class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                   bind:value={budget} placeholder="80000" />
          </div>
          <div>
            <label class="mb-1 block text-sm text-white/80">Fecha y hora (opcional)</label>
            <input type="datetime-local"
                   class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                   bind:value={scheduled_for} />
          </div>
        </div>

        <!-- Coordenadas + Mapa -->
        <div class="space-y-3">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm text-white/80">Latitud</label>
              <input type="number" step="0.000001"
                     class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                     bind:value={latNum} placeholder="4.656100" />
            </div>
            <div>
              <label class="mb-1 block text-sm text-white/80">Longitud</label>
              <input type="number" step="0.000001"
                     class="w-full rounded-xl border border-white/20 bg-white/80 px-3 py-2 text-slate-900"
                     bind:value={lngNum} placeholder="-74.059000" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button"
                    class="rounded-xl bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
                    on:click={usarMiUbicacion}>
              📍 Usar mi ubicación
            </button>
            <button type="button"
                    class="rounded-xl bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
                    on:click={loadNearby}>
              Buscar técnicos cercanos
            </button>
            {#if suggestions.length}
              <span class="text-xs text-white/70">{suggestions.length} técnicos cerca</span>
            {/if}
          </div>

          <!-- Mapa Leaflet -->
          <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
            <h3 class="mb-2 text-sm text-white/70">Selecciona la ubicación en el mapa</h3>
            <MapLeaflet bind:this={mapRef}
                        bind:lat={latNum}
                        bind:lng={lngNum}
                        editable={true}
                        on:moved={loadNearby} />
          </div>
        </div>

        {#if message}
          <div class={`rounded-xl border px-3 py-2 text-sm flex items-center gap-2
            ${kind === 'error' ? 'border-rose-400/50 bg-rose-500/10 text-rose-100'
              : kind === 'success' ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
              : 'border-white/30 bg-white/10 text-white/90'}`}>
            {#if kind === 'success'}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                   fill="currentColor" class="h-5 w-5 shrink-0">
                <path fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.536a1 1 0 111.414-1.414l3.022 3.022 6.657-6.657a1 1 0 011.414 0z"
                      clip-rule="evenodd" />
              </svg>
            {/if}
            <span>{message}</span>
          </div>
        {/if}

        <button class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-white
                       hover:brightness-110 disabled:opacity-60"
                disabled={!canSubmit() || saving}>
          {#if saving}
            Creando…
          {:else}
            Enviar solicitud
          {/if}
        </button>
      </form>
    {/if}
  </div>
</div>
