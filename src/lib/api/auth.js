// src/api/auth.js
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const STORAGE_KEY = 'auth';

// ----------------- helpers base -----------------
function buildUrl(path) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// ----------------- auth endpoints -----------------
export async function login(email, password) {
  const response = await fetch(buildUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  let data = null; try { data = await response.json(); } catch {}
  return { response, data };
}

export async function register({ email, password, full_name, phone_number }) {
  const response = await fetch(buildUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name, phone_number })
  });
  let data = null; try { data = await response.json(); } catch {}
  return { response, data };
}

// ----------------- session storage -----------------
export function getAuth() {
  const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setAuth(data, remember = true) {
  const tgt = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  try { other.removeItem(STORAGE_KEY); } catch {}
  tgt.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ----------------- fetch con bearer & parse tolerante -----------------
// Soporta: { json }, { formData }, o { body } crudo.
// No fuerza Content-Type cuando es FormData (para uploads).
export async function authedFetch(path, options = {}) {
  const auth = getAuth();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain;q=0.9, */*;q=0.8');
  }
  if (auth?.access_token) {
    headers.set('Authorization', `Bearer ${auth.access_token}`);
  }

  let body = options.body;

  if (options.json !== undefined) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  } else if (options.formData instanceof FormData) {
    // no seteamos Content-Type (el navegador pone boundary)
    body = options.formData;
  } else if (
    body &&
    !(body instanceof FormData) &&
    typeof body !== 'string' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), {
    redirect: 'follow',
    ...options,
    headers,
    body
  });

  // Parseo seguro
  let data = null;
  try {
    if (response.status !== 204) {
      const ct = response.headers.get('content-type') || '';
      data = ct.includes('application/json') ? await response.json() : await response.text();
    }
  } catch { /* ignore */ }

  if (response.status === 401) {
    clearAuth();
  }

  return { response, data };
}

export async function me() {
  return authedFetch('/users/me');
}
