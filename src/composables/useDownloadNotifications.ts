import { onMounted, watch } from "vue";
import type { DownloadItem } from "../api/aria2-types";
import { useDownloadsStore } from "../stores/downloads";

const NOTIFY_KEY = "aria2-notify";

export function useDownloadNotifications(): void {
  const downloads = useDownloadsStore();
  const notifiedGids = new Set<string>();
  let initialized = false;

  function isEnabled(): boolean {
    return localStorage.getItem(NOTIFY_KEY) === "true";
  }

  function notifyComplete(item: DownloadItem): void {
    if (!isEnabled() || Notification.permission !== "granted") return;
    new Notification("Download complete", {
      body: item.name ?? item.gid,
      tag: item.gid,
    });
  }

  function processStopped(list: DownloadItem[]): void {
    if (!isEnabled()) return;

    if (!initialized) {
      for (const item of list) notifiedGids.add(item.gid);
      initialized = true;
      return;
    }

    for (const item of list) {
      if (item.status !== "complete" || notifiedGids.has(item.gid)) continue;
      notifiedGids.add(item.gid);
      notifyComplete(item);
    }
  }

  watch(
    () => downloads.stopped,
    (list) => processStopped(list),
    { deep: true }
  );

  onMounted(() => {
    if (isEnabled() && Notification.permission === "default") {
      Notification.requestPermission();
    }
  });
}

export function notificationsEnabled(): boolean {
  return localStorage.getItem(NOTIFY_KEY) === "true";
}

export function setNotificationsEnabled(enabled: boolean): void {
  localStorage.setItem(NOTIFY_KEY, String(enabled));
  if (enabled && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function useNotificationToggle(): {
  enabled: { value: boolean };
  toggle: () => void;
} {
  const enabled = { value: notificationsEnabled() };

  function toggle(): void {
    enabled.value = !enabled.value;
    setNotificationsEnabled(enabled.value);
  }

  return { enabled, toggle };
}
