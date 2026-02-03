import * as webpush from "web-push";
import { prisma } from "@/lib/db";

// Initialize VAPID details for Web Push authentication
// Subject must be a mailto: or https: URI per Web Push spec
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@flow.app";

// Configure VAPID only when environment variables are present
if (process.env.NEXT_PUBLIC_VAPID_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Payload for notification content
 */
export interface NotificationPayload {
  reminder_id: string;
  task_id: string;
  task_title: string;
  project_name?: string | null;
  due_date?: string | null;
}

/**
 * Web Push subscription data from client
 */
export interface WebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Format notification body for display
 * Line 1: Task title
 * Line 2: Project name + due context (if available)
 */
export function formatNotificationBody(payload: NotificationPayload): string {
  const lines: string[] = [payload.task_title];

  const contextParts: string[] = [];
  if (payload.project_name) {
    contextParts.push(payload.project_name);
  }
  if (payload.due_date) {
    // Format due date context
    const dueDate = new Date(payload.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate.getTime() < today.getTime()) {
      contextParts.push("Overdue");
    } else if (dueDate.getTime() === today.getTime()) {
      contextParts.push("Due today");
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      contextParts.push("Due tomorrow");
    } else {
      contextParts.push(`Due ${payload.due_date}`);
    }
  }

  if (contextParts.length > 0) {
    lines.push(contextParts.join(" · "));
  }

  return lines.join("\n");
}

/**
 * Send a Web Push notification to a subscription
 *
 * @param subscription - The push subscription details
 * @param payload - The notification content
 * @throws Error if sending fails (except 410/404 which deactivate the subscription)
 */
export async function sendWebPushNotification(
  subscription: WebPushSubscription,
  payload: NotificationPayload
): Promise<void> {
  const pushPayload = JSON.stringify({
    title: "Flow — Next Action",
    body: formatNotificationBody(payload),
    reminder_id: payload.reminder_id,
    url: "/today",
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      pushPayload
    );
  } catch (error) {
    // Handle subscription expiration or invalidation
    if (isWebPushError(error) && (error.statusCode === 410 || error.statusCode === 404)) {
      // Subscription is no longer valid - deactivate it
      await deactivateSubscription(subscription.endpoint);
      // Don't throw - this is expected behavior for expired subscriptions
      return;
    }

    // Log and re-throw other errors for pg-boss retry
    console.error("Web Push notification failed:", error);
    throw error;
  }
}

/**
 * Deactivate a subscription by endpoint
 * Called when push service returns 410 (Gone) or 404 (Not Found)
 */
async function deactivateSubscription(endpoint: string): Promise<void> {
  try {
    await prisma.notificationSubscription.updateMany({
      where: { endpoint },
      data: { active: false },
    });
  } catch (error) {
    console.error("Failed to deactivate subscription:", error);
    // Don't throw - deactivation failure shouldn't block other operations
  }
}

/**
 * Type guard for web-push errors with statusCode
 */
interface WebPushError extends Error {
  statusCode: number;
}

function isWebPushError(error: unknown): error is WebPushError {
  return (
    error !== null &&
    typeof error === "object" &&
    "statusCode" in error &&
    typeof (error as WebPushError).statusCode === "number"
  );
}
