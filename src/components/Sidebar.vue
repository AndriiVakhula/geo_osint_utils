<script lang="ts" setup>
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'

import { ref } from 'vue'

const isOpen = ref(true)
</script>

<template>
    <Button
        variant="outline"
        size="icon"
        class="absolute bottom-3 right-3 z-50"
        @click="isOpen = !isOpen"
    >
        <ChevronRight v-if="isOpen" class="w-4 h-4" />
        <ChevronLeft v-else class="w-4 h-4" />
    </Button>

    <div
        class="absolute right-0 top-0 bottom-0 bg-background z-40 border overflow-hidden flex flex-col pb-14"
        :class="{
            'w-0 p-0': !isOpen,
            'p-3 w-3/12': isOpen,
        }"
    >
        <div>
            <slot />
        </div>

        <div class="mt-auto">
            <slot name="footer" />
        </div>
    </div>
</template>
