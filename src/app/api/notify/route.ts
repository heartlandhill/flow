import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendWebPushNotification,
  type NotificationPayload,
} from "@/lib/notifications/web-push";
import { sendNtfyNotification } from "@/lib/notifications/ntfy";

/**
 * Request body for POST /api/notify
 * This is called by pg-boss when a reminder fires
 */
interface NotifyRequestBody {
  reminder_id: string;
  task_id: string;
  task_title: string;
  project_name?: string | null;
  due_date?: string | null;
}

/**
 * Fan out a notification to all active notification subscriptions.
 * Uses Promise.allSettled to handle partial failures gracefully.
 */
async function fanOutNotification(payload: NotificationPayload): Promise<void> {
  // Query all active notification subscriptions
  const subscriptions = await prisma.notificationSubscription.findMany({
    where: { active: true },
  });

  // Map subscriptions to notification promises
  const promises = subscriptions.map((sub) => {
    if (sub.type === "WEB_PUSH" && sub.endpoint && sub.p256dh && sub.auth) {
      return sendWebPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        payload
      );
    }

    if (sub.type === "NTFY" && sub.ntfy_topic) {
      return sendNtfyNotification(sub.ntfy_topic, payload);
    }

    // Unknown subscription type or missing fields - skip
    return Promise.resolve();
  });

  // Wait for all notifications, handling partial failures
  const results = await Promise.allSettled(promises);

  // Log any failures for debugging
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to send notification to subscription ${subscriptions[index].id}:`,
        result.reason
      );
    }
  });
}

/**
 * POST /api/notify
 * Called by pg-boss when a reminder fires. Fans out the notification
 * to all active notification subscriptions (Web Push, NTFY).
 *
 * This endpoint is intended to be called internally by the scheduler,
 * not directly by users. In production, consider adding internal auth.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: NotifyRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.reminder_id || typeof body.reminder_id !== "string") {
      return NextResponse.json(
        { error: "Missing required field: reminder_id" },
        { status: 400 }
      );
    }

    if (!body.task_id || typeof body.task_id !== "string") {
      return NextResponse.json(
        { error: "Missing required field: task_id" },
        { status: 400 }
      );
    }

    if (!body.task_title || typeof body.task_title !== "string") {
      return NextResponse.json(
        { error: "Missing required field: task_title" },
        { status: 400 }
      );
    }

    // Create notification payload
    const payload: NotificationPayload = {
      reminder_id: body.reminder_id,
      task_id: body.task_id,
      task_title: body.task_title,
      project_name: body.project_name,
      due_date: body.due_date,
    };

    // Fan out notification to all active subscriptions
    await fanOutNotification(payload);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/notify:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
