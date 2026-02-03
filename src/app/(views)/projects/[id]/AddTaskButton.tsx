"use client";

import { useCallback } from "react";
import { useQuickCapture } from "@/hooks/useQuickCapture";

interface AddTaskButtonProps {
  /** The project ID for contextual task creation */
  projectId: string;
  /** The project name to display in the modal header */
  projectName: string;
  /** The area color for the visual indicator */
  areaColor: string;
  /** All available tags for the new task modal */
  allTags: { id: string; name: string; icon: string | null }[];
  /** Optional variant for different button styles */
  variant?: "primary" | "secondary";
}

/**
 * Client component button that opens QuickCapture with project context.
 * Used in both empty state and below task lists to add new tasks to the project.
 */
export function AddTaskButton({
  projectId,
  projectName,
  areaColor,
  allTags: _allTags,
  variant = "primary",
}: AddTaskButtonProps) {
  const { open } = useQuickCapture();

  const handleClick = useCallback(() => {
    open(projectId, projectName, areaColor);
  }, [open, projectId, projectName, areaColor]);

  // Primary variant: solid accent button (for empty state CTA)
  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`
          flex items-center gap-1.5
          px-4 py-1.5
          text-[14px] font-medium
          text-[var(--bg-root)]
          bg-[var(--accent)]
          rounded-md
          transition-all duration-150
          hover:opacity-90
          active:scale-[0.98] active:brightness-90
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
        `}
      >
        {/* Plus icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className="opacity-90"
        >
          <path
            d="M8 3V13M3 8H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Add Task</span>
      </button>
    );
  }

  // Secondary variant: text button (for below task lists)
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        flex items-center gap-1
        px-2.5 py-1
        text-[13px] font-medium
        text-[var(--accent)]
        bg-transparent
        rounded-md
        transition-all duration-150
        hover:bg-[rgba(232,168,124,0.12)]
        active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
      `}
    >
      {/* Plus icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="opacity-80"
      >
        <path
          d="M8 3V13M3 8H13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span>Add Task</span>
    </button>
  );
}
