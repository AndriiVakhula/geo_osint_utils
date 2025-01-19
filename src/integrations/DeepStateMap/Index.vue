<script setup lang="ts" name="DeepStateMapComponent">
import { ref, onMounted, watch, defineEmits } from 'vue'
import { formatDateToUnix } from '@/utils/date'
import Combobox from '@/components/Combobox.vue'
import DownloadKmlButton from '../../components/DownloadKmlButton.vue'
import type { FeatureCollection, Feature } from 'geojson'

const API_DATES = 'https://deepstatemap.live/api/history/public'
const API_GEO_JSON = 'https://deepstatemap.live/api/history/'

const emit = defineEmits(['update']);

const dates = ref<Array<{ value: string, label: string }>>([]);
const selectedDate = ref<string | undefined>(undefined);
const geojson = ref<FeatureCollection | null>(null);

function loadDates() {
    fetch(API_DATES)
        .then(response => response.json())
        .then(data => {
            dates.value = data.reverse().map((i: { createdAt: string }) => (
                { value: i.createdAt, label: i.createdAt })
            );
        })
}

function formatGeoJson(geojson: FeatureCollection): FeatureCollection {
    if (geojson === null) {
        return {
            type: 'FeatureCollection',
            features: [],
        };
    }

    geojson.features = geojson.features
        .filter((feature: Feature) => {
            return !feature.properties?.name.includes("Liberated")
                && !feature.properties?.name.includes("Direction of attack")
                && feature.geometry.type !== "Point";
        })
        .map((feature: Feature) => {
            if (feature.geometry.type === "Polygon") {
                feature.properties = {
                    ...feature.properties,
                    'fill-opacity': '0.0',
                    'stroke': 'ff0000ff',
                };
            }
            return feature;
        });

    return geojson;
}

function loadGeoJson(date: string) {
    const dateUnix = formatDateToUnix(date);

    fetch(`${API_GEO_JSON}${dateUnix}/geojson`)
        .then(response => response.json())
        .then(data => {
            geojson.value = data;
            update();
        })
}

function update() {
    geojson.value = formatGeoJson(geojson.value as FeatureCollection);
    emit('update', formatGeoJson(geojson.value as FeatureCollection));
}

watch(selectedDate, (newVal) => {
    if (newVal) {
        loadGeoJson(newVal);
    }
});

onMounted(() => {
    if (dates.value.length === 0) {
        loadDates();
    }
});
</script>

<template>
    <div class="border rounded-xl p-3">
        <img src="./logo.svg" alt="DeepState Map" class="w-20 h-20" />

        <div class="mt-1">
            <Combobox v-model="selectedDate" :options="dates" label="Select date" />
        </div>
        <div class="flex justify-end mt-2">
            <DownloadKmlButton file-name="deepstate-front-line" :geo-json="geojson" />
        </div>
    </div>
</template>