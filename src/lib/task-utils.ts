/**
 * Task availability utility functions for the Flow GTD application
 *
 * Implements OmniFocus-style task filtering based on project type:
 * - PARALLEL projects: all incomplete tasks are available
 * - SEQUENTIAL projects: only the first incomplete task (by sort_order) is available
 */

import type { TaskWithRelations } from "@/types";

/**
 * Get the ID of the first incomplete task in a list sorted by sort_order
 * Returns null if no incomplete tasks exist
 */
export function getFirstIncompleteTaskId(
  tasks: Array<{ id: string; completed: boolean; sort_order: number }>
): string | null {
  // Sort by sort_order and find first incomplete
  const sorted = [...tasks].sort((a, b) => a.sort_order - b.sort_order);
  const firstIncomplete = sorted.find((task) => !task.completed);
  return firstIncomplete?.id ?? null;
}

/**
 * Check if a task is "available" (actionable now) based on its project type
 *
 * A task is available when:
 * - It has no project (inbox tasks, tasks without projects) = always available
 * - It's in a PARALLEL project = always available (if incomplete)
 * - It's in a SEQUENTIAL project = only if it's the first incomplete task by sort_order
 *
 * @param task - The task to check availability for
 * @param allProjectTasks - Optional: all tasks from the same project (needed for SEQUENTIAL check)
 *                          If not provided and task is in a SEQUENTIAL project, returns true
 *                          (assumes caller doesn't have context to determine availability)
 */
export function isTaskAvailable(
  task: TaskWithRelations,
  allProjectTasks?: Array<{ id: string; completed: boolean; sort_order: number }>
): boolean {
  // Completed tasks are not "available" (they're done)
  if (task.completed) {
    return false;
  }

  // No project = always available
  if (!task.project) {
    return true;
  }

  // PARALLEL projects: all incomplete tasks are available
  if (task.project.type === "PARALLEL") {
    return true;
  }

  // SEQUENTIAL projects: only first incomplete task is available
  if (task.project.type === "SEQUENTIAL") {
    // If we don't have project tasks context, we can't determine availability
    // Default to true to avoid hiding tasks unexpectedly
    if (!allProjectTasks) {
      return true;
    }

    const firstIncompleteId = getFirstIncompleteTaskId(allProjectTasks);
    return task.id === firstIncompleteId;
  }

  // Fallback: treat as available
  return true;
}

/**
 * Filter an array of tasks to only include available tasks
 *
 * Groups tasks by project and applies availability logic:
 * - Tasks without projects: always included
 * - PARALLEL project tasks: all incomplete included
 * - SEQUENTIAL project tasks: only first incomplete (by sort_order) included
 *
 * @param tasks - Array of tasks with relations to filter
 * @returns Array of available tasks (maintains original order, just filters)
 */
export function filterAvailableTasks(
  tasks: TaskWithRelations[]
): TaskWithRelations[] {
  // Group tasks by project ID for efficient lookup
  const tasksByProject = new Map<string | null, TaskWithRelations[]>();

  for (const task of tasks) {
    const projectId = task.project?.id ?? null;
    const projectTasks = tasksByProject.get(projectId) ?? [];
    projectTasks.push(task);
    tasksByProject.set(projectId, projectTasks);
  }

  // Build a set of available task IDs for quick lookup
  const availableTaskIds = new Set<string>();

  for (const [projectId, projectTasks] of tasksByProject) {
    if (projectId === null) {
      // No project: all tasks are available
      for (const task of projectTasks) {
        if (!task.completed) {
          availableTaskIds.add(task.id);
        }
      }
      continue;
    }

    // Get project type from first task (all tasks in group have same project)
    const projectType = projectTasks[0]?.project?.type;

    if (projectType === "PARALLEL") {
      // All incomplete tasks are available
      for (const task of projectTasks) {
        if (!task.completed) {
          availableTaskIds.add(task.id);
        }
      }
    } else if (projectType === "SEQUENTIAL") {
      // Only first incomplete task is available
      const firstIncompleteId = getFirstIncompleteTaskId(projectTasks);
      if (firstIncompleteId) {
        availableTaskIds.add(firstIncompleteId);
      }
    }
  }

  // Filter original array maintaining order
  return tasks.filter((task) => availableTaskIds.has(task.id));
}
