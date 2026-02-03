"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ActionResult, Task } from "@/types";

/**
 * Server action to create a new task in the inbox.
 * Sets inbox = true by default, all other fields to defaults.
 */
export async function createTask(title: string): Promise<ActionResult<Task>> {
  try {
    // Validate input
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return { success: false, error: "Task title is required" };
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        inbox: true,
        completed: false,
      },
    });

    // Revalidate inbox to show new task
    revalidatePath("/inbox");

    return { success: true, data: task };
  } catch (error) {
    console.error("Create task error:", error);
    return { success: false, error: "Failed to create task" };
  }
}

/**
 * Server action to mark a task as completed.
 * Sets completed = true and completed_at = now().
 */
export async function completeTask(taskId: string): Promise<ActionResult> {
  try {
    // Validate input
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        completed: true,
        completed_at: new Date(),
      },
    });

    // Revalidate all views that show tasks
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/projects");
    revalidatePath("/tags");

    return { success: true };
  } catch (error) {
    console.error("Complete task error:", error);
    return { success: false, error: "Failed to complete task" };
  }
}

/**
 * Server action to update a task with partial data.
 * Automatically clears inbox flag when a project is assigned to an inbox task.
 * Handles tag updates via transaction if tagIds are provided.
 */
export async function updateTask(
  taskId: string,
  data: import("@/types").UpdateTaskInput
): Promise<ActionResult<Task>> {
  try {
    // Validate task ID
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    // Validate title if provided - cannot be empty/whitespace
    if (data.title !== undefined) {
      if (typeof data.title !== "string" || data.title.trim().length === 0) {
        return { success: false, error: "Task title cannot be empty" };
      }
    }

    // Fetch current task to check inbox status for auto-clarification
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!currentTask) {
      return { success: false, error: "Task not found" };
    }

    // Build update data object (only include fields that were provided)
    const updateData: {
      title?: string;
      notes?: string | null;
      project_id?: string | null;
      due_date?: Date | null;
      defer_date?: Date | null;
      inbox?: boolean;
    } = {};

    if (data.title !== undefined) {
      updateData.title = data.title.trim();
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.project_id !== undefined) {
      updateData.project_id = data.project_id;

      // Auto-clarification: if assigning a project to an inbox task, remove from inbox
      if (data.project_id !== null && currentTask.inbox === true) {
        updateData.inbox = false;
      }
    }

    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date;
    }

    if (data.defer_date !== undefined) {
      updateData.defer_date = data.defer_date;
    }

    // Handle task update and tags in a transaction if tagIds provided
    let updatedTask: Task;

    if (data.tagIds !== undefined) {
      // Use transaction to update task and tags atomically
      updatedTask = await prisma.$transaction(async (tx) => {
        // Update the task
        const task = await tx.task.update({
          where: { id: taskId },
          data: updateData,
        });

        // Replace all tags: delete existing, create new
        await tx.taskTag.deleteMany({
          where: { task_id: taskId },
        });

        if (data.tagIds && data.tagIds.length > 0) {
          await tx.taskTag.createMany({
            data: data.tagIds.map((tagId) => ({
              task_id: taskId,
              tag_id: tagId,
            })),
          });
        }

        return task;
      });
    } else {
      // No tag changes, just update the task
      updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });
    }

    // Revalidate all views that show tasks
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/projects");
    revalidatePath("/tags");

    return { success: true, data: updatedTask };
  } catch (error) {
    console.error("Update task error:", error);
    return { success: false, error: "Failed to update task" };
  }
}

/**
 * Server action to clarify a task from the inbox.
 * Always sets inbox = false (this is the dedicated clarification action).
 * Updates project assignment and replaces all tags atomically.
 */
export async function clarifyTask(
  taskId: string,
  data: import("@/types").ClarifyInput
): Promise<ActionResult<Task>> {
  try {
    // Validate task ID
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    // Use transaction to update task and tags atomically
    const updatedTask = await prisma.$transaction(async (tx) => {
      // Update the task - always set inbox = false
      const task = await tx.task.update({
        where: { id: taskId },
        data: {
          inbox: false,
          project_id: data.project_id,
        },
      });

      // Replace all tags: delete existing, create new
      await tx.taskTag.deleteMany({
        where: { task_id: taskId },
      });

      if (data.tagIds && data.tagIds.length > 0) {
        await tx.taskTag.createMany({
          data: data.tagIds.map((tagId) => ({
            task_id: taskId,
            tag_id: tagId,
          })),
        });
      }

      return task;
    });

    // Revalidate all views that show tasks
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/projects");
    revalidatePath("/tags");

    return { success: true, data: updatedTask };
  } catch (error) {
    console.error("Clarify task error:", error);
    return { success: false, error: "Failed to clarify task" };
  }
}
