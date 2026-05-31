import { defineStore } from "pinia";
import { computed, ref } from "vue";
import fileSettings from "../config/file-settings.json";
import globalSettings from "../config/global-settings.json";
import type { SettingsMap } from "../api/aria2-types";
import { GLOBAL_SETTINGS_EXCLUDE } from "../config/app-config";
import { rpcClient } from "../api/rpc-client";
import { STARRED_PROPS } from "../config/app-config";

function mergeSettingsMaps(...maps: SettingsMap[]): SettingsMap {
  return Object.assign({}, ...maps);
}

export const useSettingsStore = defineStore("settings", () => {
  const globalOptions = ref<Record<string, string>>({});
  const starredProps = ref<string[]>([...STARRED_PROPS]);

  const fileSettingsMap = fileSettings as SettingsMap;
  const globalOnlyMap = globalSettings as SettingsMap;

  /** Legacy Global Settings = file settings + global-only settings merged */
  const mergedGlobalSettingsMap = computed<SettingsMap>(() =>
    mergeSettingsMaps(fileSettingsMap, globalOnlyMap)
  );

  const mergedGlobalKeys = computed(() =>
    Object.keys(mergedGlobalSettingsMap.value).filter((k) => !GLOBAL_SETTINGS_EXCLUDE.includes(k))
  );

  function loadGlobalOptions(): void {
    rpcClient.subscribe("getGlobalOption", [], (data) => {
      globalOptions.value = (data.result as Record<string, string>) ?? {};
    });
  }

  function saveGlobalOptions(changes: Record<string, string>): void {
    const filtered: Record<string, string> = {};
    const current = globalOptions.value;

    for (const [key, value] of Object.entries(changes)) {
      if (value === "" || value === undefined) {
        // Omit empty = leave aria2 global option unchanged (supports "infinite seeding" / unset seed-time)
        continue;
      }
      const previous = current[key];
      if (previous !== undefined && String(previous) === String(value)) continue;
      filtered[key] = value;
    }

    if (Object.keys(filtered).length) {
      rpcClient.once("changeGlobalOption", [filtered]);
    }
  }

  function saveStarredProps(props: string[]): void {
    starredProps.value = props;
    localStorage.setItem("aria2props", JSON.stringify(props));
  }

  function loadStarredProps(): void {
    try {
      const raw = localStorage.getItem("aria2props");
      if (raw) starredProps.value = JSON.parse(raw);
    } catch {
      /* keep defaults */
    }
  }

  return {
    globalOptions,
    starredProps,
    fileSettingsMap,
    globalSettingsMap: mergedGlobalSettingsMap,
    mergedGlobalKeys,
    loadGlobalOptions,
    saveGlobalOptions,
    saveStarredProps,
    loadStarredProps,
  };
});
