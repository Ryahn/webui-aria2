<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { useI18n } from "vue-i18n";
import { useUiStore } from "../../stores/ui";

const { t } = useI18n();
const ui = useUiStore();
</script>

<template>
  <Dialog :open="ui.activeModal === 'about'" class="relative z-50" @close="ui.closeModal()">
    <div class="modal-overlay" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel">
        <DialogTitle class="mb-4 text-lg font-semibold">{{ t("About") }}</DialogTitle>
        <p class="text-sm text-muted">
          Aria2 WebUI — modern Vue 3 interface for
          <a href="https://aria2.github.io/" class="text-primary hover:underline" target="_blank" rel="noopener">aria2</a>.
        </p>
        <p class="mt-4 text-sm text-muted">
          Source:
          <a href="https://github.com/ziahamza/webui-aria2" class="text-primary hover:underline" target="_blank" rel="noopener">webui-aria2</a>
        </p>
        <div class="mt-6 flex justify-end">
          <button type="button" class="btn btn-secondary" @click="ui.closeModal()">Close</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
