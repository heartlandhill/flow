# SCHEMA.md — Flow GTD Database Schema

## Overview

PostgreSQL 16 with Prisma ORM. All tables use UUIDs as primary keys. Timestamps use `timestamptz`. The schema includes tables for the GTD data model plus pg-boss's internal tables (auto-created).

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// AREAS
// ============================================================

model Area {
  id         String    @id @default(uuid())
  name       String    @unique
  color      String    @default("#888888")  // Hex color
  sort_order Int       @default(0)
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  projects   Project[]

  @@map("areas")
}

// ============================================================
// PROJECTS
// ============================================================

enum ProjectStatus {
  ACTIVE
  SOMEDAY
  COMPLETED

  @@map("project_status")
}

enum ProjectType {
  PARALLEL
  SEQUENTIAL

  @@map("project_type")
}

model Project {
  id               String        @id @default(uuid())
  name             String
  notes            String?
  status           ProjectStatus @default(ACTIVE)
  type             ProjectType   @default(PARALLEL)
  sort_order       Int           @default(0)

  // Review
  review_interval_days Int?      @default(7)
  last_reviewed_at     DateTime?
  next_review_date     DateTime?

  // Relations
  area_id          String
  area             Area          @relation(fields: [area_id], references: [id], onDelete: Cascade)
  tasks            Task[]

  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt

  @@index([area_id])
  @@index([status])
  @@index([next_review_date])
  @@map("projects")
}

// ============================================================
// TASKS
// ============================================================

model Task {
  id           String    @id @default(uuid())
  title        String
  notes        String?
  inbox        Boolean   @default(true)
  completed    Boolean   @default(false)
  completed_at DateTime?
  sort_order   Int       @default(0)

  // Dates
  due_date     DateTime? @db.Date
  defer_date   DateTime? @db.Date

  // Relations
  project_id   String?
  project      Project?  @relation(fields: [project_id], references: [id], onDelete: SetNull)
  tags         TaskTag[]
  reminders    Reminder[]

  created_at   DateTime  @default(now())
  updated_at   DateTime  @updatedAt

  @@index([inbox, completed])
  @@index([due_date])
  @@index([defer_date])
  @@index([project_id])
  @@index([completed])
  @@map("tasks")
}

// ============================================================
// TAGS
// ============================================================

model Tag {
  id         String    @id @default(uuid())
  name       String    @unique
  icon       String?   // Emoji or icon identifier
  sort_order Int       @default(0)
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  tasks      TaskTag[]

  @@map("tags")
}

// Join table for many-to-many Task <-> Tag
model TaskTag {
  task_id String
  tag_id  String
  task    Task   @relation(fields: [task_id], references: [id], onDelete: Cascade)
  tag     Tag    @relation(fields: [tag_id], references: [id], onDelete: Cascade)

  @@id([task_id, tag_id])
  @@map("task_tags")
}

// ============================================================
// REMINDERS
// ============================================================

enum ReminderStatus {
  PENDING
  SENT
  SNOOZED
  DISMISSED

  @@map("reminder_status")
}

model Reminder {
  id           String         @id @default(uuid())
  trigger_at   DateTime       // When the reminder should fire
  status       ReminderStatus @default(PENDING)
  snoozed_until DateTime?     // If snoozed, the new trigger time
  pgboss_job_id String?       // Reference to the pg-boss job

  // Relations
  task_id      String
  task         Task           @relation(fields: [task_id], references: [id], onDelete: Cascade)

  created_at   DateTime       @default(now())
  updated_at   DateTime       @updatedAt

  @@index([status, trigger_at])
  @@index([task_id])
  @@map("reminders")
}

// ============================================================
// NOTIFICATION SUBSCRIPTIONS
// ============================================================

enum SubscriptionType {
  NTFY
  WEB_PUSH

  @@map("subscription_type")
}

model NotificationSubscription {
  id         String           @id @default(uuid())
  type       SubscriptionType
  active     Boolean          @default(true)

  // ntfy fields
  ntfy_topic String?

  // Web Push fields
  endpoint   String?
  p256dh     String?
  auth       String?

  created_at DateTime         @default(now())
  updated_at DateTime         @updatedAt

  @@map("notification_subscriptions")
}

// ============================================================
// USER SESSION (single user)
// ============================================================

model User {
  id            String   @id @default(uuid())
  username      String   @unique
  password_hash String   // bcrypt hash
  created_at    DateTime @default(now())

  @@map("users")
}

model Session {
  id         String   @id @default(uuid())
  token      String   @unique
  expires_at DateTime
  user_id    String
  created_at DateTime @default(now())

  @@index([token])
  @@index([expires_at])
  @@map("sessions")
}
```

## Table Summary

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| `areas` | Responsibility categories | Has many projects |
| `projects` | Multi-step outcomes | Belongs to area, has many tasks |
| `tasks` | Individual actions | Belongs to project (optional), has many tags via task_tags, has many reminders |
| `tags` | Context labels | Has many tasks via task_tags |
| `task_tags` | Join table | Links tasks and tags |
| `reminders` | Scheduled notifications | Belongs to task |
| `notification_subscriptions` | Push endpoints | Standalone (single user) |
| `users` | Single user auth | Standalone |
| `sessions` | Auth sessions | References user |

## Indexes Rationale

- `tasks(inbox, completed)`: Inbox view queries `WHERE inbox = true AND completed = false`.
- `tasks(due_date)`: Today and Forecast views filter by due date.
- `tasks(defer_date)`: Today view includes deferred tasks that are now available.
- `tasks(project_id)`: Project view loads tasks per project.
- `tasks(completed)`: All views exclude completed tasks.
- `projects(status)`: Separate active vs someday projects.
- `projects(next_review_date)`: Review view orders by review urgency.
- `reminders(status, trigger_at)`: Scheduler queries pending reminders due to fire.
- `sessions(token)`: Session lookup on every request.
- `sessions(expires_at)`: Cleanup expired sessions.

## Seed Data

The seed script (`prisma/seed.ts`) should create:

1. Three areas: Work (#E8A87C), Personal (#85B7D5), Health (#9ED4A0).
2. Six projects distributed across areas (4 active, 2 someday).
3. Six tags: Computer 💻, Errands 🏃, Calls 📞, Home 🏠, Waiting For ⏳, Deep Focus 🎯.
4. ~18 tasks distributed across projects and inbox, with various due dates, tags, and states.
5. One user with username/password for login.

This matches the prototype's sample data for visual consistency.

## pg-boss

pg-boss creates its own tables automatically in a `pgboss` schema when initialized. Do not manually create these. Initialize pg-boss in `src/lib/notifications/scheduler.ts` with:

```typescript
import PgBoss from "pg-boss";

const boss = new PgBoss(process.env.DATABASE_URL!);
await boss.start();
```

pg-boss job names used:
- `reminder:send` — Fires a notification for a specific reminder.
- `reminder:check` — Recurring job that checks for due reminders every minute.

## Migration Strategy

Use Prisma Migrate for schema changes:

```bash
pnpm prisma migrate dev --name init    # First migration
pnpm prisma migrate dev --name <name>  # Subsequent changes
pnpm prisma migrate deploy             # Production
```

Never use `db push` in production. Use it only in local development for rapid iteration.
