// src/routes/index.js
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


import LoginPage from '../lib/pages/login.svelte';           
import RegistroPage from '../lib/pages/RegistroPage.svelte'; 
import RecuperarPage from '../lib/pages/RecuperarPage.svelte'; 

export const NAV_LINKS = [
  { href: '/',          label: 'Inicio' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/precios',   label: 'Precios' },
  { href: '/contacto',  label: 'Contacto' },


  { href: '/login',     label: 'Iniciar sesión' },
];

export const routes = {
  '/': Home,
  '/servicios': ServicesPage,
  '/precios': PreciosPage,
  '/contacto': ContactoPage,


  '/login': LoginPage,
  '/registro': RegistroPage,       
  '/recuperar': RecuperarPage,     

  '/nosotros':   Nosotros,
  '/faq':        FAQ,
  '/soporte':    Soporte,
  '/estado':     Estado,
  '/privacidad': Privacidad,
  '/terminos':   Terminos,

  // comodín 404
  '*': NotFound,
};
