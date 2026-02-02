"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  getSessionFromCookies,
  destroySession,
  clearSessionCookie,
} from "@/lib/auth";
import type { ActionResult } from "@/types";

interface LoginState {
  success: boolean;
  error?: string;
}

/**
 * Server action to authenticate user and create session.
 * Returns error on failure, redirects to /inbox on success.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const username = formData.get("username");
    const password = formData.get("password");

    // Validate input
    if (
      !username ||
      !password ||
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return { success: false, error: "Username and password are required" };
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Use generic error message to avoid revealing if username exists
    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    // Compare password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return { success: false, error: "Invalid username or password" };
    }

    // Create session and set cookie
    const token = await createSession(user.id);
    await setSessionCookie(token);
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }

  // Redirect on success (must be outside try-catch as redirect throws)
  redirect("/inbox");
}

/**
 * Server action to destroy session and log out user.
 */
export async function logoutAction(): Promise<ActionResult> {
  try {
    const token = await getSessionFromCookies();

    if (token) {
      await destroySession(token);
    }

    await clearSessionCookie();

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
