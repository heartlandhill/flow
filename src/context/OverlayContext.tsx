"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
  ReactNode,
} from "react";

interface OverlayContextValue {
  isOverlayActive: boolean;
  registerOverlay: (id: string) => void;
  unregisterOverlay: (id: string) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

interface OverlayProviderProps {
  children: ReactNode;
}

export function OverlayProvider({ children }: OverlayProviderProps) {
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());

  const registerOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unregisterOverlay = useCallback((id: string) => {
    setActiveOverlays((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isOverlayActive = activeOverlays.size > 0;

  return createElement(
    OverlayContext.Provider,
    { value: { isOverlayActive, registerOverlay, unregisterOverlay } },
    children
  );
}

export function useOverlay(): OverlayContextValue {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
}
