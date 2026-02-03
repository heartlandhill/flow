"use client";

import { useEffect } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { CloseIcon } from "@/components/ui/Icons";
import { TaskDetailContent } from "@/components/tasks/TaskDetailContent";
import { useSelectedTask } from "@/context/SelectedTaskContext";
import { useOverlay } from "@/context/OverlayContext";

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

interface TaskDetailSheetProps {
  /** Areas with their projects for the project dropdown */
  areasWithProjects?: AreaWithProjects[];
  /** All available tags for tag toggle pills */
  allTags?: TagForToggle[];
}

/**
 * TaskDetailSheet - Mobile wrapper for task detail using Sheet primitive.
 * Visible only on viewports below 768px (md breakpoint).
 * Slides up from bottom as a bottom sheet when a task is selected.
 */
export function TaskDetailSheet({ areasWithProjects = [], allTags = [] }: TaskDetailSheetProps) {
  const { selectedTask, clearSelectedTask } = useSelectedTask();
  const { registerOverlay, unregisterOverlay } = useOverlay();

  const isOpen = selectedTask !== null;

  // Register overlay when sheet is open
  useEffect(() => {
    if (isOpen) {
      registerOverlay('task-detail-sheet');
      return () => unregisterOverlay('task-detail-sheet');
    }
  }, [isOpen, registerOverlay, unregisterOverlay]);

  return (
    <div className="md:hidden">
      <Sheet
        isOpen={isOpen}
        onClose={clearSelectedTask}
        aria-label="Task details"
      >
        {selectedTask && (
          <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="flex items-center justify-end px-4 pb-2 flex-shrink-0">
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

            {/* Content area with padding - matches reference: 4px 20px 32px */}
            <div className="pt-1 px-5 pb-8">
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
      </Sheet>
    </div>
  );
}
