"use client";

import { useEffect } from "react";

interface KeyboardShortcutOptions {
  onCapture: () => void; // Called on Cmd+N / Ctrl+N
  onEscape: () => void; // Called on Escape
  enabled?: boolean; // Default true, disable when modal closed
}

export function useKeyboardShortcuts({
  onCapture,
  onEscape,
  enabled = true,
}: KeyboardShortcutOptions): void {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Handle Cmd+N (Mac) or Ctrl+N (Windows/Linux) for quick capture
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault(); // Block browser new-window behavior
        onCapture();
        return;
      }

      // Handle Escape for closing modal
      if (event.key === "Escape") {
        onEscape();
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onCapture, onEscape]);
}
