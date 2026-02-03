import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/notifications/ntfy";
import { snoozeReminder, dismissReminder } from "@/actions/reminders";
import { prisma } from "@/lib/db";

/**
 * Shared handler for snooze/done actions from ntfy and web push notifications.
 * ntfy may send either GET or POST requests, so both methods use this handler.
 *
 * Query params:
 * - id: The reminder ID (required)
 * - token: HMAC-SHA256 signature of the reminder ID (required)
 * - mins: Number of minutes to snooze (optional, mutually exclusive with done)
 * - done: If "true", mark task as complete (optional, mutually exclusive with mins)
 */
async function handleSnoozeRequest(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const reminderId = searchParams.get("id");
    const token = searchParams.get("token");
    const mins = searchParams.get("mins");
    const done = searchParams.get("done");

    // Validate required params
    if (!reminderId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: token" },
        { status: 400 }
      );
    }

    // Validate token
    if (!verifyToken(reminderId, token)) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 }
      );
    }

    // Check that at least one action is specified
    if (!mins && done !== "true") {
      return NextResponse.json(
        { success: false, error: "Missing action parameter: mins or done" },
        { status: 400 }
      );
    }

    // Check reminder exists
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: "Reminder not found" },
        { status: 404 }
      );
    }

    // Handle done action
    if (done === "true") {
      const result = await dismissReminder(reminderId);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, action: "done" });
    }

    // Handle snooze action
    if (mins) {
      const minutes = parseInt(mins, 10);

      if (isNaN(minutes) || minutes <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid mins parameter: must be a positive integer" },
          { status: 400 }
        );
      }

      const result = await snoozeReminder(reminderId, minutes);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, action: "snoozed", minutes });
    }

    // This shouldn't be reached, but handle it defensively
    return NextResponse.json(
      { success: false, error: "No valid action specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Snooze handler error:", error);

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message === "Reminder not found") {
        return NextResponse.json(
          { success: false, error: "Reminder not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for snooze/done actions.
 * ntfy action buttons typically use GET requests.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleSnoozeRequest(request);
}

/**
 * POST handler for snooze/done actions.
 * Some notification clients may prefer POST.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleSnoozeRequest(request);
}
