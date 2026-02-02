# TASKS.md — Flow GTD Implementation Task Breakdown

## Overview

Tasks are organized into batches by dependency. Within a batch, tasks can run in parallel (separate Auto-Claude specs). Between batches, all tasks in the previous batch must be merged before starting the next.

Total: ~18 specs across 6 batches.

---

## Batch 1: Foundation (Sequential)

These must be done in order. Each depends on the previous.

### Task 1.1: Project Scaffolding

**Description**: Initialize the Next.js project with TypeScript, Tailwind CSS, Prisma, and all base configuration.

**Deliverables**:
- `pnpm create next-app` with App Router, TypeScript, Tailwind, ESLint.
- Configure `tsconfig.json` with strict mode.
- Install runtime deps: `@prisma/client`, `pg-boss`, `web-push`, `bcryptjs`.
- Install dev deps: `prisma`, type packages.
- Set up `prisma/schema.prisma` with the full schema from SCHEMA.md.
- Create `src/lib/db.ts` (Prisma client singleton).
- Create `.env.example` per ENV.md.
- Create `globals.css` with CSS custom properties from UI-REFERENCE.md and font imports.
- Set up `package.json` scripts per ENV.md.
- Set up path aliases in `tsconfig.json` (`@/` maps to `src/`).

**Acceptance criteria**:
- `pnpm dev` starts without errors.
- `pnpm build` succeeds.
- Prisma schema is valid (`pnpm prisma validate` passes).
- CSS custom properties are available globally.
- Google Fonts (DM Sans, Newsreader) load.

---

### Task 1.2: Database Migration & Seed

**Description**: Create the initial Prisma migration and seed script with sample data matching the prototype.

**Deliverables**:
- Run `prisma migrate dev --name init` to generate the migration.
- Create `prisma/seed.ts` that populates:
  - 3 areas (Work, Personal, Health) with correct colors.
  - 6 projects (4 active, 2 someday) across areas.
  - 6 tags with emojis.
  - ~18 tasks matching the prototype data (some in inbox, some in projects, various due dates, tags, completion states).
  - 1 user (username: `admin`, password: `flow-admin-2026` bcrypt-hashed).
- Configure `prisma/seed` in `package.json`.

**Acceptance criteria**:
- `pnpm db:migrate` runs cleanly on a fresh database.
- `pnpm db:seed` populates all tables.
- `pnpm db:studio` shows correct data.
- Seed is idempotent (can run multiple times without duplicating).

---

### Task 1.3: Authentication

**Description**: Implement simple session-based auth for a single user.

**Deliverables**:
- `src/lib/auth.ts`: Functions for `createSession`, `validateSession`, `destroySession`. Sessions stored in the `sessions` table. Cookie-based with httpOnly, secure, sameSite=lax.
- `src/app/login/page.tsx`: Simple login form (username + password). Redirects to `/inbox` on success.
- Middleware (`src/middleware.ts`): Checks session cookie on all routes except `/login`. Redirects to `/login` if invalid.
- Login page styling matches the app's dark theme.

**Acceptance criteria**:
- Unauthenticated users are redirected to `/login`.
- Correct credentials create a session and redirect to `/inbox`.
- Wrong credentials show an error message.
- Session persists across page reloads.
- Visiting `/login` while authenticated redirects to `/inbox`.

---

## Batch 2: Layout & Core Views (Parallel)

All tasks in this batch can run simultaneously after Batch 1 is merged.

### Task 2.1: Responsive Layout Shell

**Description**: Build the root layout with sidebar (desktop), bottom nav (mobile), mobile header, and top bar. No view content yet — just the navigation chrome.

**Deliverables**:
- `src/app/layout.tsx`: Root layout wrapping all views.
- `src/components/layout/Sidebar.tsx`: Desktop sidebar per UI-REFERENCE.md. Shows all 6 nav items with icons, labels, count badges. Quick Capture button at bottom. Brand mark and name.
- `src/components/layout/BottomNav.tsx`: Mobile bottom tab bar with 5 items (Inbox, Today, Forecast, Projects, Tags). Badges on Inbox and Today.
- `src/components/layout/MobileHeader.tsx`: Brand + hamburger. Hamburger opens a bottom sheet with all 6 nav items.
- `src/components/layout/TopBar.tsx`: Desktop top bar with search input and avatar.
- All SVG icons as inline components in `src/components/ui/Icons.tsx`.
- Active state highlights current route.
- Responsive: sidebar hidden below 768px, bottom nav hidden above 768px.

**Acceptance criteria**:
- Navigation renders correctly at mobile (375px) and desktop (1280px) widths.
- Active route is highlighted in sidebar and bottom nav.
- Hamburger menu opens/closes on mobile.
- Badge counts render (can be hardcoded for now, wired up later).
- Brand mark and name display correctly with Newsreader font.
- Navigating between views works via links.

