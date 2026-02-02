"use client";

import { useState, useCallback, useTransition } from "react";
import { TaskRow } from "@/components/tasks/TaskRow";
import { completeTask } from "@/actions/tasks";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

interface ForecastListProps {
  initialTasks: TaskWithRelations[];
  tasksByDate: Record<string, TaskWithRelations[]>;
  daysWithTasks: Date[];
}

/**
 * Helper to format date as YYYY-MM-DD for looking up tasks
 */
function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Client component for the Forecast view task list.
 * Manages optimistic UI updates for task completion.
 * Renders tasks grouped by day, showing only days that have tasks.
 *
 * Follows the same pattern as TodayList for optimistic updates.
 */
export function ForecastList({
  initialTasks,
  tasksByDate: initialTasksByDate,
  daysWithTasks: initialDaysWithTasks,
}: ForecastListProps) {
  // Local state for optimistic updates
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  const [tasksByDate, setTasksByDate] =
    useState<Record<string, TaskWithRelations[]>>(initialTasksByDate);
  // Track tasks being completed (for preventing double-clicks)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // React transition for non-blocking server action calls
  const [, startTransition] = useTransition();

  const handleComplete = useCallback(
    (taskId: string) => {
      // Prevent completing the same task twice
      if (completingIds.has(taskId)) return;

      // Mark task as completing
      setCompletingIds((prev) => new Set(prev).add(taskId));

      // Find the task being removed (for potential rollback)
      const taskToRemove = tasks.find((t) => t.id === taskId);
      const taskDateKey = taskToRemove?.due_date
        ? getDateKey(taskToRemove.due_date)
        : null;

      // Optimistically remove task from the flat list
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      // Optimistically remove task from the date grouping
      if (taskDateKey) {
        setTasksByDate((prev) => {
          const updatedDate = (prev[taskDateKey] || []).filter(
            (t) => t.id !== taskId
          );
          if (updatedDate.length === 0) {
            // Remove the date key entirely if no tasks remain
            const { [taskDateKey]: _, ...rest } = prev;
            return rest;
          }
          return { ...prev, [taskDateKey]: updatedDate };
        });
      }

      // Call server action in a transition
      startTransition(async () => {
        const result = await completeTask(taskId);

        if (!result.success) {
          // Restore task on failure
          console.error("Failed to complete task:", result.error);
          if (taskToRemove) {
            // Restore to flat list, maintaining order by due_date and sort_order
            setTasks((prev) => {
              const insertIndex = prev.findIndex((t) => {
                // First compare by due_date
                if (!t.due_date && !taskToRemove.due_date) {
                  return t.sort_order > taskToRemove.sort_order;
                }
                if (!taskToRemove.due_date) return true;
                if (!t.due_date) return false;
                if (t.due_date.getTime() !== taskToRemove.due_date.getTime()) {
                  return t.due_date > taskToRemove.due_date;
                }
                // Then compare by sort_order
                return t.sort_order > taskToRemove.sort_order;
              });
              if (insertIndex === -1) {
                return [...prev, taskToRemove];
              }
              const newTasks = [...prev];
              newTasks.splice(insertIndex, 0, taskToRemove);
              return newTasks;
            });

            // Restore to date grouping
            if (taskDateKey) {
              setTasksByDate((prev) => {
                const existing = prev[taskDateKey] || [];
                // Insert in correct position by sort_order
                const insertIndex = existing.findIndex(
                  (t) => t.sort_order > taskToRemove.sort_order
                );
                if (insertIndex === -1) {
                  return { ...prev, [taskDateKey]: [...existing, taskToRemove] };
                }
                const updated = [...existing];
                updated.splice(insertIndex, 0, taskToRemove);
                return { ...prev, [taskDateKey]: updated };
              });
            }
          }
        }

        // Remove from completing set
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      });
    },
    [tasks, completingIds]
  );

  const handleSelect = useCallback((taskId: string) => {
    // Task selection will be handled by TaskDetail component in a future spec
    // For now, this is a placeholder for the click handler
  }, []);

  // Get current days that have tasks (derived from tasksByDate state)
  const currentDaysWithTasks = initialDaysWithTasks.filter((date) => {
    const dateKey = getDateKey(date);
    return (tasksByDate[dateKey]?.length ?? 0) > 0;
  });

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {currentDaysWithTasks.map((date) => {
        const dateKey = getDateKey(date);
        const dayTasks = tasksByDate[dateKey] || [];

        if (dayTasks.length === 0) {
          return null;
        }

        return (
          <div key={dateKey}>
            {/* Day header with date and task count */}
            <div className="flex items-baseline gap-2 px-2 mb-2">
              <h2 className="font-display text-[16px] font-medium text-[var(--text-primary)]">
                {formatDate(date)}
              </h2>
              <span className="text-[13px] text-[var(--text-tertiary)]">
                {dayTasks.length}
              </span>
            </div>
            {/* Task list for this day */}
            <div className="flex flex-col">
              {dayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
