"use client";

import { useState, useCallback, useTransition } from "react";
import { TaskRow } from "@/components/tasks/TaskRow";
import { completeTask } from "@/actions/tasks";
import type { TaskWithRelations } from "@/types";

interface InboxListProps {
  initialTasks: TaskWithRelations[];
}

/**
 * Client component for the inbox task list.
 * Manages optimistic UI updates for task completion.
 */
export function InboxList({ initialTasks }: InboxListProps) {
  // Local state for optimistic updates
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  // Track tasks being completed (for preventing double-clicks)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // React transition for non-blocking server action calls
  const [isPending, startTransition] = useTransition();

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
              // Find the correct position to insert (maintain order)
              const insertIndex = prev.findIndex(
                (t) => new Date(t.created_at) < new Date(taskToRemove.created_at)
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

  const handleSelect = useCallback((taskId: string) => {
    // Task selection will be handled by TaskDetail component in a future spec
    // For now, this is a placeholder for the click handler
  }, []);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onComplete={handleComplete}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}
