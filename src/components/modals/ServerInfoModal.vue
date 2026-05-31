<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import { useConnectionStore } from "../../stores/connection";
import { useUiStore } from "../../stores/ui";

const { t } = useI18n();
const ui = useUiStore();
const connection = useConnectionStore();

watch(
  () => ui.activeModal,
  (modal) => {
    if (modal === "serverInfo") connection.refreshServerInfo();
  }
);
</script>

<template>
  <Dialog :open="ui.activeModal === 'serverInfo'" class="relative z-50" @close="ui.closeModal()">
    <div class="modal-overlay" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel">
        <DialogTitle class="mb-4 text-lg font-semibold">{{ t("Server info") }}</DialogTitle>
        <dl class="space-y-2 text-sm">
          <div><dt class="text-muted">Version</dt><dd>{{ connection.version || "—" }}</dd></div>
          <div>
            <dt class="text-muted">Features</dt>
            <dd class="mt-1 flex flex-wrap gap-1">
              <span v-if="!connection.enabledFeatures.length" class="text-muted">—</span>
              <span v-for="f in connection.enabledFeatures" :key="f" class="badge badge-active">{{ f }}</span>
            </dd>
          </div>
          <div><dt class="text-muted">Status</dt><dd>{{ connection.status }}</dd></div>
          <div>
            <dt class="text-muted">RPC</dt>
            <dd>{{ connection.config.host }}:{{ connection.config.port }}{{ connection.config.path }}</dd>
          </div>
        </dl>
        <div class="mt-6 flex justify-end">
          <button type="button" class="btn btn-secondary" @click="ui.closeModal()">{{ t("Cancel") }}</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
