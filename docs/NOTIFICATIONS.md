# NOTIFICATIONS.md — Flow GTD Notification System

## Overview

Flow's notification system delivers task reminders to:
1. **Android/GrapheneOS** via ntfy (no Google Play Services required)
2. **Desktop browsers** via the Web Push API and Service Workers

Reminders are scheduled using pg-boss, a Postgres-native job queue. Users can snooze notifications with one tap directly from the notification itself.

## Architecture

```
User sets reminder on task
        │
        ▼
Reminder record created in Postgres
pg-boss job scheduled with sendAfter = trigger_at
        │
        ▼ (at trigger time)
pg-boss fires job → POST /api/notify
        │
        ├──► ntfy HTTP POST → Android ntfy app → notification with action buttons
        │                                              │
        │                                    User taps snooze button
        │                                              │
        │                                    GET /api/snooze?id=X&mins=60
        │                                              │
        │                                    Reschedule pg-boss job
        │
        └──► Web Push via web-push lib → Desktop browser → notification with actions
```

## pg-boss Setup

### Initialization (`src/lib/notifications/scheduler.ts`)

Initialize pg-boss once using the existing DATABASE_URL. pg-boss creates its own tables in a `pgboss` schema automatically.

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
```

### Scheduling a Reminder

```typescript
export async function scheduleReminder(
  reminderId: string,
  taskId: string,
  triggerAt: Date
): Promise<string> {
  const boss = await getBoss();
  const jobId = await boss.send("reminder:send", {
    reminder_id: reminderId,
    task_id: taskId,
  }, {
    sendAfter: triggerAt,
    singletonKey: `reminder:${reminderId}`,
    retryLimit: 3,
    retryDelay: 30,
  });
  return jobId!;
}
```

### Handling a Fired Reminder

```typescript
async function handleReminderJob(job: PgBoss.Job<ReminderPayload>) {
  const { reminder_id, task_id } = job.data;

  const task = await prisma.task.findUnique({
    where: { id: task_id },
    include: { project: { include: { area: true } } }
  });

  if (!task || task.completed) return;

  await fanOutNotification({
    reminder_id,
    task_id: task.id,
    task_title: task.title,
    project_name: task.project?.name,
    due_date: task.due_date?.toISOString().split("T")[0],
  });

  await prisma.reminder.update({
    where: { id: reminder_id },
    data: { status: "SENT" },
  });
}
```

### Snoozing

```typescript
export async function snoozeReminder(
  reminderId: string,
  minutes: number
): Promise<void> {
  const boss = await getBoss();
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
  });

  if (!reminder) throw new Error("Reminder not found");

  if (reminder.pgboss_job_id) {
    await boss.cancel(reminder.pgboss_job_id);
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
```

## ntfy Integration (`src/lib/notifications/ntfy.ts`)

### Configuration

- `NTFY_BASE_URL`: ntfy server URL. Default: `https://ntfy.sh`. Self-hosted recommended.
- `NTFY_TOPIC_PREFIX`: Random prefix for the user's topic (e.g., `flow-abc123`). Full topic: `{prefix}-reminders`.

### Sending a Notification

```typescript
export async function sendNtfyNotification(
  topic: string,
  payload: NotificationPayload
): Promise<void> {
  const snoozeBaseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/snooze`;
  const token = signToken(payload.reminder_id);

  const actions = [
    `http, 10 min, ${snoozeBaseUrl}?id=${payload.reminder_id}&mins=10&token=${token}, clear=true`,
    `http, 1 hour, ${snoozeBaseUrl}?id=${payload.reminder_id}&mins=60&token=${token}, clear=true`,
    `http, Tomorrow, ${snoozeBaseUrl}?id=${payload.reminder_id}&mins=1440&token=${token}, clear=true`,
    `http, Done ✓, ${snoozeBaseUrl}?id=${payload.reminder_id}&done=true&token=${token}, clear=true`,
  ];

  await fetch(`${process.env.NTFY_BASE_URL}/${topic}`, {
    method: "POST",
    headers: {
      "Title": "Flow — Next Action",
      "Priority": "high",
      "Tags": "clipboard",
      "Actions": actions.join("; "),
    },
    body: formatNotificationBody(payload),
  });
}
```

### Notification Body Format

```
Define database schema for tasks and projects
GTD App Development · Due today
```

Line 1: Task title. Line 2: Project name + due context. Concise for lock screen display.

### Token Signing for Snooze URLs

ntfy action URLs can't carry auth headers. Use HMAC-SHA256 in query params:

```typescript
import { createHmac } from "crypto";

