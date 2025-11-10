import { writable, derived, get } from 'svelte/store';
import { me, clearAuth } from '../api/auth.js';

export const session = writable({ user: null, loading: true });
export const isLoggedIn = derived(session, (s) => !!s?.user);

export async function checkAuth() {
  try {
    const { response, data } = await me();
    if (response?.ok) session.set({ user: data, loading: false });
    else session.set({ user: null, loading: false });
  } catch {
    session.set({ user: null, loading: false });
  }
}

export function loginSet(user) {
  session.set({ user, loading: false });
}

export function logoutAndClear() {
  try { clearAuth?.(); } catch {}
  session.set({ user: null, loading: false });
}

/** Conditions para svelte-spa-router/wrap */
export function requireAuth(detail) {
  if (get(isLoggedIn)) return true;
  const next = encodeURIComponent(detail?.location || '/dashboard');
  return `/login?next=${next}`;           // 👈 redirección
}

export function onlyGuests(detail) {
  if (!get(isLoggedIn)) return true;
  const qs = detail?.querystring ?? '';
  const params = new URLSearchParams(qs);
  const dest = params.get('next') || '/dashboard';
  return dest;                            // 👈 redirección
}
