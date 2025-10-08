// Fuente única de verdad para Servicios y Beneficios.
// Puedes consumir estos datos desde otros componentes/páginas.

export const SERVICES = [
  {
    name: "Electricidad",
    description: "Instalaciones, reparaciones y mantenimiento eléctrico.",
    icon: "bolt"       // clave para el icono (ver ICONS)
  },
  {
    name: "Plomería",
    description: "Reparaciones de tuberías, grifos, fugas y más.",
    icon: "pipe"
  },
  {
    name: "Carpintería",
    description: "Muebles a medida, reparaciones y restauraciones.",
    icon: "hammer"
  },
  {
    name: "Limpieza",
    description: "Limpieza profunda para hogares, oficinas y exteriores.",
    icon: "broom"
  },
  {
    name: "Cerrajería",
    description: "Apertura de puertas, cambio de cerraduras y llaves.",
    icon: "lock"
  },
  {
    name: "Mantenimiento General",
    description: "Pequeñas reparaciones y mantenimiento en el hogar.",
    icon: "toolbox"
  }
];

export const REASONS = [
  {
    title: "Técnicos Certificados",
    description:
      "Todos los profesionales han pasado verificación y cuentan con experiencia comprobada.",
    icon: "shield"
  },
  {
    title: "Rápido y Fácil",
    description:
      "Solicita un servicio en minutos, sin llamadas innecesarias ni largas esperas.",
    icon: "flash"
  },
  {
    title: "Precios Transparentes",
    description:
      "Cotizaciones claras y justas antes de contratar un servicio.",
    icon: "ticket"
  },
  {
    title: "Garantía de Satisfacción",
    description:
      "Supervisión del trabajo y garantía real sobre la intervención.",
    icon: "badge"
  }
];

// Conjunto de iconos inline (Heroicons-like SVGs). 0 dependencias.
export const ICONS = {
  bolt:   'M13 2 3 14h6l-2 8 10-12h-6l2-8Z',
  pipe:   'M3 10h6v4H3v6H1V4h2v6Zm20 4h-6v-4h6V4h2v16h-2v-6Z',
  hammer: 'M2 21h8v-2H6l7.5-7.5 3 3L13 22h9v-2h-7l3-7-5-5L4 17v-4H2v8Z',
  broom:  'M4 14 2 22h2l1-4 4 4h2l-6-8Zm8-10 8 8-2 2-8-8 2-2Zm1-2 6 6 1-1a2 2 0 0 0 0-3l-3-3a2 2 0 0 0-3 0l-1 1Z',
  lock:   'M6 10V7a6 6 0 1 1 12 0v3h2v12H4V10h2Zm2 0h8V7a4 4 0 1 0-8 0v3Z',
  toolbox:'M3 8h4V6h10v2h4a2 2 0 0 1 2 2v10H1V10a2 2 0 0 1 2-2Zm6-2v2h6V6H9Zm2 8h2v4h-2v-4Z',
  shield: 'M12 2 3 6v6c0 5.55 3.84 8.74 9 10 5.16-1.26 9-4.45 9-10V6l-9-4Z',
  flash:  'M7 2h10l-5 7h5l-9 13 2-9H6l1-11Z',
  ticket: 'M3 8h4a2 2 0 1 0 0-4h10a2 2 0 1 0 0 4h4v8h-4a2 2 0 1 0 0 4H7a2 2 0 1 0 0-4H3V8Z',
  badge:  'M12 2 9 8l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1-3-6Z'
};
