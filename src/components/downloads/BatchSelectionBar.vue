<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useDownloadsStore } from "../../stores/downloads";

const { t } = useI18n();
const downloads = useDownloadsStore();
</script>

<template>
  <div
    v-if="downloads.selectionCount > 0"
    class="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg"
  >
    <span class="text-sm font-medium">{{ downloads.selectionCount }} selected</span>
    <button type="button" class="btn btn-secondary" @click="downloads.pauseSelected()">
      {{ t("Pause All") }}
    </button>
    <button type="button" class="btn btn-secondary" @click="downloads.resumeSelected()">
      {{ t("Resume Paused") }}
    </button>
    <button type="button" class="btn btn-danger" @click="downloads.removeSelected()">
      {{ t("Remove") }}
    </button>
    <button type="button" class="btn btn-secondary" @click="downloads.clearSelection()">
      Clear
    </button>
  </div>
</template>
