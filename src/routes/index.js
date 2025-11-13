// src/nav/routes.js
import { wrap } from 'svelte-spa-router/wrap';
import { requireAuth, onlyGuests, session } from '../lib/stores/auth.js';
import { get } from 'svelte/store';

// Públicas / marketing
import Home from '../lib/pages/Home.svelte';
import ServicesPage from '../lib/pages/ServicesPage.svelte';
import PreciosPage from '../lib/pages/PreciosPage.svelte';
import ContactoPage from '../lib/pages/ContactoPage.svelte';
import Nosotros from '../lib/pages/Nosotros.svelte';
import FAQ from '../lib/pages/FAQ.svelte';
import Soporte from '../lib/pages/Soporte.svelte';
import Estado from '../lib/pages/Estado.svelte';
import Privacidad from '../lib/pages/Privacidad.svelte';
import Terminos from '../lib/pages/Terminos.svelte';
import NotFound from '../lib/pages/NotFound.svelte';

// Área app general
import DashboardPage from '../lib/pages/DashboardPage.svelte';
import LoginPage from '../lib/pages/login.svelte';
import RegistroPage from '../lib/pages/RegistroPage.svelte';
import RecuperarPage from '../lib/pages/RecuperarPage.svelte';
import SolicitarPage from '../lib/pages/SolicitarPage.svelte';
import SoyTecnico from '../lib/pages/SoyTecnico.svelte';
import MisTrabajos from '../lib/pages/MisTrabajos.svelte';
import SolicitudDetalle from '../lib/pages/SolicitudDetalle.svelte';
import Cuenta from '../lib/pages/Cuenta.svelte';

// **NUEVAS páginas para el parcial**
import PrincipalPage from '../lib/pages/Principal.svelte';   // Principal (información del proyecto)
import ReportePage from '../lib/pages/Reporte.svelte';       // Reporte (form + tabla; no funcional)

// Admin
import AdminPage from '../lib/pages/Admin.svelte';           // Dashboard Admin (puede ser tu Admin.svelte)

// (Opcional si vas a separar vistas de admin por archivo)
import RolesPage from '../lib/pages/admin/Roles.svelte';     // CRUD Roles & Permisos (soft-delete)
import UsuariosPage from '../lib/pages/admin/Usuarios.svelte'; // CRUD Usuarios con rol (soft-delete)

export const NAV_LINKS = [
  { href: '/',          label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/precios',   label: 'Precios' },
  { href: '/contacto',  label: 'Contacto' },
  { href: '/principal', label: 'Principal' },
  { href: '/reporte',   label: 'Reporte' },
  { href: '/login',     label: 'Iniciar sesión' },
];
function requireAdmin(detail) {
  const s = get(session);
  const next = encodeURIComponent(detail?.location || '/admin');
  if (!s?.user) return `/login?next=${next}`; 
  if (s.user.is_superuser || s.user?.rol?.nombre === 'Admin') return true;
  return '/dashboard'; // autenticado pero no admin
}

export const routes = {
  // Públicas
  '/': Home,
  '/servicios': ServicesPage,
  '/precios': PreciosPage,
  '/contacto': ContactoPage,
  '/nosotros':   Nosotros,
  '/faq':        FAQ,
  '/soporte':    Soporte,
  '/estado':     Estado,
  '/privacidad': Privacidad,
  '/terminos':   Terminos,

  // Auth
  '/login':     wrap({ component: LoginPage,     conditions: [onlyGuests] }),
  '/registro':  wrap({ component: RegistroPage,  conditions: [onlyGuests] }),
  '/recuperar': wrap({ component: RecuperarPage, conditions: [onlyGuests] }),

  // App general (protegidas)
  '/dashboard':       wrap({ component: DashboardPage,   conditions: [requireAuth] }),
  '/soy-tecnico':     wrap({ component: SoyTecnico,      conditions: [requireAuth] }),
  '/perfil-tecnico':  wrap({ component: SoyTecnico,      conditions: [requireAuth] }),
  '/mis-trabajos':    wrap({ component: MisTrabajos,     conditions: [requireAuth] }),
  '/solicitar':       wrap({ component: SolicitarPage,   conditions: [requireAuth] }),
  '/cuenta':          wrap({ component: Cuenta,          conditions: [requireAuth] }),

  // Detalle protegido
  '/solicitud/:id':   wrap({ component: SolicitudDetalle, conditions: [requireAuth] }),

  // **NUEVAS páginas requeridas por el parcial**
  '/principal': PrincipalPage, // pública (puedes protegerla si quieres)
  '/reporte':   ReportePage,   // pública; el formulario NO necesita estar funcional

  // Admin
  '/admin':            wrap({ component: AdminPage,    conditions: [requireAdmin] }),
  '/admin/roles':      wrap({ component: RolesPage,    conditions: [requireAdmin] }),
  '/admin/usuarios':   wrap({ component: UsuariosPage, conditions: [requireAdmin] }),
  '/admin/roles': wrap({ component: RolesPage, conditions: [requireAdmin] }),


  // 404
  '*': NotFound,
};
