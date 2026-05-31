import { onMounted, onUnmounted } from "vue";
import { useUiStore } from "../stores/ui";

export function useKeyboardShortcuts(): void {
  const ui = useUiStore();

  function handler(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      if (e.key !== "Escape") return;
    }

    if (e.ctrlKey && e.key.toLowerCase() === "u") {
      e.preventDefault();
      ui.openModal("addUri");
    }
    if (e.key === "/") {
      e.preventDefault();
      document.getElementById("download-search")?.focus();
    }
    if (e.key === "Escape") {
      ui.closeModal();
    }
  }

  onMounted(() => window.addEventListener("keydown", handler));
  onUnmounted(() => window.removeEventListener("keydown", handler));
}

export function useDragDrop(onDrop: (data: { uris: string[]; files: File[] }) => void): {
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
} {
  function onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  function onDropHandler(e: DragEvent): void {
    e.preventDefault();
    const uris: string[] = [];
    const files: File[] = [];

    if (e.dataTransfer?.getData("text/uri-list")) {
      uris.push(
        ...e.dataTransfer
          .getData("text/uri-list")
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      );
    }
    if (e.dataTransfer?.getData("text/plain")) {
      const text = e.dataTransfer.getData("text/plain").trim();
      if (text.startsWith("magnet:") || text.startsWith("http")) uris.push(text);
    }
    if (e.dataTransfer?.files.length) {
      files.push(...Array.from(e.dataTransfer.files));
    }

    if (uris.length || files.length) onDrop({ uris, files });
  }

  return { onDragOver, onDrop: onDropHandler };
}
