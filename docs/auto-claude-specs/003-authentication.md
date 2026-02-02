# Spec 003: Authentication

## Batch
1 (Foundation) — Run after Spec 002 is merged.

## Description
Implement simple session-based authentication for a single user. Cookie-based sessions stored in the database. Middleware protects all routes except `/login`. This is intentionally minimal — no OAuth, no magic links, no multi-user.

## What to do

1. **Create `src/lib/auth.ts`** with these functions:

   **`createSession(userId: string): Promise<string>`**
   - Generate a random token (64 hex chars via `crypto.randomBytes(32).toString("hex")`).
   - Insert into `sessions` table with `expires_at = now + 30 days`.
   - Return the token.

   **`validateSession(token: string): Promise<{ userId: string } | null>`**
   - Look up session by token.
   - If not found or expired, return null.
   - If valid, return the userId.

   **`destroySession(token: string): Promise<void>`**
   - Delete the session record.

   **`getSessionFromCookies(): Promise<{ userId: string } | null>`**
   - Read the `flow_session` cookie from the request.
   - Call `validateSession` with the token.

   **`setSessionCookie(token: string): void`**
   - Set a `flow_session` cookie: httpOnly, secure (in production), sameSite=lax, path=/, maxAge=30 days.

   **`clearSessionCookie(): void`**
   - Clear the `flow_session` cookie.

2. **Create `src/app/login/page.tsx`**:
   - Dark themed login page matching the app's aesthetic.
   - Centered card with the Flow brand mark and name at top.
   - Username and password inputs.
   - "Sign In" button.
   - Server action that:
     - Looks up user by username.
     - Compares password with bcrypt.
     - If valid: creates session, sets cookie, redirects to `/inbox`.
     - If invalid: returns error message shown below the form.
   - Style: `bg-card` card, `bg-surface` inputs, accent-colored button. Newsreader for the brand name.

3. **Create `src/middleware.ts`**:
   - Runs on all routes except `/login`, `/api/snooze` (public webhook), and static assets (`/_next`, `/favicon.ico`, `/sw.js`).
   - Reads the `flow_session` cookie.
   - If missing or invalid: redirect to `/login`.
   - If valid: continue to the requested page.
   - Note: Middleware can't use Prisma directly (runs in Edge runtime). Use a lightweight token validation approach: either switch to Node.js runtime in `next.config.ts` (`middleware: { runtime: "nodejs" }`) or validate by making an internal fetch to an auth-check API route.

4. **Create a logout mechanism**:
   - Add a server action `logoutAction` that destroys the session and clears the cookie.
   - This will be called from a logout button in the sidebar/header (wired in a later spec, just export the action).

## Files to create
- `src/lib/auth.ts`
- `src/app/login/page.tsx`
- `src/middleware.ts`

## Files to modify
- `next.config.ts` (if needed for middleware runtime)

## Acceptance criteria
- [ ] Visiting any page while unauthenticated redirects to `/login`.
- [ ] The login page renders with the dark theme and Flow branding.
- [ ] Entering correct credentials (admin / flow-admin-2026) redirects to `/inbox`.
- [ ] Entering wrong credentials shows an error message without redirecting.
- [ ] After login, refreshing the page does not redirect to login (session persists).
- [ ] The session cookie is httpOnly and sameSite=lax.
- [ ] `/api/snooze` is accessible without authentication (for ntfy callbacks).
- [ ] `pnpm build` succeeds.

## References
- SCHEMA.md → User and Session models
- CLAUDE.md → Coding Conventions (error handling, server actions)
- UI-REFERENCE.md → Color Tokens (for login page styling)
- ENV.md → SESSION_SECRET
