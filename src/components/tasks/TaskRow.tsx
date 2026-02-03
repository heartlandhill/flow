"use client";

import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { NoteIcon } from "@/components/ui/Icons";
import { useSelectedTask } from "@/context/SelectedTaskContext";
import type { TaskWithRelations } from "@/types";

interface TaskRowProps {
  task: TaskWithRelations;
  onComplete: (taskId: string) => void;
  onSelect?: (taskId: string) => void;
}

/**
 * Get the due date display info based on temporal proximity
 */
function getDueDateInfo(dueDate: Date | null): {
  label: string;
  textColor: string;
  bgColor: string;
} | null {
  if (!dueDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Format date label
  const formatDate = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  if (diffDays < 0) {
    // Overdue
    return {
      label: formatDate(due),
      textColor: "text-[#E88B8B]",
      bgColor: "bg-[rgba(232,139,139,0.14)]",
    };
  } else if (diffDays === 0) {
    // Today
    return {
      label: "Today",
      textColor: "text-[#F2D06B]",
      bgColor: "bg-[rgba(242,208,107,0.12)]",
    };
  } else if (diffDays === 1) {
    // Tomorrow
    return {
      label: "Tomorrow",
      textColor: "text-[#E8A87C]",
      bgColor: "bg-[rgba(232,168,124,0.12)]",
    };
  } else {
    // Future
    return {
      label: formatDate(due),
      textColor: "text-[var(--text-secondary)]",
      bgColor: "bg-[var(--bg-surface)]",
    };
  }
}

/**
 * Get area color for project label
 */
function getAreaColor(areaColor: string | null | undefined): string {
  // Use the area's color if provided, fallback to accent
  return areaColor || "var(--accent)";
}

export function TaskRow({ task, onComplete, onSelect }: TaskRowProps) {
  // Animation state: 'idle' | 'completing' | 'fading'
  const [animationState, setAnimationState] = useState<"idle" | "completing" | "fading">("idle");
  const { selectTask } = useSelectedTask();

  const handleCheck = useCallback(() => {
    if (animationState !== "idle") return;

    // Step 1: Checkbox fills + scales (0-200ms)
    setAnimationState("completing");

    // Step 2: After 200ms, row fades (200-500ms)
    setTimeout(() => {
      setAnimationState("fading");
    }, 200);

    // Step 3: After 500ms total, call onComplete
    setTimeout(() => {
      onComplete(task.id);
    }, 500);
  }, [animationState, onComplete, task.id]);

  const handleRowClick = useCallback(() => {
    if (animationState !== "idle") return;
    // Pass full task data to context for TaskDetailPanel
    selectTask(task);
    // Also call onSelect for backwards compatibility
    onSelect?.(task.id);
  }, [animationState, selectTask, task, onSelect]);

  const dueDateInfo = getDueDateInfo(task.due_date);
  const hasNotes = task.notes && task.notes.trim().length > 0;
  const areaColor = getAreaColor(task.project?.area?.color);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={`
        flex items-start gap-3 cursor-pointer
        rounded-md transition-all duration-300 ease-out

        /* Padding: 14px 12px mobile, 10px 12px desktop */
        py-3.5 px-3
        md:py-2.5 md:px-3

        /* Hover state */
        hover:bg-[var(--bg-hover)]

        /* Focus state */
        focus:outline-none focus-visible:bg-[var(--bg-hover)]

        /* Fading animation state */
        ${animationState === "fading" ? "opacity-30 scale-[0.97]" : "opacity-100 scale-100"}
      `}
    >
      {/* Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          checked={task.completed}
          completing={animationState === "completing" || animationState === "fading"}
          onCheck={handleCheck}
          aria-label={`Mark "${task.title}" complete`}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <p
          className={`
            text-[15px] md:text-[14px] font-normal leading-snug
            text-[var(--text-primary)]
            truncate
          `}
        >
          {task.title}
        </p>

        {/* Meta line */}
        {(task.project || task.tags.length > 0 || dueDateInfo) && (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Project pill */}
            {task.project && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: `${areaColor}20`,
                  color: areaColor,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: areaColor }}
                />
                {task.project.name}
              </span>
            )}

            {/* Tag icons - mobile shows icon only, desktop shows icon + name */}
            {task.tags.map((taskTag) => (
              <span
                key={taskTag.tag_id}
                className="text-[11px] text-[var(--text-secondary)]"
                title={taskTag.tag.name}
              >
                <span className="md:hidden">
                  {taskTag.tag.icon || "#"}
                </span>
                <span className="hidden md:inline">
                  {taskTag.tag.icon || "#"} {taskTag.tag.name}
                </span>
              </span>
            ))}

            {/* Due date badge */}
            {dueDateInfo && (
              <span
                className={`
                  inline-flex items-center px-1.5 py-0.5 rounded-full
                  text-[11px] font-medium
                  ${dueDateInfo.textColor} ${dueDateInfo.bgColor}
                `}
              >
                {dueDateInfo.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notes icon */}
      {hasNotes && (
        <div className="flex-shrink-0 pt-0.5">
          <NoteIcon
            size={16}
            className="text-[var(--text-tertiary)]"
          />
        </div>
      )}
    </div>
  );
}
