# SPEC.md — Flow GTD Product Specification

## 1. Product Summary

Flow is a single-user GTD task manager. It implements the five GTD stages (Capture, Clarify, Organize, Reflect, Engage) through six primary views (Inbox, Today, Forecast, Projects, Tags, Review) plus a global Quick Capture mechanism and a notification/reminder system.

Design philosophy: ship the 30% of OmniFocus that 90% of users actually need, and make it beautiful.

## 2. Core Data Model

### Entities

- **Task**: The atomic unit. Has a title, optional notes, optional due date, optional defer date, completion status, and belongs to zero or one Project. Can have multiple Tags. May have Reminders.
- **Project**: A multi-step outcome. Belongs to one Area. Has a status (active, someday, completed). Has a review interval and next review date. Can be sequential or parallel (determines which tasks show as "available").
- **Area**: A category of responsibility (e.g., Work, Personal, Health). Groups projects. Has a display color.
- **Tag**: A context label (e.g., @computer, @errands, @calls). Tasks can have multiple tags.
- **Reminder**: A scheduled notification tied to a task. Has a trigger time and snooze state.

See SCHEMA.md for the full database schema.

## 3. Views

### 3.1 Inbox

**Purpose**: Capture bucket. All new items land here before being clarified.

**Displays**: All tasks where `inbox = true` and `completed = false`, ordered by creation date (newest first).

**Behaviors**:
- Tapping a task opens the detail panel/sheet.
- Completing a task (checkbox) triggers the completion animation and removes it.
- "Clarifying" a task means assigning it a project (or making it standalone), optionally adding tags, due date, and defer date, then setting `inbox = false`. The task moves out of inbox.
- When inbox is empty, show the empty state: ✨ icon + "Inbox zero — everything is processed."

**Empty state message**: "Inbox zero — everything is processed"

### 3.2 Today

**Purpose**: Focus view for the current day.

**Displays**: All tasks where `due_date = today` and `completed = false`, plus any tasks where `defer_date <= today` and `completed = false` (deferred tasks that are now available). Ordered by project grouping, then by sort order within project.

**Behaviors**:
- Same task interaction as inbox (tap to detail, checkbox to complete).
- Header shows "Today" with the formatted date (e.g., "Sunday, Feb 1").

**Empty state message**: "Nothing due today — enjoy the calm"

### 3.3 Forecast

**Purpose**: Calendar lookahead showing upcoming due dates.

**Displays**: The next 14 days as a horizontally scrollable strip (mobile) or grid (desktop). Each day cell shows the day name, date number, and colored dots for tasks due that day. Below the strip, a vertical list groups tasks by day.

**Behaviors**:
- Today's cell is visually highlighted with the accent border.
- Colored dots correspond to the Area color of the task's project (gray if no project).
- Tapping a task in the list below opens the detail panel/sheet.
- Days with no tasks still show in the strip but have no dots.

### 3.4 Projects

**Purpose**: Overview of all active work and someday/maybe ideas.

**Displays**: Projects grouped under their Areas. Each Area section is collapsible. Active projects show a progress bar and up to 3 next actions. Below active projects, a "Someday / Maybe" section shows projects with `status = someday`.

**Area sections**:
- Header: chevron (expand/collapse) + colored dot + area name + project count.
- Collapsed: just the header.
- Expanded: list of ProjectCards.

**ProjectCard** (active):
- Project name + remaining task count.
- Progress bar (percentage of completed tasks out of total tasks in project).
- Up to 3 TaskRows for the next available actions.
- "+N more" link if more than 3 remaining tasks.

**ProjectCard** (someday):
- Compact: just project name + area label. Dimmed at 60% opacity.

**Project type behavior**:
- **Parallel project**: All incomplete tasks are "available" and shown as next actions.
- **Sequential project**: Only the first incomplete task (by sort order) is "available." Others are hidden until it's completed.

### 3.5 Tags

**Purpose**: Filter tasks by context for context-based working.

**Displays**: A grid of tag cards (2 columns mobile, 3 columns desktop). Each card shows the tag icon/emoji, name, and count of incomplete tasks with that tag. Tapping a tag card activates it and shows the filtered task list below.

