"use client";

import { Sheet } from "@/components/ui/Sheet";
import { CloseIcon } from "@/components/ui/Icons";
import { TaskDetailContent } from "@/components/tasks/TaskDetailContent";
import { useSelectedTask } from "@/context/SelectedTaskContext";

/**
 * TaskDetailSheet - Mobile wrapper for task detail using Sheet primitive.
 * Visible only on viewports below 768px (md breakpoint).
 * Slides up from bottom as a bottom sheet when a task is selected.
 */
export function TaskDetailSheet() {
  const { selectedTask, clearSelectedTask } = useSelectedTask();

  const isOpen = selectedTask !== null;

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

            {/* Content area with padding */}
            <div className="px-4 pb-6">
              <TaskDetailContent
                task={selectedTask}
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
