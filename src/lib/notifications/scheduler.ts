import { PgBoss, type Job } from "pg-boss";
import { prisma } from "../db";
import { type NotificationPayload, sendNtfyNotification } from "./ntfy";

/**
 * Payload for pg-boss reminder jobs.
 */
interface ReminderJobPayload {
  reminder_id: string;
  task_id: string;
}

/**
 * Queue name for reminder jobs.
 */
const REMINDER_QUEUE = "reminder:send";

/**
 * Global reference to pg-boss instance for singleton pattern.
 * This prevents multiple instances in development with hot reloading.
 */
const globalForBoss = globalThis as unknown as { boss: PgBoss | null };

let boss: PgBoss | null = globalForBoss.boss ?? null;

/**
 * Gets or creates the pg-boss singleton instance.
 * Initializes pg-boss with the DATABASE_URL and registers the reminder job handler.
 */
export async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      schema: "pgboss",
    });

    await boss.start();
    await boss.work<ReminderJobPayload>(REMINDER_QUEUE, handleReminderJob);

    if (process.env.NODE_ENV !== "production") {
      globalForBoss.boss = boss;
    }
  }

  return boss;
}

/**
 * Schedules a reminder to be sent at a specific time.
 * Uses singletonKey to prevent duplicate jobs for the same reminder.
 *
 * @param reminderId - The ID of the reminder record
 * @param taskId - The ID of the associated task
 * @param triggerAt - When the notification should be sent
 * @returns The pg-boss job ID
 */
export async function scheduleReminder(
  reminderId: string,
  taskId: string,
  triggerAt: Date
): Promise<string> {
  const bossInstance = await getBoss();

  const jobId = await bossInstance.send(
    REMINDER_QUEUE,
    {
      reminder_id: reminderId,
      task_id: taskId,
    } satisfies ReminderJobPayload,
    {
      startAfter: triggerAt,
      singletonKey: `reminder:${reminderId}`,
      retryLimit: 3,
      retryDelay: 30,
    }
  );

  return jobId!;
}

/**
 * Handler for fired reminder jobs.
 * Fetches the task, builds the notification payload, and fans out to all channels.
 * pg-boss v12+ passes jobs as an array (batch processing).
 */
async function handleReminderJob(jobs: Job<ReminderJobPayload>[]): Promise<void> {
  for (const job of jobs) {
    const { reminder_id, task_id } = job.data;

    const task = await prisma.task.findUnique({
      where: { id: task_id },
      include: { project: { include: { area: true } } },
    });

    // Skip if task doesn't exist or is already completed
    if (!task || task.completed) {
      continue;
    }

    const payload: NotificationPayload = {
      reminder_id,
      task_id: task.id,
      task_title: task.title,
      project_name: task.project?.name ?? undefined,
      due_date: task.due_date?.toISOString().split("T")[0],
    };

    await fanOutNotification(payload);

    await prisma.reminder.update({
      where: { id: reminder_id },
      data: { status: "SENT" },
    });
  }
}

/**
 * Snoozes a reminder by canceling the existing job and scheduling a new one.
 *
 * @param reminderId - The ID of the reminder to snooze
 * @param minutes - How many minutes to snooze for
 */
export async function snoozeReminder(
  reminderId: string,
  minutes: number
): Promise<void> {
  const bossInstance = await getBoss();

  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
  });

  if (!reminder) {
    throw new Error("Reminder not found");
  }

  // Cancel the existing job if one exists
  if (reminder.pgboss_job_id) {
    await bossInstance.cancel(REMINDER_QUEUE, reminder.pgboss_job_id);
  }

  const newTrigger = new Date(Date.now() + minutes * 60 * 1000);
  const newJobId = await scheduleReminder(reminderId, reminder.task_id, newTrigger);

  await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      status: "SNOOZED",
      snoozed_until: newTrigger,
      pgboss_job_id: newJobId,
    },
  });
}

/**
 * Fans out a notification to all active subscription channels.
 * Currently supports ntfy; Web Push to be added later.
 */
async function fanOutNotification(payload: NotificationPayload): Promise<void> {
  const subscriptions = await prisma.notificationSubscription.findMany({
    where: { active: true },
  });

  const promises = subscriptions.map((sub) => {
    if (sub.type === "NTFY" && sub.ntfy_topic) {
      return sendNtfyNotification(sub.ntfy_topic, payload);
    }
    // Web Push support to be added later
    return Promise.resolve();
  });

  // Use allSettled so one failure doesn't block others
  await Promise.allSettled(promises);
}
