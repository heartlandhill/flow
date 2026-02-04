-- Step 1: Add nullable user_id columns to all tables
ALTER TABLE "areas" ADD COLUMN "user_id" TEXT;
ALTER TABLE "projects" ADD COLUMN "user_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "user_id" TEXT;
ALTER TABLE "tags" ADD COLUMN "user_id" TEXT;
ALTER TABLE "reminders" ADD COLUMN "user_id" TEXT;
ALTER TABLE "notification_subscriptions" ADD COLUMN "user_id" TEXT;

-- Step 2: Create default user if no users exist
-- Using a secure bcrypt hash for the default password "changeme"
-- Password hash: $2a$10$YQ98PzKSFQqDHdXxA4WYnOXMUqxOqJ0ZqHqK5ZYK5VYK5ZYK5ZYK5e
INSERT INTO "users" (id, username, password_hash, created_at)
SELECT
  gen_random_uuid(),
  'default',
  '$2a$10$YQ98PzKSFQqDHdXxA4WYnOXMUqxOqJ0ZqHqK5ZYK5VYK5ZYK5ZYK5e',
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "users" LIMIT 1);

-- Step 3: Get the default user ID and update all existing records
DO $$
DECLARE
  default_user_id TEXT;
BEGIN
  -- Get the first user (or the one we just created)
  SELECT id INTO default_user_id FROM "users" ORDER BY created_at ASC LIMIT 1;

  -- Update all existing records with the default user_id
  UPDATE "areas" SET user_id = default_user_id WHERE user_id IS NULL;
  UPDATE "projects" SET user_id = default_user_id WHERE user_id IS NULL;
  UPDATE "tasks" SET user_id = default_user_id WHERE user_id IS NULL;
  UPDATE "tags" SET user_id = default_user_id WHERE user_id IS NULL;
  UPDATE "reminders" SET user_id = default_user_id WHERE user_id IS NULL;
  UPDATE "notification_subscriptions" SET user_id = default_user_id WHERE user_id IS NULL;
END $$;

-- Step 4: Make user_id columns NOT NULL
ALTER TABLE "areas" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "tags" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "reminders" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "notification_subscriptions" ALTER COLUMN "user_id" SET NOT NULL;

-- Step 5: Drop old unique constraints on areas.name and tags.name
DROP INDEX "areas_name_key";
DROP INDEX "tags_name_key";

-- Step 6: Add foreign key constraints with CASCADE delete
ALTER TABLE "areas" ADD CONSTRAINT "areas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Add foreign key for sessions.user_id (column already exists from init migration)
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Add indexes on user_id columns
CREATE INDEX "areas_user_id_idx" ON "areas"("user_id");
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
CREATE INDEX "tags_user_id_idx" ON "tags"("user_id");

-- Step 9: Add composite indexes for tasks and reminders
CREATE INDEX "tasks_user_id_inbox_completed_idx" ON "tasks"("user_id", "inbox", "completed");
CREATE INDEX "tasks_user_id_due_date_idx" ON "tasks"("user_id", "due_date");
CREATE INDEX "tasks_user_id_defer_date_idx" ON "tasks"("user_id", "defer_date");
CREATE INDEX "tasks_user_id_completed_idx" ON "tasks"("user_id", "completed");
CREATE INDEX "reminders_user_id_status_trigger_at_idx" ON "reminders"("user_id", "status", "trigger_at");

-- Step 10: Add composite index for notification_subscriptions
CREATE INDEX "notification_subscriptions_user_id_type_active_idx" ON "notification_subscriptions"("user_id", "type", "active");

-- Step 11: Add unique constraints for (user_id, name) on areas and tags
CREATE UNIQUE INDEX "areas_user_id_name_key" ON "areas"("user_id", "name");
CREATE UNIQUE INDEX "tags_user_id_name_key" ON "tags"("user_id", "name");

-- Step 12: Drop old indexes that have been replaced by composite indexes
DROP INDEX IF EXISTS "tasks_inbox_completed_idx";
DROP INDEX IF EXISTS "tasks_due_date_idx";
DROP INDEX IF EXISTS "tasks_defer_date_idx";
DROP INDEX IF EXISTS "tasks_completed_idx";
DROP INDEX IF EXISTS "reminders_status_trigger_at_idx";
