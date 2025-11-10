<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';

  // Fix iconos marker por Vite
  import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
  import markerIcon from 'leaflet/dist/images/marker-icon.png';
  import markerShadow from 'leaflet/dist/images/marker-shadow.png';

  // Props del mapa
  export let lat = 4.6486;      // Bogotá por defecto
  export let lng = -74.0875;
  export let zoom = 14;
  export let editable = true;
  export let height = '320px';

  // ✅ NUEVO: lista de técnicos { id, latitude, longitude, service_radius_km, user?, average_rating? }
  export let technicians = [];
  export let showRadius = true;
  export let autoFitOnTechChange = true;

  const dispatch = createEventDispatcher();

  let mapDiv;   // contenedor
  let map;
  let marker;   // marcador del usuario
  let techLayer; // capa para técnicos (se recrea reactivo)

  const DefaultIcon = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;

  function setLatLng(newLat, newLng, moveView = false) {
    const la = Number(newLat);
    const ln = Number(newLng);
    if (Number.isFinite(la) && Number.isFinite(ln)) {
      lat = Number(la.toFixed(6));
      lng = Number(ln.toFixed(6));
      if (marker) marker.setLatLng([lat, lng]);
      if (moveView && map) map.setView([lat, lng], map.getZoom());
      dispatch('moved', { lat, lng });
    }
  }

  // API pública: geolocalizar
  export function locateMe() {
    if (!map) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setLatLng(coords.latitude, coords.longitude, true),
        () => map.locate({ setView: true, maxZoom: 17 }),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      map.locate({ setView: true, maxZoom: 17 });
    }
  }

  onMount(() => {
    map = L.map(mapDiv, { zoomControl: true, attributionControl: true }).setView([lat, lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    marker = L.marker([lat, lng], { draggable: editable }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLatLng(pos.lat, pos.lng, false);
    });

    map.on('click', (e) => {
      if (!editable) return;
      setLatLng(e.latlng.lat, e.latlng.lng, false);
    });

    map.on('locationfound', (e) => setLatLng(e.latlng.lat, e.latlng.lng, true));

    techLayer = L.layerGroup().addTo(map); // capa para técnicos

    return () => {
      map?.remove();
      map = null;
      marker = null;
      techLayer = null;
    };
  });

  // ---------- Pintar técnicos ----------
  function renderTechnicians() {
    if (!map || !techLayer) return;

    techLayer.clearLayers();
    const addedLayers = [];

    // Solo técnicos con coordenadas válidas
    (technicians || [])
      .filter(t => Number.isFinite(Number(t?.latitude)) && Number.isFinite(Number(t?.longitude)))
      .forEach(t => {
        const pos = [Number(t.latitude), Number(t.longitude)];

        // Punto del técnico
        const dot = L.circleMarker(pos, {
          radius: 7,
          color: '#10b981',      // borde verde
          weight: 2,
          fillColor: '#86efac',  // verde claro
          fillOpacity: 0.9,
        }).addTo(techLayer);

        const name = (t.user?.full_name || `Técnico #${t.id}`).toString();
        const rating = t.average_rating != null ? `⭐ ${t.average_rating}` : '';
        const radio = t.service_radius_km ? `${t.service_radius_km} km` : 's/radio';
        dot.bindPopup(`<strong>${name}</strong><br>${rating}<br>Radio: ${radio}`);
        addedLayers.push(dot);

        // Círculo de cobertura (opcional)
        if (showRadius && Number(t.service_radius_km) > 0) {
          const circle = L.circle(pos, {
            radius: Number(t.service_radius_km) * 1000,
            color: '#10b981',
            weight: 1,
            fillOpacity: 0.08,
          }).addTo(techLayer);
          addedLayers.push(circle);
        }
      });

    // Ajustar vista para ver usuario + técnicos
    if (autoFitOnTechChange && addedLayers.length) {
      const group = L.featureGroup(addedLayers);
      const bounds = group.getBounds().extend([lat, lng]);
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
    }
  }

  // Reactivo: cuando cambien technicians -> repintar
  $: renderTechnicians();

  // Sincronizar si cambian lat/lng o editable
  $: if (map && marker) {
    marker.setLatLng([lat, lng]);
    if (editable) marker.dragging.enable(); else marker.dragging.disable();
  }
</script>

<div bind:this={mapDiv} style={`height:${height}; width:100%; border-radius:0.75rem; overflow:hidden;`}></div>

<style>
  :global(.leaflet-container) {
    background: #0f172a; /* slate-900 */
  }
</style>
