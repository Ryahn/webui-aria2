import { createI18n } from "vue-i18n";

const modules = import.meta.glob("../locales/*.json", { eager: true });

const messages: Record<string, Record<string, string>> = {};

for (const path in modules) {
  const locale = path.match(/\/([^/]+)\.json$/)?.[1];
  if (locale) {
    messages[locale] = (modules[path] as { default: Record<string, string> }).default;
  }
}

function readLocale(): string {
  const stored = localStorage.getItem("aria2-locale");
  if (stored && messages[stored]) return stored;
  return "en_US";
}

export const i18n = createI18n({
  legacy: false,
  locale: readLocale(),
  fallbackLocale: "en_US",
  messages,
});

export function setLocale(locale: string): void {
  if (messages[locale]) {
    i18n.global.locale.value = locale;
    localStorage.setItem("aria2-locale", locale);
  }
}

export const availableLocales = Object.keys(messages).sort();
