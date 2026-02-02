# Spec 002: Database Migration & Seed

## Batch
1 (Foundation) — Run after Spec 001 is merged.

## Description
Create the initial Prisma migration from the schema defined in Spec 001, then write a seed script that populates the database with sample data matching the UI prototype. The seed data is critical for visual development — every view needs realistic data to build against.

## What to do

1. **Run the initial migration**:
   ```bash
   pnpm prisma migrate dev --name init
   ```
   This generates the migration SQL in `prisma/migrations/`.

2. **Create the seed script** at `prisma/seed.ts`:

   **Areas** (3):
   | Name | Color |
   |------|-------|
   | Work | #E8A87C |
   | Personal | #85B7D5 |
   | Health | #9ED4A0 |

   **Tags** (6):
   | Name | Icon |
   |------|------|
   | Computer | 💻 |
   | Errands | 🏃 |
   | Calls | 📞 |
   | Home | 🏠 |
   | Waiting For | ⏳ |
   | Deep Focus | 🎯 |

   **Projects** (6):
   | Name | Area | Status | Type |
   |------|------|--------|------|
   | GTD App Development | Work | ACTIVE | SEQUENTIAL |
   | Q1 Marketing Plan | Work | ACTIVE | PARALLEL |
   | Apartment Renovation | Personal | ACTIVE | PARALLEL |
   | Learn Japanese | Personal | SOMEDAY | PARALLEL |
   | Marathon Training | Health | ACTIVE | SEQUENTIAL |
   | Meditation Habit | Health | SOMEDAY | PARALLEL |

   Set `review_interval_days = 7` and `next_review_date = today` for active projects.

   **Tasks** (~18, distributed):
   - 4 inbox tasks (no project, `inbox = true`):
     - "Research best practices for database indexing" (tag: Computer)
     - "Buy new running shoes" (tag: Errands)
     - "Call dentist to schedule cleaning" (tag: Calls)
     - "Read article on GTD weekly reviews"
   - 3 tasks in GTD App Development (due dates near today):
     - "Define database schema for tasks and projects" (due: today, tag: Computer, Deep Focus)
     - "Design the inbox view wireframe" (due: tomorrow)
     - "Set up CI/CD pipeline" (due: in 3 days, tag: Computer)
   - 3 tasks in Q1 Marketing Plan:
     - "Draft social media calendar" (due: in 2 days, tag: Computer)
     - "Review competitor analysis" (tag: Deep Focus)
     - "Schedule team brainstorm" (tag: Calls, due: in 5 days)
   - 3 tasks in Apartment Renovation:
     - "Get quotes from contractors" (tag: Calls, Errands)
     - "Pick paint colors for bedroom" (tag: Home, due: in 4 days)
     - "Order kitchen cabinet hardware" (tag: Computer, Errands)
   - 3 tasks in Marathon Training:
     - "Complete 10K training run" (due: today, tag: none)
     - "Book sports massage appointment" (tag: Calls, due: in 6 days)
     - "Research nutrition plans" (tag: Computer)
   - 2 completed tasks (for progress bar display):
     - "Set up project repository" in GTD App Dev (completed)
     - "5K baseline run" in Marathon Training (completed)

   **User** (1):
   - username: `admin`
   - password: `flow-admin-2026` (bcrypt hashed with cost factor 12)

3. **Make seed idempotent**: Use `upsert` operations or delete-then-create within a transaction. Running `pnpm db:seed` twice should not create duplicates.

4. **Configure Prisma seed** in `package.json`:
   ```json
   "prisma": {
     "seed": "tsx prisma/seed.ts"
   }
   ```
   Install `tsx` as a dev dependency: `pnpm add -D tsx`.

## Files to create
- `prisma/seed.ts`
- `prisma/migrations/<timestamp>_init/migration.sql` (auto-generated)
- (Modify `package.json` for prisma.seed config)

## Acceptance criteria
- [ ] `pnpm db:migrate` runs cleanly on a fresh Postgres database.
- [ ] `pnpm db:seed` completes without errors.
- [ ] `pnpm db:studio` shows all tables populated with correct data.
- [ ] 3 areas with correct colors.
- [ ] 6 tags with correct emojis.
- [ ] 6 projects with correct area assignments and statuses.
- [ ] ~18 tasks with correct project assignments, tags, due dates, and inbox flags.
- [ ] 2 tasks have `completed = true`.
- [ ] 1 user exists with correct credentials (password verifiable with bcrypt.compare).
- [ ] Running `pnpm db:seed` a second time does not create duplicates.

## References
- SCHEMA.md → Seed Data section, full Prisma schema
- UI-REFERENCE.md → Area Colors (for verifying seed color values)
- ENV.md → DATABASE_URL configuration