**References**: UI-REFERENCE.md → Navigation section. Prototype file for exact visual match.

---

### Task 2.2: Inbox View

**Description**: Build the Inbox view — displays unclarified tasks, supports completion.

**Deliverables**:
- `src/app/(views)/inbox/page.tsx`: Server component that queries inbox tasks.
- `src/components/tasks/TaskRow.tsx`: Reusable task row component per UI-REFERENCE.md.
- `src/components/ui/Checkbox.tsx`: Animated checkbox component.
- `src/actions/tasks.ts`: `createTask` and `completeTask` server actions.
- Empty state when no inbox tasks.
- View header with "Inbox" title and count.

**Acceptance criteria**:
- Inbox shows only tasks with `inbox = true` and `completed = false`.
- Tasks ordered by created_at descending (newest first).
- Checking a task triggers completion animation and removes it.
- Empty state shows when all tasks are cleared.
- TaskRow shows title, project label (colored), tag emojis, due badge, notes icon.

**References**: SPEC.md §3.1, API.md → Tasks section, UI-REFERENCE.md → TaskRow/Checkbox.

---

### Task 2.3: Today View

**Description**: Build the Today view — tasks due today and deferred tasks that are now available.

**Deliverables**:
- `src/app/(views)/today/page.tsx`: Server component with Today query.
- Reuses TaskRow from Task 2.2.
- View header with "Today" title and formatted date.
- Empty state.

**Acceptance criteria**:
- Shows tasks where `due_date = today` OR (`defer_date <= today` AND no due_date), all incomplete.
- Header shows formatted date (e.g., "Sunday, Feb 1").
- Task completion works.
- Empty state displays when no tasks are due.

**References**: SPEC.md §3.2, API.md → Today query.

---

### Task 2.4: Quick Capture

**Description**: Build the global Quick Capture modal.

**Deliverables**:
- `src/components/tasks/QuickCapture.tsx`: Modal component.
- `src/components/ui/FAB.tsx`: Floating action button (mobile only).
- `src/hooks/useQuickCapture.ts`: Hook managing open/close state, keyboard shortcut.
- `src/hooks/useKeyboardShortcuts.ts`: Global keyboard handler for Cmd+N / Ctrl+N and Escape.
- Wire `createTask` server action to the modal.
- Integrate into root layout so it's available on all views.

**Acceptance criteria**:
- Cmd+N / Ctrl+N opens the modal on desktop.
- FAB button visible on mobile, opens the modal.
- Typing and pressing Enter creates a task in inbox.
- Modal closes after creation, on Escape, or on clicking outside.
- New task appears in Inbox view immediately.
- Input autofocuses when modal opens.

**References**: SPEC.md §4.1, UI-REFERENCE.md → Capture Modal/FAB.

---

## Batch 3: Remaining Views (Parallel)

### Task 3.1: Forecast View

**Description**: Build the Forecast view with date strip and grouped task list.

**Deliverables**:
- `src/app/(views)/forecast/page.tsx`: Server component querying next 14 days.
- `src/components/forecast/ForecastStrip.tsx`: Horizontally scrollable date cells.
- `src/components/forecast/ForecastDayGroup.tsx`: Day header + task list for days with tasks.
- `src/lib/utils.ts`: Date formatting helpers (`formatDate`, `dateClass`).

**Acceptance criteria**:
- Shows next 14 days in a scrollable strip.
- Today's cell has accent border.
- Colored dots correspond to project area colors.
- Below the strip, tasks are grouped by day.
- Days with no tasks show in strip but not in list.
- Tapping a task opens detail (wired in Batch 4).

**References**: SPEC.md §3.3, UI-REFERENCE.md → Forecast Strip.

---

### Task 3.2: Projects View

**Description**: Build the Projects view with area grouping, project cards, and someday section.

**Deliverables**:
- `src/app/(views)/projects/page.tsx`: Server component querying areas → projects → tasks.
- `src/components/projects/AreaGroup.tsx`: Collapsible area section.
- `src/components/projects/ProjectCard.tsx`: Card with progress bar and nested tasks.
- `src/actions/projects.ts`: `createProject`, `updateProject` server actions.

**Acceptance criteria**:
- Projects grouped under collapsible area headers.
- Area headers show colored dot, name, project count.
- Project cards show name, task count, progress bar (colored by area), up to 3 TaskRows.
- "+N more" shown when more than 3 tasks.
- Someday/Maybe section at the bottom, dimmed.
- Sequential projects show only the first incomplete task.
- Parallel projects show all incomplete tasks.

**References**: SPEC.md §3.4, API.md → Projects queries, UI-REFERENCE.md → ProjectCard.

