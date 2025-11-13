// src/api/assignments.js
import { authedFetch } from './auth.js';

// Crea una asignación para una solicitud dada (request_id)
export async function createAssignment(request_id) {
  return authedFetch('/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id }),
  });
}

// Cambia estado de una asignación (p.ej. "in_process", "finished", "cancelled")
export async function setAssignmentStatus(assignment_id, status) {
  return authedFetch(`/assignments/${assignment_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

// Obtiene detalle de una asignación
export async function getAssignment(assignment_id) {
  return authedFetch(`/assignments/${assignment_id}`);
}
