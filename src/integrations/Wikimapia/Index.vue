<script lang="ts" setup>
import { defineProps, defineEmits, ref, onMounted, watch } from 'vue';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { featureCollection } from '@turf/turf';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Combobox from '@/components/Combobox.vue';
import * as categoriesList from './categories.json';
import DownloadKmlButton from '../../components/DownloadKmlButton.vue';
import type { Feature } from 'geojson';

interface WikiMapiaPlace {
    id: number;
    polygon: { x: number; y: number }[];
    language_iso: string;
    name: string;
}

const API_URL = 'http://api.wikimapia.org/';

const emit = defineEmits(['update']);
const props = defineProps<{
    leftLat: number;
    rightLat: number;
    topLon: number;
    bottomLon: number;
}>();

const apiKey = ref('');
const isApiKeyInvalid = ref(false);
const category = ref('');
const pointsData = ref<Feature[] | null>(null);

const categories = JSON.parse(JSON.stringify(categoriesList)).default;

watch(apiKey, () => {
    isApiKeyInvalid.value = false;
});

const loadPlaces = async () => {
    localStorage.setItem('wikimapiaApiKey', apiKey.value);

    const fetchPlaces = async (
        page = 1,
        accumulated: WikiMapiaPlace[] = []
    ): Promise<WikiMapiaPlace[]> => {
        const queryUrl = `${API_URL}/?key=${apiKey.value}&function=box&coordsby=bbox` +
            `&bbox=${props.leftLat},${props.bottomLon},${props.rightLat},${props.topLon}` +
            `&category=${category.value}&count=100&page=${page}&format=json`;

        try {
            const response = await fetch(queryUrl);

            const data = await response.json();
            if (data.debug?.code === 1004) {
                isApiKeyInvalid.value = true;
                throw new Error('API key is invalid');
            }

            const currentPageResults = data.folder as WikiMapiaPlace[];
            const allResults = accumulated.concat(currentPageResults);

            const totalPages = Math.ceil(data.found / 100);
            if (page < totalPages) {
                return fetchPlaces(page + 1, allResults);
            }

            return allResults;
        } catch (error) {
            console.error('Error fetching places:', error);
            throw error;
        }
    };

    try {
        const allPlaces = await fetchPlaces();

        const uniquePlaces: WikiMapiaPlace[] = Array.from(
            new Set(allPlaces.map((place) => place.id))
        ).map((id) => allPlaces.find((place) => place.id === id) as WikiMapiaPlace);

        const points: Feature[] = uniquePlaces.map((item) => {
            const pointCoordinates: [number, number, number] = [
                item.polygon[0].x,
                item.polygon[0].y,
                0,
            ];

            const sourceLang = item.language_iso;
            const transUrl = `https://translate.google.fr/?hl=en#${sourceLang}/en/${encodeURI(
                item.name
            )}`;

            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: pointCoordinates,
                },
                properties: {
                    name: item.name,
                    type: category.value,
                    sourceLang,
                    transUrl,
                },
            };
        });

        pointsData.value = points;

        emit('update', featureCollection(points));
    } catch (error) {
        console.error('Error processing places:', error);
    }
};

onMounted(() => {
    apiKey.value = localStorage.getItem('wikimapiaApiKey') || '';
});
</script>

<template>
    <div class="border rounded-xl p-3">
        <img src="./logo.png" alt="wikimapia" class="mb-2" />


        <Alert class="mb-2" variant="destructive" v-if="isApiKeyInvalid">
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>
                You API key is invalid. Please provide a valid API key.
            </AlertDescription>
        </Alert>


        <div class="flex mb-2">
            <Combobox class="mr-3" v-model="category" :options="categories" label="Select category" />

            <div class="w-full">
                <Label>API key</Label>
                <Input class="mt-1" placeholder="API key" v-model="apiKey" />
            </div>
        </div>

        <div class="flex justify-end">
            <Button class="mr-1" :disabled="!category" @click="loadPlaces">
                Load places
            </Button>

            <DownloadKmlButton file-name="wikimapia" :geoJson="featureCollection(pointsData ?? [])" />
        </div>
    </div>
</template>