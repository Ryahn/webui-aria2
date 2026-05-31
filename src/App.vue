<script setup lang="ts">
import { onMounted, watch } from "vue";
import { ENABLE } from "./config/app-config";
import { useTheme } from "./composables/useTheme";
import { useKeyboardShortcuts, useDragDrop } from "./composables/useKeyboard";
import { useDownloadNotifications } from "./composables/useDownloadNotifications";
import { addTorrents, addUris } from "./api/aria2-actions";
import { getRpcErrorMessage } from "./api/aria2-types";
import { parseUriLines } from "./utils/helpers";
import { useConnectionStore } from "./stores/connection";
import { useDownloadsStore } from "./stores/downloads";
import { useSettingsStore } from "./stores/settings";
import { useUiStore } from "./stores/ui";
import { useAlertStore } from "./stores/alerts";
import AppNavbar from "./components/layout/AppNavbar.vue";
import AlertToasts from "./components/layout/AlertToasts.vue";
import ConnectionBanner from "./components/layout/ConnectionBanner.vue";
import Sidebar from "./components/layout/Sidebar.vue";
import DownloadList from "./components/downloads/DownloadList.vue";
import BatchSelectionBar from "./components/downloads/BatchSelectionBar.vue";
import AddUriModal from "./components/modals/AddUriModal.vue";
import AddTorrentModal from "./components/modals/AddTorrentModal.vue";
import AddMetalinkModal from "./components/modals/AddMetalinkModal.vue";
import ConnectionModal from "./components/modals/ConnectionModal.vue";
import GlobalSettingsModal from "./components/modals/GlobalSettingsModal.vue";
import ServerInfoModal from "./components/modals/ServerInfoModal.vue";
import AboutModal from "./components/modals/AboutModal.vue";
import FileSelectModal from "./components/modals/FileSelectModal.vue";
import DownloadSettingsModal from "./components/modals/DownloadSettingsModal.vue";

const { initTheme } = useTheme();
const connection = useConnectionStore();
const downloads = useDownloadsStore();
const settings = useSettingsStore();
const ui = useUiStore();
const alerts = useAlertStore();

useKeyboardShortcuts();
useDownloadNotifications();

const { onDragOver, onDrop } = useDragDrop(({ uris, files }) => {
  const torrents = files.filter((f) => f.name.toLowerCase().endsWith(".torrent"));
  const httpUris = uris.filter((u) => u.startsWith("http") || u.startsWith("ftp") || u.startsWith("magnet:"));

  if (httpUris.length) {
    const lines = parseUriLines(httpUris.join("\n"));
    if (lines.length) {
      addUris(lines, {}, (data) => {
        const err = getRpcErrorMessage(data);
        if (err) alerts.add(err, "error");
        else alerts.add(`Added ${lines.length} download(s)`, "success");
      });
    } else {
      ui.openAddUriPrefill(httpUris.join("\n"));
    }
  }

  if (torrents.length) {
    addTorrents(torrents, {}, (data) => {
      const err = getRpcErrorMessage(data);
      if (err) alerts.add(err, "error");
      else alerts.add(`Added ${torrents.length} torrent(s)`, "success");
    });
  }
});

onMounted(() => {
  initTheme();
  connection.init();
  downloads.initSubscriptions();
  settings.loadStarredProps();
  settings.loadGlobalOptions();
});

watch(
  () => downloads.pageTitle,
  (title) => {
    document.title = title;
  },
  { immediate: true }
);
</script>

<template>
  <div @dragover="onDragOver" @drop="onDrop">
    <AppNavbar />
    <ConnectionBanner />
    <AlertToasts />

    <div class="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <main class="min-w-0 flex-1">
        <div class="mb-6">
          <input
            id="download-search"
            v-model="downloads.searchQuery"
            type="search"
            class="input"
            placeholder="Search downloads… (press /)"
          />
        </div>

        <DownloadList
          :title="$t('Active')"
          :items="downloads.active"
          list-type="active"
          :search="downloads.searchQuery"
        />
        <DownloadList
          :title="$t('Waiting')"
          :items="downloads.waiting"
          list-type="waiting"
          :search="downloads.searchQuery"
        />
        <DownloadList
          :title="$t('Complete')"
          :items="downloads.stopped"
          list-type="stopped"
          :search="downloads.searchQuery"
        />
      </main>

      <div v-if="ENABLE.sidebar.show" class="hidden w-72 shrink-0 lg:block">
        <Sidebar />
      </div>
    </div>

    <template v-if="ENABLE.sidebar.show">
      <div
        v-show="ui.sidebarOpen"
        class="fixed inset-0 z-30 bg-black/40 lg:hidden"
        @click="ui.toggleSidebar()"
      />
      <aside
        class="fixed right-0 top-0 z-40 h-full w-72 overflow-y-auto border-l border-border bg-surface p-4 pt-20 shadow-xl transition-transform lg:hidden"
        :class="ui.sidebarOpen ? 'translate-x-0' : 'translate-x-full'"
      >
        <Sidebar />
      </aside>
    </template>

    <AddUriModal />
    <AddTorrentModal />
    <AddMetalinkModal />
    <ConnectionModal />
    <GlobalSettingsModal />
    <ServerInfoModal />
    <AboutModal />
    <FileSelectModal />
    <DownloadSettingsModal />
    <BatchSelectionBar />
  </div>
</template>
