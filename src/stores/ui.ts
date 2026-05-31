import { defineStore } from "pinia";
import { ref } from "vue";

export type ModalType =
  | null
  | "addUri"
  | "addTorrent"
  | "addMetalink"
  | "globalSettings"
  | "connection"
  | "serverInfo"
  | "about"
  | "fileSelect"
  | "downloadSettings";

export const useUiStore = defineStore("ui", () => {
  const activeModal = ref<ModalType>(null);
  const sidebarOpen = ref(false);
  const fileSelectGid = ref<string | null>(null);
  const downloadSettingsGid = ref<string | null>(null);
  const pendingUris = ref("");
  const pendingTorrentFiles = ref<File[]>([]);

  function openModal(type: ModalType): void {
    activeModal.value = type;
  }

  function openAddUriPrefill(text: string): void {
    pendingUris.value = text;
    activeModal.value = "addUri";
  }

  function openAddTorrentPrefill(files: File[]): void {
    pendingTorrentFiles.value = files;
    activeModal.value = "addTorrent";
  }

  function openDownloadSettings(gid: string): void {
    downloadSettingsGid.value = gid;
    activeModal.value = "downloadSettings";
  }

  function consumePendingUris(): string {
    const value = pendingUris.value;
    pendingUris.value = "";
    return value;
  }

  function consumePendingTorrentFiles(): File[] {
    const value = pendingTorrentFiles.value;
    pendingTorrentFiles.value = [];
    return value;
  }

  function closeModal(): void {
    activeModal.value = null;
    fileSelectGid.value = null;
    downloadSettingsGid.value = null;
  }

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value;
  }

  return {
    activeModal,
    sidebarOpen,
    fileSelectGid,
    downloadSettingsGid,
    pendingUris,
    pendingTorrentFiles,
    openModal,
    openAddUriPrefill,
    openAddTorrentPrefill,
    openDownloadSettings,
    consumePendingUris,
    consumePendingTorrentFiles,
    closeModal,
    toggleSidebar,
  };
});
