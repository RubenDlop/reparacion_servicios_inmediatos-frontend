// src/api/dashboard.js
import { authedFetch } from './auth';

// Normaliza respuestas tipo {items,total} o arrays planos
function unwrapList(payload) {
  if (!payload) return { items: [], total: 0 };
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  const items = payload.items ?? payload.data ?? [];
  const total = payload.total ?? payload.count ?? items.length ?? 0;
  return { items, total };
}

// Solicitudes del usuario (paginadas)
export async function fetchRequests({ size = 5, page = 1 } = {}) {
  const { response, data } = await authedFetch(`/requests?page=${page}&size=${size}`);
  return { response, ...unwrapList(data) };
}

// Asignaciones (si el usuario no es técnico/superuser puede responder 403)
export async function fetchAssignments({ size = 5, page = 1 } = {}) {
  const { response, data } = await authedFetch(`/assignments?page=${page}&size=${size}`);
  return { response, ...unwrapList(data) };
}

// Servicios activos para el selector
export async function listServices({ page = 1, size = 100 } = {}) {
  const { response, data } = await authedFetch(`/services?page=${page}&size=${size}`);
  return { response, ...unwrapList(data) };
}

// Crear una solicitud de servicio
export async function createRequest(payload) {
  const { response, data } = await authedFetch(`/requests`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { response, data };
}
