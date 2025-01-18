<template>
    <div class="container relative pt-5">
        <DeepStateMap class="mb-5" @update="mergeGeoJson" />

        <Wikimapia class="mb-5" :left-lat="positions.leftLat" :top-lon="positions.topLon"
            :right-lat="positions.rightLat" :bottom-lon="positions.bottomLon" @update="mergeGeoJson" />

        <Map @update-position="updatePosition" :geo-json="geojson" />

        <div class="flex justify-end">
            <DownloadKmlButton class="mt-5" :geo-json="geojson" file-name="map" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DeepStateMap from './integrations/DeepStateMap/Index.vue'
import Wikimapia from './integrations/Wikimapia/Index.vue';
import Map from './integrations/Map.vue';
import DownloadKmlButton from './components/DownloadKmlButton.vue';
import type { FeatureCollection } from 'geojson';

const geojson = ref<FeatureCollection>({
    type: 'FeatureCollection',
    features: []
});

const positions = ref({
    leftLat: 0,
    rightLat: 0,
    topLon: 0,
    bottomLon: 0
});

function updatePosition(data: { leftLat: number; rightLat: number; topLon: number; bottomLon: number }) {
    positions.value = data;
}

function mergeGeoJson(geojsonVal: FeatureCollection) {
    if (geojson.value) {
        if (geojson.value.type === 'FeatureCollection' && geojsonVal.type === 'FeatureCollection') {
            geojson.value.features = geojson.value.features.concat(geojsonVal.features);
        }
    } else {
        geojson.value = geojsonVal;
    }
}
</script>