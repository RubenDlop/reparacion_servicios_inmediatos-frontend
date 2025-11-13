<script>
  import { onMount, tick } from 'svelte';
  import { getRoles } from '../../api/acl.js';
  import {
    getUsers, createUser, updateUser, softDeleteUser,
    promoteUser, demoteUser
  } from '../../api/users.js';

  // ------- STATE -------
  let loading = true, errorMsg = '';
  let search = '', page = 1, size = 10;
  let users = [], total = 0;

  let roles = [];
  let roleFilter = ''; // filtro en toolbar

  // modal create/edit
  let modalOpen = false, saving = false;
  let emailRef;

  // ≥4 atributos + rol y estado (usando tus campos)
  let form = {
    id: null,
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    role_id: '',    // '' para el <select>, se castea a number/null al guardar
    is_active: true
  };

  // ------- DATA -------
  async function loadData() {
    loading = true; errorMsg = '';
    try {
      const [{ response: rU, data: dU }, { response: rR, data: dR }] =
        await Promise.all([
          getUsers({ q: search, page, size, role_id: roleFilter || null }),
          getRoles({ size: 200 })
        ]);

      if (!rU?.ok) throw new Error(`Usuarios: ${rU?.status}`);
      if (!rR?.ok) throw new Error(`Roles: ${rR?.status}`);

      users = Array.isArray(dU?.items) ? dU.items : [];
      total = Number(dU?.total ?? users.length);

      roles = (Array.isArray(dR?.items) ? dR.items : []).map(x => ({
        id: x.id, nombre: x.nombre ?? x.name ?? ''
      }));
    } catch (e) {
      errorMsg = e?.message ?? 'Error cargando datos';
    } finally {
      loading = false;
    }
  }
  function resetAndReload(){ page = 1; loadData(); }
  $: maxPage = Math.max(1, Math.ceil(total / size));
  onMount(loadData);

  // ------- UI -------
  function openCreate() {
    form = {
      id: null, full_name: '', email: '', phone_number: '',
      password: '', role_id: '', is_active: true
    };
    modalOpen = true; tick().then(()=> emailRef?.focus());
  }
  function openEdit(u) {
    form = {
      id: u.id,
      full_name: u.full_name ?? '',
      email: u.email ?? '',
      phone_number: u.phone_number ?? '',
      password: '',
      role_id: (u.role_id ?? u.rol_id ?? null) == null ? '' : String(u.role_id ?? u.rol_id),
      is_active: u.is_active ?? true
    };
    modalOpen = true; tick().then(()=> emailRef?.focus());
  }

  function castRoleIdForApi(value) {
    if (value === '' || value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async function saveUser() {
    if (!form.full_name?.trim() || !form.email?.trim()) return;
    saving = true;
    try {
      const base = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number?.trim() || null,
        role_id: castRoleIdForApi(form.role_id),
        is_active: !!form.is_active
      };
      const payload = form.password?.trim()
        ? { ...base, password: form.password.trim() }
        : base;

      const res = form.id == null
        ? await createUser(payload)
        : await updateUser(form.id, payload);

      if (!res.response?.ok)
        throw new Error((form.id==null?'Crear':'Actualizar')+` usuario: ${res.response?.status}`);

      modalOpen = false;
      resetAndReload();
    } catch (e) {
      alert(e?.message || 'No se pudo guardar el usuario');
    } finally { saving = false; }
  }

  async function onDelete(u) {
    if (!confirm(`¿Eliminar (soft-delete) a ${u.full_name || u.email}?`)) return;
    const { response } = await softDeleteUser(u.id);
    if (!response?.ok) return alert('No se pudo eliminar');
    resetAndReload();
  }
  async function onPromote(u){ const {response}=await promoteUser(u.id); if(!response?.ok) return alert('No se pudo promover'); resetAndReload(); }
  async function onDemote(u){ const {response}=await demoteUser(u.id); if(!response?.ok) return alert('No se pudo quitar admin'); resetAndReload(); }

  function chipClass(ok){ return ok
    ? 'bg-emerald-400/15 text-emerald-200 border-emerald-400/30'
    : 'bg-rose-400/15 text-rose-200 border-rose-400/30';
  }
</script>

<!-- WRAP -->
<div class="min-h-[60vh] bg-[#0b1220] text-white">
  <div class="mx-auto max-w-6xl px-4 py-6">
    <!-- Header -->
    <div class="mb-3">
      <h1 class="text-2xl font-extrabold tracking-tight">Administración · Usuarios</h1>
      <p class="text-sm text-white/70">Tabla con búsqueda, filtros, acciones y paginación.</p>
    </div>

    <!-- Toolbar -->
    <div class="mb-4 grid gap-3 md:grid-cols-[1fr,240px,auto] md:items-center">
      <input
        class="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Buscar por nombre o email"
        bind:value={search}
        on:keydown={(e)=> e.key==='Enter' && resetAndReload()}
      />
      <select
        class="select-dark rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        bind:value={roleFilter}
      >
        <option value="">— Filtrar por rol —</option>
        {#each roles as r}<option value={r.id}>{r.nombre}</option>{/each}
      </select>
      <div class="flex gap-2">
        <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10" on:click={resetAndReload}>Buscar</button>
        <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10" on:click={()=>{ search=''; roleFilter=''; resetAndReload(); }}>Limpiar</button>
        <button class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:brightness-110" on:click={openCreate}>Nuevo usuario</button>
      </div>
    </div>

    <!-- Error -->
    {#if errorMsg}
      <div class="mb-4 rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-rose-200">{errorMsg}</div>
    {/if}

    <!-- TABLE -->
    <div class="overflow-x-auto rounded-2xl border border-white/10 bg-white/[.06]">
      <table class="w-full min-w-[900px] text-sm">
        <thead class="sticky top-0 z-10 bg-[#111a2e] text-white/80">
          <tr class="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold">
            <th class="w-[28%]">Nombre</th>
            <th class="w-[24%]">Email</th>
            <th class="w-[14%]">Teléfono</th>
            <th class="w-[14%]">Rol</th>
            <th class="w-[10%]">Estado</th>
            <th class="w-[10%] text-right">Acciones</th>
          </tr>
        </thead>

        <!-- Loading skeleton -->
        {#if loading}
          <tbody>
            {#each Array.from({length:6}) as _}
              <tr class="border-t border-white/10">
                <td colspan="6" class="px-4 py-4">
                  <div class="h-6 animate-pulse rounded bg-white/10"></div>
                </td>
              </tr>
            {/each}
          </tbody>

        {:else if users.length === 0}
          <tbody>
            <tr class="border-t border-white/10">
              <td colspan="6" class="px-4 py-8 text-center text-white/70">No hay usuarios para mostrar.</td>
            </tr>
          </tbody>

        {:else}
          <tbody class="[&>tr:nth-child(even)]:bg-white/[.03]">
            {#each users as u}
              <tr class="border-t border-white/10 hover:bg-white/[.06] transition-colors">
                <td class="px-4 py-3">
                  <div class="font-semibold">{u.full_name || '—'}</div>
                  {#if u.is_superuser}
                    <span class="mt-1 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] text-amber-200">Admin</span>
                  {/if}
                </td>
                <td class="px-4 py-3 text-white/90">{u.email}</td>
                <td class="px-4 py-3 text-white/80">{u.phone_number || '—'}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[12px]">
                    {u.rol?.nombre ?? u.role?.nombre ?? u.role_name ?? '—'}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class={`inline-flex rounded-full border px-2.5 py-0.5 text-[12px] ${chipClass(u.is_active)}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-2">
                    <button class="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                      on:click={() => openEdit(u)}>Editar</button>
                    <button class="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                      on:click={() => onDelete(u)}>Eliminar</button>
                    {#if u.is_superuser}
                      <button class="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                        on:click={() => onDemote(u)}>Quitar admin</button>
                    {:else}
                      <button class="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
                        on:click={() => onPromote(u)}>Hacer admin</button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        {/if}
      </table>
    </div>

    <!-- Pagination -->
    {#if total > 0}
      <div class="mt-4 flex items-center justify-between">
        <span class="text-sm text-white/60">
          {(total === 0) ? '0' : ((page-1)*size+1)} – {Math.min(page*size, total)} de {total}
        </span>
        <div class="flex gap-2">
          <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10" disabled={page<=1} on:click={()=>{ page--; loadData(); }}>Anterior</button>
          <button class="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10" disabled={page>=maxPage} on:click={()=>{ page++; loadData(); }}>Siguiente</button>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- MODAL -->
{#if modalOpen}
  <div class="fixed inset-0 z-[999] grid place-items-center bg-black/60 p-4">
    <div class="w-[720px] max-w-[95vw] rounded-2xl border border-white/20 bg-[#182235] shadow-2xl">
      <div class="px-5 pt-4 text-lg font-bold">
        {form.id == null ? 'Nuevo usuario' : 'Editar usuario'}
      </div>

      <div class="grid gap-4 px-5 pb-1 pt-3 md:grid-cols-2">
        <label class="text-sm text-white/80">
          Nombre completo
          <input class="mt-1 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Ej: Juan Pérez" bind:value={form.full_name}/>
        </label>
        <label class="text-sm text-white/80">
          Email
          <input bind:this={emailRef} type="email" autocomplete="off"
            class="mt-1 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="usuario@correo.com" bind:value={form.email}/>
        </label>
        <label class="text-sm text-white/80">
          Teléfono (opcional)
          <input class="mt-1 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="+57 300 000 0000" bind:value={form.phone_number}/>
        </label>
        <label class="text-sm text-white/80">
          Rol
          <select
            class="select-dark mt-1 w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            bind:value={form.role_id}
          >
            <option value="">Sin rol</option>
            {#each roles as r}<option value={r.id}>{r.nombre}</option>{/each}
          </select>
        </label>
        <label class="text-sm text-white/80 md:col-span-2">
          Contraseña {form.id==null ? '' : '(opcional)'}
          <input type="password"
            class="mt-1 w-full rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-base text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder={form.id==null ? 'Mínimo según tu política' : 'Deja vacío para no cambiar'} bind:value={form.password}/>
        </label>
        <label class="text-sm text-white/80 flex items-center gap-2 md:col-span-2">
          <input type="checkbox" class="h-4 w-4 accent-indigo-500" bind:checked={form.is_active}/>
          Usuario activo
        </label>
      </div>

      <div class="flex items-center justify-end gap-2 px-5 py-4">
        <button class="rounded-xl px-4 py-2 text-sm text-white/85 hover:bg-white/10"
          on:click={()=> (modalOpen=false)} disabled={saving}>Cancelar</button>
        <button class="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:brightness-110 disabled:opacity-60"
          on:click={saveUser} disabled={saving || !form.full_name?.trim() || !form.email?.trim()}>
          {saving ? 'Guardando…' : (form.id == null ? 'Crear' : 'Guardar')}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* === FIX: controles nativos en tema oscuro y opciones visibles === */
  :global(html){ color-scheme: dark; }

  /* Selects oscuros (aplica a los que tengan la clase select-dark) */
  :global(select.select-dark){
    color:#e5e7eb;
    background-color: rgba(255,255,255,.08);
  }
  :global(select.select-dark option){
    background:#0f172a;     /* fondo del popup */
    color:#e5e7eb;          /* texto legible */
  }
  :global(select.select-dark option:checked),
  :global(select.select-dark option:hover){
    background:#4f46e5;     /* highlight */
    color:#fff;
  }
</style>
