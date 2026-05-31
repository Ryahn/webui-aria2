<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { DownloadItem } from "../../api/aria2-types";
import { PAGE_SIZE } from "../../config/app-config";
import { useDownloadsStore } from "../../stores/downloads";
import DownloadRow from "./DownloadRow.vue";

const props = defineProps<{
  title: string;
  items: DownloadItem[];
  listType: "active" | "waiting" | "stopped";
  search: string;
}>();

const { t } = useI18n();
const downloads = useDownloadsStore();
const page = ref(1);

const filtered = computed(() => {
  if (!props.search.trim()) return props.items;
  const q = props.search.toLowerCase();
  return props.items.filter(
    (d) => d.name?.toLowerCase().includes(q) || d.gid.toLowerCase().includes(q)
  );
});

const sorted = computed(() => downloads.sortItems(filtered.value));

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)));

const paged = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return sorted.value.slice(start, start + PAGE_SIZE);
});

const allPageSelected = computed(() =>
  paged.value.length > 0 && paged.value.every((d) => downloads.isSelected(d.gid))
);

function prev(): void {
  page.value = Math.max(1, page.value - 1);
}

function next(): void {
  page.value = Math.min(totalPages.value, page.value + 1);
}

function togglePageSelection(): void {
  if (allPageSelected.value) {
    for (const d of paged.value) {
      if (downloads.isSelected(d.gid)) downloads.toggleSelected(d.gid);
    }
  } else {
    for (const d of paged.value) {
      if (!downloads.isSelected(d.gid)) downloads.toggleSelected(d.gid);
    }
  }
}
</script>

<template>
  <section class="mb-8">
    <div class="mb-3 flex flex-wrap items-center gap-3">
      <h2 class="text-lg font-semibold text-text">
        {{ title }}
        <span class="text-sm font-normal text-muted">({{ filtered.length }})</span>
      </h2>
      <label v-if="paged.length" class="ml-auto flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" :checked="allPageSelected" @change="togglePageSelection" />
        Select page
      </label>
    </div>

    <p v-if="!filtered.length" class="text-sm text-muted">
      {{ t("Currently no download in line to display, use the") }}
      {{ t("download button to start downloading files!") }}
    </p>

    <DownloadRow
      v-for="item in paged"
      :key="item.gid"
      :download="item"
      :list-type="listType"
    />

    <div v-if="totalPages > 1" class="mt-3 flex items-center justify-center gap-3 text-sm">
      <button type="button" class="btn btn-secondary" :disabled="page <= 1" @click="prev">‹</button>
      <span>{{ t("Displaying") }} {{ page }} {{ t("of") }} {{ totalPages }}</span>
      <button type="button" class="btn btn-secondary" :disabled="page >= totalPages" @click="next">›</button>
    </div>
  </section>
</template>
