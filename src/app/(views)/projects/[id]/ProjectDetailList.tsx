"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { TaskRow } from "@/components/tasks/TaskRow";
import { completeTask } from "@/actions/tasks";
import { useSearch } from "@/context/SearchContext";
import type { TaskWithRelations } from "@/types";

interface ProjectDetailListProps {
  initialTasks: TaskWithRelations[];
}

/**
 * Client component for the project detail task list.
 * Manages optimistic UI updates for task completion and search filtering.
 * Follows the same pattern as InboxList and TodayList.
 */
export function ProjectDetailList({ initialTasks }: ProjectDetailListProps) {
  // Local state for optimistic updates
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  // Track tasks being completed (for preventing double-clicks)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // React transition for non-blocking server action calls
  const [isPending, startTransition] = useTransition();
  // Search context for filtering
  const { query } = useSearch();

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!query.trim()) return tasks;
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [tasks, query]);

  const isSearchActive = query.trim().length > 0;

  const handleComplete = useCallback(
    (taskId: string) => {
      // Prevent completing the same task twice
      if (completingIds.has(taskId)) return;

      // Mark task as completing
      setCompletingIds((prev) => new Set(prev).add(taskId));

      // Optimistically remove task from list
      const taskToRemove = tasks.find((t) => t.id === taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      // Call server action in a transition
      startTransition(async () => {
        const result = await completeTask(taskId);

        if (!result.success) {
          // Restore task on failure
          console.error("Failed to complete task:", result.error);
          if (taskToRemove) {
            setTasks((prev) => {
              // Find the correct position to insert (maintain order by sort_order)
              const insertIndex = prev.findIndex(
                (t) => t.sort_order > taskToRemove.sort_order
              );
              if (insertIndex === -1) {
                return [...prev, taskToRemove];
              }
              const newTasks = [...prev];
              newTasks.splice(insertIndex, 0, taskToRemove);
              return newTasks;
            });
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

  // If no tasks at all (not due to search), return null
  if (tasks.length === 0) {
    return null;
  }

  // If search is active but no results
  if (isSearchActive && filteredTasks.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="px-4 py-2 text-sm text-[var(--text-secondary)]">
          No tasks matching &apos;{query}&apos;
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isSearchActive && (
        <div className="px-4 py-2 text-sm text-[var(--text-secondary)]">
          Showing results for &apos;{query}&apos;
        </div>
      )}
      {filteredTasks.map((task) => (
        <TaskRow
          key={task.id}
          // Hide project pill since we're already viewing this project
          task={{ ...task, project: null }}
          // Pass full task data to context for TaskDetailPanel
          contextTask={task}
          onComplete={handleComplete}
        />
      ))}
    </div>
  );
}
