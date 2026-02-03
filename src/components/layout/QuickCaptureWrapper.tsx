"use client";

import { ReactNode } from "react";
import { QuickCaptureProvider, useQuickCapture } from "@/hooks/useQuickCapture";
import { OverlayProvider, useOverlay } from "@/context/OverlayContext";
import { QuickCapture } from "@/components/tasks/QuickCapture";
import { FAB } from "@/components/ui/FAB";

interface QuickCaptureWrapperProps {
  children: ReactNode;
}

/**
 * Inner component that uses the QuickCapture context to wire up the FAB.
 * Must be inside QuickCaptureProvider and OverlayProvider.
 */
function QuickCaptureContent({ children }: QuickCaptureWrapperProps) {
  const { open } = useQuickCapture();
  const { isOverlayActive } = useOverlay();

  return (
    <>
      {children}
      <QuickCapture />
      {!isOverlayActive && <FAB onClick={() => open()} />}
    </>
  );
}

/**
 * Client wrapper that provides QuickCapture context and overlay tracking to the app.
 * Wraps children in OverlayProvider and QuickCaptureProvider, renders the modal + FAB.
 *
 * This keeps the root layout as a server component while adding
 * the client-side context for quick capture and overlay visibility functionality.
 */
export function QuickCaptureWrapper({ children }: QuickCaptureWrapperProps) {
  return (
    <OverlayProvider>
      <QuickCaptureProvider>
        <QuickCaptureContent>{children}</QuickCaptureContent>
      </QuickCaptureProvider>
    </OverlayProvider>
  );
}
