"use client";

import { useEffect, useCallback } from "react";
import { CloseIcon } from "@/components/ui/Icons";
import { TaskDetailContent } from "@/components/tasks/TaskDetailContent";
import { useSelectedTask } from "@/context/SelectedTaskContext";

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

interface TaskDetailProps {
  /** Areas with their projects for the project dropdown */
  areasWithProjects?: AreaWithProjects[];
  /** All available tags for tag toggle pills */
  allTags?: TagForToggle[];
}

/**
 * TaskDetail - Desktop side panel for task detail view.
 * Visible only on viewports at 768px+ (md breakpoint).
 * Slides in from right when a task is selected.
 *
 * Features:
 * - 340px fixed width
 * - Slide animation: opacity(0→1) + translateX(12px→0), 200ms ease
 * - Background: var(--bg-sidebar)
 * - Left border: 1px solid var(--border)
 * - Close button in top-right corner
 * - Escape key handler to close panel
 */
export function TaskDetail({ areasWithProjects = [], allTags = [] }: TaskDetailProps) {
  const { selectedTask, clearSelectedTask } = useSelectedTask();

  const isOpen = selectedTask !== null;

  // Handle Escape key to close panel
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        clearSelectedTask();
      }
    },
    [isOpen, clearSelectedTask]
  );

  // Register/unregister Escape key listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  return (
    <aside
      className={`
        hidden md:flex
        w-[340px] min-w-[340px]
        h-full
        flex-col
        bg-[var(--bg-sidebar)]
        border-l border-[var(--border)]
        z-40
        transition-all duration-200 ease-out
        ${
          isOpen
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 translate-x-3 pointer-events-none"
        }
      `}
      role="complementary"
      aria-label="Task details"
      aria-hidden={!isOpen}
    >
      {selectedTask && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with close button */}
          <div className="flex items-center justify-end px-4 pt-4 pb-2 flex-shrink-0">
            <button
              type="button"
              onClick={clearSelectedTask}
              className="
                p-2 -mr-2
                rounded-full
                text-[var(--text-tertiary)]
                hover:text-[var(--text-secondary)]
                hover:bg-[var(--bg-surface)]
                transition-colors duration-150
              "
              aria-label="Close task details"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          {/* Content area with padding and scroll */}
          <div className="px-4 pb-6 overflow-y-auto flex-1">
            <TaskDetailContent
              task={selectedTask}
              areasWithProjects={areasWithProjects}
              allTags={allTags}
              onEditClick={() => {
                // Edit functionality will be implemented in Spec 013
              }}
            />
          </div>
        </div>
      )}
    </aside>
  );
}
