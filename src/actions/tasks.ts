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
