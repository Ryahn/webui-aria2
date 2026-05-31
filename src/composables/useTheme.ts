import { ref, watch } from "vue";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "aria2-theme";

function systemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readStoredTheme(): ThemeMode | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return null;
}

export function useTheme() {
  const theme = ref<ThemeMode>(readStoredTheme() ?? systemTheme());

  function applyTheme(mode: ThemeMode): void {
    theme.value = mode;
    document.documentElement.dataset.theme = mode;
    document.documentElement.classList.toggle("dark", mode === "dark");

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#121212" : "#1a736b");
  }

  function toggleTheme(): void {
    applyTheme(theme.value === "dark" ? "light" : "dark");
    localStorage.setItem(STORAGE_KEY, theme.value);
  }

  function initTheme(): void {
    applyTheme(theme.value);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!readStoredTheme()) applyTheme(e.matches ? "dark" : "light");
    });
  }

  watch(theme, (mode) => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.classList.toggle("dark", mode === "dark");
  });

  return { theme, toggleTheme, initTheme, applyTheme };
}