export function signToken(reminderId: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update(reminderId)
    .digest("hex");
}

export function verifyToken(reminderId: string, token: string): boolean {
  const expected = signToken(reminderId);
  return token === expected;
}
```

## Web Push Integration (`src/lib/notifications/web-push.ts`)

### VAPID Keys (one-time generation)

```bash
npx web-push generate-vapid-keys
```

Store as `NEXT_PUBLIC_VAPID_KEY` and `VAPID_PRIVATE_KEY`.

### Service Worker (`public/sw.js`)

```javascript
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Flow", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      tag: data.reminder_id,
      data: { url: data.url, reminder_id: data.reminder_id },
      actions: [
        { action: "snooze-10", title: "10 min" },
        { action: "snooze-60", title: "1 hour" },
        { action: "done", title: "Done ✓" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { reminder_id } = event.notification.data;

  if (event.action === "done") {
    fetch(`/api/snooze?id=${reminder_id}&done=true`);
  } else if (event.action === "snooze-10") {
    fetch(`/api/snooze?id=${reminder_id}&mins=10`);
  } else if (event.action === "snooze-60") {
    fetch(`/api/snooze?id=${reminder_id}&mins=60`);
  } else {
    event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
  }
});
```

Web Push supports 2-3 action buttons. We show 10 min, 1 hour, and Done. "Tomorrow" is ntfy-only.

### Sending a Web Push Notification

```typescript
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@yourapp.com",
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendWebPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: NotificationPayload
): Promise<void> {
  await webpush.sendNotification(
    { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
    JSON.stringify({
      title: "Flow — Next Action",
      body: formatNotificationBody(payload),
      reminder_id: payload.reminder_id,
      url: "/today",
    })
  );
}
```

## Fan-out Function

```typescript
export async function fanOutNotification(payload: NotificationPayload): Promise<void> {
  const subscriptions = await prisma.notificationSubscription.findMany({
    where: { active: true },
  });

  const promises = subscriptions.map((sub) => {
    if (sub.type === "NTFY" && sub.ntfy_topic) {
      return sendNtfyNotification(sub.ntfy_topic, payload);
    }
    if (sub.type === "WEB_PUSH" && sub.endpoint) {
      return sendWebPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh!, auth: sub.auth! },
        payload
      );
    }
    return Promise.resolve();
  });

  await Promise.allSettled(promises);
}
```

## User Setup Flow

### ntfy (on first login or in settings)

1. App generates a unique topic: `flow-{random_hex(8)}`.
2. Shows instruction: "Install ntfy from F-Droid, then tap this link to subscribe."
3. Provides `ntfy://subscribe/{topic}` deep link.
4. Stores topic in NotificationSubscription.

### Web Push (on first login or in settings)

1. Prompt for notification permission.
2. If granted: register service worker, subscribe, store in NotificationSubscription.
3. If denied: explain how to enable in browser settings.

## Snooze Presets

| Button Label | Duration | Available On |
|-------------|----------|--------------|
| 10 min | 10 minutes | ntfy + Web Push |
| 1 hour | 60 minutes | ntfy + Web Push |
| Tomorrow | 1440 minutes | ntfy only |
| Done ✓ | Completes task | ntfy + Web Push |

## Error Handling

- ntfy send fails: log error, no retry (best-effort).
- Web Push 410 (Gone): deactivate subscription.
- Web Push other errors: retry via pg-boss (up to 3 times).
- Task completed before firing: skip silently.
- Reminder dismissed before firing: skip silently.
