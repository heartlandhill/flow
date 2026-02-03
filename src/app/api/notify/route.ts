import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  type NotificationPayload,
  sendNtfyNotification,
} from "@/lib/notifications/ntfy";

/**
 * Request body for the notify endpoint.
 */
interface NotifyRequestBody {
  reminder_id: string;
  task_id: string;
  task_title: string;
  project_name?: string;
  due_date?: string;
}

/**
 * Validates the Authorization header against INTERNAL_API_SECRET.
 * Expected format: "Bearer {INTERNAL_API_SECRET}"
 */
function validateAuthHeader(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret) {
    console.error("INTERNAL_API_SECRET environment variable is not set");
    return false;
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return false;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return false;
  }

  return token === secret;
}

/**
 * Validates the request body has required fields.
 */
function validateRequestBody(
  body: unknown
): body is NotifyRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const obj = body as Record<string, unknown>;

  if (!obj.reminder_id || typeof obj.reminder_id !== "string") {
    return false;
  }

  if (!obj.task_id || typeof obj.task_id !== "string") {
    return false;
  }

  if (!obj.task_title || typeof obj.task_title !== "string") {
    return false;
  }

  // Optional fields validation (if present, must be strings)
  if (obj.project_name !== undefined && typeof obj.project_name !== "string") {
    return false;
  }

  if (obj.due_date !== undefined && typeof obj.due_date !== "string") {
    return false;
  }

  return true;
}

/**
 * Fans out a notification to all active subscription channels.
 * Uses Promise.allSettled to prevent one failure from blocking others.
 */
async function fanOutNotification(payload: NotificationPayload): Promise<{
  total: number;
  succeeded: number;
  failed: number;
}> {
  const subscriptions = await prisma.notificationSubscription.findMany({
    where: { active: true },
  });

  const promises = subscriptions.map(async (sub) => {
    if (sub.type === "NTFY" && sub.ntfy_topic) {
      return sendNtfyNotification(sub.ntfy_topic, payload);
    }

    // Web Push support to be added in Spec 016
    if (sub.type === "WEB_PUSH" && sub.endpoint) {
      // Stub: Web Push not implemented yet
      return Promise.resolve();
    }

    return Promise.resolve();
  });

  // Use allSettled so one failure doesn't block others
  const results = await Promise.allSettled(promises);

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Log any failures for debugging
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Notification delivery failed for subscription ${subscriptions[index]?.id}:`,
        result.reason
      );
    }
  });

  return {
    total: subscriptions.length,
    succeeded,
    failed,
  };
}

/**
 * POST handler for internal notification fan-out.
 * Called by pg-boss worker when a reminder fires.
 *
 * Authentication: Authorization: Bearer {INTERNAL_API_SECRET}
 *
 * Request body:
 * - reminder_id: string (required)
 * - task_id: string (required)
 * - task_title: string (required)
 * - project_name: string (optional)
 * - due_date: string (optional, ISO date format)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate authentication
    if (!validateAuthHeader(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate request body
    if (!validateRequestBody(body)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body. Required fields: reminder_id, task_id, task_title",
        },
        { status: 400 }
      );
    }

    // Build notification payload
    const payload: NotificationPayload = {
      reminder_id: body.reminder_id,
      task_id: body.task_id,
      task_title: body.task_title,
      project_name: body.project_name,
      due_date: body.due_date,
    };

    // Fan out notification to all active subscriptions
    const result = await fanOutNotification(payload);

    return NextResponse.json({
      success: true,
      notifications: result,
    });
  } catch (error) {
    console.error("Notify endpoint error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