**Behaviors**:
- Only one tag can be active at a time. Tapping the active tag deactivates it.
- Active tag card gets an accent border.
- Filtered task list shows all incomplete tasks with that tag, ordered by due date (nulls last), then creation date.

### 3.6 Review

**Purpose**: Weekly review workflow. Step through each active project to ensure nothing is stale.

**Displays**: One project at a time in a ReviewCard. Shows progress indicator ("2 of 4"), area badge, project name, stats (remaining tasks, completion percentage), progress bar, next actions list, and three prompting questions.

**Prompting questions** (always the same):
1. "Is this project still relevant?"
2. "What's the next physical action?"
3. "Is anything stuck or waiting?"

**Behaviors**:
- "Mark Reviewed" advances to the next project and updates the project's `last_reviewed_at` timestamp.
- "Previous" goes back (does not undo the review timestamp).
- On the last project, the button says "Finish Review."
- After finishing, show empty state: ✅ "All projects reviewed — you're on top of things."
- Only projects with `status = active` and a `review_interval` are included.
- Projects are ordered by `next_review_date` ascending (most overdue first).

## 4. Global Features

### 4.1 Quick Capture

**Trigger**: `Cmd+N` / `Ctrl+N` on desktop. FAB (floating action button) on mobile.

**Behavior**: Opens a centered modal overlay with a text input. User types a task title and presses Enter (or taps "Add to Inbox"). The task is created with `inbox = true` and all other fields null/default. Modal closes. If on the Inbox view, the new task appears immediately at the top.

**Dismiss**: Press Escape, click outside the modal, or tap the X.

### 4.2 Task Detail

**Mobile**: Bottom sheet that slides up, covering ~85% of the viewport. Has a drag handle at top. Dismiss by tapping the overlay or the close button.

**Desktop**: Side panel (340px wide) that slides in from the right. Dismiss with the close button or Escape key.

**Fields shown**:
- Title (large, Newsreader serif font)
- Project (colored by area)
- Due date (with color coding: red for overdue, yellow for today, orange for tomorrow, gray for future)
- Defer date
- Tags (comma-separated names)
- Notes (in a subtle card below)

**Editing**: In SLC, the detail panel is read-only display. Editing is done through an edit mode that replaces the display fields with form inputs. Save applies the changes and closes edit mode.

### 4.3 Navigation

**Mobile** (below 768px):
- Top: Mobile header with brand logo and hamburger menu button.
- Bottom: Tab bar with 5 items (Inbox, Today, Forecast, Projects, Tags). Review is accessible from the hamburger menu.
- Hamburger menu: Bottom sheet listing all 6 views.

**Desktop** (768px+):
- Left sidebar (240px) with all 6 nav items, badges for counts (Inbox, Today, Review), and Quick Capture button at bottom.
- Top bar with search input and user avatar.

### 4.4 Search

**SLC scope**: Client-side filtering of task titles. No full-text search or server-side search. The search input in the top bar (desktop) filters the current view's tasks by title substring match.

### 4.5 Task Completion Animation

When a checkbox is tapped:
1. Checkbox fills with the accent color and shows a checkmark (scale up to 1.1x, 200ms).
2. The entire task row fades to 30% opacity and scales to 97% (400ms ease).
3. After 500ms total, the task is marked complete server-side and removed from the list.

## 5. Notifications & Reminders

See NOTIFICATIONS.md for the full specification.

Summary: Users can set reminders on tasks. Reminders are delivered via ntfy (Android/GrapheneOS) and Web Push (desktop). Notifications include one-tap snooze buttons (10 min, 1 hour, tomorrow). Scheduling is handled by pg-boss jobs in Postgres.

## 6. Out of Scope (SLC)

These features are explicitly excluded from the initial build:

- Multi-user / sharing / collaboration
- Native mobile app (responsive web only)
- Repeating/recurring tasks
- File attachments
- Perspectives / custom saved views (OmniFocus feature)
- Import/export
- Drag-and-drop reordering (use explicit sort order field)
- Undo
- Offline support / PWA caching
- Dark/light theme toggle (dark only in SLC)
- Keyboard shortcuts beyond Cmd+N and Escape
- Task dependencies
- Time tracking
- Subtasks / checklists within tasks
