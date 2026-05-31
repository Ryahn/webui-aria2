<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { rpcClient } from "../../api/rpc-client";
import type { Aria2File } from "../../api/aria2-types";
import { useUiStore } from "../../stores/ui";

const { t } = useI18n();
const ui = useUiStore();

const files = ref<Aria2File[]>([]);
const selected = ref<Set<string>>(new Set());

onMounted(() => {
  const gid = ui.fileSelectGid;
  if (!gid) return;
  rpcClient.once("getFiles", [gid], (data) => {
    files.value = (data.result as Aria2File[]) ?? [];
    selected.value = new Set(files.value.filter((f) => f.selected === "true").map((f) => f.index));
  });
});

function toggle(index: string): void {
  if (selected.value.has(index)) selected.value.delete(index);
  else selected.value.add(index);
}

function save(): void {
  const gid = ui.fileSelectGid;
  if (!gid) return;
  const indexes = Array.from(selected.value).join(",");
  rpcClient.once("changeOption", [gid, { "select-file": indexes }]);
  ui.closeModal();
}
</script>

<template>
  <Dialog :open="ui.activeModal === 'fileSelect'" class="relative z-50" @close="ui.closeModal()">
    <div class="modal-overlay" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel modal-panel-lg">
        <DialogTitle class="mb-4 text-lg font-semibold">Select files</DialogTitle>
        <ul class="max-h-96 space-y-2 overflow-y-auto">
          <li v-for="file in files" :key="file.index">
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" :checked="selected.has(file.index)" @change="toggle(file.index)" />
              <span class="truncate">{{ file.path }}</span>
            </label>
          </li>
        </ul>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="ui.closeModal()">{{ t("Cancel") }}</button>
          <button type="button" class="btn btn-primary" @click="save">{{ t("Save") }}</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
