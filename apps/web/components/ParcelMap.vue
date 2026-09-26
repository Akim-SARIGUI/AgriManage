<template>
  <div ref="mapEl" class="parcel-map" :style="{ height }" />
</template>

<script setup lang="ts">
import type { Map as LeafletMap, Marker } from 'leaflet';

export type MapMarker = {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
};

const props = withDefaults(
  defineProps<{
    markers?: MapMarker[];
    center?: [number, number];
    zoom?: number;
    height?: string;
    selectable?: boolean;
    selected?: { latitude: number; longitude: number } | null;
  }>(),
  {
    markers: () => [],
    center: () => [12.37, -1.53],
    zoom: 12,
    height: '320px',
    selectable: false,
    selected: null,
  },
);

const emit = defineEmits<{
  select: [payload: { latitude: number; longitude: number }];
}>();

const mapEl = ref<HTMLElement | null>(null);
let map: LeafletMap | null = null;
let selectMarker: Marker | null = null;
const markerLayerIds: Marker[] = [];

onMounted(async () => {
  const L = (await import('leaflet')).default;

  // Fix default marker icons with Vite
  // @ts-expect-error leaflet internal path helper
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  if (!mapEl.value) return;

  const initialCenter: [number, number] =
    props.selected
      ? [props.selected.latitude, props.selected.longitude]
      : props.markers.length
        ? [props.markers[0].latitude, props.markers[0].longitude]
        : props.center;

  map = L.map(mapEl.value).setView(initialCenter, props.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);

  renderMarkers(L);

  if (props.selectable) {
    map.on('click', (event) => {
      const { lat, lng } = event.latlng;
      emit('select', { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) });
      setSelectMarker(L, lat, lng);
    });

    if (props.selected) {
      setSelectMarker(L, props.selected.latitude, props.selected.longitude);
    }
  }

  setTimeout(() => map?.invalidateSize(), 150);
});

watch(
  () => props.markers,
  async () => {
    const L = (await import('leaflet')).default;
    renderMarkers(L);
  },
  { deep: true },
);

watch(
  () => props.selected,
  async (value) => {
    if (!props.selectable || !value || !map) return;
    const L = (await import('leaflet')).default;
    setSelectMarker(L, value.latitude, value.longitude);
    map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 13));
  },
);

onBeforeUnmount(() => {
  map?.remove();
  map = null;
});

function renderMarkers(L: typeof import('leaflet')) {
  if (!map) return;
  markerLayerIds.forEach((marker) => marker.remove());
  markerLayerIds.length = 0;

  props.markers.forEach((item) => {
    const marker = L.marker([item.latitude, item.longitude])
      .addTo(map!)
      .bindPopup(item.name);
    markerLayerIds.push(marker);
  });

  if (props.markers.length > 1) {
    const bounds = L.latLngBounds(
      props.markers.map((item) => [item.latitude, item.longitude] as [number, number]),
    );
    map.fitBounds(bounds.pad(0.2));
  } else if (props.markers.length === 1) {
    map.setView([props.markers[0].latitude, props.markers[0].longitude], 14);
  }
}

function setSelectMarker(L: typeof import('leaflet'), lat: number, lng: number) {
  if (!map) return;
  if (selectMarker) {
    selectMarker.setLatLng([lat, lng]);
  } else {
    selectMarker = L.marker([lat, lng]).addTo(map);
  }
}
</script>

<style scoped>
.parcel-map {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(27, 94, 32, 0.15);
  z-index: 0;
}
</style>
