<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useConnectionStore } from "../../stores/connection";
import { useUiStore } from "../../stores/ui";

const { t } = useI18n();
const connection = useConnectionStore();
const ui = useUiStore();
</script>

<template>
  <div
    v-if="connection.showConnectionBanner"
    class="border-b border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text"
    role="alert"
  >
    <p class="font-medium">
      {{ t("Oh Snap!") }}
      {{ t("Could not connect to the aria2 RPC server. Will retry in 10 secs. You might want to check the connection settings by going to Settings > Connection Settings") }}
    </p>
    <p v-if="connection.retryInSeconds != null" class="mt-1 text-muted">
      Retrying in {{ connection.retryInSeconds }}s…
    </p>
    <p class="mt-2 text-xs text-muted">
      The web UI port (8080/8888) is not the aria2 RPC port (6800). Ensure aria2 is running with
      <code class="rounded bg-surface px-1">--enable-rpc --rpc-listen-all</code>.
    </p>
    <button type="button" class="btn btn-primary mt-3" @click="ui.openModal('connection')">
      {{ t("Connection Settings") }}
    </button>
  </div>
  <div
    v-else-if="connection.status === 'busy'"
    class="border-b border-warning/30 bg-warning/5 px-4 py-2 text-center text-xs text-muted"
  >
    aria2 is busy (e.g. allocating files). Waiting for RPC to respond…
    <span v-if="connection.retryInSeconds != null"> ({{ connection.retryInSeconds }}s)</span>
  </div>
</template>
