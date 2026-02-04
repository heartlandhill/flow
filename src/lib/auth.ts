import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

// Cookie configuration
const COOKIE_NAME = "flow_session";
const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
const SESSION_DURATION_SECONDS = SESSION_DURATION_DAYS * 24 * 60 * 60;

/**
 * Creates a new session for a user and stores it in the database.
 * Returns the session token.
 */
export async function createSession(userId: string): Promise<string> {
  // Generate cryptographically secure 64-character hex token
  const token = randomBytes(32).toString("hex");

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      token,
      user_id: userId,
      expires_at: expiresAt,
    },
  });

  return token;
}

/**
 * Validates a session token and returns the user ID if valid.
 * Returns null if the session is invalid or expired.
 */
export async function validateSession(token: string): Promise<string | null> {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      select: { user_id: true, expires_at: true },
    });

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expires_at < new Date()) {
      // Clean up expired session
      await prisma.session.delete({ where: { token } }).catch(() => {
        // Ignore errors during cleanup
      });
      return null;
    }

    return session.user_id;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

/**
 * Destroys a session by removing it from the database.
 */
export async function destroySession(token: string): Promise<void> {
  if (!token || typeof token !== "string") {
    return;
  }

  try {
    await prisma.session.delete({ where: { token } });
  } catch (error) {
    // Ignore errors if session doesn't exist (already deleted or never existed)
    console.error("Session destruction error:", error);
  }
}

/**
 * Gets the session token from cookies.
 * Returns null if no session cookie exists.
 */
export async function getSessionFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);
    return sessionCookie?.value ?? null;
  } catch (error) {
    console.error("Error reading session cookie:", error);
    return null;
  }
}

/**
 * Sets the session cookie with secure attributes.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();

  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_NAME);
}

/**
 * Gets the current user ID from the session cookie.
 * Returns null if no valid session exists.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const token = await getSessionFromCookies();
  if (!token) {
    return null;
  }

  return await validateSession(token);
}

/**
 * Gets the current user ID from the session cookie.
 * Throws an error if no valid session exists.
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("Unauthorized: Valid session required");
  }

  return userId;
}
