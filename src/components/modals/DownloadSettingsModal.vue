<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { rpcClient } from "../../api/rpc-client";
import { getRpcErrorMessage } from "../../api/aria2-types";
import { buildOptionChanges, getDownloadSettingsKeys } from "../../utils/download-settings";
import { useAlertStore } from "../../stores/alerts";
import { useDownloadsStore } from "../../stores/downloads";
import { useSettingsStore } from "../../stores/settings";
import { useUiStore } from "../../stores/ui";
import SettingsFormModal from "./SettingsFormModal.vue";

const { t } = useI18n();
const ui = useUiStore();
const settings = useSettingsStore();
const downloads = useDownloadsStore();
const alerts = useAlertStore();

const options = ref<Record<string, string>>({});
const snapshot = ref<Record<string, string>>({});
const loading = ref(false);
const loadError = ref("");

const gid = computed(() => ui.downloadSettingsGid);
const download = computed(() => (gid.value ? downloads.findByGid(gid.value) : undefined));
const listType = computed(() => (download.value ? downloads.getType(download.value) : "stopped"));

const keys = computed(() =>
  getDownloadSettingsKeys(listType.value, Object.keys(settings.fileSettingsMap))
);

const title = computed(() => {
  const name = download.value?.name ?? gid.value ?? "";
  return name ? `${name} — ${t("Download settings")}` : t("Download settings");
});

const isOpen = computed(() => ui.activeModal === "downloadSettings" && !!gid.value);

function loadOptions(): void {
  if (!gid.value) return;

  loading.value = true;
  loadError.value = "";
  options.value = {};
  snapshot.value = {};

  rpcClient.once("getOption", [gid.value], (data) => {
    loading.value = false;
    const err = getRpcErrorMessage(data);
    if (err) {
      loadError.value = err;
      return;
    }

    const vals = (data.result as Record<string, string>) ?? {};
    snapshot.value = { ...vals };
    options.value = { ...vals };
  });
  rpcClient.forceUpdate();
}

function save(values: Record<string, string>): void {
  if (!gid.value) return;

  const changes = buildOptionChanges(values, snapshot.value);
  if (!Object.keys(changes).length) {
    ui.closeModal();
    return;
  }

  rpcClient.once("changeOption", [gid.value, changes], (data) => {
    const err = getRpcErrorMessage(data);
    if (err) {
      alerts.add(err, "error");
      return;
    }
    alerts.add("Download settings updated", "success");
    ui.closeModal();
  });
  rpcClient.forceUpdate();
}

watch(
  () => [ui.activeModal, gid.value] as const,
  ([modal, id]) => {
    if (modal === "downloadSettings" && id) loadOptions();
  }
);
</script>

<template>
  <div v-if="isOpen && loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <p class="rounded-lg bg-surface px-6 py-4 text-sm text-text">Loading download options…</p>
  </div>

  <div
    v-else-if="isOpen && loadError"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  >
    <div class="modal-panel max-w-md">
      <p class="mb-4 text-sm text-danger">{{ loadError }}</p>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn btn-secondary" @click="ui.closeModal()">{{ t("Cancel") }}</button>
        <button type="button" class="btn btn-primary" @click="loadOptions">Retry</button>
      </div>
    </div>
  </div>

  <SettingsFormModal
    v-else
    :open="isOpen && !loading && !loadError"
    :title="title"
    :settings-map="settings.fileSettingsMap"
    :model-value="options"
    :keys="keys"
    large
    @close="ui.closeModal()"
    @save="save"
  />
</template>
