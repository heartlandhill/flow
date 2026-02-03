import { createHmac, timingSafeEqual } from "crypto";
import type { NotificationPayload } from "./web-push";

/**
 * Signs a reminder ID using HMAC-SHA256 with the SESSION_SECRET.
 * Used to authenticate snooze URLs called from ntfy action buttons.
 */
export function signToken(reminderId: string): string {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }

  return createHmac("sha256", process.env.SESSION_SECRET)
    .update(reminderId)
    .digest("hex");
}

/**
 * Verifies a token against the expected signature for a reminder ID.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyToken(reminderId: string, token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  try {
    const expected = signToken(reminderId);

    // Use timing-safe comparison to prevent timing attacks
    const tokenBuffer = Buffer.from(token, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (tokenBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}

/**
 * Formats the notification body for display on lock screen.
 * Line 1: Task title
 * Line 2: Project name + due context
 */
export function formatNotificationBody(payload: NotificationPayload): string {
  const lines: string[] = [payload.task_title];

  const contextParts: string[] = [];

  if (payload.project_name) {
    contextParts.push(payload.project_name);
  }

  if (payload.due_date) {
    const dueContext = formatDueContext(payload.due_date);
    if (dueContext) {
      contextParts.push(dueContext);
    }
  }

  if (contextParts.length > 0) {
    lines.push(contextParts.join(" · "));
  }

  return lines.join("\n");
}

/**
 * Formats a due date into human-readable context.
 */
function formatDueContext(dueDate: string): string {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "Overdue";
  } else if (diffDays === 0) {
    return "Due today";
  } else if (diffDays === 1) {
    return "Due tomorrow";
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  }

  return "";
}

/**
 * Sends a notification via ntfy.
 * Includes action buttons for snoozing and completing tasks.
 */
export async function sendNtfyNotification(
  topic: string,
  payload: NotificationPayload
): Promise<void> {
  const ntfyBaseUrl = process.env.NTFY_BASE_URL || "https://ntfy.sh";
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appBaseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
  }

  const snoozeBaseUrl = `${appBaseUrl}/api/snooze`;
  const token = signToken(payload.reminder_id);

  const actions = [
    `http, 10 min, ${snoozeBaseUrl}?id=${payload.reminder_id}&mins=10&token=${token}, clear=true`,
    `http, 1 hour, ${snoozeBaseUrl}?id=${payload.reminder_id}&mins=60&token=${token}, clear=true`,
    `http, Tomorrow, ${snoozeBaseUrl}?id=${payload.reminder_id}&mins=1440&token=${token}, clear=true`,
    `http, Done ✓, ${snoozeBaseUrl}?id=${payload.reminder_id}&done=true&token=${token}, clear=true`,
  ];

  const response = await fetch(`${ntfyBaseUrl}/${topic}`, {
    method: "POST",
    headers: {
      "Title": "Flow — Next Action",
      "Priority": "high",
      "Tags": "clipboard",
      "Actions": actions.join("; "),
    },
    body: formatNotificationBody(payload),
  });

  if (!response.ok) {
    console.error(
      `ntfy notification failed: ${response.status} ${response.statusText}`
    );
  }
}
