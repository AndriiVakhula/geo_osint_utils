<script lang="ts" setup>
import { ref, watch, defineEmits } from 'vue'
import { featureCollection } from '@turf/turf'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input';
import type { Feature } from 'geojson'
import { useDebounce } from '@/utils/useDebounce';
import { parseCoordinates } from '@/utils/parseCoordinates';

const HISTORY_KEY = "history";
const SHEET_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeKw2iYbEK_NihjyA78sJMXOVpoRGETxE00GVLBFHL8wz8aTGrA8-k-ojt8nI3NrhErogk-gAMwP26/pub?gid=1893012681&single=true&output=tsv";

interface Record {
    [key: string]: string;
}

let records: Record[] = []
const search = ref('')
const emit = defineEmits(['update'])
const showFullHistory = ref(false);

fetch(SHEET_TSV_URL)
    .then((response) => response.text())
    .then((text) => {
        const rows = text.split('\n')
        const headers = rows[1].split('\t')

        const data = rows
            .slice(2)
            .map((row) => {
                const values = row.split('\t')
                return headers.reduce<Record>((acc, header, index) => {
                    if (values[1] === 'знайдено') {
                        acc[header] = values[index]
                    }
                    return acc
                }, {})
            })
            .filter((item) => Object.keys(item).length > 0)

        records = data
    })

const parseItemsToPoints = (records: any) => {
    const points: Feature[] = [];

    records.forEach((item: any) => {
        const coordinatesData = item['Координати'];

        if (!coordinatesData.length) {
            return null;
        }

        const coordinates = parseCoordinates(coordinatesData);
        console.log(item)
        const point = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [...coordinates, 0],
            },
            properties: {
                name: `
                    Підрозділ: ${item['підрозділ']} <br>
                    Таймкод: ${item['таймкод']}<br>
                    Лінк на відео: <a href="${item['Лінк відео']}">${item['Лінк відео']}</a><br>
                `,
            },
        }

        points.push(point as Feature)
    })

    return points;
}

const debouncedSearch = useDebounce(search, 600)
watch(debouncedSearch, (value) => {
    if (!showFullHistory.value && !value.length) {
        emit('update', HISTORY_KEY, featureCollection([]))
        return;
    }

    const filteredData = records.filter((item) => {
        return item['підрозділ'].includes(value)
    })

    emit('update', HISTORY_KEY, featureCollection(parseItemsToPoints(filteredData)))
});

watch(showFullHistory, (value) => {
    if (value && !debouncedSearch.value.length) {
        emit('update', HISTORY_KEY, featureCollection(parseItemsToPoints(records)))
    } else {
        emit('update', HISTORY_KEY, featureCollection([]))
    }
})
</script>

<template>
    <Accordion type="single" class="w-full" collapsible>
        <AccordionItem value="depstate">
            <AccordionTrigger>
            <h2 class="text-xl font-bold">Unit history</h2>
            </AccordionTrigger>

            <AccordionContent>
                <div class="mb-2">
                    <Checkbox @update:checked="(val) => showFullHistory = val" id="fullHistory" label="Show all unit history" />
                    <label
                         for="fullHistory"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                       >
                        Show all unit history
                    </label>
                </div>

                <div>
                    <Input v-model="search" placeholder="Unit name" />
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>
