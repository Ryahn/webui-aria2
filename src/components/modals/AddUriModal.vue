<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { addUris, parseCligetCommand } from "../../api/aria2-actions";
import { getRpcErrorMessage } from "../../api/aria2-types";
import { DOWNLOAD_PROPS } from "../../config/app-config";
import { parseUriLines } from "../../utils/helpers";
import { useSettingsStore } from "../../stores/settings";
import { useUiStore } from "../../stores/ui";
import SettingsFormModal from "./SettingsFormModal.vue";

const { t } = useI18n();
const ui = useUiStore();
const settings = useSettingsStore();

const uris = ref("");
const cliget = ref("");
const showAdvanced = ref(false);
const downloadOptions = ref<Record<string, string>>({});
const submitError = ref("");

const optionKeys = Object.keys(settings.fileSettingsMap).filter((k) =>
  DOWNLOAD_PROPS.includes(k) || showAdvanced.value
);

function submit(): void {
  const lines = parseUriLines(uris.value);
  if (!lines.length && cliget.value.trim()) {
    const parsed = parseCligetCommand(cliget.value);
    if (parsed.uris.length) lines.push(parsed);
  }
  if (!lines.length) return;

  submitError.value = "";
  let pending = lines.length;
  let hadError = false;

  addUris(lines, downloadOptions.value, (data) => {
    pending--;
    const err = getRpcErrorMessage(data);
    if (err) {
      hadError = true;
      submitError.value = submitError.value ? `${submitError.value}\n${err}` : err;
    }
    if (pending === 0 && !hadError) {
      ui.closeModal();
      uris.value = "";
      cliget.value = "";
    }
  });
}

function openAdvanced(): void {
  showAdvanced.value = true;
}

watch(
  () => ui.activeModal,
  (modal) => {
    if (modal === "addUri") {
      const pending = ui.consumePendingUris();
      if (pending) uris.value = pending;
    }
  }
);
</script>

<template>
  <Dialog :open="ui.activeModal === 'addUri'" class="relative z-50" @close="ui.closeModal()">
    <div class="modal-overlay" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel modal-panel-lg">
        <DialogTitle class="mb-2 text-lg font-semibold">{{ t("Add Downloads By URIs") }}</DialogTitle>
        <p class="mb-4 text-sm text-muted">
          {{ t("- You can add multiple downloads (files) at the same time by putting URIs for each file on a separate line.") }}
        </p>

        <label class="mb-1 block text-sm font-medium">URIs (one per line)</label>
        <textarea v-model="uris" rows="6" class="input mb-4 font-mono text-xs" />

        <label class="mb-1 block text-sm font-medium">Cliget command (optional)</label>
        <textarea
          v-model="cliget"
          rows="4"
          class="input mb-1 font-mono text-xs"
          placeholder="Paste aria2c command from cliget — headers, cookies, and -x/-s flags are parsed automatically"
        />
        <p class="mb-4 text-xs text-muted">
          Supports multiple <code class="rounded bg-surface px-1">--header</code> flags, quoted cookies, and
          <code class="rounded bg-surface px-1">--referer</code> / <code class="rounded bg-surface px-1">--user-agent</code>.
        </p>

        <div class="mb-4 flex gap-2">
          <button type="button" class="btn btn-secondary" @click="openAdvanced">
            {{ t("Advanced settings") }}
          </button>
        </div>

        <p v-if="submitError" class="mb-4 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {{ submitError }}
        </p>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="ui.closeModal()">{{ t("Cancel") }}</button>
          <button type="button" class="btn btn-primary" @click="submit">{{ t("Start") }}</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>

  <SettingsFormModal
    :open="showAdvanced"
    :title="t('Download settings')"
    :settings-map="settings.fileSettingsMap"
    :model-value="downloadOptions"
    :keys="optionKeys"
    large
    @close="showAdvanced = false"
    @save="(v) => { downloadOptions = v; showAdvanced = false; }"
  />
</template>
