/**
 * Flow GTD Service Worker
 *
 * Handles Web Push notifications for task reminders with actionable
 * snooze/done buttons.
 */

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
        { action: "done", title: "Done \u2713" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { reminder_id, url } = event.notification.data || {};

  if (event.action === "done") {
    event.waitUntil(
      fetch(`/api/snooze?id=${reminder_id}&done=true`)
    );
  } else if (event.action === "snooze-10") {
    event.waitUntil(
      fetch(`/api/snooze?id=${reminder_id}&mins=10`)
    );
  } else if (event.action === "snooze-60") {
    event.waitUntil(
      fetch(`/api/snooze?id=${reminder_id}&mins=60`)
    );
  } else {
    // Body click (no action) - open the app
    event.waitUntil(
      clients.openWindow(url || "/")
    );
  }
});
