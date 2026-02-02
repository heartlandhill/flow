"use client";

import { ReactNode } from "react";
import { QuickCaptureProvider, useQuickCapture } from "@/hooks/useQuickCapture";
import { QuickCapture } from "@/components/tasks/QuickCapture";
import { FAB } from "@/components/ui/FAB";

interface QuickCaptureWrapperProps {
  children: ReactNode;
}

/**
 * Inner component that uses the QuickCapture context to wire up the FAB.
 * Must be inside QuickCaptureProvider.
 */
function QuickCaptureContent({ children }: QuickCaptureWrapperProps) {
  const { open } = useQuickCapture();

  return (
    <>
      {children}
      <QuickCapture />
      <FAB onClick={open} />
    </>
  );
}

/**
 * Client wrapper that provides QuickCapture context to the app.
 * Wraps children in QuickCaptureProvider and renders the modal + FAB.
 *
 * This keeps the root layout as a server component while adding
 * the client-side context for quick capture functionality.
 */
export function QuickCaptureWrapper({ children }: QuickCaptureWrapperProps) {
  return (
    <QuickCaptureProvider>
      <QuickCaptureContent>{children}</QuickCaptureContent>
    </QuickCaptureProvider>
  );
}
