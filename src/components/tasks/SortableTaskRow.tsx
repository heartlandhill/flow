"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskRow } from "./TaskRow";
import { GripIcon } from "@/components/ui/Icons";
import type { TaskWithRelations } from "@/types";

interface SortableTaskRowProps {
  task: TaskWithRelations;
  onComplete: (taskId: string) => void;
  onSelect?: (taskId: string) => void;
  /** Optional full task data to pass to context when selected.
   *  Use this when task prop is modified for display (e.g., project: null)
   *  but you want the full data available in TaskDetailPanel. */
  contextTask?: TaskWithRelations;
}

export function SortableTaskRow({
  task,
  onComplete,
  onSelect,
  contextTask,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center
        /* Add left padding on mobile to make room for visible drag handle */
        pl-7 md:pl-0
        ${isDragging ? "opacity-50 z-50" : "opacity-100"}
      `}
      // Set touch-action for proper mobile handling
      {...attributes}
    >
      {/* Drag handle - visible on mobile, hover-to-reveal on desktop */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        type="button"
        className={`
          absolute top-1/2 -translate-y-1/2
          /* Mobile: positioned inside the left padding area */
          left-1
          /* Desktop: positioned outside to the left, revealed on hover */
          md:left-0 md:-translate-x-6
          p-1 rounded
          cursor-grab
          text-[var(--text-tertiary)]
          opacity-40 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100
          hover:text-[var(--text-secondary)]
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
          transition-opacity duration-150
          touch-action-manipulation
          ${isDragging ? "cursor-grabbing" : "cursor-grab"}
        `}
        aria-label={`Drag to reorder "${task.title}"`}
      >
        <GripIcon size={16} />
      </button>

      {/* Task row */}
      <div className="flex-1 min-w-0">
        <TaskRow
          task={task}
          onComplete={onComplete}
          onSelect={onSelect}
          contextTask={contextTask}
        />
      </div>
    </div>
  );
}
