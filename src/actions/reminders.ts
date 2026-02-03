"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { scheduleReminder } from "@/lib/notifications/scheduler";
import type { ActionResult, Reminder } from "@/types";

/**
 * Server action to create a reminder for a task.
 * Creates Reminder record with PENDING status and schedules pg-boss job.
 *
 * @param taskId - The task ID to create a reminder for
 * @param triggerAt - When the reminder should fire
 */
export async function createReminder(
  taskId: string,
  triggerAt: Date
): Promise<ActionResult<Reminder>> {
  try {
    // Validate task ID
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    // Validate trigger time
    if (!(triggerAt instanceof Date) || isNaN(triggerAt.getTime())) {
      return { success: false, error: "Valid trigger time is required" };
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Don't create reminders for completed tasks
    if (task.completed) {
      return { success: false, error: "Cannot create reminder for completed task" };
    }

    // Create the reminder record with PENDING status
    const reminder = await prisma.reminder.create({
      data: {
        task_id: taskId,
        trigger_at: triggerAt,
        status: "PENDING",
      },
    });

    // Schedule the pg-boss job
    const jobId = await scheduleReminder(reminder.id, taskId, triggerAt);

    // Update reminder with job ID if job was created
    let updatedReminder = reminder;
    if (jobId) {
      updatedReminder = await prisma.reminder.update({
        where: { id: reminder.id },
        data: { pgboss_job_id: jobId },
      });
    }

    // Revalidate views that show reminders
    revalidatePath("/today");
    revalidatePath("/inbox");
    revalidatePath("/forecast");

    return { success: true, data: updatedReminder };
  } catch (error) {
    console.error("Create reminder error:", error);
    return { success: false, error: "Failed to create reminder" };
  }
}
