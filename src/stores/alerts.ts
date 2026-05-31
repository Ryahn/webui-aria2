import { defineStore } from "pinia";
import { ref } from "vue";
import type { AlertMessage } from "../api/aria2-types";

export const ALERT_DISMISS_MS = 5000;

export const useAlertStore = defineStore("alerts", () => {
  const alerts = ref<AlertMessage[]>([]);
  const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  function scheduleDismiss(id: string, timeoutMs: number): void {
    if (timeoutMs <= 0) return;
    const timer = setTimeout(() => remove(id), timeoutMs);
    dismissTimers.set(id, timer);
  }

  function add(
    message: string,
    type: AlertMessage["type"] = "info",
    timeoutMs = ALERT_DISMISS_MS
  ): void {
    const id = crypto.randomUUID();
    alerts.value.push({ id, message, type });
    scheduleDismiss(id, timeoutMs);
  }

  function remove(id: string): void {
    const timer = dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.delete(id);
    }
    alerts.value = alerts.value.filter((a) => a.id !== id);
  }

  return { alerts, add, remove };
});
