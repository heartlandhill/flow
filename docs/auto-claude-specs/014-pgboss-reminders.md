# Spec 014: pg-boss & Reminder Scheduling

## Batch
5 (Notifications) — Can run after Batch 2. Runs in parallel with Specs 015, 016. Can overlap with Batches 3-4.

## Description
Set up pg-boss as the job queue and implement the reminder data flow — creating, scheduling, snoozing, and dismissing reminders. This is the backend plumbing that powers all notifications. Does not include notification delivery (that's Specs 015-016).

## What to do

1. **Install pg-boss**: `pnpm add pg-boss`

2. **Create `src/lib/notifications/scheduler.ts`**:
   - Singleton pattern for pg-boss instance (similar to Prisma client pattern).
   - `getBoss()`: Returns the pg-boss instance, starting it if needed.
   - `scheduleReminder(reminderId, taskId, triggerAt)`: Creates a pg-boss job with `sendAfter: triggerAt` and `singletonKey: reminder:${reminderId}`. Returns the job ID.
   - `cancelReminder(jobId)`: Cancels a pg-boss job.
   - `handleReminderJob(job)`: The handler that fires when a reminder is due. For now, logs the event. Notification delivery will be wired in Specs 015-016.

   ```typescript
   import PgBoss from "pg-boss";

   let boss: PgBoss | null = null;

   export async function getBoss(): Promise<PgBoss> {
     if (!boss) {
       boss = new PgBoss({
         connectionString: process.env.DATABASE_URL!,
         schema: "pgboss",
       });
       await boss.start();
       await boss.work("reminder:send", handleReminderJob);
     }
     return boss;
   }

   async function handleReminderJob(job: PgBoss.Job<{ reminder_id: string; task_id: string }>) {
     // Load task, check if still relevant
     const reminder = await prisma.reminder.findUnique({ where: { id: job.data.reminder_id } });
     if (!reminder || reminder.status === "DISMISSED") return;

     const task = await prisma.task.findUnique({
       where: { id: job.data.task_id },
       include: { project: { include: { area: true } } }
     });
     if (!task || task.completed) return;

     // TODO: Wire notification delivery (Specs 015-016)
     console.log(`[Reminder] Firing for task: ${task.title}`);

     await prisma.reminder.update({
       where: { id: job.data.reminder_id },
       data: { status: "SENT" },
     });
   }
   ```

3. **Create `src/actions/reminders.ts`** with server actions:

   **`createReminder(taskId: string, triggerAt: Date)`**:
   - Create a Reminder record with `status: PENDING`.
   - Schedule a pg-boss job via `scheduleReminder()`.
   - Store the pg-boss job ID on the reminder record.
   - Revalidate the task detail.

   **`snoozeReminder(reminderId: string, minutes: number)`**:
   - Cancel the old pg-boss job.
   - Calculate new trigger time: `now + minutes`.
   - Schedule a new pg-boss job.
   - Update reminder: `status: SNOOZED`, `snoozed_until: newTrigger`, `pgboss_job_id: newJobId`.

   **`dismissReminder(reminderId: string)`**:
   - Cancel the pg-boss job.
   - Update reminder: `status: DISMISSED`.

   **`deleteReminder(reminderId: string)`**:
   - Cancel the pg-boss job.
   - Delete the reminder record.

4. **Wire task completion to cancel reminders**:
   - In `completeTask` (src/actions/tasks.ts), after marking the task complete:
     ```typescript
     // Cancel all pending reminders for this task
     const reminders = await prisma.reminder.findMany({
       where: { task_id: id, status: { in: ["PENDING", "SNOOZED"] } }
     });
     for (const reminder of reminders) {
       if (reminder.pgboss_job_id) {
         const boss = await getBoss();
         await boss.cancel(reminder.pgboss_job_id);
       }
       await prisma.reminder.update({
         where: { id: reminder.id },
         data: { status: "DISMISSED" }
       });
     }
     ```

5. **Add reminder UI to task edit form** (Spec 013 must be merged first, or add as a separate file):
   - In the task detail edit mode, add a "Reminder" section.
   - Show existing reminders (with status and trigger time).
   - "Add Reminder" button → datetime picker → calls `createReminder`.
   - Existing reminders have a dismiss/delete button.

6. **Initialize pg-boss on server startup**:
   - Create `src/lib/notifications/init.ts` that calls `getBoss()`.
   - Import and call in `src/app/layout.tsx` or in a server-side initialization point.
   - Guard with `PGBOSS_ENABLED` env var (for multi-instance deployments).

## Files to create
- `src/lib/notifications/scheduler.ts`
- `src/actions/reminders.ts`
- `src/lib/notifications/init.ts`

## Files to modify
- `src/actions/tasks.ts` (add reminder cancellation to completeTask)
- Task edit form (add reminder section — may depend on Spec 013)

## Acceptance criteria
- [ ] pg-boss starts successfully alongside the Next.js dev server.
- [ ] pg-boss tables are created in the `pgboss` schema automatically.
- [ ] Creating a reminder via `createReminder` inserts a record and schedules a pg-boss job.
- [ ] The pg-boss job fires at the scheduled time (verify with a short delay, e.g., 10 seconds).
- [ ] `handleReminderJob` logs the task title when the job fires.
- [ ] Snoozing a reminder cancels the old job and schedules a new one.
- [ ] Dismissing a reminder cancels the job and updates the status.
- [ ] Completing a task cancels all its pending/snoozed reminders.
- [ ] `pnpm build` succeeds.

## References
- NOTIFICATIONS.md → pg-boss Setup section, Scheduling, Snoozing
- API.md → Reminders server actions
- SCHEMA.md → Reminder model
- ENV.md → DATABASE_URL, PGBOSS_ENABLED
