<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { RpcConfig, RpcProtocol } from "../../config/app-config";
import { DEFAULT_RPC_PORT } from "../../config/app-config";
import { useConnectionStore } from "../../stores/connection";
import { useUiStore } from "../../stores/ui";

const { t } = useI18n();
const ui = useUiStore();
const connection = useConnectionStore();

const form = reactive<RpcConfig>({
  ...connection.config,
  auth: { ...connection.config.auth },
});
const profileName = ref(connection.activeProfile?.name ?? "");
const selectedProfileId = ref(connection.activeProfileId ?? "");

const protocols: RpcProtocol[] = ["http", "https", "ws", "wss"];

watch(
  () => ui.activeModal,
  (modal) => {
    if (modal !== "connection") return;
    Object.assign(form, connection.config, { auth: { ...connection.config.auth } });
    selectedProfileId.value = connection.activeProfileId ?? "";
    profileName.value = connection.activeProfile?.name ?? `${form.host}:${form.port}`;
    connection.refreshProfiles();
  }
);

function loadSelectedProfile(): void {
  if (!selectedProfileId.value) return;
  const profile = connection.profiles.find((p) => p.id === selectedProfileId.value);
  if (!profile) return;
  Object.assign(form, profile.config, { auth: { ...profile.config.auth } });
  profileName.value = profile.name;
}

function save(): void {
  form.port = Number(form.port) || DEFAULT_RPC_PORT;
  if (form.protocol === "https" || form.protocol === "wss") form.encrypt = true;
  if (form.protocol === "http" || form.protocol === "ws") form.encrypt = false;

  const next = { ...form, auth: { ...form.auth } };
  connection.applyConfig(next, true);

  if (profileName.value.trim()) {
    connection.saveAsProfile(profileName.value.trim(), next);
    selectedProfileId.value = connection.activeProfileId ?? "";
  }

  ui.closeModal();
}

function saveProfileOnly(): void {
  if (!profileName.value.trim()) return;
  form.port = Number(form.port) || DEFAULT_RPC_PORT;
  const next = { ...form, auth: { ...form.auth } };
  const profile = connection.saveAsProfile(profileName.value.trim(), next);
  selectedProfileId.value = profile.id;
}

function deleteSelectedProfile(): void {
  if (!selectedProfileId.value) return;
  connection.removeProfile(selectedProfileId.value);
  selectedProfileId.value = connection.activeProfileId ?? "";
  profileName.value = connection.activeProfile?.name ?? `${form.host}:${form.port}`;
}
</script>

<template>
  <Dialog :open="ui.activeModal === 'connection'" class="relative z-50" @close="ui.closeModal()">
    <div class="modal-overlay" />
    <div class="modal-shell">
      <DialogPanel class="modal-panel">
        <DialogTitle class="mb-4 text-lg font-semibold">{{ t("Connection Settings") }}</DialogTitle>

        <div v-if="connection.profiles.length" class="mb-4 space-y-2">
          <label class="mb-1 block text-sm">Saved profile</label>
          <div class="flex gap-2">
            <select v-model="selectedProfileId" class="input flex-1" @change="loadSelectedProfile">
              <option value="">— Custom —</option>
              <option v-for="p in connection.profiles" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button
              v-if="selectedProfileId"
              type="button"
              class="btn btn-danger"
              title="Delete profile"
              @click="deleteSelectedProfile"
            >
              ✕
            </button>
          </div>
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-sm">Profile name</label>
          <input v-model="profileName" type="text" class="input" placeholder="Home server" />
          <p class="mt-1 text-xs text-muted">Save a named profile for quick switching between aria2 servers.</p>
        </div>

        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm">Host</label>
            <input v-model="form.host" type="text" class="input" />
          </div>
          <div>
            <label class="mb-1 block text-sm">Port (6800 direct, or web UI port when proxied)</label>
            <input v-model.number="form.port" type="number" class="input" />
          </div>
          <div>
            <label class="mb-1 block text-sm">Path</label>
            <input v-model="form.path" type="text" class="input" />
          </div>
          <div>
            <label class="mb-1 block text-sm">Protocol</label>
            <select v-model="form.protocol" class="input">
              <option :value="undefined">Auto (same-origin when host matches)</option>
              <option v-for="p in protocols" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm">RPC Secret Token</label>
            <input v-model="form.auth!.token" type="password" class="input" autocomplete="off" />
          </div>
          <div>
            <label class="mb-1 block text-sm">Direct URL (optional)</label>
            <input v-model="form.directURL" type="url" class="input" placeholder="http://server/downloads/" />
          </div>
        </div>

        <p class="mt-4 text-xs text-muted">
          When UI and RPC share one origin (Docker, nginx, Vite dev), leave host as the page hostname and port as the page port.
          See DEPLOYMENT.md in the repository.
        </p>

        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="ui.closeModal()">{{ t("Cancel") }}</button>
          <button type="button" class="btn btn-secondary" @click="saveProfileOnly">Save profile</button>
          <button type="button" class="btn btn-primary" @click="save">{{ t("Save") }} &amp; connect</button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>
