"use client";

import { useState, useCallback, useTransition, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { SortableTaskRow } from "@/components/tasks/SortableTaskRow";
import { completeTask, reorderTasks } from "@/actions/tasks";
import { useSearch } from "@/context/SearchContext";
import { getFirstIncompleteTaskId } from "@/lib/task-utils";
import type { TaskWithRelations, ProjectType } from "@/types";

interface ProjectDetailListProps {
  initialTasks: TaskWithRelations[];
  projectId: string;
  projectType: ProjectType;
}

/**
 * Client component for the project detail task list.
 * Manages optimistic UI updates for task completion, search filtering,
 * and drag-and-drop reordering.
 * Follows the same pattern as InboxList and TodayList.
 */
export function ProjectDetailList({
  initialTasks,
  projectId,
  projectType,
}: ProjectDetailListProps) {
  // Local state for optimistic updates
  const [tasks, setTasks] = useState<TaskWithRelations[]>(initialTasks);
  // Track tasks being completed (for preventing double-clicks)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // React transition for non-blocking server action calls
  const [isPending, startTransition] = useTransition();
  // Search context for filtering
  const { query } = useSearch();
  // Store previous order for rollback on reorder failure
  const previousOrderRef = useRef<TaskWithRelations[]>([]);

  // Configure dnd-kit sensors
  // MouseSensor for desktop, TouchSensor with delay for mobile, KeyboardSensor for accessibility
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!query.trim()) return tasks;
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [tasks, query]);

  const isSearchActive = query.trim().length > 0;

  // For SEQUENTIAL projects, identify the first incomplete task (the "available" one)
  const firstIncompleteId = projectType === "SEQUENTIAL"
    ? getFirstIncompleteTaskId(tasks)
    : null;

  // Helper to check if a task is available
  const isTaskAvailable = (taskId: string) => {
    return projectType === "PARALLEL" || taskId === firstIncompleteId;
  };

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

  // Handle drag end event for reordering
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      // No drop target or dropped in same position
      if (!over || active.id === over.id) {
        return;
      }

      // Find old and new indices
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Store previous order for rollback
      previousOrderRef.current = tasks;

      // Optimistically update the order
      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      // Call server action to persist the new order
      startTransition(async () => {
        const result = await reorderTasks(
          projectId,
          newTasks.map((t) => t.id)
        );

        if (!result.success) {
          // Rollback on failure
          console.error("Failed to reorder tasks:", result.error);
          setTasks(previousOrderRef.current);
        }
      });
    },
    [tasks, projectId]
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredTasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col">
          {isSearchActive && (
            <div className="px-4 py-2 text-sm text-[var(--text-secondary)]">
              Showing results for &apos;{query}&apos;
            </div>
          )}
          {filteredTasks.map((task) => {
            const available = isTaskAvailable(task.id);
            return (
              <div
                key={task.id}
                className={`relative ${!available ? "opacity-50" : ""}`}
              >
                <SortableTaskRow
                  // Hide project pill since we're already viewing this project
                  task={{ ...task, project: null }}
                  // Pass full task data to context for TaskDetailPanel
                  contextTask={task}
                  onComplete={handleComplete}
                />
                {!available && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)]">
                    (waiting)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
