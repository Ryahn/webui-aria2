<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { addTorrents } from "../../api/aria2-actions";
import { getRpcErrorMessage } from "../../api/aria2-types";
import { useUiStore } from "../../stores/ui";

const { t } = useI18n();
const ui = useUiStore();
const files = ref<FileList | null>(null);
const droppedFiles = ref<File[]>([]);
const submitError = ref("");

watch(
  () => ui.activeModal,
  (modal) => {
    if (modal === "addTorrent") {
      const pending = ui.consumePendingTorrentFiles();
      if (pending.length) droppedFiles.value = pending;
    }
  }
);

async function submit(): Promise<void> {
  const list = droppedFiles.value.length
    ? droppedFiles.value
    : files.value?.length
      ? Array.from(files.value)
      : [];
  if (!list.length) return;

  submitError.value = "";
  let pending = list.length;
  let hadError = false;

  await addTorrents(list, {}, (data) => {
    pending--;
    const err = getRpcErrorMessage(data);
    if (err) {
      hadError = true;
      submitError.value = submitError.value ? `${submitError.value}\n${err}` : err;
    }
    if (pending === 0 && !hadError) {
      ui.closeModal();
      files.value = null;
      droppedFiles.value = [];
    }
  });
}
</script>

<template>
  <Dialog :open="ui.activeModal === 'addTorrent'" class="relative z-50" @close="ui.closeModal()">
    <div class="modal-overlay" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel">
        <DialogTitle class="mb-4 text-lg font-semibold">{{ t("Add Downloads By Torrents") }}</DialogTitle>
        <p v-if="droppedFiles.length" class="mb-2 text-sm text-muted">
          {{ droppedFiles.length }} torrent file(s) ready from drag-and-drop
        </p>
        <input type="file" accept=".torrent,application/x-bittorrent" multiple @change="files = ($event.target as HTMLInputElement).files" />
        <p v-if="submitError" class="mt-4 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {{ submitError }}
        </p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="ui.closeModal()">{{ t("Cancel") }}</button>
          <button type="button" class="btn btn-primary" @click="submit">{{ t("Start") }}</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
