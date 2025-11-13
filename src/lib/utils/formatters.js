// src/lib/utils/formatters.js
export const timeAgo = (s) => {
  if (!s) return '—';
  const ms = Date.now() - new Date(s).getTime();
  const mins = Math.floor(Math.abs(ms) / 60000);
  if (mins < 1) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const d = Math.floor(hrs / 24);
  return `hace ${d} d`;
};

export const fmtDate = (s) => (s ? new Date(s).toLocaleString() : '—');

export const money = (n) =>
  typeof n === 'number'
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n)
    : 'Presupuesto por definir';

const num = (v) => (v === null || v === undefined ? null : Number(v));
export const getLat = (x) => num(x?.latitude ?? x?.lat ?? x?.coords?.lat ?? x?.location?.lat);
export const getLng = (x) => num(x?.longitude ?? x?.lng ?? x?.coords?.lng ?? x?.location?.lng);

export const chipFor = (status) => {
  const s = (status || '').toLowerCase();
  if (['pending','creada','nuevo','created'].includes(s)) return { text:'Pendiente', cls:'chip chip--warn' };
  if (['in_process','en_proceso','assigned','aceptada'].includes(s)) return { text:'En proceso', cls:'chip chip--info' };
  if (['finished','finalizada','done','completado'].includes(s)) return { text:'Finalizada', cls:'chip chip--ok' };
  if (['cancelled','canceled','rechazada'].includes(s)) return { text:'Cancelada', cls:'chip chip--bad' };
  return { text: status || '—', cls:'chip' };
};

export const I = {
  pin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>`,
  clock:`<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.75A10.25 10.25 0 1 0 22.25 12 10.26 10.26 0 0 0 12 1.75Zm.75 5.5h-1.5v5l4.25 2.55.75-1.23-3.5-2.07Z"/></svg>`,
  money:`<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm-3 8a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3 1 1 0 1 1 2 0 1 1 0 0 0 1 1h6a1 1 0 0 0 1-1 3 3 0 0 0-3-3h-2a5 5 0 0 1-5-5h2a3 3 0 0 0 3 3h2a5 5 0 0 1 5 5Z"/></svg>`,
  service:`<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m21 16-3.59-3.59L22 7.83 20.59 6.41l-4.59 4.59L12.41 7 11 8.41l3.59 3.59L6 20h15zM3 21h4l-4-4z"/></svg>`
};
