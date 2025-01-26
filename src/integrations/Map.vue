<script lang="ts" setup>
import { onMounted, ref, defineEmits, defineProps, watch } from 'vue';
import L, { type PathOptions } from 'leaflet';
import markerIcon from "leaflet/dist/images/marker-icon.png";
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-vue-next'
import type { FeatureCollection, Feature, GeoJsonProperties, Geometry } from 'geojson';

const emit = defineEmits(['updatePosition']);
const props = defineProps<{ geoJson: FeatureCollection }>();

let map: L.Map | null = null;
const leftLat = ref(0);
const rightLat = ref(0);
const topLon = ref(0);
const bottomLon = ref(0);

const isContextMenuVisible = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const clickCoords = ref<{ lat: number; lng: number } | null>(null);

let geoJsonLayer: L.GeoJSON | null = null;

const initializeMap = () => {
    L.Marker.prototype.setIcon(L.icon({
        iconUrl: markerIcon
    }))

    map = L.map('map').setView([48.3794, 31.1656], 6);

    const OpenStreetMap_HOT = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
    }).addTo(map);

    const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });

    const baseMaps = {
        "OSM HOT": OpenStreetMap_HOT,
        "Esri World Imagery": Esri_WorldImagery
    };

    L.control.layers(baseMaps).addTo(map);

    map.on('move', updateMapBounds);

    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
        e.originalEvent.preventDefault();

        clickCoords.value = {
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
        };

        contextMenuPos.value = {
            x: e.containerPoint.x,
            y: e.containerPoint.y,
        };

        isContextMenuVisible.value = true;
    });

    map.on('click', () => {
        isContextMenuVisible.value = false;
    });
};

function polygonAndLineStyle(feature?: Feature<Geometry, GeoJsonProperties>): PathOptions {
    if (!feature || !feature.properties) return {};

    return {
        color: '#' + feature.properties.stroke || '#3388ff',
        weight: feature.properties['stroke-width'] || 3,
        opacity: feature.properties['stroke-opacity'] || 1,
        fillColor: feature.properties.fill || '#3388ff',
        fillOpacity: feature.properties['fill-opacity'] || 0.2
    };
}

function setPosition(event: KeyboardEvent) {
    if (!map) return;
    const [lat, lon] = (event.target as HTMLInputElement)?.value.split(',').map(Number);

    if (lat && lon) {
        map.setView([lat, lon], 12);
    }
}

watch(() => props.geoJson, (newVal) => {
    if (!map || !props.geoJson) return;

    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    geoJsonLayer = L.geoJSON(
        newVal,
        {
            style: polygonAndLineStyle,
            onEachFeature(feature, layer) {
                if (feature.properties && feature.properties.name) {
                    layer.bindPopup(`<h4>${feature.properties.name}</h4>`);
                }
            }
        }).addTo(map);
}, { deep: true });

const updateMapBounds = () => {
    if (!map) return;
    const mapbounds = map.getBounds();
    topLon.value = mapbounds.getNorthEast().lat;
    rightLat.value = mapbounds.getNorthEast().lng;
    bottomLon.value = mapbounds.getSouthWest().lat;
    leftLat.value = mapbounds.getSouthWest().lng;

    emit('updatePosition', {
        leftLat: leftLat.value,
        rightLat: rightLat.value,
        topLon: topLon.value,
        bottomLon: bottomLon.value
    });
};

const copyCoordinates = () => {
  if (!clickCoords.value) return;
  const coordsString = `${clickCoords.value.lat}, ${clickCoords.value.lng}`;
  navigator.clipboard.writeText(coordsString)
    .then(() => {
        isContextMenuVisible.value = false;
    })
    .catch((err) => {
        console.error('Copy error', err);
    });
};

onMounted(initializeMap);
</script>

<template>
    <div class="relative">
        <div class="absolute top-3 left-12 z-10 max-w-sm items-center bg-background w-80">
            <Input id="search" type="text" placeholder="Go to place" class="pl-10" @keypress.enter="setPosition" />
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Search class="size-5 text-muted-foreground" />
            </span>
        </div>

        <div id="map" style="height: 100vh;">
            <div id="shadow"></div>
            <div id="spin_div"></div>
            <div
                v-if="isContextMenuVisible"
                class="bg-background p-3 rounded-md shadow-sm"
                :style="{
                    position: 'absolute',
                    top: contextMenuPos.y + 'px',
                    left: contextMenuPos.x + 'px',
                    zIndex: 9999
                }"
            >
                <button variant="outline" size="sm" @click="copyCoordinates">
                    <b>Copy:</b> {{ clickCoords?.lat }} {{clickCoords?.lng}}
                </button>
            </div>
        </div>
    </div>
</template>

<style>
#map {
    z-index: 1;
    width: 100%;
    height: 100%;
}
</style>
