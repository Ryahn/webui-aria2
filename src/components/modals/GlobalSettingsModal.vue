<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "../../stores/settings";
import { useUiStore } from "../../stores/ui";
import SettingsFormModal from "./SettingsFormModal.vue";

const { t } = useI18n();
const ui = useUiStore();
const settings = useSettingsStore();

const keys = computed(() => settings.mergedGlobalKeys);

function save(values: Record<string, string>): void {
  settings.saveGlobalOptions(values);
  ui.closeModal();
}
</script>

<template>
  <SettingsFormModal
    :open="ui.activeModal === 'globalSettings'"
    :title="t('Global Settings')"
    :settings-map="settings.globalSettingsMap"
    :model-value="settings.globalOptions"
    :keys="keys"
    large
    @close="ui.closeModal()"
    @save="save"
  />
</template>
