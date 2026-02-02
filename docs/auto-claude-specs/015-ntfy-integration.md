# Spec 015: ntfy Integration

## Batch
5 (Notifications) — Can run after Batch 2. Runs in parallel with Specs 014, 016.

## Description
Implement ntfy notification delivery for Android/GrapheneOS. When a reminder fires, send a notification to the user's ntfy topic with 4 action buttons (10 min, 1 hour, Tomorrow, Done). Includes the snooze callback endpoint and token signing for auth.

## What to do

1. **Create `src/lib/notifications/ntfy.ts`**:

   **`sendNtfyNotification(topic: string, payload: NotificationPayload)`**:
   - Sends an HTTP POST to `{NTFY_BASE_URL}/{topic}`.
   - Headers: Title, Priority (high), Tags, Actions.
   - Body: task title + project/due context.
   - Action buttons as ntfy action string format:
     ```
     http, 10 min, {snoozeUrl}?id={reminderId}&mins=10&token={token}, clear=true;
     http, 1 hour, {snoozeUrl}?id={reminderId}&mins=60&token={token}, clear=true;
     http, Tomorrow, {snoozeUrl}?id={reminderId}&mins=1440&token={token}, clear=true;
     http, Done ✓, {snoozeUrl}?id={reminderId}&done=true&token={token}, clear=true
     ```
   - `clear=true` tells ntfy to dismiss the notification after the action is tapped.

   **`formatNotificationBody(payload: NotificationPayload): string`**:
   - Line 1: task title.
   - Line 2: `{project name} · Due {context}` or just project name or just due context.
   - Due context: "Due today", "Due tomorrow", "Due Feb 5", "Overdue", or omitted if no due date.

2. **Create token signing** in `src/lib/notifications/ntfy.ts` (or a shared auth file):

   **`signToken(reminderId: string): string`**:
   - HMAC-SHA256 of the reminder ID using SESSION_SECRET.
   - Returns hex string.

   **`verifyToken(reminderId: string, token: string): boolean`**:
   - Recomputes the HMAC and compares (timing-safe comparison).

3. **Create `src/app/api/snooze/route.ts`**:
   - Handles GET and POST requests (ntfy sends HTTP requests based on action type).
   - Query params: `id` (reminder ID), `mins` (snooze minutes), `done` (boolean), `token` (signed token).
   - **Validation**:
     - Verify the token matches the reminder ID.
     - If invalid token: return 403.
   - **If `done=true`**:
     - Load the reminder to get the task_id.
     - Call `completeTask(task_id)`.
     - Call `dismissReminder(id)`.
   - **If `mins` is set**:
     - Call `snoozeReminder(id, parseInt(mins))`.
   - Return 200 OK (ntfy expects 2xx).

4. **Create `src/app/api/notify/route.ts`**:
   - Internal endpoint called by pg-boss worker.
   - Auth: `Authorization: Bearer {INTERNAL_API_SECRET}`.
   - Request body: `{ reminder_id, task_id, task_title, project_name?, due_date? }`.
   - Loads all active NotificationSubscriptions.
   - For each NTFY subscription: calls `sendNtfyNotification`.
   - For each WEB_PUSH subscription: calls `sendWebPushNotification` (wired in Spec 016, stub for now).
   - Uses `Promise.allSettled` so one failure doesn't block others.

5. **Wire into `handleReminderJob`** (from Spec 014):
   - Replace the console.log with an internal fetch to `/api/notify`:
     ```typescript
     await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notify`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${process.env.INTERNAL_API_SECRET}`,
       },
       body: JSON.stringify({
         reminder_id: reminder.id,
         task_id: task.id,
         task_title: task.title,
         project_name: task.project?.name,
         due_date: task.due_date?.toISOString().split("T")[0],
       }),
     });
     ```
   - OR: call `fanOutNotification` directly (skip the HTTP hop for simplicity in SLC). Either approach works — direct call is simpler.

6. **ntfy setup UI** (simple, can be a settings page or inline):
   - Display the user's ntfy topic.
   - Provide a `ntfy://subscribe/{topic}` deep link for one-tap subscription on Android.
   - Show instructions: "Install ntfy from F-Droid, then tap the link below."
   - Store the topic in NotificationSubscription table.
   - For now, auto-generate the topic on first login: `{NTFY_TOPIC_PREFIX}-reminders`.

## Files to create
- `src/lib/notifications/ntfy.ts`
- `src/app/api/snooze/route.ts`
- `src/app/api/notify/route.ts`

## Files to modify
- `src/lib/notifications/scheduler.ts` (wire handleReminderJob to notification delivery)
- `src/middleware.ts` (ensure `/api/snooze` is excluded from auth)

## Dependencies
- Reminder server actions from Spec 014 (snoozeReminder, dismissReminder).
- completeTask from Spec 005.

## Acceptance criteria
- [ ] `sendNtfyNotification` sends a properly formatted request to the ntfy server.
- [ ] Notification body shows task title + project/due context.
- [ ] 4 action buttons are included with correct snooze URLs.
- [ ] `/api/snooze` with valid token and `mins=10` snoozes the reminder.
- [ ] `/api/snooze` with valid token and `done=true` completes the task.
- [ ] `/api/snooze` with invalid token returns 403.
- [ ] `/api/snooze` is accessible without session auth (excluded in middleware).
- [ ] `/api/notify` requires the internal API secret.
- [ ] Token signing uses HMAC-SHA256 with SESSION_SECRET.
- [ ] `pnpm build` succeeds.

## References
- NOTIFICATIONS.md → ntfy Integration, Token Signing, Fan-out Function
- API.md → /api/snooze, /api/notify endpoints
- ENV.md → NTFY_BASE_URL, NTFY_TOPIC_PREFIX, INTERNAL_API_SECRET, SESSION_SECRET
