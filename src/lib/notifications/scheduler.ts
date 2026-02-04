import { PgBoss, type Job } from "pg-boss";
import { prisma } from "@/lib/db";

// Queue name for reminder jobs
export const REMINDER_QUEUE = "reminder";

// Job data interface for reminder jobs
export interface ReminderJobData {
  reminder_id: string;
  task_id: string;
}

// Global singleton pattern (same as db.ts for hot-reload resilience)
const globalForPgBoss = globalThis as unknown as {
  pgBoss: PgBoss | undefined;
  pgBossStarted: boolean;
};

/**
 * Get the pg-boss singleton instance.
 * Creates and starts the instance on first call.
 * Subsequent calls return the same instance.
 */
export async function getBoss(): Promise<PgBoss> {
  if (globalForPgBoss.pgBoss && globalForPgBoss.pgBossStarted) {
    return globalForPgBoss.pgBoss;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create pg-boss instance with pgboss schema
  const boss = new PgBoss({
    connectionString,
    schema: "pgboss",
  });

  // Handle pg-boss errors
  boss.on("error", (error) => {
    console.error("[pg-boss] Error:", error);
  });

  // Store in global before starting (prevents race condition on concurrent calls)
  globalForPgBoss.pgBoss = boss;

  // Start pg-boss (creates tables if needed)
  await boss.start();
  globalForPgBoss.pgBossStarted = true;

  // Register the reminder job handler
  await boss.work<ReminderJobData>(
    REMINDER_QUEUE,
    { pollingIntervalSeconds: 1 },
    handleReminderJob
  );

  console.log("[pg-boss] Started successfully");

  return boss;
}

/**
 * Schedule a reminder job to fire at a specific time.
 * Uses singletonKey for deduplication.
 *
 * @param reminderId - The reminder ID
 * @param taskId - The task ID
 * @param triggerAt - When the job should fire
 * @returns The job ID if created, null if duplicate exists
 */
export async function scheduleReminder(
  reminderId: string,
  taskId: string,
  triggerAt: Date
): Promise<string | null> {
  const boss = await getBoss();

  const jobData: ReminderJobData = {
    reminder_id: reminderId,
    task_id: taskId,
  };

  const jobId = await boss.send(REMINDER_QUEUE, jobData, {
    startAfter: triggerAt,
    singletonKey: `reminder:${reminderId}`,
  });

  return jobId;
}

/**
 * Cancel a reminder job by its job ID.
 * Handles gracefully if job doesn't exist or already completed.
 *
 * @param jobId - The pg-boss job ID to cancel
 */
export async function cancelReminder(jobId: string): Promise<void> {
  try {
    const boss = await getBoss();
    await boss.cancel(REMINDER_QUEUE, jobId);
  } catch (error) {
    // Job may already be completed/cancelled - that's OK
    console.error("[pg-boss] Cancel error (non-fatal):", error);
  }
}

/**
 * Handler for reminder jobs when they fire.
 * Validates task/reminder state before processing.
 * Updates reminder status to SENT.
 */
export async function handleReminderJob(
  jobs: Job<ReminderJobData>[]
): Promise<void> {
  for (const job of jobs) {
    const { reminder_id, task_id } = job.data;

    try {
      // Load the reminder with user_id for subscription filtering
      const reminder = await prisma.reminder.findUnique({
        where: { id: reminder_id },
        select: { id: true, status: true, user_id: true },
      });

      // Skip if reminder doesn't exist or already dismissed
      if (!reminder || reminder.status === "DISMISSED") {
        console.log(`[Reminder] Skipping ${reminder_id}: already dismissed or not found`);
        continue;
      }

      // Load the task
      const task = await prisma.task.findUnique({
        where: { id: task_id },
      });

      // Skip if task doesn't exist or is completed
      if (!task || task.completed) {
        console.log(`[Reminder] Skipping ${reminder_id}: task completed or not found`);
        // Mark reminder as dismissed since task is done
        await prisma.reminder.update({
          where: { id: reminder_id },
          data: { status: "DISMISSED" },
        });
        continue;
      }

      // Load active notification subscriptions for this user
      const subscriptions = await prisma.notificationSubscription.findMany({
        where: {
          user_id: reminder.user_id,
          active: true,
        },
      });

      // Log the reminder (placeholder for actual notification delivery in Specs 015-016)
      console.log(`[Reminder] Firing for task: ${task.title} (${subscriptions.length} subscriptions)`);
      // TODO: In Specs 015-016, send notifications to each subscription:
      // - For NTFY: POST to ntfy_topic
      // - For WEBPUSH: Use web-push library with endpoint/p256dh/auth

      // Update reminder status to SENT
      await prisma.reminder.update({
        where: { id: reminder_id },
        data: { status: "SENT" },
      });
    } catch (error) {
      console.error(`[Reminder] Error processing job ${job.id}:`, error);
      throw error; // Re-throw to let pg-boss handle retry
    }
  }
}
