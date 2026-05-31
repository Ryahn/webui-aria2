<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { DownloadItem } from "../../api/aria2-types";
import { formatBytes, formatSpeed } from "../../utils/helpers";
import { useConnectionStore } from "../../stores/connection";
import { useDownloadsStore } from "../../stores/downloads";
import { useUiStore } from "../../stores/ui";
import ChunkBar from "./ChunkBar.vue";

const props = defineProps<{ download: DownloadItem; listType: "active" | "waiting" | "stopped" }>();

const { t } = useI18n();
const downloads = useDownloadsStore();
const connection = useConnectionStore();
const ui = useUiStore();

const progress = computed(() => downloads.progress(props.download));

const isSeeding = computed(() => {
  const d = props.download;
  if (d.status !== "active" || !d.bittorrent) return false;
  const total = Number(d.totalLength);
  const completed = Number(d.completedLength);
  return total > 0 && completed >= total;
});

const statusLabel = computed(() => {
  if (isSeeding.value) return t("Seeding");
  const s = props.download.status;
  if (s === "active") return t("Active");
  if (s === "waiting") return t("Waiting");
  if (s === "paused") return t("Paused");
  if (s === "complete") return t("Complete");
  if (s === "error") return t("Error");
  if (s === "removed") return t("Removed");
  return s;
});

const badgeClass = computed(() => {
  if (isSeeding.value) return "badge-waiting";
  const s = props.download.status;
  if (s === "active") return "badge-active";
  if (s === "error") return "badge-error";
  if (s === "waiting" || s === "paused") return "badge-waiting";
  if (s === "complete") return "badge-active";
  return "";
});

function directUrl(path: string): string | null {
  const base = connection.directURL;
  if (!base) return null;
  return base.replace(/\/?$/, "/") + path.replace(/^\//, "");
}
</script>

<template>
  <div class="card mb-3 overflow-hidden">
    <div class="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
      <input
        type="checkbox"
        class="shrink-0"
        :checked="downloads.isSelected(download.gid)"
        :aria-label="`Select ${download.name}`"
        @change="downloads.toggleSelected(download.gid)"
      />
      <span class="badge" :class="badgeClass">{{ statusLabel }}</span>
      <span class="min-w-0 flex-1 truncate font-medium" :title="download.name">{{ download.name }}</span>
      <div class="flex flex-wrap gap-1">
        <button
          v-if="listType === 'active' && !isSeeding"
          type="button"
          class="btn btn-secondary"
          @click="downloads.pause(download)"
        >
          Pause
        </button>
        <button
          v-if="download.status === 'paused' || listType === 'waiting'"
          type="button"
          class="btn btn-secondary"
          @click="downloads.resume(download)"
        >
          ▶
        </button>
        <button v-if="listType === 'waiting'" type="button" class="btn btn-secondary" @click="downloads.moveUp(download)">↑</button>
        <button v-if="listType === 'waiting'" type="button" class="btn btn-secondary" @click="downloads.moveDown(download)">↓</button>
        <button
          v-if="download.bittorrent && listType !== 'stopped'"
          type="button"
          class="btn btn-secondary"
          @click="ui.fileSelectGid = download.gid; ui.openModal('fileSelect')"
        >
          {{ t("Toggle") }}
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :title="t('Download settings')"
          @click="ui.openDownloadSettings(download.gid)"
        >
          ⚙
        </button>
        <button type="button" class="btn btn-secondary" @click="downloads.toggleExpanded(download)">
          {{ download.expanded ? "−" : "+" }}
        </button>
        <button type="button" class="btn btn-danger" @click="downloads.remove(download)">
          {{ t("Remove") }}
        </button>
      </div>
    </div>

    <div class="px-4 py-3">
      <div class="mb-2 h-2 overflow-hidden rounded-full bg-border">
        <div class="h-full bg-primary transition-all" :style="{ width: `${progress}%` }" />
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>{{ formatBytes(download.completedLength) }} / {{ formatBytes(download.totalLength) }}</span>
        <span v-if="listType === 'active'">↓ {{ formatSpeed(download.downloadSpeed) }}</span>
        <span v-if="listType === 'active'">↑ {{ formatSpeed(download.uploadSpeed) }}</span>
        <span>{{ progress.toFixed(1) }}%</span>
        <span v-if="download.errorMessage" class="text-danger">{{ download.errorMessage }}</span>
      </div>
      <ChunkBar
        v-if="download.bitfield && download.numPieces"
        class="mt-2"
        :bitfield="download.bitfield"
        :num-pieces="download.numPieces"
      />
    </div>

    <div v-if="download.expanded" class="border-t border-border bg-surface-elevated px-4 py-3 text-sm">
      <p class="text-muted">GID: {{ download.gid }}</p>
      <p class="text-muted">Dir: {{ download.dir }}</p>
      <ul v-if="download.files?.length" class="mt-2 space-y-1">
        <li v-for="file in download.files" :key="file.index" class="flex items-center gap-2">
          <span
            class="h-2 w-2 rounded-full"
            :class="file.completedLength === file.length ? 'bg-success' : 'bg-border'"
          />
          <span class="min-w-0 flex-1 truncate">{{ file.path }}</span>
          <a
            v-if="directUrl(file.path) && file.completedLength === file.length"
            :href="directUrl(file.path)!"
            class="text-primary hover:underline"
            target="_blank"
            rel="noopener"
          >
            ↓
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
