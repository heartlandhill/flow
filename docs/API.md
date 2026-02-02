# API.md — Flow GTD API & Server Actions

## Overview

Flow uses two patterns for data mutations:

1. **Server Actions** (in `src/actions/`) — For all CRUD operations initiated by user interaction. These are called directly from client components via form actions or `startTransition`.
2. **API Routes** (in `src/app/api/`) — For webhook endpoints (ntfy snooze callbacks), web push subscription management, and the notification fan-out endpoint.

All server actions require a valid session. API routes that receive external callbacks (snooze) use a signed token for auth instead.

## Response Format

All server actions return a consistent shape:

```typescript
interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}
```

## Server Actions

### Tasks (`src/actions/tasks.ts`)

#### `createTask(title: string): ActionResult<Task>`

Creates a new task in the inbox.

- Sets `inbox = true`, all other fields to defaults.
- Returns the created task.
- Revalidates `/inbox`.

#### `updateTask(id: string, data: UpdateTaskInput): ActionResult<Task>`

Updates any task fields.

```typescript
interface UpdateTaskInput {
  title?: string;
  notes?: string;
  due_date?: Date | null;
  defer_date?: Date | null;
  project_id?: string | null;
  inbox?: boolean;
  sort_order?: number;
}
```

- If `project_id` is set and `inbox` was `true`, automatically sets `inbox = false` (clarifying the task).
- Revalidates the current path.

#### `completeTask(id: string): ActionResult`

Marks a task as completed.

- Sets `completed = true` and `completed_at = now()`.
- Cancels any pending reminders for this task.
- Revalidates all view paths.

#### `uncompleteTask(id: string): ActionResult`

Marks a completed task as incomplete.

- Sets `completed = false` and `completed_at = null`.
- Revalidates all view paths.

#### `deleteTask(id: string): ActionResult`

Permanently deletes a task.

- Cascades to task_tags and reminders (via Prisma).
- Revalidates all view paths.

#### `clarifyTask(id: string, data: ClarifyInput): ActionResult<Task>`

Moves a task out of inbox by assigning it context.

```typescript
interface ClarifyInput {
  project_id?: string | null;
  tag_ids?: string[];
  due_date?: Date | null;
  defer_date?: Date | null;
}
```

- Sets `inbox = false`.
- Replaces all existing tags with the provided `tag_ids`.
- Revalidates `/inbox` and destination view paths.

---

### Projects (`src/actions/projects.ts`)

#### `createProject(data: CreateProjectInput): ActionResult<Project>`

```typescript
interface CreateProjectInput {
  name: string;
  area_id: string;
  notes?: string;
  type?: "PARALLEL" | "SEQUENTIAL";
  status?: "ACTIVE" | "SOMEDAY";
  review_interval_days?: number;
}
```

- If status is ACTIVE and review_interval_days is set, calculates `next_review_date = now() + interval`.
- Revalidates `/projects`.

#### `updateProject(id: string, data: UpdateProjectInput): ActionResult<Project>`

```typescript
interface UpdateProjectInput {
  name?: string;
  notes?: string;
  area_id?: string;
  type?: "PARALLEL" | "SEQUENTIAL";
  status?: "ACTIVE" | "SOMEDAY" | "COMPLETED";
  review_interval_days?: number | null;
}
```

- If status changes to COMPLETED, marks all incomplete tasks in the project as completed.
- Revalidates `/projects` and `/review`.

#### `markProjectReviewed(id: string): ActionResult`

- Sets `last_reviewed_at = now()`.
- Calculates `next_review_date = now() + review_interval_days`.
- Revalidates `/review`.

#### `deleteProject(id: string): ActionResult`

- Orphans all tasks (sets their `project_id = null`, does NOT delete them).
- Revalidates `/projects`.

---

### Areas (`src/actions/areas.ts`)

#### `createArea(data: { name: string; color: string }): ActionResult<Area>`

- Name must be unique.
- Revalidates `/projects`.

#### `updateArea(id: string, data: { name?: string; color?: string }): ActionResult<Area>`

- Name uniqueness enforced.
- Revalidates `/projects`.

#### `deleteArea(id: string): ActionResult`

- Cascades to projects and their tasks (via Prisma cascade).
- Requires confirmation in the UI (not enforced server-side).
- Revalidates `/projects`.

---

### Tags (`src/actions/tags.ts`)

#### `createTag(data: { name: string; icon?: string }): ActionResult<Tag>`

- Name must be unique.
- Revalidates `/tags`.

#### `updateTag(id: string, data: { name?: string; icon?: string }): ActionResult<Tag>`

- Revalidates `/tags`.

#### `deleteTag(id: string): ActionResult`

- Cascades task_tag entries (via Prisma cascade). Does not delete tasks.
- Revalidates `/tags`.

#### `setTaskTags(taskId: string, tagIds: string[]): ActionResult`

- Replaces all existing tags on the task with the provided set.
- Deletes existing task_tag rows, creates new ones.
- Revalidates current path.

---

### Reminders (`src/actions/reminders.ts`)

