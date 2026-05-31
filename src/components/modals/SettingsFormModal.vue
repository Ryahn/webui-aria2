<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { computed, ref, watch } from "vue";
import type { SettingsMap } from "../../api/aria2-types";

const props = defineProps<{
  open: boolean;
  title: string;
  settingsMap: SettingsMap;
  modelValue: Record<string, string>;
  keys: string[];
  large?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [values: Record<string, string>];
}>();

const local = ref<Record<string, string>>({ ...props.modelValue });
const search = ref("");

watch(
  () => props.modelValue,
  (v) => {
    local.value = { ...v };
  },
  { deep: true }
);

const filteredKeys = computed(() => {
  const q = search.value.toLowerCase();
  return props.keys.filter((k) => !q || k.includes(q) || props.settingsMap[k]?.desc?.toLowerCase().includes(q));
});

function save(): void {
  emit("save", { ...local.value });
  emit("close");
}
</script>

<template>
  <Dialog :open="open" class="relative z-50" @close="emit('close')">
    <div class="modal-overlay" aria-hidden="true" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel" :class="large && 'modal-panel-lg'">
        <DialogTitle class="mb-4 text-lg font-semibold">{{ title }}</DialogTitle>

        <input v-model="search" type="search" class="input mb-4" placeholder="Search settings..." />

        <div class="max-h-[50vh] space-y-3 overflow-y-auto">
          <div v-for="key in filteredKeys" :key="key">
            <label class="mb-1 block text-sm font-medium">{{ key }}</label>
            <select
              v-if="settingsMap[key]?.options"
              v-model="local[key]"
              class="input"
            >
              <option value="">— unset —</option>
              <option v-for="opt in settingsMap[key].options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
            <input
              v-else
              v-model="local[key]"
              type="text"
              class="input"
              :placeholder="String(settingsMap[key]?.val ?? '')"
            />
            <p class="mt-1 text-xs text-muted">{{ settingsMap[key]?.desc }}</p>
            <p v-if="key === 'seed-time'" class="mt-1 text-xs text-warning">
              Leave empty to omit (unlimited seeding per ratio). Set 0 to disable seeding after complete.
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
          <button type="button" class="btn btn-primary" @click="save">Save</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
