<script setup lang="ts">
import { useAlertStore } from "../../stores/alerts";

const alerts = useAlertStore();

const typeClass: Record<string, string> = {
  success: "border-success bg-success/10 text-success",
  error: "border-danger bg-danger/10 text-danger",
  info: "border-primary bg-primary/10 text-primary",
  warning: "border-warning bg-warning/10 text-warning",
};
</script>

<template>
  <div class="fixed right-4 top-16 z-[100] flex w-full max-w-md flex-col gap-2">
    <div
      v-for="alert in alerts.alerts"
      :key="alert.id"
      class="rounded-md border px-4 py-3 text-sm shadow-lg"
      :class="typeClass[alert.type]"
    >
      <div class="flex items-start justify-between gap-2">
        <span v-html="alert.message" />
        <button
          type="button"
          class="shrink-0 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
          @click="alerts.remove(alert.id)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>
