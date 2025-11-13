<script>
  import { onMount } from 'svelte';
  import {
    getRoles,
    getModules,
    createRole,
    updateRole,
    softDeleteRole
  } from '../../api/acl.js';

  // -------- STATE --------
  let loading = true;
  let errorMsg = '';

  let search = '';
  let page = 1;
  let size = 8;

  let roles = [];
  let total = 0;
  let modules = [];

  // modal create/edit
  let modalOpen = false;
  let saving = false;
  let form = { id: null, nombre: '', descripcion: '' };

  // -------- DATA --------
  async function loadData() {
    loading = true; errorMsg = '';
    try {
      const [rRoles, rMods] = await Promise.all([
        getRoles({ q: search, page, size }),
        getModules({ page: 1, size: 200 }),
      ]);

      if (!rRoles.response?.ok) throw new Error(`Roles: ${rRoles.response?.status}`);
      if (!rMods.response?.ok)  throw new Error(`Módulos: ${rMods.response?.status}`);

      const items = Array.isArray(rRoles.data?.items) ? rRoles.data.items : [];
      roles = items.map(x => ({
        id: x.id,
        nombre: x.nombre ?? x.name ?? '',
        descripcion: x.descripcion ?? x.description ?? '',
      }));
      total = Number(rRoles.data?.total ?? roles.length);
      modules = Array.isArray(rMods.data?.items) ? rMods.data.items : [];
    } catch (e) {
      errorMsg = e?.message ?? 'Error cargando datos';
    } finally {
      loading = false;
    }
  }

  function resetAndReload(){ page = 1; loadData(); }
  $: maxPage = Math.max(1, Math.ceil(total / size));
  onMount(loadData);

  // -------- UI actions --------
  function openCreate() {
    form = { id: null, nombre: '', descripcion: '' };
    modalOpen = true;
  }
  function openEdit(r) {
    form = { id: r.id, nombre: r.nombre ?? '', descripcion: r.descripcion ?? '' };
    modalOpen = true;
  }

  async function saveRole() {
    if (!form.nombre?.trim()) return;
    saving = true;
    try {
      if (form.id == null) {
        const res = await createRole({ nombre: form.nombre.trim(), descripcion: form.descripcion?.trim() || null });
        if (!res.response?.ok) throw new Error(`Crear rol: ${res.response?.status}`);
      } else {
        const res = await updateRole(form.id, { nombre: form.nombre.trim(), descripcion: form.descripcion?.trim() || null });
        if (!res.response?.ok) throw new Error(`Actualizar rol: ${res.response?.status}`);
      }
      modalOpen = false;
      resetAndReload();
    } catch (e) {
      alert(e?.message || 'No se pudo guardar el rol');
    } finally {
      saving = false;
    }
  }

  async function onDeleteRole(id) {
    if (!confirm('¿Eliminar (soft-delete) este rol?')) return;
    const res = await softDeleteRole(id);
    if (!res.response?.ok) { alert('No se pudo eliminar'); return; }
    resetAndReload();
  }

  function onKey(e){ if (e.key === 'Escape' && modalOpen && !saving) modalOpen = false; }
</script>

<!-- WRAP -->
<div class="min-h-[60vh] bg-[#0b1220] text-white" on:keydown={onKey} tabindex="0">
  <div class="mx-auto max-w-6xl px-4 py-6">
    <!-- HEADER -->
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight">Roles & Permisos</h1>
      <p class="text-sm text-white/70">Administra los roles del sistema y sus permisos por módulo.</p>
    </div>

    <!-- TOOLBAR -->
    <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
  <input
  class="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 caret-indigo-400 selection:bg-indigo-500/30"
  placeholder="Buscar por nombre o descripción"
  bind:value={search}
  on:keydown={(e)=> e.key==='Enter' && resetAndReload()}
