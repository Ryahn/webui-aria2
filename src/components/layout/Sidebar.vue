<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { ENABLE } from "../../config/app-config";
import {
  notificationsEnabled,
  setNotificationsEnabled,
} from "../../composables/useDownloadNotifications";
import { rpcClient } from "../../api/rpc-client";
import { formatSpeed } from "../../utils/helpers";
import { useDownloadsStore } from "../../stores/downloads";
import type { DownloadSortField } from "../../stores/downloads";
import { useSettingsStore } from "../../stores/settings";
import SpeedGraph from "../charts/SpeedGraph.vue";

const { t } = useI18n();
const downloads = useDownloadsStore();
const settings = useSettingsStore();

const notifyOnComplete = ref(notificationsEnabled());

const sortFields: { value: DownloadSortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "progress", label: "Progress" },
  { value: "speed", label: "Speed" },
];

function onNotifyToggle(): void {
  setNotificationsEnabled(notifyOnComplete.value);
}

function saveStarred(): void {
  const changes: Record<string, string> = {};
  for (const key of settings.starredProps) {
    const val = starredValues.value[key];
    if (val !== undefined && val !== "") changes[key] = val;
  }
  if (Object.keys(changes).length) {
    rpcClient.once("changeGlobalOption", [changes]);
  }
  settings.saveStarredProps(settings.starredProps);
}

const starredValues = ref<Record<string, string>>({});

function syncStarredFromGlobal(): void {
  for (const key of settings.starredProps) {
    starredValues.value[key] = settings.globalOptions[key] ?? "";
  }
}

settings.loadGlobalOptions();
syncStarredFromGlobal();
</script>

<template>
  <aside class="space-y-4">
    <section v-if="ENABLE.sidebar.stats" class="card p-4">
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {{ t("Global Statistics") }}
      </h3>
      <div class="mb-2 flex justify-between text-sm">
        <span>↓ {{ formatSpeed(downloads.globalStat.downloadSpeed) }}</span>
        <span>↑ {{ formatSpeed(downloads.globalStat.uploadSpeed) }}</span>
      </div>
      <SpeedGraph :samples="downloads.speedHistory" />
    </section>

    <section v-if="ENABLE.sidebar.filters" class="card p-4">
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {{ t("Download Filters") }}
      </h3>
      <div class="space-y-2 text-sm">
        <label class="flex items-center gap-2">
          <input v-model="downloads.hideLinkedMetadata" type="checkbox" />
          {{ t("Hide linked meta-data") }}
        </label>
        <label class="flex items-center gap-2">
          <input v-model="notifyOnComplete" type="checkbox" @change="onNotifyToggle" />
          Notify when downloads complete
        </label>
      </div>
    </section>

    <section class="card p-4">
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Sort downloads</h3>
      <div class="flex gap-2">
        <select
          class="input flex-1"
          :value="downloads.sortField"
          @change="downloads.setSort(($event.target as HTMLSelectElement).value as DownloadSortField)"
        >
          <option v-for="f in sortFields" :key="f.value" :value="f.value">{{ f.label }}</option>
        </select>
        <button type="button" class="btn btn-secondary" :title="downloads.sortDir" @click="downloads.toggleSortDir()">
          {{ downloads.sortDir === "asc" ? "↑" : "↓" }}
        </button>
      </div>
    </section>

    <section v-if="ENABLE.sidebar.starredProps && settings.starredProps.length" class="card p-4">
      <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
        {{ t("Quick Access Settings") }}
      </h3>
      <div class="space-y-2">
        <div v-for="key in settings.starredProps" :key="key">
          <label class="mb-1 block text-xs text-muted">{{ key }}</label>
          <input v-model="starredValues[key]" type="text" class="input" />
        </div>
        <button type="button" class="btn btn-primary w-full" @click="saveStarred">
          {{ t("Save settings") }}
        </button>
      </div>
    </section>
  </aside>
</template>
