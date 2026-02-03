"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { scheduleReminder, cancelReminder } from "@/lib/notifications/scheduler";
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

/**
 * Server action to snooze a reminder.
 * Cancels the existing pg-boss job and schedules a new one.
 * Updates reminder status to SNOOZED with new trigger time.
 *
 * @param reminderId - The reminder ID to snooze
 * @param minutes - Number of minutes to snooze for
 */
export async function snoozeReminder(
  reminderId: string,
  minutes: number
): Promise<ActionResult<Reminder>> {
  try {
    // Validate reminder ID
    if (!reminderId || typeof reminderId !== "string") {
      return { success: false, error: "Reminder ID is required" };
    }

    // Validate minutes
    if (typeof minutes !== "number" || minutes <= 0) {
      return { success: false, error: "Valid snooze duration is required" };
    }

    // Find the reminder
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      return { success: false, error: "Reminder not found" };
    }

    // Don't snooze dismissed reminders
    if (reminder.status === "DISMISSED") {
      return { success: false, error: "Cannot snooze dismissed reminder" };
    }

    // Cancel the existing pg-boss job if it exists
    if (reminder.pgboss_job_id) {
      await cancelReminder(reminder.pgboss_job_id);
    }

    // Calculate new trigger time
    const newTrigger = new Date(Date.now() + minutes * 60 * 1000);

    // Schedule the new pg-boss job
    const newJobId = await scheduleReminder(
      reminderId,
      reminder.task_id,
      newTrigger
    );

    // Update reminder with new status and job ID
    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: "SNOOZED",
        snoozed_until: newTrigger,
        pgboss_job_id: newJobId,
      },
    });

    // Revalidate views that show reminders
    revalidatePath("/today");
    revalidatePath("/inbox");
    revalidatePath("/forecast");

    return { success: true, data: updatedReminder };
  } catch (error) {
    console.error("Snooze reminder error:", error);
    return { success: false, error: "Failed to snooze reminder" };
  }
}

/**
 * Server action to dismiss a reminder.
 * Cancels the pg-boss job and sets status to DISMISSED.
 *
 * @param reminderId - The reminder ID to dismiss
 */
export async function dismissReminder(
  reminderId: string
): Promise<ActionResult<Reminder>> {
  try {
    // Validate reminder ID
    if (!reminderId || typeof reminderId !== "string") {
      return { success: false, error: "Reminder ID is required" };
    }

    // Find the reminder
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      return { success: false, error: "Reminder not found" };
    }

    // Already dismissed - return success idempotently
    if (reminder.status === "DISMISSED") {
      return { success: true, data: reminder };
    }

    // Cancel the pg-boss job if it exists
    if (reminder.pgboss_job_id) {
      await cancelReminder(reminder.pgboss_job_id);
    }

    // Update reminder status to DISMISSED
    const updatedReminder = await prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: "DISMISSED",
        pgboss_job_id: null,
      },
    });

    // Revalidate views that show reminders
    revalidatePath("/today");
    revalidatePath("/inbox");
    revalidatePath("/forecast");

    return { success: true, data: updatedReminder };
  } catch (error) {
    console.error("Dismiss reminder error:", error);
    return { success: false, error: "Failed to dismiss reminder" };
  }
}
