# Spec 016: Web Push Integration

## Batch
5 (Notifications) — Can run after Batch 2. Runs in parallel with Specs 014, 015.

## Description
Implement Web Push notifications for desktop browsers. Includes the service worker, VAPID key configuration, subscription management, and notification delivery. Desktop users get browser notifications with action buttons.

## What to do

1. **Create `src/lib/notifications/web-push.ts`**:

   **Setup**:
   ```typescript
   import webpush from "web-push";

   webpush.setVapidDetails(
     `mailto:admin@${new URL(process.env.NEXT_PUBLIC_APP_URL!).hostname}`,
     process.env.NEXT_PUBLIC_VAPID_KEY!,
     process.env.VAPID_PRIVATE_KEY!
   );
   ```

   **`sendWebPushNotification(subscription, payload)`**:
   - Sends via `webpush.sendNotification()`.
   - Payload JSON: `{ title, body, reminder_id, url }`.
   - Handle errors:
     - 410 (Gone): deactivate the subscription in the database.
     - Other errors: log and let pg-boss retry.

2. **Create `public/sw.js`** (service worker):
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

   Note: Service worker calls to `/api/snooze` from the same origin don't need the signed token (they carry the session cookie). However, for consistency with the ntfy flow, add the token anyway or skip auth for same-origin requests.

3. **Create `src/app/api/push/subscribe/route.ts`**:

   **POST** — Register a subscription:
   - Request body: `{ endpoint, keys: { p256dh, auth } }`.
   - Upsert a NotificationSubscription with `type: WEB_PUSH`.
   - Requires valid session.
   - Returns 200 with subscription ID.

   **DELETE** — Unregister:
   - Request body: `{ endpoint }`.
   - Set `active = false` on matching subscription.
   - Requires valid session.
   - Returns 200.

4. **Create client-side subscription flow**:
   - Create a utility function or hook: `src/hooks/useWebPush.ts`.
   - On mount (or when user enables notifications):
     1. Check if `Notification.permission` is already granted.
     2. If not, call `Notification.requestPermission()`.
     3. If granted:
        - Register service worker: `navigator.serviceWorker.register("/sw.js")`.
        - Subscribe: `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_KEY) })`.
        - Send subscription to `/api/push/subscribe`.
     4. If denied: show message about enabling in browser settings.
   - Helper: `urlBase64ToUint8Array(base64String)` — converts VAPID public key for the subscribe call.

5. **Wire into fan-out** (in `/api/notify` or the direct fan-out function):
   - When firing a notification, send to all active WEB_PUSH subscriptions using `sendWebPushNotification`.
   - Already structured in Spec 015's `/api/notify` — just add the web push branch.

6. **Create basic notification settings UI**:
   - Can be part of a settings page or a notification bell icon in the top bar.
   - Show: "Browser notifications: [Enabled/Disabled]" with a toggle.
   - "Enable" triggers the permission/subscription flow.
   - "Disable" calls DELETE `/api/push/subscribe`.

## Files to create
- `src/lib/notifications/web-push.ts`
- `public/sw.js`
- `src/app/api/push/subscribe/route.ts`
- `src/hooks/useWebPush.ts`

## Files to modify
- `src/app/api/notify/route.ts` (add web push delivery alongside ntfy)

## Dependencies
- `/api/snooze` endpoint from Spec 015 (for service worker button actions).
- Fan-out function structure from Spec 015.

## Acceptance criteria
- [ ] Service worker registers successfully at `/sw.js`.
- [ ] Browser prompts for notification permission.
- [ ] Granting permission subscribes and stores the subscription in the database.
- [ ] Firing a reminder (via pg-boss) triggers a desktop browser notification.
- [ ] Notification shows title, body, and 3 action buttons (10 min, 1 hour, Done).
- [ ] Clicking "10 min" or "1 hour" snoozes the reminder.
- [ ] Clicking "Done ✓" completes the task.
- [ ] Clicking the notification body opens the app.
- [ ] Denying permission shows a helpful message.
- [ ] Expired/invalid subscriptions (410 response) are deactivated.
- [ ] `pnpm build` succeeds.

## References
- NOTIFICATIONS.md → Web Push Integration, Service Worker, Subscription Flow
- API.md → /api/push/subscribe endpoint
- ENV.md → NEXT_PUBLIC_VAPID_KEY, VAPID_PRIVATE_KEY
