// src/lib/api/users.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

function getToken() {
  try {
    const raw = localStorage.getItem('auth') ?? sessionStorage.getItem('auth');
    return raw ? JSON.parse(raw).access_token : null;
  } catch {
    return null;
  }
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
    body = options.formData; // no setear Content-Type
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

// ------- LISTADO -------
export async function getUsers({ q, page = 1, size = 20 } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  qs.set('page', String(page));
  qs.set('size', String(size));
  return authedFetch(`/users/?${qs.toString()}`); // ← slash antes del ?
}


// ------- CRUD -------
export async function createUser(payload) {
  // payload: { full_name, email, phone_number, password, role_id?, is_active? }
  // role_id debe ser number o null
  return authedFetch('/users', { method: 'POST', json: payload });
}

export async function updateUser(userId, payload) {
  return authedFetch(`/users/${userId}`, { method: 'PATCH', json: payload });
}

export async function softDeleteUser(userId) {
  return authedFetch(`/users/${userId}`, { method: 'DELETE' });
}

// ------- ADMIN OPCIONALES (promote/demote) -------
export async function promoteUser(userId) {
  // ajusta la ruta si en tu backend quedó bajo /admin
  return authedFetch(`/users/${userId}/promote`, { method: 'POST' });
}

export async function demoteUser(userId) {
  // ajusta la ruta si en tu backend quedó bajo /admin
  return authedFetch(`/users/${userId}/demote`, { method: 'POST' });
}
