
import { wrap } from 'svelte-spa-router/wrap';
import { requireAuth, onlyGuests, session } from '../lib/stores/auth.js';
import { get } from 'svelte/store';

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
import DashboardPage from '../lib/pages/DashboardPage.svelte';

import LoginPage from '../lib/pages/login.svelte';
import RegistroPage from '../lib/pages/RegistroPage.svelte';
import RecuperarPage from '../lib/pages/RecuperarPage.svelte';
import SolicitarPage from '../lib/pages/SolicitarPage.svelte';
import SoyTecnico from '../lib/pages/SoyTecnico.svelte';
import MisTrabajos from '../lib/pages/MisTrabajos.svelte';


import Cuenta from '../lib/pages/Cuenta.svelte';


import AdminPage from '../lib/pages/Admin.svelte';

export const NAV_LINKS = [
  { href: '/',          label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/precios',   label: 'Precios' },
  { href: '/contacto',  label: 'Contacto' },
  { href: '/login',     label: 'Iniciar sesión' },
];


function requireAdmin(detail) {
  const s = get(session);
  const next = encodeURIComponent(detail?.location || '/admin');
  if (!s?.user) return `/login?next=${next}`;   
  if (s.user.is_superuser) return true;       
  return '/dashboard';                         
} 

export const routes = {

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


  '/login':     wrap({ component: LoginPage,     conditions: [onlyGuests] }),
  '/registro':  wrap({ component: RegistroPage,  conditions: [onlyGuests] }),
  '/recuperar': wrap({ component: RecuperarPage, conditions: [onlyGuests] }),


  '/dashboard':       wrap({ component: DashboardPage, conditions: [requireAuth] }),
  '/soy-tecnico':     wrap({ component: SoyTecnico,     conditions: [requireAuth] }),
  '/perfil-tecnico':  wrap({ component: SoyTecnico,     conditions: [requireAuth] }),
  '/mis-trabajos':    wrap({ component: MisTrabajos,    conditions: [requireAuth] }),
  '/solicitar':       wrap({ component: SolicitarPage,  conditions: [requireAuth] }), 
  '/cuenta':          wrap({ component: Cuenta,         conditions: [requireAuth] }),  


  '/admin':           wrap({ component: AdminPage,      conditions: [requireAdmin] }),


  '*': NotFound,
};
