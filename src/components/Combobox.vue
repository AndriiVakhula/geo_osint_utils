<script setup lang="ts">
import { ref, defineModel, defineProps, computed } from 'vue'
import { useDebounce } from '@/utils/useDebounce'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-vue-next'

export type ComboOption = { value: string; label: string }

const props = defineProps<{
    options: ComboOption[]
    label?: string
}>()

const model = defineModel<string>({ default: '' })

const open = ref(false)
const searchQuery = ref('')

const debouncedSearch = useDebounce(searchQuery, 300)

const filteredOptions = computed(() => {
    if (!props.options) return []
    return props.options
        .filter((option) =>
            option.label.toLowerCase().includes(debouncedSearch.value.toLowerCase())
        )
        .slice(0, 100)
})
</script>

<template>
    <div>
        <Label>{{ label }}</Label>

        <div class="mt-1">
            <Popover v-model:open="open">
                <PopoverTrigger as-child>
                    <Button variant="outline" role="combobox" :aria-expanded="open" class="w-full justify-between">
                        {{
                            model
                                ? options?.find((option) => option.value.toString() === model)?.label
                                : 'Select...'
                        }}
                        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                <PopoverContent class="w-96 p-0">
                    <Command>
                        <CommandInput class="h-9" placeholder="Search..." @input="searchQuery = $event.target.value" />
                        <CommandEmpty>No Options found.</CommandEmpty>

                        <CommandList>
                            <CommandGroup>
                                <CommandItem v-for="option in filteredOptions" :key="option.value" :value="option.value"
                                    @select="(ev) => {
                                        if (ev.detail.value) {
                                            model = ev.detail.value.toString()
                                        }
                                        open = false
                                    }">
                                    {{ option.label }}

                                    <Check :class="cn(
                                        'ml-auto h-4 w-4',
                                        model === option.value ? 'opacity-100' : 'opacity-0',
                                    )" />
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    </div>
</template>