#### `createReminder(data: CreateReminderInput): ActionResult<Reminder>`

```typescript
interface CreateReminderInput {
  task_id: string;
  trigger_at: Date;
}
```

- Creates a reminder record with `status = PENDING`.
- Schedules a pg-boss job with `sendAfter` set to `trigger_at`.
- Stores the pg-boss job ID on the reminder record.
- Revalidates task detail.

#### `snoozeReminder(id: string, minutes: number): ActionResult`

- Sets `status = SNOOZED` and `snoozed_until = now() + minutes`.
- Cancels the old pg-boss job.
- Creates a new pg-boss job with the new trigger time.
- Updates the reminder's `pgboss_job_id`.

#### `dismissReminder(id: string): ActionResult`

- Sets `status = DISMISSED`.
- Cancels the pg-boss job.

#### `deleteReminder(id: string): ActionResult`

- Deletes the reminder record.
- Cancels the pg-boss job.

---

## API Routes

### `POST /api/notify` (Internal)

Called by the pg-boss worker when a reminder job fires. Fans out the notification to all active subscription channels.

**Request body**:
```typescript
{
  reminder_id: string;
  task_id: string;
  task_title: string;
  project_name?: string;
  due_date?: string;
}
```

**Behavior**:
1. Loads all active NotificationSubscriptions.
2. For each NTFY subscription: sends an HTTP POST to the ntfy topic with action buttons.
3. For each WEB_PUSH subscription: sends a web push notification.
4. Updates reminder status to SENT.

**Auth**: Internal only. Validated by a shared secret in the `Authorization` header (`Bearer <INTERNAL_API_SECRET>`).

**Response**: `200 OK` or `500` with error.

---

### `POST /api/snooze` (External callback)

Called by ntfy when a user taps a snooze action button on a notification.

**Query parameters**:
```
?id=<reminder_id>&mins=<minutes>&done=<boolean>&token=<signed_token>
```

**Behavior**:
- If `done=true`: calls `completeTask` for the associated task and `dismissReminder`.
- If `mins` is set: calls `snoozeReminder(id, mins)`.
- Validates the signed token (HMAC of reminder_id + SESSION_SECRET).

**Auth**: Signed token in query params (since ntfy action URLs can't carry headers).

**Response**: `200 OK` (ntfy expects a 2xx to dismiss the notification action).

---

### `POST /api/push/subscribe`

Registers a Web Push subscription.

**Request body**:
```typescript
{
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  }
}
```

**Behavior**:
- Creates or updates a NotificationSubscription with type WEB_PUSH.
- Stores the endpoint, p256dh, and auth values.

**Auth**: Requires valid session cookie.

**Response**: `200 OK` with subscription ID.

---

### `DELETE /api/push/subscribe`

Unregisters a Web Push subscription.

**Request body**:
```typescript
{
  endpoint: string;
}
```

**Behavior**:
- Sets `active = false` on the matching subscription.

**Auth**: Requires valid session cookie.

**Response**: `200 OK`.

---

## Data Queries (Server Components)

These are not server actions but direct Prisma queries in server components:

### Inbox View
```typescript
prisma.task.findMany({
  where: { inbox: true, completed: false },
  orderBy: { created_at: "desc" },
  include: { tags: { include: { tag: true } }, project: { include: { area: true } } }
})
```

### Today View
```typescript
prisma.task.findMany({
  where: {
    completed: false,
    OR: [
      { due_date: today },
      { defer_date: { lte: today }, due_date: null }
    ]
  },
  orderBy: [{ project_id: "asc" }, { sort_order: "asc" }],
  include: { tags: { include: { tag: true } }, project: { include: { area: true } } }
})
```

### Forecast View
```typescript
prisma.task.findMany({
  where: {
    completed: false,
    due_date: { gte: today, lte: twoWeeksFromNow }
  },
  orderBy: { due_date: "asc" },
  include: { project: { include: { area: true } } }
})
```

### Projects View
```typescript
// Active projects grouped by area
prisma.area.findMany({
  orderBy: { sort_order: "asc" },
  include: {
    projects: {
      where: { status: "ACTIVE" },
      orderBy: { sort_order: "asc" },
      include: {
        tasks: {
          where: { completed: false },
          orderBy: { sort_order: "asc" },
          include: { tags: { include: { tag: true } } }
        }
      }
    }
  }
})

// Someday projects separately
prisma.project.findMany({
  where: { status: "SOMEDAY" },
  include: { area: true }
})
```

### Tags View
```typescript
prisma.tag.findMany({
  orderBy: { sort_order: "asc" },
  include: {
    tasks: {
      where: { task: { completed: false } },
      include: { task: true }
    }
  }
})
```

### Review View
```typescript
prisma.project.findMany({
  where: {
    status: "ACTIVE",
    review_interval_days: { not: null }
  },
  orderBy: { next_review_date: "asc" },
  include: {
    area: true,
    tasks: {
      where: { completed: false },
      orderBy: { sort_order: "asc" },
      include: { tags: { include: { tag: true } } }
    }
  }
})
```
