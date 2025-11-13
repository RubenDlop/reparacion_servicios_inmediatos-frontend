// src/api/acl.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

function getToken() {
  try {
    const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
    return raw ? JSON.parse(raw).access_token : null;
  } catch { return null; }
}
function buildUrl(path) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
async function authedFetch(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain;q=0.9, */*;q=0.8');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body = options.body;
  if (options.json !== undefined) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  } else if (options.formData instanceof FormData) {
    body = options.formData; // no seteamos Content-Type
  } else if (body && !(body instanceof FormData) && typeof body !== 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), { ...options, headers, body });
  let data = null;
  try {
    if (response.status !== 204) {
      const ct = response.headers.get('content-type') || '';
      data = ct.includes('application/json') ? await response.json() : await response.text();
    }
  } catch { /* noop */ }

  return { response, data };
}

// ------- MÓDULOS -------
export async function getModules({ q, page = 1, size = 50 } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  qs.set('page', String(page));
  qs.set('size', String(size));
  return authedFetch(`/modules?${qs.toString()}`);
}

// ------- ROLES -------
export async function getRoles({ q, page = 1, size = 20 } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  qs.set('page', String(page));
  qs.set('size', String(size));
  return authedFetch(`/roles?${qs.toString()}`);
}

export async function createRole(payload) {
  return authedFetch('/roles', { method: 'POST', json: payload });
}
export async function updateRole(roleId, payload) {
  return authedFetch(`/roles/${roleId}`, { method: 'PATCH', json: payload });
}
export async function softDeleteRole(roleId) {
  return authedFetch(`/roles/${roleId}`, { method: 'DELETE' });
}
