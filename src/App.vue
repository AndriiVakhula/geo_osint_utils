<template>
    <div class="container relative pt-5">
        <DeepStateMap @update="geojson = $event" />

        <div class="flex justify-end">
            <Button class="mt-5" @click="download">Download</Button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import convertGeoJSONToKML from './geoJsonToKml';
import DeepStateMap from './integrations/DeepStateMap/Index.vue'
import { Button } from '@/components/ui/button';
import type { FeatureCollection, Feature } from 'geojson';

const geojson = ref<FeatureCollection | Feature | null>(null);

function download() {
    if (geojson.value) {
        const kml = convertGeoJSONToKML(geojson.value);
        const blob = new Blob([kml], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'map.kml';
        link.click();
    } else {
        console.error('No GeoJSON data available to download.');
    }
}
</script>