---

### Task 3.3: Tags View

**Description**: Build the Tags view with tag cards and filtered task list.

**Deliverables**:
- `src/app/(views)/tags/page.tsx`: Server component querying tags with task counts.
- Tag card grid component.
- Filtered task list when a tag is selected.
- `src/actions/tags.ts`: `createTag`, `setTaskTags` server actions.

**Acceptance criteria**:
- Tags displayed in 2-column grid (mobile) / 3-column (desktop).
- Each card shows emoji, name, incomplete task count.
- Tapping a tag shows its tasks below.
- Only one tag active at a time. Tapping again deactivates.
- Active tag has accent border.

**References**: SPEC.md §3.5, UI-REFERENCE.md → Tag Cards.

---

### Task 3.4: Review View

**Description**: Build the weekly Review view with step-through workflow.

**Deliverables**:
- `src/app/(views)/review/page.tsx`: Server component querying reviewable projects.
- `src/components/review/ReviewCard.tsx`: Full review card per UI-REFERENCE.md.
- `src/actions/projects.ts`: `markProjectReviewed` server action (add to existing file).

**Acceptance criteria**:
- Shows one project at a time, ordered by next_review_date ascending.
- Displays area badge, project name, stats, progress bar, next actions, prompting questions.
- "Mark Reviewed" updates the review date and advances to next project.
- "Previous" goes back without undoing the timestamp.
- Last project shows "Finish Review" button.
- Empty state when all projects reviewed.
- Progress indicator shows "X of Y".

**References**: SPEC.md §3.6, API.md → Review query, UI-REFERENCE.md → ReviewCard.

---

## Batch 4: Task Detail & Edit (Sequential)

### Task 4.1: Task Detail Panel

**Description**: Build the task detail view — bottom sheet on mobile, side panel on desktop.

**Deliverables**:
- `src/components/tasks/TaskDetail.tsx`: Desktop side panel (340px).
- `src/components/tasks/TaskDetailSheet.tsx`: Mobile bottom sheet.
- `src/components/ui/Sheet.tsx`: Reusable bottom sheet primitive.
- Wire task selection from all views — clicking a TaskRow opens detail.
- Display all task fields: title, project, due date, defer date, tags, notes.

**Acceptance criteria**:
- Mobile: tapping a task opens a bottom sheet (slides up, 85vh max, drag handle).
- Desktop: tapping a task opens a side panel (340px, slides from right).
- Escape or clicking overlay/close button dismisses.
- All task fields displayed with correct formatting and colors.
- Due date color-coded (overdue, today, tomorrow, future).
- Project name colored by area.

**References**: SPEC.md §4.2, UI-REFERENCE.md → Bottom Sheet / Side Panel.

---

### Task 4.2: Task Edit Mode

**Description**: Add editing capability to the task detail panel.

**Deliverables**:
- Edit button in the detail panel header.
- Edit mode replaces display fields with form inputs:
  - Title: text input.
  - Project: select dropdown of all projects (grouped by area).
  - Due date: date picker.
  - Defer date: date picker.
  - Tags: multi-select of available tags.
  - Notes: textarea.
  - Inbox toggle (for moving tasks back to inbox).
- Save and Cancel buttons.
- `src/actions/tasks.ts`: `updateTask`, `clarifyTask` actions (add to existing file).

**Acceptance criteria**:
- Toggling edit mode shows form inputs pre-filled with current values.
- Saving updates the task and closes edit mode.
- Cancel reverts without saving.
- Assigning a project to an inbox task automatically moves it out of inbox.
- Tag changes persist correctly (full replacement via `setTaskTags`).
- Date pickers work on both mobile and desktop.

**References**: SPEC.md §4.2, API.md → updateTask/clarifyTask.

---

## Batch 5: Notifications (Parallel with Batch 4)

### Task 5.1: pg-boss Setup & Reminder Scheduling

**Description**: Set up pg-boss and the reminder data flow.

**Deliverables**:
- `src/lib/notifications/scheduler.ts`: pg-boss initialization, `scheduleReminder`, `snoozeReminder`, `handleReminderJob` functions.
- `src/actions/reminders.ts`: `createReminder`, `snoozeReminder`, `dismissReminder` server actions.
- Reminder creation UI in the task edit form (add a "Set Reminder" field with datetime picker).
- Wire task completion to cancel pending reminders.

**Acceptance criteria**:
- pg-boss starts successfully alongside the Next.js server.
- Creating a reminder schedules a pg-boss job.
- Completing a task cancels its pending reminders.
- Snoozing creates a new job at the adjusted time.
- pg-boss tables are created automatically in the `pgboss` schema.

**References**: NOTIFICATIONS.md → pg-boss section, API.md → Reminders section.

---

### Task 5.2: ntfy Integration

