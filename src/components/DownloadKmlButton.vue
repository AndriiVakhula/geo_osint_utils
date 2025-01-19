<script setup lang="ts">
import { defineProps } from 'vue';
import type { FeatureCollection } from 'geojson';
import { Button } from '@/components/ui/button';
import convertGeoJSONToKML from '../utils/geoJsonToKml';

const props = defineProps<{
    geoJson: FeatureCollection | null;
    fileName: string;
}>();

const downloadKml = () => {
    if (!props.geoJson || Object.keys(props.geoJson).length === 0) return;

    const kml = convertGeoJSONToKML(props.geoJson as FeatureCollection);

    const blob = new Blob([kml], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${props.fileName}.kml`;
    link.click();
};

</script>

<template>
    <Button :disabled="!geoJson?.features?.length" @click="downloadKml">Download KML</Button>
</template>