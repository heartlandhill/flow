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
  projectId: string | null;
  projectName: string | null;
  areaColor: string | null;
  open: (projectId?: string, projectName?: string, areaColor?: string) => void;
  close: () => void;
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

interface QuickCaptureProviderProps {
  children: ReactNode;
}

export function QuickCaptureProvider({ children }: QuickCaptureProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [areaColor, setAreaColor] = useState<string | null>(null);

  const open = useCallback((projectId?: string, projectName?: string, areaColor?: string) => {
    setProjectId(projectId ?? null);
    setProjectName(projectName ?? null);
    setAreaColor(areaColor ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setProjectId(null);
    setProjectName(null);
    setAreaColor(null);
  }, []);

  // Wire up global keyboard shortcuts
  useKeyboardShortcuts({
    onCapture: open,
    onEscape: close,
    enabled: true,
  });

  return createElement(
    QuickCaptureContext.Provider,
    { value: { isOpen, projectId, projectName, areaColor, open, close } },
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
