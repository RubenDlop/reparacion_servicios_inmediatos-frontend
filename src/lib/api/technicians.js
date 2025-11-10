// api/technicians.js
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

// ---------- helpers ----------
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

  // Acepta JSON, texto o binario en respuesta
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain;q=0.9, */*;q=0.8');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Cuerpo: soporta options.json, options.formData o options.body
  let body = options.body;

  if (options.json !== undefined) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  } else if (options.formData instanceof FormData) {
    // ¡No setear Content-Type para FormData!
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
    body,
  });

  // Parse tolerante
  let data = null;
  try {
    if (response.status !== 204) {
      const ct = response.headers.get('content-type') || '';
      data = ct.includes('application/json') ? await response.json() : await response.text();
    }
  } catch { /* ignore */ }

  return { response, data };
}

// ---------- PERFIL ----------
export function getMyTechnicianProfile() {
  return authedFetch('/technicians/me');
}

export function applyTechnician(payload) {
  return authedFetch('/technicians/apply', { method: 'POST', json: payload });
}

export function updateMyTechnicianProfile(payload) {
  return authedFetch('/technicians/me', { method: 'PATCH', json: payload });
}

// ---------- DOCUMENTOS DEL TÉCNICO ----------
export function listTechnicianDocuments() {
  return authedFetch('/technicians/me/documents');
}

export function uploadTechnicianDocument(file, meta = {}) {
  const form = new FormData();
  form.append('file', file); // el backend espera "file"
  if (meta.kind)       form.append('kind', meta.kind);
  if (meta.issuer)     form.append('issuer', meta.issuer);
  if (meta.issued_at)  form.append('issued_at', meta.issued_at);     // yyyy-mm-dd
  if (meta.expires_at) form.append('expires_at', meta.expires_at);   // yyyy-mm-dd
  if (meta.notes)      form.append('notes', meta.notes);

  return authedFetch('/technicians/me/documents', {
    method: 'POST',
    formData: form,
  });
}

export function deleteTechnicianDocument(docId) {
  return authedFetch(`/technicians/me/documents/${docId}`, { method: 'DELETE' });
}

// ---------- MIS TRABAJOS (evita 307 usando slash final) ----------
export function listAssignments({ page = 1, size = 5 } = {}) {
  return authedFetch(`/assignments/?page=${page}&size=${size}`);
}

export function listRequests({ page = 1, size = 5 } = {}) {
  return authedFetch(`/requests/?page=${page}&size=${size}`);
}
