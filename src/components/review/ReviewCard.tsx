"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTaskRow } from "@/components/tasks/SortableTaskRow";
import { TaskRow } from "@/components/tasks/TaskRow";
import { getFirstIncompleteTaskId } from "@/lib/task-utils";
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
  /** Server action to reorder tasks within a project */
  onReorderTasks: (projectId: string, taskIds: string[]) => Promise<ActionResult>;
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
  onReorderTasks,
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
          className="inline-block px-2.5 py-[3px] rounded-xl text-[11px] font-semibold text-[var(--bg-root)]"
          style={{
            backgroundColor: areaColor,
          }}
        >
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
      <div className="flex gap-7 mb-3.5">
        {/* Remaining count */}
        <div className="flex flex-col">
          <span className="text-[20px] font-semibold text-[var(--text-primary)]">
            {stats.incompleteTasks}
          </span>
          <span className="text-[11px] uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
            Remaining
          </span>
        </div>

        {/* Completion percentage */}
        <div className="flex flex-col">
          <span className="text-[20px] font-semibold text-[var(--text-primary)]">
            {stats.completionPercentage}%
          </span>
          <span className="text-[11px] uppercase tracking-[0.5px] text-[var(--text-tertiary)]">
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
          project={project}
          onTaskComplete={handleTaskComplete}
          onReorderTasks={onReorderTasks}
        />
      </div>

      {/* Prompting questions card */}
      <PromptingQuestionsCard />

      {/* Navigation buttons */}
      <div className="flex gap-2.5 mt-5 flex-col md:flex-row md:justify-between">
        {/* Previous button - hidden on first project */}
        {!isFirstProject && (
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isPending}
            className={`
              px-5 py-3 rounded-md
              text-[14px] font-medium
              bg-[var(--bg-surface)] text-[var(--text-secondary)]
              border border-[var(--border)]
              transition-all duration-150 ease-out
              hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]
              active:brightness-95
              disabled:opacity-30 disabled:cursor-not-allowed
              order-2 md:order-1 md:flex-1
              text-center
            `}
          >
            Back
          </button>
        )}

        {/* Mark Reviewed / Finish Review button */}
        <button
          type="button"
          onClick={handleMarkReviewed}
          disabled={isPending}
          className={`
            px-5 py-3 rounded-md
            text-[14px] font-medium
            bg-[var(--accent)] text-[var(--bg-root)]
            transition-all duration-150 ease-out
            active:brightness-90
            disabled:opacity-50 disabled:cursor-not-allowed
            order-1 md:order-2 md:flex-1
            text-center
          `}
        >
          {isPending ? "Saving..." : isLastProject ? "Done" : "Reviewed →"}
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
 * Next Actions list - shows ALL incomplete tasks for review with drag-and-drop reordering.
 *
 * Unlike action-oriented views (Today, Forecast), Review shows all tasks
 * so users can examine the whole project, reorder if needed, and identify
 * what's stuck. For SEQUENTIAL projects, the first task is shown at full
 * opacity while subsequent tasks are dimmed to indicate they're waiting.
 */
function NextActionsList({
  tasks,
  project,
  onTaskComplete,
  onReorderTasks,
}: {
  tasks: ReviewableProject["tasks"];
  project: ReviewableProject;
  onTaskComplete: (taskId: string) => void;
  onReorderTasks: (projectId: string, taskIds: string[]) => Promise<ActionResult>;
}) {
  // Track if component is mounted (for SSR hydration fix)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Local state for optimistic reordering
  const [localTasks, setLocalTasks] = useState(() =>
    [...tasks]
      .filter((task) => !task.completed)
      .sort((a, b) => a.sort_order - b.sort_order)
  );
  const [isPending, startTransition] = useTransition();

  // Sync localTasks when project changes (e.g., advancing to next project in review)
  useEffect(() => {
    setLocalTasks(
      [...tasks]
        .filter((task) => !task.completed)
        .sort((a, b) => a.sort_order - b.sort_order)
    );
  }, [project.id, tasks]);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - reorder tasks
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = localTasks.findIndex((t) => t.id === active.id);
        const newIndex = localTasks.findIndex((t) => t.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Optimistic update
          const newTasks = [...localTasks];
          const [movedTask] = newTasks.splice(oldIndex, 1);
          newTasks.splice(newIndex, 0, movedTask);
          setLocalTasks(newTasks);

          // Persist to server
          startTransition(async () => {
            const taskIds = newTasks.map((t) => t.id);
            const result = await onReorderTasks(project.id, taskIds);
            if (!result.success) {
              console.error("Failed to reorder tasks:", result.error);
              // Revert on failure
              setLocalTasks(
                [...tasks]
                  .filter((task) => !task.completed)
                  .sort((a, b) => a.sort_order - b.sort_order)
              );
            }
          });
        }
      }
    },
    [localTasks, onReorderTasks, project.id, tasks]
  );

  // For SEQUENTIAL projects, identify the first task (the "available" one)
  const firstIncompleteId = project.type === "SEQUENTIAL"
    ? getFirstIncompleteTaskId(localTasks)
    : null;

  // Convert tasks for display
  const tasksForDisplay: Array<{
    displayTask: TaskWithRelations;
    contextTask: TaskWithRelations;
    isAvailable: boolean;
  }> = localTasks.map((task) => ({
    displayTask: {
      ...task,
      project: null,
      reminders: [],
    },
    contextTask: {
      ...task,
      project: { ...project, area: project.area },
      reminders: [],
    },
    isAvailable: project.type === "PARALLEL" || task.id === firstIncompleteId,
  }));

  // Edge case: no tasks or all completed
  if (tasksForDisplay.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-[14px] text-[var(--text-secondary)] italic">
          No incomplete tasks — all caught up!
        </p>
      </div>
    );
  }

  // SSR fallback - render without drag-and-drop to avoid hydration mismatch
  // (dnd-kit generates different IDs on server vs client)
  if (!isMounted) {
    return (
      <div className="-mx-2">
        {tasksForDisplay.map(({ displayTask, contextTask, isAvailable }) => (
          <div
            key={displayTask.id}
            className={`relative ${!isAvailable ? "opacity-50" : ""}`}
          >
            <TaskRow
              task={displayTask}
              contextTask={contextTask}
              onComplete={onTaskComplete}
            />
            {!isAvailable && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)]">
                (waiting)
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Client-side with drag-and-drop enabled
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={`-mx-2 pl-6 ${isPending ? "opacity-70" : ""}`}>
          {tasksForDisplay.map(({ displayTask, contextTask, isAvailable }) => (
            <div
              key={displayTask.id}
              className={`relative ${!isAvailable ? "opacity-50" : ""}`}
            >
              <SortableTaskRow
                task={displayTask}
                contextTask={contextTask}
                onComplete={onTaskComplete}
              />
              {!isAvailable && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)]">
                  (waiting)
                </span>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
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
        rounded-md
        p-3.5
      `}
    >
      <ul className="space-y-1.5">
        {questions.map((question, index) => (
          <li
            key={index}
            className="text-[13px] text-[var(--text-secondary)] italic py-[3px]"
          >
            → {question}
          </li>
        ))}
      </ul>
    </div>
  );
}
