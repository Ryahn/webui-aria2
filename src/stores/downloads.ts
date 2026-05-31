import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { rpcClient } from "../api/rpc-client";
import type { DownloadItem, GlobalStat, SpeedSample } from "../api/aria2-types";
import { getRpcErrorMessage } from "../api/aria2-types";
import { APP_NAME, PAGE_SIZE, TITLE_PATTERN } from "../config/app-config";
import { downloadName, getProgress, mergeDownloads } from "../utils/helpers";

export type DownloadSortField = "name" | "size" | "progress" | "speed";
export type DownloadSortDir = "asc" | "desc";

const DEFAULT_GLOBAL_STAT: GlobalStat = {
  downloadSpeed: "0",
  uploadSpeed: "0",
  numActive: "0",
  numWaiting: "0",
  numStopped: "0",
};

export const useDownloadsStore = defineStore("downloads", () => {
  const active = ref<DownloadItem[]>([]);
  const waiting = ref<DownloadItem[]>([]);
  const stopped = ref<DownloadItem[]>([]);
  const allStopped = ref<DownloadItem[]>([]);
  const globalStat = ref<GlobalStat>({ ...DEFAULT_GLOBAL_STAT });
  const hideLinkedMetadata = ref(true);
  const searchQuery = ref("");
  const speedHistory = ref<SpeedSample[]>([]);
  const maxHistory = 60;
  const sortField = ref<DownloadSortField>(
    (localStorage.getItem("aria2-sort-field") as DownloadSortField) || "name"
  );
  const sortDir = ref<DownloadSortDir>(
    (localStorage.getItem("aria2-sort-dir") as DownloadSortDir) || "asc"
  );
  const selectedGids = ref<Set<string>>(new Set());

  function enrich(item: DownloadItem): DownloadItem {
    item.name = downloadName(item);
    return item;
  }

  function initSubscriptions(): void {
    rpcClient.subscribe("tellActive", [], (data) => {
      active.value = mergeDownloads((data.result as DownloadItem[]) ?? [], active.value, enrich);
    });

    rpcClient.subscribe("tellWaiting", [0, 1000], (data) => {
      waiting.value = mergeDownloads((data.result as DownloadItem[]) ?? [], waiting.value, enrich);
    });

    rpcClient.subscribe("tellStopped", [0, 1000], (data) => {
      const incoming = ((data.result as DownloadItem[]) ?? []).map(enrich);
      if (!hideLinkedMetadata.value) {
        stopped.value = mergeDownloads(incoming, stopped.value, enrich);
        return;
      }

      allStopped.value = mergeDownloads(incoming, allStopped.value, enrich);
      const gids: Record<string, DownloadItem> = {};
      for (const e of allStopped.value) gids[e.gid] = e;
      for (const e of active.value) gids[e.gid] = e;
      for (const e of waiting.value) gids[e.gid] = e;

      stopped.value = allStopped.value.filter((e) => {
        if (!e.metadata || !e.followedBy?.length) return true;
        const followedGid = e.followedBy[0];
        const linked = gids[followedGid];
        if (!linked) return true;
        linked.followedFrom = e;
        return false;
      });
    });

    rpcClient.subscribe("getGlobalStat", [], (data) => {
      if (getRpcErrorMessage(data) || data.result == null) return;
      globalStat.value = { ...DEFAULT_GLOBAL_STAT, ...(data.result as GlobalStat) };
      const now = Date.now();
      speedHistory.value.push({
        time: now,
        download: Number(globalStat.value.downloadSpeed),
        upload: Number(globalStat.value.uploadSpeed),
      });
      if (speedHistory.value.length > maxHistory) {
        speedHistory.value.shift();
      }
    });
  }

  const pageTitle = computed(() =>
    TITLE_PATTERN.replace("{active}", String(active.value.length))
      .replace("{waiting}", String(waiting.value.length))
      .replace("{stopped}", String(stopped.value.length))
      .replace("{name}", APP_NAME)
  );

  function getType(d: DownloadItem): "active" | "waiting" | "stopped" {
    if (active.value.some((x) => x.gid === d.gid)) return "active";
    if (waiting.value.some((x) => x.gid === d.gid)) return "waiting";
    return "stopped";
  }

  function pause(d: DownloadItem): void {
    rpcClient.once("forcePause", [d.gid]);
  }

  function resume(d: DownloadItem): void {
    rpcClient.once("unpause", [d.gid]);
  }

  function remove(d: DownloadItem, skipConfirm = false): Promise<boolean> {
    return new Promise((resolve) => {
      if (!skipConfirm && !confirm(`Remove ${d.name} and associated meta-data?`)) {
        resolve(false);
        return;
      }

      const method = getType(d) === "stopped" ? "removeDownloadResult" : "remove";
      if (d.followedFrom) remove(d.followedFrom, true);
      rpcClient.once(method, [d.gid]);

      for (const list of [active, waiting, stopped]) {
        const idx = list.value.findIndex((x) => x.gid === d.gid);
        if (idx >= 0) list.value.splice(idx, 1);
      }
      resolve(true);
    });
  }

  function moveUp(d: DownloadItem): void {
    if (getType(d) === "waiting") rpcClient.once("changePosition", [d.gid, -1, "POS_CUR"]);
  }

  function moveDown(d: DownloadItem): void {
    if (getType(d) === "waiting") rpcClient.once("changePosition", [d.gid, 1, "POS_CUR"]);
  }

  function pauseAll(): void {
    rpcClient.once("forcePauseAll", []);
  }

  function unpauseAll(): void {
    rpcClient.once("unpauseAll", []);
  }

  function purgeCompleted(): void {
    rpcClient.once("purgeDownloadResult", []);
  }

  function shutdown(): void {
    if (confirm("Shutdown aria2?")) rpcClient.once("shutdown", []);
  }

  function toggleExpanded(d: DownloadItem): void {
    d.expanded = !d.expanded;
  }

  function progress(d: DownloadItem): number {
    return getProgress(d);
  }

  function sortItems(items: DownloadItem[]): DownloadItem[] {
    const sorted = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField.value) {
        case "name":
          cmp = (a.name ?? a.gid).localeCompare(b.name ?? b.gid);
          break;
        case "size":
          cmp = Number(a.totalLength) - Number(b.totalLength);
          break;
        case "progress":
          cmp = progress(a) - progress(b);
          break;
        case "speed":
          cmp = Number(a.downloadSpeed) - Number(b.downloadSpeed);
          break;
      }
      return sortDir.value === "asc" ? cmp : -cmp;
    });
    return sorted;
  }

  function setSort(field: DownloadSortField, dir?: DownloadSortDir): void {
    sortField.value = field;
    if (dir) sortDir.value = dir;
    localStorage.setItem("aria2-sort-field", field);
    localStorage.setItem("aria2-sort-dir", sortDir.value);
  }

  function toggleSortDir(): void {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    localStorage.setItem("aria2-sort-dir", sortDir.value);
  }

  function findByGid(gid: string): DownloadItem | undefined {
    return [...active.value, ...waiting.value, ...stopped.value].find((d) => d.gid === gid);
  }

  function isSelected(gid: string): boolean {
    return selectedGids.value.has(gid);
  }

  function toggleSelected(gid: string): void {
    const next = new Set(selectedGids.value);
    if (next.has(gid)) next.delete(gid);
    else next.add(gid);
    selectedGids.value = next;
  }

  function clearSelection(): void {
    selectedGids.value = new Set();
  }

  function selectAll(items: DownloadItem[]): void {
    selectedGids.value = new Set(items.map((d) => d.gid));
  }

  function pauseSelected(): void {
    for (const gid of selectedGids.value) {
      const d = findByGid(gid);
      if (d && getType(d) === "active") pause(d);
    }
  }

  function resumeSelected(): void {
    for (const gid of selectedGids.value) {
      const d = findByGid(gid);
      if (d && (getType(d) === "waiting" || d.status === "paused")) resume(d);
    }
  }

  async function removeSelected(): Promise<void> {
    for (const gid of [...selectedGids.value]) {
      const d = findByGid(gid);
      if (d) await remove(d, true);
    }
    clearSelection();
  }

  const selectionCount = computed(() => selectedGids.value.size);

  function paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }

  return {
    active,
    waiting,
    stopped,
    globalStat,
    hideLinkedMetadata,
    searchQuery,
    speedHistory,
    sortField,
    sortDir,
    selectedGids,
    selectionCount,
    pageTitle,
    initSubscriptions,
    getType,
    pause,
    resume,
    remove,
    moveUp,
    moveDown,
    pauseAll,
    unpauseAll,
    purgeCompleted,
    shutdown,
    toggleExpanded,
    progress,
    sortItems,
    setSort,
    toggleSortDir,
    findByGid,
    isSelected,
    toggleSelected,
    clearSelection,
    selectAll,
    pauseSelected,
    resumeSelected,
    removeSelected,
    paginate,
  };
});
