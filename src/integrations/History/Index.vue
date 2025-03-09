<script lang="ts" setup>
import { type Ref,ref, watch, defineEmits, watchEffect } from 'vue';
import type { DateRange } from 'reka-ui'
import { featureCollection } from '@turf/turf'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input';
import { CalendarIcon } from 'lucide-vue-next'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Feature } from 'geojson'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { CalendarDate } from '@internationalized/date'
import { useDebounce } from '@/utils/useDebounce';
import { parseCoordinates } from '@/utils/parseCoordinates';

const HISTORY_KEY = "history";
const SHEET_TSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTeKw2iYbEK_NihjyA78sJMXOVpoRGETxE00GVLBFHL8wz8aTGrA8-k-ojt8nI3NrhErogk-gAMwP26/pub?gid=1893012681&single=true&output=tsv";

interface Record {
    [key: string]: string;
}

let records: Record[] = []
const search = ref('');

const date = ref({
  start: undefined,
  end: undefined,
}) as Ref<DateRange>

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
                    Дата: ${item['ЗАПОВНЮЄТЬСЯ ЗВІТУЮЧИМ!\r']}
                `,
            },
        }

        points.push(point as Feature)
    })

    return points;
}

const debouncedSearch = useDebounce(search, 600)
watchEffect(() => {
    if (shouldReturnEmptyCollection()) {
        emit('update', HISTORY_KEY, featureCollection([]))
        return;
    }

    const filteredData = filterRecords();
    emit('update', HISTORY_KEY, featureCollection(parseItemsToPoints(filteredData)))
});

function shouldReturnEmptyCollection(): boolean {
    return !showFullHistory.value && !debouncedSearch.value.length;
}

function filterRecords(): Record[] {
    if (showFullHistory.value && (!date.value.start && !date.value.end)) {
        return records;
    }

    return records.filter((item) => {
        const isSearchMatch = item['підрозділ'].includes(debouncedSearch.value);

        if (date.value.start && date.value.end) {
            const pointDate = getDateFromRecord(item);
            const dateRange = getDateRange();

            if (showFullHistory.value) {
                return isWithinDateRange(pointDate, dateRange);
            }

            return isWithinDateRange(pointDate, dateRange) && isSearchMatch;
        }

        return isSearchMatch;
    });
}

function getDateFromRecord(item: Record): CalendarDate {
    const [year, month, day] = item['ЗАПОВНЮЄТЬСЯ ЗВІТУЮЧИМ!\r']?.trim().split('.').reverse();
    return new CalendarDate(+year, +month, +day);
}

function getDateRange() {
    const startDate = new CalendarDate(
        date.value.start?.year ?? 0,
        (date.value.start?.month ?? 0) - 1,
        date.value.start?.day ?? 0
    );

    const endDate = new CalendarDate(
        date.value.end?.year ?? 0,
        (date.value.end?.month ?? 0) - 1,
        date.value.end?.day ?? 0
    );

    return { startDate, endDate };
}

function isWithinDateRange(pointDate: CalendarDate, dateRange: { startDate: CalendarDate, endDate: CalendarDate }): boolean {
    return pointDate >= dateRange.startDate && pointDate <= dateRange.endDate;
}
</script>

<template>
    <Accordion type="single" class="w-full" collapsible>
        <AccordionItem value="depstate">
            <AccordionTrigger>
            <h2 class="text-xl font-bold">Unit history</h2>
            </AccordionTrigger>

            <AccordionContent>
                <div class="mb-2">
                    <Checkbox
                        :disabled="Boolean(search.length)"
                        id="fullHistory"
                        label="Show all unit history"
                        @update:checked="showFullHistory = $event"
                    />

                    <label
                        for="fullHistory"
                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                       >
                        Show all unit history
                    </label>
                </div>

                <Popover>
                    <PopoverTrigger class="w-full">
                        <Button variant="outline" size="sm" class="w-full">

                        <template v-if="date?.start && date.end">
                            {{ date.start.toString() }} - {{ date.end?.toString() }}

                            <CalendarIcon class="mr-2 h-4 w-4" />
                        </template>

                        <template v-else>
                            Select date range
                            <CalendarIcon class="mr-2 h-4 w-4" />
                        </template>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <RangeCalendar v-model="date" />
                    </PopoverContent>
                </Popover>

                <div class="mt-2">
                    <Input v-model="search" :disabled="showFullHistory" placeholder="Unit name" />
                </div>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
</template>
