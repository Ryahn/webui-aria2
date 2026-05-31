<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ENABLE, LOCALE_OPTIONS } from "../../config/app-config";
import { useTheme } from "../../composables/useTheme";
import { setLocale } from "../../i18n";
import { useConnectionStore } from "../../stores/connection";
import { useDownloadsStore } from "../../stores/downloads";
import { useUiStore } from "../../stores/ui";

const { t, locale } = useI18n();
const { theme, toggleTheme } = useTheme();
const ui = useUiStore();
const connection = useConnectionStore();
const downloads = useDownloadsStore();

const statusTitle = computed(() => {
  let title = connection.status;
  if (connection.retryInSeconds != null) {
    title += ` — retry in ${connection.retryInSeconds}s`;
  }
  return title;
});

const statusClass = computed(() => {
  switch (connection.status) {
    case "connected":
      return "bg-success";
    case "connecting":
    case "busy":
      return "bg-warning";
    case "unauthorized":
      return "bg-danger";
    default:
      return "bg-muted";
  }
});

function changeLocale(code: string): void {
  setLocale(code);
  locale.value = code;
}
</script>

<template>
  <nav class="sticky top-0 z-40 border-b border-border bg-primary text-white shadow-md">
    <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
      <button
        type="button"
        class="rounded p-1 hover:bg-white/10 lg:hidden"
        :aria-label="t('Toggle navigation')"
        @click="ui.toggleSidebar()"
      >
        ☰
      </button>

      <div class="flex items-center gap-2 font-semibold">
        <span>Aria2 WebUI</span>
        <span class="h-2 w-2 rounded-full" :class="statusClass" :title="statusTitle" />
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <Menu as="div" class="relative">
          <MenuButton class="btn bg-white/10 text-white hover:bg-white/20">
            {{ t("Add") }} ▾
          </MenuButton>
          <MenuItems class="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-md border border-border bg-surface py-1 shadow-lg">
            <MenuItem v-slot="{ active }">
              <button
                type="button"
                class="block w-full px-4 py-2 text-left text-sm text-text"
                :class="active && 'bg-surface-elevated'"
                @click="ui.openModal('addUri')"
              >
                {{ t("By URIs") }}
              </button>
            </MenuItem>
            <MenuItem v-if="ENABLE.torrent && connection.isFeatureEnabled('BitTorrent')" v-slot="{ active }">
              <button
                type="button"
                class="block w-full px-4 py-2 text-left text-sm text-text"
                :class="active && 'bg-surface-elevated'"
                @click="ui.openModal('addTorrent')"
              >
                {{ t("By Torrents") }}
              </button>
            </MenuItem>
            <MenuItem v-if="ENABLE.metalink && connection.isFeatureEnabled('Metalink')" v-slot="{ active }">
              <button
                type="button"
                class="block w-full px-4 py-2 text-left text-sm text-text"
                :class="active && 'bg-surface-elevated'"
                @click="ui.openModal('addMetalink')"
              >
                {{ t("By Metalinks") }}
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>

        <Menu as="div" class="relative">
          <MenuButton class="btn bg-white/10 text-white hover:bg-white/20">
            {{ t("Manage") }} ▾
          </MenuButton>
          <MenuItems class="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-md border border-border bg-surface py-1 shadow-lg">
            <MenuItem v-slot="{ active }">
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-text" :class="active && 'bg-surface-elevated'" @click="downloads.pauseAll()">
                {{ t("Pause All") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-text" :class="active && 'bg-surface-elevated'" @click="downloads.unpauseAll()">
                {{ t("Resume Paused") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-text" :class="active && 'bg-surface-elevated'" @click="downloads.purgeCompleted()">
                {{ t("Purge Completed") }}
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>

        <Menu as="div" class="relative">
          <MenuButton class="btn bg-white/10 text-white hover:bg-white/20">
            {{ t("Settings") }} ▾
          </MenuButton>
          <MenuItems class="absolute right-0 z-50 mt-1 min-w-[12rem] rounded-md border border-border bg-surface py-1 shadow-lg">
            <MenuItem v-slot="{ active }">
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-text" :class="active && 'bg-surface-elevated'" @click="ui.openModal('connection')">
                {{ t("Connection Settings") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-text" :class="active && 'bg-surface-elevated'" @click="ui.openModal('globalSettings')">
                {{ t("Global Settings") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-text" :class="active && 'bg-surface-elevated'" @click="ui.openModal('serverInfo')">
                {{ t("Server info") }}
              </button>
            </MenuItem>
            <MenuItem v-slot="{ active }">
              <button type="button" class="block w-full px-4 py-2 text-left text-sm text-text" :class="active && 'bg-surface-elevated'" @click="ui.openModal('about')">
                {{ t("About and contribute") }}
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>

        <Menu as="div" class="relative">
          <MenuButton class="btn bg-white/10 text-white hover:bg-white/20" :aria-label="t('Language')">
            🌐
          </MenuButton>
          <MenuItems class="absolute right-0 z-50 mt-1 max-h-64 min-w-[10rem] overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-lg">
            <MenuItem v-for="loc in LOCALE_OPTIONS" :key="loc.code" v-slot="{ active }">
              <button
                type="button"
                class="block w-full px-4 py-2 text-left text-sm text-text"
                :class="active && 'bg-surface-elevated'"
                @click="changeLocale(loc.code)"
              >
                {{ loc.label }}
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>

        <button
          type="button"
          class="btn bg-white/10 text-white hover:bg-white/20"
          :aria-label="theme === 'dark' ? 'Light mode' : 'Dark mode'"
          @click="toggleTheme"
        >
          {{ theme === "dark" ? "☀️" : "🌙" }}
        </button>
      </div>
    </div>
  </nav>
</template>
