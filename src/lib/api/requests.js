// src/api/requests.js
import { authedFetch } from './auth';

/**
 * Lista de servicios (para el <select>).
 * Nota: la barra final en /services/ evita redirecciones 307.
 */
export async function listServices({ page = 1, size = 100 } = {}) {
  const { response, data } = await authedFetch(`/services/?page=${page}&size=${size}`);
  return { response, data };
}

/**
 * Crear una solicitud de servicio.
 */
export async function createRequest(payload) {
  const { response, data } = await authedFetch('/requests', {
    method: 'POST',
    json: payload,
  });
  return { response, data };
}

/**
 * Técnicos cercanos (requiere token del usuario).
 */
export async function nearbyTechnicians({ latitude, longitude }) {
  const qs = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  const { response, data } = await authedFetch(`/technicians/nearby?${qs.toString()}`);
  return { response, data };
}
