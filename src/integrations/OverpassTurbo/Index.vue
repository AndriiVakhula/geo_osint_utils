<script setup lang="ts">
import { ref } from 'vue'
import { featureCollection, lineString } from '@turf/turf';
import { Input } from '@/components/ui/input';
import Combobox, { type ComboOption } from '@/components/Combobox.vue';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button';
import DownloadKmlButton from '@/components/DownloadKmlButton.vue';

const powerLinesData = ref<any[]>([])
const searchArea = ref<string>("");
const voltage = ref<string>("");

const emit = defineEmits(['update']);

const voltageOptions: ComboOption[] = [
    { value: "10000", label: "10кв" },
    { value: "35000", label: "35кв" },
    { value: "110000", label: "110кв" },
    { value: "220000", label: "220кв" },
];

function overpassWayToGeoJSON(overpassWay: any) {
    const coordinates = overpassWay.geometry.map((node: any) => [node.lon, node.lat]);
    const properties = {
        id: overpassWay.id,
        osm_type: overpassWay.type,
        name: overpassWay.tags.name,
        'stroke': '0000FF',
        ...overpassWay.tags,
    };
    const geoJsonFeature = lineString(coordinates, properties);
    return geoJsonFeature
}

async function getPowerLines(areaName: string, voltage: string) {
    const overpassQuery = `
        [out:json][timeout:180];
        area
            ["boundary"="administrative"]
            ["admin_level"="4"]
            ["name:uk"="${areaName}"]->.searchArea;
        (
            way["power"="line"]["voltage"="${voltage}"](area.searchArea);
        );
        out geom;
    >;
    out skel qt;
`
    const url = 'https://overpass-api.de/api/interpreter'
    const params = new URLSearchParams()
    params.append('data', overpassQuery)

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
        })

        if (!response.ok) {
            throw new Error(`Overpass error: ${response.statusText}`)
        }

        const data = await response.json()
        const geoJsonData: any[] = [];

        data.elements.forEach((element: any) => {
            if (element.type === 'way') {
                geoJsonData.push(overpassWayToGeoJSON(element))
            }
        });
        powerLinesData.value = geoJsonData;
        emit('update', "owerpassPoverLine" , featureCollection(geoJsonData));
    } catch (err) {
        console.error('Error fetching Overpass data:', err)
        powerLinesData.value = []
    }
}
</script>

<template>
    <Accordion type="single" class="w-full" collapsible>
        <AccordionItem value="depstate">
            <AccordionTrigger>
                <h2 class="text-xl font-bold">Overpass Turbo</h2>
            </AccordionTrigger>

            <AccordionContent>
                <Input class="mb-2" v-model="searchArea" placeholder="Search area (Донецька область, etc)" />
                <Combobox class="mr-3" v-model="voltage" :options="voltageOptions" label="Select Voltage" />

                <div class="flex justify-end mt-2">
                    <Button @click="getPowerLines(searchArea, voltage)":disabled="!searchArea.length || !voltage.length" class="mr-1">Get Power Lines</Button>

                    <DownloadKmlButton file-name="overpassturbo" :geoJson="featureCollection(powerLinesData ?? [])" />
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>
