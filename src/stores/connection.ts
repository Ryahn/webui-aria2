import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { defaultRpcConfig } from "../config/app-config";
import type { RpcConfig } from "../config/app-config";
import type { ConnectionStatus, VersionInfo } from "../api/aria2-types";
import type { RpcMulticallResult } from "../api/aria2-types";
import { rpcClient } from "../api/rpc-client";
import {
  deleteProfile,
  findProfile,
  getActiveProfileId,
  loadProfiles,
  setActiveProfileId,
  upsertProfile,
  type ConnectionProfile,
} from "../utils/connection-profiles";
import { loadSavedConnection, parseConnectionFromUrl, saveConnection } from "../utils/helpers";
import { useAlertStore } from "./alerts";

export const useConnectionStore = defineStore("connection", () => {
  const config = ref<RpcConfig>(defaultRpcConfig());
  const status = ref<ConnectionStatus>("disconnected");
  const retryInSeconds = ref<number | null>(null);
  const version = ref("");
  const enabledFeatures = ref<string[]>([]);
  const profiles = ref<ConnectionProfile[]>(loadProfiles());
  const activeProfileId = ref<string | null>(getActiveProfileId());

  const alerts = useAlertStore();
  let countdownTimer: ReturnType<typeof setInterval> | null = null;

  const activeProfile = computed(() =>
    profiles.value.find((p) => p.id === activeProfileId.value)
  );

  function refreshProfiles(): void {
    profiles.value = loadProfiles();
    activeProfileId.value = getActiveProfileId();
  }

  function updateRetryCountdown(): void {
    if (!rpcClient.retryAt) {
      retryInSeconds.value = null;
      return;
    }
    retryInSeconds.value = Math.max(0, Math.ceil((rpcClient.retryAt - Date.now()) / 1000));
  }

  function startCountdownTimer(): void {
    if (countdownTimer) return;
    countdownTimer = setInterval(updateRetryCountdown, 500);
  }

  function applyVersionResponse(data: RpcMulticallResult): void {
    const result = data.result as VersionInfo | undefined;
    if (!result?.version) return;
    version.value = result.version;
    enabledFeatures.value = result.enabledFeatures ?? [];
  }

  function refreshServerInfo(): void {
    rpcClient.forceUpdate();
  }

  function init(): void {
    const base = defaultRpcConfig();
    const urlOverride = parseConnectionFromUrl();
    const savedProfile = activeProfileId.value ? findProfile(activeProfileId.value) : undefined;
    const saved = savedProfile?.config ?? loadSavedConnection(base);
    config.value = { ...base, ...(saved ?? {}), ...(urlOverride ?? {}) };

    rpcClient.onStatusChange = (s) => {
      status.value = s;
      if (s === "connected") refreshServerInfo();
    };
    rpcClient.onRetryAtChange = () => updateRetryCountdown();
    rpcClient.onErrorMessage = (msg) => alerts.add(msg, "error");
    rpcClient.onSuccessMessage = (msg) => alerts.add(msg, "success");

    startCountdownTimer();

    rpcClient.subscribe("getVersion", [], applyVersionResponse);

    rpcClient.configure(config.value);
  }

  function applyConfig(next: RpcConfig, persist = true): void {
    config.value = { ...next };
    if (persist) {
      saveConnection(config.value);
      rpcClient.saveCurrentConfiguration();
    }
    rpcClient.configure(config.value);
  }

  function saveAsProfile(name: string, next?: RpcConfig): ConnectionProfile {
    const profile = upsertProfile(name, next ?? config.value, activeProfileId.value ?? undefined);
    refreshProfiles();
    return profile;
  }

  function loadProfile(id: string): void {
    const profile = findProfile(id);
    if (!profile) return;
    activeProfileId.value = id;
    setActiveProfileId(id);
    applyConfig(profile.config, true);
  }

  function removeProfile(id: string): void {
    deleteProfile(id);
    refreshProfiles();
  }

  function isFeatureEnabled(feature: string): boolean {
    return enabledFeatures.value.includes(feature);
  }

  const directURL = computed(() => config.value.directURL ?? rpcClient.getDirectURL());
  const showConnectionBanner = computed(
    () => status.value === "disconnected" || status.value === "unauthorized"
  );

  return {
    config,
    status,
    retryInSeconds,
    version,
    enabledFeatures,
    profiles,
    activeProfileId,
    activeProfile,
    directURL,
    showConnectionBanner,
    init,
    applyConfig,
    saveAsProfile,
    loadProfile,
    removeProfile,
    refreshProfiles,
    refreshServerInfo,
    isFeatureEnabled,
  };
});
