"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { cancelReminder } from "@/lib/notifications/scheduler";
import type { ActionResult, Project, ProjectType, Task, TaskWithRelations } from "@/types";

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
    // Revalidate layout to update navigation badge counts
    revalidatePath("/", "layout");

    return { success: true, data: task };
  } catch (error) {
    console.error("Create task error:", error);
    return { success: false, error: "Failed to create task" };
  }
}

/**
 * Server action to mark a task as completed.
 * Sets completed = true and completed_at = now().
 * Also cancels all pending/snoozed reminders for the task.
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

    // Find all PENDING/SNOOZED reminders for this task
    const reminders = await prisma.reminder.findMany({
      where: {
        task_id: taskId,
        status: { in: ["PENDING", "SNOOZED"] },
      },
    });

    // Cancel pg-boss jobs and update reminders to DISMISSED
    for (const reminder of reminders) {
      if (reminder.pgboss_job_id) {
        await cancelReminder(reminder.pgboss_job_id);
      }
    }

    // Update all found reminders to DISMISSED status
    if (reminders.length > 0) {
      await prisma.reminder.updateMany({
        where: {
          task_id: taskId,
          status: { in: ["PENDING", "SNOOZED"] },
        },
        data: {
          status: "DISMISSED",
          pgboss_job_id: null,
        },
      });
    }

    // Revalidate all views that show tasks
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/projects");
    revalidatePath("/tags");
    // Revalidate layout to update navigation badge counts
    revalidatePath("/", "layout");

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
): Promise<ActionResult<TaskWithRelations>> {
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
    if (data.tagIds !== undefined) {
      // Use transaction to update task and tags atomically
      await prisma.$transaction(async (tx) => {
        // Update the task
        await tx.task.update({
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
      });
    } else {
      // No tag changes, just update the task
      await prisma.task.update({
        where: { id: taskId },
        data: updateData,
      });
    }

    // Fetch the updated task with full relations
    const taskWithRelations = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        project: {
          include: {
            area: true,
          },
        },
        reminders: true,
      },
    });

    if (!taskWithRelations) {
      return { success: false, error: "Task not found after update" };
    }

    // Revalidate all views that show tasks
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/projects");
    revalidatePath("/tags");
    // Revalidate layout to update navigation badge counts
    revalidatePath("/", "layout");

    return { success: true, data: taskWithRelations as TaskWithRelations };
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
    // Revalidate layout to update navigation badge counts
    revalidatePath("/", "layout");

    return { success: true, data: updatedTask };
  } catch (error) {
    console.error("Clarify task error:", error);
    return { success: false, error: "Failed to clarify task" };
  }
}

/**
 * Server action to delete a task.
 * TaskTag and Reminder records are automatically deleted via Prisma cascade.
 */
export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    // Validate input
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    // Check if task exists before deleting
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) {
      return { success: false, error: "Task not found" };
    }

    // Delete task - TaskTag and Reminder cascade automatically
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Revalidate all views that show tasks
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/projects");
    revalidatePath("/tags");
    // Revalidate layout to update navigation badge counts
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Delete task error:", error);
    return { success: false, error: "Failed to delete task" };
  }
}

/**
 * Server action to reorder tasks within a project.
 * Updates sort_order for each task atomically in a transaction.
 * The order of taskIds array determines the new sort_order values.
 */
export async function reorderTasks(
  projectId: string,
  taskIds: string[]
): Promise<ActionResult> {
  try {
    // Validate inputs
    if (!projectId || typeof projectId !== "string") {
      return { success: false, error: "Project ID is required" };
    }
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return { success: false, error: "Task IDs array is required" };
    }

    // Update sort_order for each task in transaction
    await prisma.$transaction(
      taskIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: { sort_order: index },
        })
      )
    );

    // Revalidate project detail page
    revalidatePath(`/projects/${projectId}`);
    // Revalidate projects list (counts may change display)
    revalidatePath("/projects");
    // Revalidate today and forecast views
    revalidatePath("/today");
    revalidatePath("/forecast");

    return { success: true };
  } catch (error) {
    console.error("Reorder tasks error:", error);
    return { success: false, error: "Failed to reorder tasks" };
  }
}

/**
 * Server action to convert an inbox task to a project.
 * Creates a new project with the task's title as the name, then deletes the task.
 * Only inbox tasks can be converted (GTD clarification workflow).
 */
export async function convertTaskToProject(
  taskId: string,
  areaId: string,
  projectType: ProjectType
): Promise<ActionResult<Project>> {
  try {
    // Validate task ID
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    // Validate area ID
    if (!areaId || typeof areaId !== "string") {
      return { success: false, error: "Area ID is required" };
    }

    // Verify task exists and is an inbox task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (!task.inbox) {
      return { success: false, error: "Only inbox tasks can be converted to projects" };
    }

    // Verify area exists
    const area = await prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      return { success: false, error: "Area not found" };
    }

    // Create the project with task's title as name
    const project = await prisma.project.create({
      data: {
        name: task.title.trim(),
        area_id: areaId,
        type: projectType,
        status: "ACTIVE",
      },
    });

    // Delete the original task (cascade handles TaskTag, Reminder)
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Revalidate affected paths
    revalidatePath("/inbox");
    revalidatePath("/projects");
    // Revalidate layout to update navigation badge counts
    revalidatePath("/", "layout");

    return { success: true, data: project };
  } catch (error) {
    console.error("Convert task to project error:", error);
    return { success: false, error: "Failed to convert task to project" };
  }
}