**Description**: Implement ntfy notification delivery with action buttons.

**Deliverables**:
- `src/lib/notifications/ntfy.ts`: `sendNtfyNotification` function with action button URLs.
- Token signing/verification for snooze callback auth.
- `src/app/api/snooze/route.ts`: Snooze callback endpoint.
- `src/app/api/notify/route.ts`: Internal notification fan-out endpoint.
- Notification setup UI (topic display, subscribe link).

**Acceptance criteria**:
- Firing a reminder sends a notification to the configured ntfy topic.
- Notification shows task title, project name, due context.
- 4 action buttons: 10 min, 1 hour, Tomorrow, Done ✓.
- Tapping snooze reschedules the reminder.
- Tapping Done completes the task.
- Signed tokens prevent unauthorized snooze calls.

**References**: NOTIFICATIONS.md → ntfy section, API.md → /api/snooze, /api/notify.

---

### Task 5.3: Web Push Integration

**Description**: Implement Web Push notifications for desktop browsers.

**Deliverables**:
- `src/lib/notifications/web-push.ts`: `sendWebPushNotification` function.
- `public/sw.js`: Service worker with push and notificationclick handlers.
- `src/app/api/push/subscribe/route.ts`: Subscription registration endpoint.
- Client-side subscription flow (service worker registration, permission request, subscribe).
- Fan-out function that sends to both ntfy and web push.

**Acceptance criteria**:
- Browser prompts for notification permission.
- Subscription is stored in the database.
- Firing a reminder shows a desktop notification with action buttons.
- Clicking snooze buttons works (calls /api/snooze).
- Clicking the notification body opens the app.
- 410 responses deactivate the subscription.

**References**: NOTIFICATIONS.md → Web Push section.

---

## Batch 6: Polish & Integration (Sequential)

### Task 6.1: Wire Navigation Badges

**Description**: Connect live data to all navigation badge counts.

**Deliverables**:
- Sidebar badges show real-time counts for Inbox, Today, Review.
- Mobile bottom bar badges show counts for Inbox, Today.
- Counts update after task completion, creation, and clarification.

**Acceptance criteria**:
- Inbox badge shows count of `inbox = true AND completed = false`.
- Today badge shows count of tasks due today.
- Review badge shows count of projects needing review.
- Completing a task updates the count without full page reload.

---

### Task 6.2: Search

**Description**: Implement client-side search filtering.

**Deliverables**:
- Search input in the desktop top bar filters current view's tasks.
- Filters by title substring match, case-insensitive.
- Clears when switching views.

**Acceptance criteria**:
- Typing in search filters visible tasks in real-time.
- Empty search shows all tasks.
- Works on all views that display tasks.

---

### Task 6.3: UI Polish Pass

**Description**: Final visual refinement to match the prototype exactly.

**Deliverables**:
- Verify all colors, fonts, spacing, and animations match UI-REFERENCE.md.
- Ensure smooth completion animations.
- Verify responsive behavior at 375px, 768px, and 1280px widths.
- Verify bottom sheet and side panel transitions.
- Verify FAB positioning with safe-area insets.
- Verify forecast strip scrolling behavior.
- Test on a real Android device (GrapheneOS) via the browser.

**Acceptance criteria**:
- Pixel-level match with the prototype at all breakpoints.
- All animations are smooth (no jank).
- No visual regressions from earlier batches.
- Touch targets are at least 44px on mobile.
- Safe-area insets work on notched devices.

---

## Dependency Graph

```
Batch 1 (sequential):
  1.1 Scaffolding → 1.2 Database → 1.3 Auth

Batch 2 (parallel, after Batch 1):
  2.1 Layout Shell
  2.2 Inbox View
  2.3 Today View
  2.4 Quick Capture

Batch 3 (parallel, after Batch 2):
  3.1 Forecast View
  3.2 Projects View
  3.3 Tags View
  3.4 Review View

Batch 4 (sequential, after Batch 3):
  4.1 Task Detail Panel → 4.2 Task Edit Mode

Batch 5 (parallel, after Batch 2. Can overlap with Batch 3/4):
  5.1 pg-boss & Reminders
  5.2 ntfy Integration
  5.3 Web Push Integration

Batch 6 (sequential, after all above):
  6.1 Navigation Badges
  6.2 Search
  6.3 UI Polish Pass
```

## Notes for Auto-Claude

- Each task above becomes one Auto-Claude spec.
- Use the **Description** as the task description.
- Use the **Acceptance criteria** as the acceptance criteria.
- Include the **References** so the agent knows which docs to read.
- Batch 1 tasks should include the full file paths from CLAUDE.md.
- Batch 2+ tasks should reference existing files from prior batches.
- Run `pnpm build` as a validation step in every spec's QA phase.
