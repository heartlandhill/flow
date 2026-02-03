"use client";

import { ReactNode } from "react";
import { SelectedTaskProvider } from "@/context/SelectedTaskContext";
import { TaskDetail } from "@/components/tasks/TaskDetail";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";

interface SelectedTaskWrapperProps {
  children: ReactNode;
}

/**
 * Inner component that renders the task detail panels.
 * Must be inside SelectedTaskProvider.
 */
function SelectedTaskContent({ children }: SelectedTaskWrapperProps) {
  return (
    <>
      {children}
      <TaskDetailSheet />
      <TaskDetail />
    </>
  );
}

/**
 * Client wrapper that provides SelectedTask context to the app.
 * Wraps children in SelectedTaskProvider and renders both mobile
 * (TaskDetailSheet) and desktop (TaskDetail) detail components.
 *
 * This keeps the root layout as a server component while adding
 * the client-side context for selected task functionality.
 */
export function SelectedTaskWrapper({ children }: SelectedTaskWrapperProps) {
  return (
    <SelectedTaskProvider>
      <SelectedTaskContent>{children}</SelectedTaskContent>
    </SelectedTaskProvider>
  );
}
