<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";

const error = ref<Error | null>(null);

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err));
  return false;
});

function reload(): void {
  error.value = null;
  location.reload();
}
</script>

<template>
  <div v-if="error" class="mx-auto max-w-lg p-8 text-center">
    <h1 class="mb-2 text-xl font-semibold">Something went wrong</h1>
    <p class="mb-4 text-sm text-muted">{{ error.message }}</p>
    <button type="button" class="btn btn-primary" @click="reload">Reload</button>
  </div>
  <slot v-else />
</template>
