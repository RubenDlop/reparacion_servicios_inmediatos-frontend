<!-- src/pages/admin/AdminRoles.svelte -->
<script>
  import { onMount } from "svelte";
  import { link } from "svelte-spa-router";

  /** =======================
   *  API mínima (ajusta paths)
   *  =======================*/
  const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const authHeaders = () => {
    const t = localStorage.getItem("access_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };
  const j = (r) => r.json();

  // Rutas sugeridas del backend (cámbialas si ya tienes otras)
  const ENDPOINTS = {
    roles: `${API}/acl/roles`,
    modules: `${API}/acl/modules`,
    rolePerms: (roleId) => `${API}/acl/roles/${roleId}/permissions`, // GET/PUT (bulk)
  };

  // Roles
  const fetchRoles = async () =>
    fetch(`${ENDPOINTS.roles}?include_inactive=true`, { headers: { ...authHeaders() } }).then(j);

  const createRole = async (payload) =>
    fetch(ENDPOINTS.roles, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(j);

  const updateRole = async (id, payload) =>
    fetch(`${ENDPOINTS.roles}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(j);

  const softDeleteRole = async (id) =>
    fetch(`${ENDPOINTS.roles}/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });

  // Módulos
  const fetchModules = async () =>
    fetch(`${ENDPOINTS.modules}?include_inactive=false`, { headers: { ...authHeaders() } }).then(j);

  // Permisos por rol (matriz)
  const fetchRolePerms = async (roleId) =>
    fetch(ENDPOINTS.rolePerms(roleId), { headers: { ...authHeaders() } }).then(j);

  const saveRolePerms = async (roleId, matrix) =>
    fetch(ENDPOINTS.rolePerms(roleId), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ permissions: matrix }), // [{modulo_id, can_create, can_read, can_update, can_delete}]
    }).then(j);

  /** =======================
   *  Estado UI
   *  =======================*/
  let loading = true;
  let errorMsg = "";
  let roles = []; // {id, nombre, descripcion, estado, created_at, ...}
  let modules = []; // {id, nombre, ruta, icono, estado}
  let showPerms = false;
  let showEdit = false;
  let editing = null; // rol que se está editando
  let form = { nombre: "", descripcion: "" };

  // Permisos en modal
  let selRole = null;
  let matrix = []; // [{modulo_id, nombre, can_create, can_read, can_update, can_delete}]

  const resetForm = () => (form = { nombre: "", descripcion: "" });

  const loadAll = async () => {
    loading = true; errorMsg = "";
    try {
      const [rRoles, rModules] = await Promise.all([fetchRoles(), fetchModules()]);
      roles = rRoles?.items ?? rRoles ?? [];
      modules = rModules?.items ?? rModules ?? [];
    } catch (e) {
      errorMsg = "No fue posible cargar Roles/Módulos.";
      console.error(e);
    } finally {
      loading = false;
    }
  };

  onMount(loadAll);

  /** =======================
   *  Acciones Roles
   *  =======================*/
  const submitCreate = async () => {
    if (!form.nombre.trim()) return;
    const payload = { nombre: form.nombre.trim(), descripcion: form.descripcion?.trim() || null };
    const created = await createRole(payload);
    if (created?.id) {
      roles = [created, ...roles];
      resetForm();
    }
  };

  const startEdit = (r) => {
    editing = { ...r };
    showEdit = true;
  };

  const submitEdit = async () => {
    const { id, nombre, descripcion } = editing;
    const updated = await updateRole(id, { nombre, descripcion });
    if (updated?.id) {
      roles = roles.map((r) => (r.id === id ? updated : r));
      showEdit = false;
      editing = null;
    }
  };

  const toggleEstado = async (r) => {
    // Soft delete/restore
    const newEstado = r.estado === 1 ? 0 : 1;
    const updated = await updateRole(r.id, { estado: newEstado });
    if (updated?.id) {
      roles = roles.map((x) => (x.id === r.id ? updated : x));
    }
  };

  /** =======================
   *  Permisos (modal)
   *  =======================*/
  const openPerms = async (r) => {
    selRole = r;
    showPerms = true;
    matrix = [];
    try {
      // backend debería devolver array de objetos con permisos por módulo
      // Si viene vacío, sembramos una base con todos los módulos en false.
      const current = await fetchRolePerms(r.id);
      const byId = new Map((current ?? []).map((p) => [p.modulo_id, p]));
      matrix = modules.map((m) => ({
        modulo_id: m.id,
        nombre: m.nombre,
        can_create: Boolean(byId.get(m.id)?.can_create),
        can_read: byId.has(m.id) ? Boolean(byId.get(m.id)?.can_read) : true, // por defecto true (lectura)
        can_update: Boolean(byId.get(m.id)?.can_update),
        can_delete: Boolean(byId.get(m.id)?.can_delete),
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggle = (row, key) => (row[key] = !row[key]);

  const savePerms = async () => {
    const payload = matrix.map(({ modulo_id, can_create, can_read, can_update, can_delete }) => ({
      modulo_id, can_create, can_read, can_update, can_delete
    }));
    await saveRolePerms(selRole.id, payload);
    showPerms = false;
  };

  const fmtEstado = (e) => (e === 1 ? "Activo" : "Inactivo");
</script>

<div class="min-h-screen bg-slate-950 text-white/90">
  <main class="mx-auto max-w-7xl px-6 py-8">
    <nav class="mb-6 text-sm text-white/60">
      <a href="/admin" use:link class="underline hover:opacity-80">Administración</a>
      <span class="mx-2">/</span>
      <span>Roles & Permisos</span>
    </nav>

    <!-- Encabezado -->
    <section class="container">
      <h1>Administración · Roles & Permisos</h1>
      <p>CRUD de roles y matriz de permisos por módulo (C/R/U/D con soft-delete).</p>
    </section>

    {#if loading}
      <div class="grid gap-4 md:grid-cols-3">
        {#each Array.from({ length: 6 }) as _}
          <div class="h-24 animate-pulse rounded-2xl bg-white/10"></div>
        {/each}
      </div>
    {:else}
      {#if errorMsg}
        <div class="rounded-2xl border border-rose-400/50 bg-rose-500/10 p-4 text-rose-100">{errorMsg}</div>
      {:else}
        <!-- Crear rol -->
        <section class="mb-6 rounded-2xl border border-white/10 bg-white/10 p-5">
          <h2 class="text-lg font-semibold">Crear nuevo rol</h2>
          <div class="mt-3 grid gap-3 md:grid-cols-3">
            <input
              class="rounded-xl border border-white/10 bg-slate-900/60 p-3 outline-none focus:ring"
              placeholder="Nombre del rol (único)"
              bind:value={form.nombre}
            />
            <input
              class="rounded-xl border border-white/10 bg-slate-900/60 p-3 outline-none focus:ring md:col-span-2"
              placeholder="Descripción (opcional)"
              bind:value={form.descripcion}
            />
          </div>
          <div class="mt-3">
            <button on:click={submitCreate}
              class="rounded-xl bg-emerald-500/90 px-4 py-2 font-semibold hover:bg-emerald-500">
              Crear rol
            </button>
          </div>
        </section>

        <!-- Tabla de roles -->
        <section class="overflow-hidden rounded-2xl border border-white/10 bg-white/10">
          <div class="flex items-center justify-between border-b border-white/10 p-4">
            <h2 class="text-lg font-semibold">Roles</h2>
            <span class="text-sm text-white/70">{roles.length} total</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-white/5 text-left text-white/70">
                <tr>
                  <th class="px-4 py-3">ID</th>
                  <th class="px-4 py-3">Nombre</th>
                  <th class="px-4 py-3">Descripción</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                {#if roles.length === 0}
                  <tr><td colspan="5" class="px-4 py-6 text-center text-white/70">Sin roles.</td></tr>
                {:else}
                  {#each roles as r}
                    <tr>
                      <td class="px-4 py-3 font-mono text-white/80">#{r.id}</td>
                      <td class="px-4 py-3 font-medium">{r.nombre}</td>
                      <td class="px-4 py-3 text-white/80">{r.descripcion ?? "—"}</td>
                      <td class="px-4 py-3">
                       <td class="px-4 py-3">
  <span
    class={`rounded-full px-2 py-0.5 text-xs ${
      r.estado === 1
        ? "bg-emerald-500/20 text-emerald-300"
        : "bg-amber-500/20 text-amber-300"
    }`}
  >
    {fmtEstado(r.estado)}
  </span>
</td>

                      <td class="px-4 py-3">
                        <div class="flex items-center justify-end gap-2">
                          <button class="rounded-lg border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20"
                                  on:click={() => openPerms(r)}>
                            Permisos
                          </button>
                          <button class="rounded-lg border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20"
                                  on:click={() => startEdit(r)}>
                            Editar
                          </button>
                          <button class="rounded-lg border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20"
                                  on:click={() => toggleEstado(r)}>
                            {r.estado === 1 ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </section>
      {/if}
    {/if}

    <!-- Modal editar rol -->
    {#if showEdit}
      <div class="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
        <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h3 class="text-lg font-semibold">Editar rol</h3>
          <div class="mt-4 grid gap-3">
            <label class="text-sm">Nombre</label>
            <input class="rounded-xl border border-white/10 bg-slate-800 p-3" bind:value={editing.nombre} />
            <label class="mt-2 text-sm">Descripción</label>
            <input class="rounded-xl border border-white/10 bg-slate-800 p-3" bind:value={editing.descripcion} />
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button class="rounded-xl border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/20"
                    on:click={() => { showEdit = false; editing = null; }}>
              Cancelar
            </button>
            <button class="rounded-xl bg-emerald-500 px-4 py-2 font-semibold hover:bg-emerald-600"
                    on:click={submitEdit}>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Modal permisos -->
    {#if showPerms}
      <div class="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4">
        <div class="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Permisos · {selRole?.nombre}</h3>
            <button class="rounded-xl border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20"
                    on:click={() => (showPerms = false)}>
              Cerrar
            </button>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-white/5 text-left text-white/70">
                <tr>
                  <th class="px-4 py-3">Módulo</th>
                  <th class="px-4 py-3 text-center">Crear</th>
                  <th class="px-4 py-3 text-center">Leer</th>
                  <th class="px-4 py-3 text-center">Actualizar</th>
                  <th class="px-4 py-3 text-center">Eliminar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                {#each matrix as row, i}
                  <tr>
                    <td class="px-4 py-3 font-medium">{row.nombre}</td>
                    <td class="px-4 py-3 text-center">
                      <input type="checkbox" checked={row.can_create} on:change={() => toggle(row, "can_create")} />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input type="checkbox" checked={row.can_read} on:change={() => toggle(row, "can_read")} />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input type="checkbox" checked={row.can_update} on:change={() => toggle(row, "can_update")} />
                    </td>
                    <td class="px-4 py-3 text-center">
                      <input type="checkbox" checked={row.can_delete} on:change={() => toggle(row, "can_delete")} />
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button class="rounded-xl border border-white/10 bg-white/10 px-4 py-2 hover:bg-white/20"
                    on:click={() => (showPerms = false)}>
              Cancelar
            </button>
            <button class="rounded-xl bg-emerald-500 px-4 py-2 font-semibold hover:bg-emerald-600"
                    on:click={savePerms}>
              Guardar permisos
            </button>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  .container{max-width:960px;margin:2rem auto;padding:1rem}
</style>
