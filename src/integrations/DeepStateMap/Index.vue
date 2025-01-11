<script setup lang="ts" name="DeepStateMap">
import { ref, computed, onMounted, watch, defineEmits } from 'vue'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatDateToUnix } from '@/utils/date'
import type { FeatureCollection, Feature } from 'geojson'

const API_DATES = 'https://deepstatemap.live/api/history/public'
const API_GEO_JSON = 'https://deepstatemap.live/api/history/'

const emit = defineEmits(['update']);

const dates = ref<Array<{ createdAt: string }>>([]);
const selectedDate = ref<string | undefined>(undefined);
const geojson = ref<FeatureCollection | null>(null);

const searchQuery = ref('');
const filteredDates = computed(() => {
    return dates.value.filter(date =>
        date.createdAt.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

function loadDates() {
    fetch(API_DATES)
        .then(response => response.json())
        .then(data => {
            dates.value = data.reverse();
        })
}

function formatGeoJson(geojson: FeatureCollection): FeatureCollection {
    const json = geojson;

    json.features = json.features.filter((feature: Feature) => {
        return !feature.properties?.name.includes("Liberated")
            // remove unknown status poligons
            // && !feature.properties.name.includes("Unknown status")
            // remove direction of attack markers
            && !feature.properties?.name.includes("Direction of attack")
            // remove all markers
            && feature.geometry.type !== "Point"
    })

    return json;
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
    emit('update', formatGeoJson(geojson.value as FeatureCollection));
}

watch(selectedDate, (newVal) => {
    if (newVal) {
        loadGeoJson(newVal);
    }
})

onMounted(() => {
    loadDates()
});
</script>

<template>
    <div class="border rounded-xl p-3">
        <img src="./logo.svg" alt="DeepState Map" class="w-20 h-20" />

        <Label>Select a date</Label>

        <div class="mt-1">
            <Select v-model="selectedDate">
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>

                <SelectContent>
                    <div class="p-2">
                        <Input v-model="searchQuery" type="text" placeholder="Search..."
                            class="w-full px-2 py-1 border rounded" />
                    </div>

                    <SelectGroup>
                        <SelectItem v-for="date in filteredDates" :key="date.createdAt" :value="date.createdAt">
                            {{ date.createdAt }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    </div>
</template>