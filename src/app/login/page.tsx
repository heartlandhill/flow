"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";

const initialState = {
  success: false,
  error: undefined,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-root)] px-4">
      <div className="w-full max-w-sm">
        {/* Flow Branding */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-[var(--text-primary)] tracking-tight">
            Flow
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">
            Sign in to continue
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border)]">
          <form action={formAction} className="space-y-4">
            {/* Error Message */}
            {state.error && (
              <div className="bg-[var(--due-overdue-bg)] border border-[var(--due-overdue)] text-[var(--due-overdue)] rounded-lg px-4 py-3 text-sm">
                {state.error}
              </div>
            )}

            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                autoComplete="username"
                autoFocus
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                placeholder="Enter your username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-[var(--accent)] hover:opacity-90 text-[var(--bg-root)] font-medium rounded-lg px-4 py-2.5 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[var(--text-tertiary)] text-xs mt-6">
          Getting Things Done
        </p>
      </div>
    </div>
  );
}
