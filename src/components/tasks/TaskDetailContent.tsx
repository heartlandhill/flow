"use client";

import { ForecastIcon } from "@/components/ui/Icons";
import type { TaskWithRelations } from "@/types";

interface TaskDetailContentProps {
  task: TaskWithRelations;
  onEditClick?: () => void;
}

/**
 * Get the due date display info based on temporal proximity
 * Replicates logic from TaskRow.tsx for consistency
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
 * Get defer date display info - uses same color coding as due dates
 */
function getDeferDateInfo(deferDate: Date | null): {
  label: string;
  textColor: string;
  bgColor: string;
} | null {
  if (!deferDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const defer = new Date(deferDate.getFullYear(), deferDate.getMonth(), deferDate.getDate());

  const diffTime = defer.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Format date label
  const formatDate = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  if (diffDays < 0) {
    // Past defer date (task should be visible)
    return {
      label: formatDate(defer),
      textColor: "text-[var(--text-secondary)]",
      bgColor: "bg-[var(--bg-surface)]",
    };
  } else if (diffDays === 0) {
    // Deferred until today
    return {
      label: "Today",
      textColor: "text-[#F2D06B]",
      bgColor: "bg-[rgba(242,208,107,0.12)]",
    };
  } else if (diffDays === 1) {
    // Deferred until tomorrow
    return {
      label: "Tomorrow",
      textColor: "text-[#E8A87C]",
      bgColor: "bg-[rgba(232,168,124,0.12)]",
    };
  } else {
    // Future defer date
    return {
      label: formatDate(defer),
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

/**
 * TaskDetailContent renders all task fields in a read-only format.
 * Shared between mobile bottom sheet and desktop side panel.
 */
export function TaskDetailContent({ task, onEditClick }: TaskDetailContentProps) {
  const dueDateInfo = getDueDateInfo(task.due_date);
  const deferDateInfo = getDeferDateInfo(task.defer_date);
  const areaColor = getAreaColor(task.project?.area?.color);
  const hasNotes = task.notes && task.notes.trim().length > 0;
  const hasTags = task.tags.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header with title and edit button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h2
          className="font-newsreader text-[20px] font-medium leading-snug text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-newsreader)" }}
        >
          {task.title}
        </h2>
        <button
          type="button"
          onClick={onEditClick}
          className="flex-shrink-0 text-[14px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
        >
          Edit
        </button>
      </div>

      {/* Field sections with 16px spacing */}
      <div className="flex flex-col gap-4">
        {/* Project field */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Project
          </span>
          {task.project ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[13px] font-medium w-fit"
              style={{
                backgroundColor: `${areaColor}20`,
                color: areaColor,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: areaColor }}
              />
              {task.project.name}
            </span>
          ) : (
            <span className="text-[14px] text-[var(--text-tertiary)]">
              No project
            </span>
          )}
        </div>

        {/* Due date field */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Due Date
          </span>
          {dueDateInfo ? (
            <span
              className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[13px] font-medium w-fit
                ${dueDateInfo.textColor} ${dueDateInfo.bgColor}
              `}
            >
              <ForecastIcon size={14} className="flex-shrink-0" />
              {dueDateInfo.label}
            </span>
          ) : (
            <span className="text-[14px] text-[var(--text-tertiary)]">
              No due date
            </span>
          )}
        </div>

        {/* Defer date field - only shown if present */}
        {deferDateInfo && (
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Deferred Until
            </span>
            <span
              className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[13px] font-medium w-fit
                ${deferDateInfo.textColor} ${deferDateInfo.bgColor}
              `}
            >
              <ForecastIcon size={14} className="flex-shrink-0" />
              {deferDateInfo.label}
            </span>
          </div>
        )}

        {/* Tags field */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Tags
          </span>
          {hasTags ? (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((taskTag) => (
                <span
                  key={taskTag.tag_id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[13px] font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]"
                >
                  <span>{taskTag.tag.icon || "#"}</span>
                  {taskTag.tag.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[14px] text-[var(--text-tertiary)]">
              No tags
            </span>
          )}
        </div>

        {/* Notes field - only shown if present */}
        {hasNotes && (
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Notes
            </span>
            <div className="bg-[var(--bg-surface)] rounded-[10px] p-3.5">
              <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                {task.notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