/>

      <div class="flex gap-2">
        <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          on:click={resetAndReload}>Buscar</button>
        <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          on:click={()=>{ search=''; resetAndReload(); }}>Limpiar</button>
        <button class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          on:click={openCreate}>Nuevo rol</button>
      </div>
    </div>

    <!-- ERROR -->
    {#if errorMsg}
      <div class="mt-4 rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-rose-200">
        {errorMsg}
      </div>
    {/if}

    <!-- LISTA / SKELETON / VACÍO -->
    <div class="mt-5">
      {#if loading}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each Array.from({length:6}) as _}
            <div class="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5"></div>
          {/each}
        </div>
      {:else if roles.length === 0}
        <div class="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
          <div class="text-lg font-semibold">No hay roles</div>
          <p class="mt-1 text-white/60">Crea tu primer rol para comenzar.</p>
          <button class="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:brightness-110"
            on:click={openCreate}>Crear rol</button>
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each roles as r}
            <div class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.06] transition hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/10">
              <div class="p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate text-base font-bold">{r.nombre}</div>
                    <div class="mt-1 line-clamp-2 text-sm text-white/70">{r.descripcion || '—'}</div>
                  </div>
                  <div class="flex shrink-0 gap-2">
                    <button class="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                      on:click={() => openEdit(r)} aria-label="Editar">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" d="M16.862 3.487a2.1 2.1 0 0 1 2.97 2.97L8.94 17.35l-4.12 1.15 1.15-4.12 10.892-10.89Z"/></svg>
                      Editar
                    </button>
                    <button class="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                      on:click={() => onDeleteRole(r.id)} aria-label="Eliminar">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-width="2" d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h10Z"/></svg>
                      Eliminar
                    </button>
                  </div>
                </div>

                {#if modules?.length}
                  <div class="mt-3 flex flex-wrap gap-2">
                    {#each modules.slice(0,3) as m}
                      <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
                        {m.nombre ?? m.name}
                      </span>
                    {/each}
                    {#if modules.length > 3}
                      <span class="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60">+{modules.length - 3}</span>
                    {/if}
                  </div>
                {/if}
              </div>
              <div class="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500/60 via-fuchsia-500/60 to-cyan-400/60 opacity-0 transition group-hover:opacity-100"></div>
            </div>
          {/each}
        </div>

        <!-- PAGINACIÓN -->
        <div class="mt-6 flex items-center justify-between">
          <span class="text-sm text-white/60">
            {(total === 0) ? '0' : ((page-1)*size+1)} – {Math.min(page*size, total)} de {total}
          </span>
          <div class="flex gap-2">
            <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              disabled={page<=1} on:click={()=>{ page--; loadData(); }}>Anterior</button>
            <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
              disabled={page>=maxPage} on:click={()=>{ page++; loadData(); }}>Siguiente</button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- MODAL -->
{#if modalOpen}
  <div class="fixed inset-0 z-[999] grid place-items-center bg-black/60 p-4">
    <div class="w-[560px] max-w-[95vw] rounded-2xl border border-white/20 bg-[#182235] shadow-2xl">
      <div class="px-5 pt-4 text-lg font-bold text-white">
        {form.id == null ? 'Nuevo rol' : 'Editar rol'}
      </div>

      <div class="px-5 pb-1 pt-3 grid gap-4">
        <label class="text-sm text-white/80">
          Nombre del rol
          <input
            bind:this={nameRef}
            autocomplete="off"
            class="mt-1 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 caret-indigo-400 selection:bg-indigo-500/30"
            placeholder="Ej: Administrador"
            bind:value={form.nombre}
          />
        </label>

        <label class="text-sm text-white/80">
          Descripción (opcional)
          <textarea
            rows="4"
            class="mt-1 min-h-[110px] w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 caret-indigo-400 selection:bg-indigo-500/30"
            placeholder="Ej: Acceso total al panel de administración"
            bind:value={form.descripcion}
          />
        </label>
      </div>

      <div class="flex items-center justify-end gap-2 px-5 py-4">
        <button
          class="rounded-xl px-4 py-2 text-sm text-white/85 hover:bg-white/10"
          on:click={() => (modalOpen = false)}
          disabled={saving}
        >Cancelar</button>

        <button
          class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
          on:click={saveRole}
          disabled={saving || !form.nombre?.trim()}
        >{saving ? 'Guardando…' : (form.id == null ? 'Crear' : 'Guardar')}</button>
      </div>
    </div>
  </div>
{/if}
  
