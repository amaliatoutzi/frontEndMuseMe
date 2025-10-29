<template>
  <div class="map-wrap" :style="{ height }" ref="mapEl"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { Museum } from '../../utils/catalog';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{
  museums: Museum[];
  height?: string; // e.g., '460px'
}>();
const emit = defineEmits<{ (e: 'open', id: string): void }>();

const mapEl = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let markers: L.Marker[] = [];
const markerById = new Map<string, L.Marker>();
let selectedId: string | null = null;
// Custom gold pin using a DivIcon so it stands out vs base map POIs
const pin = L.divIcon({
  className: 'mm-pin',
  html: '<span class="mm-pin-inner"></span>',
  iconSize: [22, 30],
  iconAnchor: [11, 28],
  popupAnchor: [0, -26],
});

function initMap() {
  if (!mapEl.value) return;
  map = L.map(mapEl.value, { zoomControl: true, scrollWheelZoom: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);
  updateMarkers();
}

function updateMarkers() {
  if (!map) return;
  // clear
  markers.forEach((m) => m.remove());
  markers = [];
  markerById.clear();

  const withCoords = props.museums.filter((m) => m.location && typeof m.location.lat === 'number' && typeof m.location.lon === 'number');
  for (const m of withCoords) {
    const ll = L.latLng(m.location!.lat, m.location!.lon);
    const marker = L.marker(ll, { icon: pin })
      .addTo(map!)
      .bindPopup(`<strong>${m.name}</strong>${m.borough ? `<div>${m.borough}</div>` : ''}`)
      .on('click', () => {
        setSelected(m.id);
        emit('open', m.id);
      });
    markers.push(marker);
    markerById.set(m.id, marker);
  }

  if (withCoords.length) {
    const bounds = L.latLngBounds(withCoords.map((m) => [m.location!.lat, m.location!.lon] as [number, number]));
    map.fitBounds(bounds.pad(0.1));
  } else {
    // NYC fallback
    map.setView([40.7128, -74.006], 11);
  }
}

onMounted(() => initMap());
onBeforeUnmount(() => { if (map) { map.remove(); map = null; } });
watch(() => props.museums, () => updateMarkers(), { deep: true });

const height = props.height || '460px';

function setSelected(id: string | null) {
  if (selectedId && markerById.has(selectedId)) {
    const prev = markerById.get(selectedId)!;
    const el = prev.getElement();
    if (el) el.classList.remove('is-selected');
  }
  selectedId = id;
  if (id && markerById.has(id)) {
    const cur = markerById.get(id)!;
    const el = cur.getElement();
    if (el) el.classList.add('is-selected');
  }
}

// Clear selection when clicking empty map space
watch(mapEl, () => {
  if (!map) return;
  map!.on('click', () => setSelected(null));
});
</script>

<style scoped>
.map-wrap { width: 100%; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }
:deep(.leaflet-container) { font: inherit; }
/* Burgundy teardrop marker */
:deep(.mm-pin) { position: relative; }
:deep(.mm-pin-inner) {
  display: block;
  width: 22px; height: 22px;
  background: var(--brand-600); border-radius: 50%;
  box-shadow: 0 0 0 2px #fff, 0 2px 6px rgba(0,0,0,0.25);
  position: relative;
}
:deep(.mm-pin-inner)::after {
  content: '';
  position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%);
  width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid var(--brand-600);
}

/* Gold selection halo */
:deep(.mm-pin.is-selected) .mm-pin-inner {
  box-shadow: 0 0 0 2px #fff, 0 0 0 6px rgba(201, 169, 97, 0.65), 0 2px 6px rgba(0,0,0,0.25);
}
</style>
