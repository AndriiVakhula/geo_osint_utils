<script setup lang="ts" name="DeepStateMapComponent">
import { ref, onMounted, watch, defineEmits } from 'vue'
import { formatDateToUnix } from '@/utils/date'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Combobox from '@/components/Combobox.vue'
import DownloadKmlButton from '../../components/DownloadKmlButton.vue'
import type { FeatureCollection, Feature } from 'geojson'

const DEEP_STATE_MAP_KEY = 'DeepStateMap';
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
    emit('update',DEEP_STATE_MAP_KEY, formatGeoJson(geojson.value as FeatureCollection));
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
    <Accordion type="single" class="w-full" collapsible>
        <AccordionItem value="depstate">
            <AccordionTrigger>
                <img src="./logo.svg" alt="DeepState Map" class="w-20 h-20" />
            </AccordionTrigger>

            <AccordionContent>
                <Combobox v-model="selectedDate" :options="dates" label="Select date" class="w-full" />
                <div class="flex justify-end mt-2">
                    <DownloadKmlButton file-name="deepstate-front-line" :geo-json="geojson" />
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>
