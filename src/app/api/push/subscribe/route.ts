import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Request body for POST /api/push/subscribe
 */
interface SubscribeRequestBody {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Request body for DELETE /api/push/subscribe
 */
interface UnsubscribeRequestBody {
  endpoint: string;
}

/**
 * POST /api/push/subscribe
 * Registers a Web Push subscription.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate session
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body: SubscribeRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.endpoint || typeof body.endpoint !== "string") {
      return NextResponse.json(
        { error: "Missing required field: endpoint" },
        { status: 400 }
      );
    }

    if (!body.keys || typeof body.keys !== "object") {
      return NextResponse.json(
        { error: "Missing required field: keys" },
        { status: 400 }
      );
    }

    if (!body.keys.p256dh || typeof body.keys.p256dh !== "string") {
      return NextResponse.json(
        { error: "Missing required field: keys.p256dh" },
        { status: 400 }
      );
    }

    if (!body.keys.auth || typeof body.keys.auth !== "string") {
      return NextResponse.json(
        { error: "Missing required field: keys.auth" },
        { status: 400 }
      );
    }

    // Upsert subscription by endpoint and user_id
    // Check if a subscription with this endpoint already exists for this user
    const existingSubscription = await prisma.notificationSubscription.findFirst({
      where: {
        endpoint: body.endpoint,
        user_id: userId,
      },
    });

    let subscription;

    if (existingSubscription) {
      // Update existing subscription
      subscription = await prisma.notificationSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          type: "WEB_PUSH",
          active: true,
          user_id: userId,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      });
    } else {
      // Create new subscription
      subscription = await prisma.notificationSubscription.create({
        data: {
          type: "WEB_PUSH",
          active: true,
          user_id: userId,
          endpoint: body.endpoint,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      });
    }

    return NextResponse.json({ id: subscription.id }, { status: 200 });
  } catch (error) {
    console.error("Error registering web push subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Unregisters/deactivates a Web Push subscription.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate session
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body: UnsubscribeRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.endpoint || typeof body.endpoint !== "string") {
      return NextResponse.json(
        { error: "Missing required field: endpoint" },
        { status: 400 }
      );
    }

    // Find subscription by endpoint and user_id
    const subscription = await prisma.notificationSubscription.findFirst({
      where: {
        endpoint: body.endpoint,
        user_id: userId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Deactivate subscription
    await prisma.notificationSubscription.update({
      where: { id: subscription.id },
      data: { active: false },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error unregistering web push subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
