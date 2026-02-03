"use client";

import { ReactNode } from "react";
import { SelectedTaskProvider } from "@/context/SelectedTaskContext";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";

// Simplified type for project dropdown - just need id, name
interface ProjectForDropdown {
  id: string;
  name: string;
}

// Area with its projects for grouped dropdown
interface AreaWithProjects {
  id: string;
  name: string;
  color: string;
  projects: ProjectForDropdown[];
}

// Simplified type for tag toggle pills
interface TagForToggle {
  id: string;
  name: string;
  icon: string | null;
}

interface SelectedTaskWrapperProps {
  children: ReactNode;
  /** Areas with their projects for the project dropdown */
  areasWithProjects?: AreaWithProjects[];
  /** All available tags for tag toggle pills */
  allTags?: TagForToggle[];
}

/**
 * Inner component that renders the task detail panels.
 * Must be inside SelectedTaskProvider.
 */
function SelectedTaskContent({ children, areasWithProjects = [], allTags = [] }: SelectedTaskWrapperProps) {
  return (
    <>
      {children}
      <TaskDetailSheet areasWithProjects={areasWithProjects} allTags={allTags} />
    </>
  );
}

/**
 * Client wrapper that provides SelectedTask context to the app.
 * Wraps children in SelectedTaskProvider and renders the mobile
 * TaskDetailSheet component. Desktop TaskDetail is rendered in
 * layout.tsx as part of the flex-based layout structure.
 *
 * This keeps the root layout as a server component while adding
 * the client-side context for selected task functionality.
 */
export function SelectedTaskWrapper({ children, areasWithProjects = [], allTags = [] }: SelectedTaskWrapperProps) {
  return (
    <SelectedTaskProvider>
      <SelectedTaskContent areasWithProjects={areasWithProjects} allTags={allTags}>
        {children}
      </SelectedTaskContent>
    </SelectedTaskProvider>
  );
}
