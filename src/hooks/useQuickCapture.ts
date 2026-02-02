"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
  ReactNode,
} from "react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

interface QuickCaptureContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

interface QuickCaptureProviderProps {
  children: ReactNode;
}

export function QuickCaptureProvider({ children }: QuickCaptureProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Wire up global keyboard shortcuts
  useKeyboardShortcuts({
    onCapture: open,
    onEscape: close,
    enabled: true,
  });

  return createElement(
    QuickCaptureContext.Provider,
    { value: { isOpen, open, close } },
    children
  );
}

export function useQuickCapture(): QuickCaptureContextValue {
  const context = useContext(QuickCaptureContext);

  if (!context) {
    throw new Error("useQuickCapture must be used within a QuickCaptureProvider");
  }

  return context;
}
