"use client";

import { useState, useCallback, useTransition } from "react";
import { TaskRow } from "@/components/tasks/TaskRow";
import type { ReviewableProject, ReviewProjectStats, ActionResult, TaskWithRelations } from "@/types";

interface ProjectWithStats {
  project: ReviewableProject;
  stats: ReviewProjectStats;
}

interface ReviewCardProps {
  /** Projects with their computed stats */
  projectsWithStats: ProjectWithStats[];
  /** Server action to mark a project as reviewed */
  onMarkReviewed: (id: string) => Promise<ActionResult>;
  /** Server action to complete a task */
  onTaskComplete: (taskId: string) => Promise<ActionResult>;
}

/**
 * Get area color with fallback
 */
function getAreaColor(color: string | null): string {
  return color || "var(--accent)";
}

/**
 * ReviewCard component - displays projects one at a time for review.
 *
 * Shows:
 * - Progress indicator ("X of Y")
 * - Area badge with area color
 * - Project name
 * - Stats row (remaining count, completion percentage)
 */
export function ReviewCard({
  projectsWithStats,
  onMarkReviewed,
  onTaskComplete,
}: ReviewCardProps) {
  // Current index in the project list
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track if review session is complete
  const [isComplete, setIsComplete] = useState(false);
  // React transition for non-blocking server action calls
  const [isPending, startTransition] = useTransition();

  // Current project and stats
  const current = projectsWithStats[currentIndex];
  const totalProjects = projectsWithStats.length;

  // Determine if on first or last project
  const isFirstProject = currentIndex === 0;
  const isLastProject = currentIndex === totalProjects - 1;

  // Handle "Previous" button click
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Handle "Mark Reviewed" / "Finish Review" button click
  const handleMarkReviewed = useCallback(() => {
    if (isPending || !current) return;

    startTransition(async () => {
      const result = await onMarkReviewed(current.project.id);

      if (!result.success) {
        console.error("Failed to mark project as reviewed:", result.error);
        return;
      }

      // If this was the last project, show completion state
      if (isLastProject) {
        setIsComplete(true);
      } else {
        // Advance to next project
        setCurrentIndex((prev) => prev + 1);
      }
    });
  }, [isPending, current, onMarkReviewed, isLastProject]);

  // Handle task completion
  const handleTaskComplete = useCallback(
    (taskId: string) => {
      startTransition(async () => {
        const result = await onTaskComplete(taskId);
        if (!result.success) {
          console.error("Failed to complete task:", result.error);
        }
      });
    },
    [onTaskComplete]
  );

  // Show completion state when all projects are reviewed
  if (isComplete) {
    return <CompletionState />;
  }

  // Should not happen, but guard for empty array
  if (!current) {
    return null;
  }

  const { project, stats } = current;
  const areaColor = getAreaColor(project.area.color);

  return (
    <div
      className={`
        bg-[var(--bg-card)] border border-[var(--border)]
        rounded-[10px]
        p-4 md:p-6
      `}
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-end mb-4">
        <span className="text-[13px] font-normal text-[var(--text-secondary)]">
          {currentIndex + 1} of {totalProjects}
        </span>
      </div>

      {/* Area badge */}
      <div className="mb-2">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
          style={{
            backgroundColor: `${areaColor}20`,
            color: areaColor,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: areaColor }}
          />
          {project.area.name}
        </span>
      </div>

      {/* Project name */}
      <h2
        className="font-display text-[22px] font-medium text-[var(--text-primary)] mt-2 mb-6"
      >
        {project.name}
      </h2>

      {/* Stats row */}
      <div className="flex gap-6 mb-4">
        {/* Remaining count */}
        <div className="flex flex-col">
          <span className="text-[20px] md:text-[22px] font-semibold text-[var(--text-primary)]">
            {stats.incompleteTasks}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.8px] text-[var(--text-secondary)]">
            Remaining
          </span>
        </div>

        {/* Completion percentage */}
        <div className="flex flex-col">
          <span className="text-[20px] md:text-[22px] font-semibold text-[var(--text-primary)]">
            {stats.completionPercentage}%
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.8px] text-[var(--text-secondary)]">
            Complete
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-[4px] rounded-full bg-[var(--bg-hover)] mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${stats.completionPercentage}%`,
            backgroundColor: areaColor,
          }}
        />
      </div>

      {/* Next Actions section */}
      <div className="mb-6">
        <h3 className="text-[12px] font-medium uppercase tracking-[0.8px] text-[var(--text-secondary)] mb-3">
          Next Actions
        </h3>
        <NextActionsList
          tasks={project.tasks}
          onTaskComplete={handleTaskComplete}
        />
      </div>

      {/* Prompting questions card */}
      <PromptingQuestionsCard />

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-6 flex-col md:flex-row md:justify-end">
        {/* Previous button - hidden on first project */}
        {!isFirstProject && (
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isPending}
            className={`
              px-4 py-2.5 rounded-lg
              text-[14px] font-medium
              bg-[var(--bg-surface)] text-[var(--text-secondary)]
              hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
              transition-colors duration-150 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              order-2 md:order-1
            `}
          >
            Previous
          </button>
        )}

        {/* Mark Reviewed / Finish Review button */}
        <button
          type="button"
          onClick={handleMarkReviewed}
          disabled={isPending}
          className={`
            px-4 py-2.5 rounded-lg
            text-[14px] font-medium
            bg-[var(--accent)] text-[var(--bg-root)]
            hover:opacity-90
            transition-opacity duration-150 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            order-1 md:order-2
          `}
        >
          {isPending ? "Saving..." : isLastProject ? "Finish Review" : "Mark Reviewed"}
        </button>
      </div>
    </div>
  );
}

/**
 * Completion state displayed after all projects are reviewed.
 */
function CompletionState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-[48px] mb-4" role="img" aria-label="Checkmark">
        ✅
      </span>
      <p className="font-display text-lg text-[var(--text-secondary)]">
        All projects reviewed — you&apos;re on top of things.
      </p>
    </div>
  );
}

/**
 * Next Actions list - shows all incomplete tasks for the project.
 * Uses TaskRow component for consistent task display.
 */
function NextActionsList({
  tasks,
  onTaskComplete,
}: {
  tasks: ReviewableProject["tasks"];
  onTaskComplete: (taskId: string) => void;
}) {
  // Filter to only incomplete tasks
  const incompleteTasks = tasks.filter((task) => !task.completed);

  // Convert TaskWithTags to TaskWithRelations for TaskRow
  // Pass project: null since we're already viewing the project
  const tasksWithRelations: TaskWithRelations[] = incompleteTasks.map((task) => ({
    ...task,
    project: null,
    reminders: [],
  }));

  // Edge case: no tasks or all completed
  if (tasksWithRelations.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[14px] text-[var(--text-secondary)] italic">
          No incomplete tasks — all caught up!
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-2">
      {tasksWithRelations.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onComplete={onTaskComplete}
        />
      ))}
    </div>
  );
}

/**
 * Prompting questions card - GTD reflection questions.
 * Three questions to help review the project thoroughly.
 */
function PromptingQuestionsCard() {
  const questions = [
    "Is this project still relevant?",
    "What's the next physical action?",
    "Is anything stuck or waiting?",
  ];

  return (
    <div
      className={`
        bg-[var(--bg-surface)]
        rounded-lg
        p-3.5
      `}
    >
      <ul className="space-y-2">
        {questions.map((question, index) => (
          <li
            key={index}
            className="text-[14px] text-[var(--text-secondary)] italic"
          >
            → {question}
          </li>
        ))}
      </ul>
    </div>
  );
}
