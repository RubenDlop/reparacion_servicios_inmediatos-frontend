// src/lib/api/requests.js
import { authedFetch } from './auth.js';

/** Lista de servicios (para el <select>). */
export async function listServices({ page = 1, size = 100 } = {}) {
  return authedFetch(`/services/?page=${page}&size=${size}`);
}

/** Lista de solicitudes del usuario (paginado). */
export async function listRequests({ page = 1, size = 10 } = {}) {
  return authedFetch(`/requests/?page=${page}&size=${size}`);
}

/** Crear una solicitud de servicio. */
export async function createRequest(payload) {
  return authedFetch('/requests', {
    method: 'POST',
    json: payload,
  });
}

/** Detalle de una solicitud por ID (nombre que espera tu vista). */
export async function getRequestById(request_id) {
  return authedFetch(`/requests/${request_id}`);
}

/** Alias por si en algún sitio usaste getRequest. */
export const getRequest = getRequestById;

/** Cancelar una solicitud. */
export async function cancelRequest(id) {
  return authedFetch(`/requests/${id}`, {
    method: 'PATCH',
    json: { status: 'cancelled' },
  });
}

/** Técnicos cercanos (requiere token). */
export async function nearbyTechnicians({ latitude, longitude, radius_km = 10 }) {
  const qs = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radius_km: String(radius_km),
  }).toString();
  return authedFetch(`/technicians/nearby?${qs}`);
}
