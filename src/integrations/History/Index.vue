<script lang="ts" setup>
import { ref, watch, defineEmits } from 'vue'
import { featureCollection } from '@turf/turf'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input';
import type { Feature } from 'geojson'
import { useDebounce } from '@/utils/useDebounce';

const HISTORY_KEY = "history";
const SHEET_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRZpNiKE8fcAve5vmmyiuvFgUVvAm-sn_QfsV2JXGH1UYUKVM0vEtyZA2iE3lKGuKrw4Poeo-aTXl4L/pub?output=tsv";

interface Record {
    [key: string]: string;
}

let records: Record[] = []
const search = ref('')
const emit = defineEmits(['update'])

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

const debouncedSearch = useDebounce(search, 300)

watch(debouncedSearch, (value) => {
    const filteredData = records.filter((item) => {
        return item['підрозділ'].includes(value)
    })

    const points: Feature[] = filteredData.map((item) => {
        const coordinates = item['Координати'].split(', ').map(Number).reverse();
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [...coordinates, 0],
            },
            properties: {
                name: item['підрозділ'],
            },
        }
    })

    emit('update', HISTORY_KEY, featureCollection(points))
})
</script>

<template>
    <Accordion type="single" class="w-full" collapsible>
        <AccordionItem value="depstate">
            <AccordionTrigger>
            <h2 class="text-xl font-bold">Unit history</h2>
            </AccordionTrigger>

            <AccordionContent>
                <div>
                    <Input v-model="search" />
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>
