<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { addMetalinks } from "../../api/aria2-actions";
import { getRpcErrorMessage } from "../../api/aria2-types";
import { useUiStore } from "../../stores/ui";

const { t } = useI18n();
const ui = useUiStore();
const files = ref<FileList | null>(null);
const text = ref("");
const submitError = ref("");

function trackBatch(count: number, onDone: () => void): (data: Parameters<typeof getRpcErrorMessage>[0]) => void {
  let pending = count;
  let hadError = false;

  return (data) => {
    pending--;
    const err = getRpcErrorMessage(data);
    if (err) {
      hadError = true;
      submitError.value = submitError.value ? `${submitError.value}\n${err}` : err;
    }
    if (pending === 0 && !hadError) onDone();
  };
}

async function submit(): Promise<void> {
  submitError.value = "";

  if (text.value.trim()) {
    const blob = new File([text.value], "metalink.meta4", { type: "application/metalink+xml" });
    await addMetalinks([blob], {}, trackBatch(1, () => {
      ui.closeModal();
      text.value = "";
    }));
    return;
  }

  if (!files.value?.length) return;
  const list = Array.from(files.value);
  await addMetalinks(list, {}, trackBatch(list.length, () => {
    ui.closeModal();
    files.value = null;
  }));
}
</script>

<template>
  <Dialog :open="ui.activeModal === 'addMetalink'" class="relative z-50" @close="ui.closeModal()">
    <div class="modal-overlay" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel">
        <DialogTitle class="mb-4 text-lg font-semibold">{{ t("Add Downloads By Metalinks") }}</DialogTitle>
        <input type="file" accept=".metalink,.meta4,.xml" multiple class="mb-4" @change="files = ($event.target as HTMLInputElement).files" />
        <label class="mb-1 block text-sm">Or paste metalink XML</label>
        <textarea v-model="text" rows="5" class="input" />
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
