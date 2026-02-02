# Spec 006: Today View

## Batch
2 (Layout & Core Views) — Run after Batch 1. Can run in parallel with Specs 004, 005, 007.

## Description
Build the Today view showing tasks due today and deferred tasks that are now available. Reuses TaskRow and Checkbox from Spec 005.

## What to do

1. **Create `src/app/(views)/today/page.tsx`** (server component):
   - Query tasks where `completed = false` AND (`due_date = today` OR `defer_date <= today`).
   - Full query from API.md:
     ```typescript
     const today = new Date(); // Date only, no time
     today.setHours(0, 0, 0, 0);

     prisma.task.findMany({
       where: {
         completed: false,
         OR: [
           { due_date: today },
           { defer_date: { lte: today } }
         ]
       },
       orderBy: [{ project_id: "asc" }, { sort_order: "asc" }],
       include: { tags: { include: { tag: true } }, project: { include: { area: true } } }
     })
     ```
   - Note: `due_date` and `defer_date` are `@db.Date` fields (date only, no time component). Compare accordingly.

2. **View header**:
   - "Today" in Newsreader 26px/28px.
   - Subtitle: formatted date — e.g., "Sunday, Feb 1" — in DM Sans 13px, `var(--text-secondary)`. Margin-bottom 20px.

3. **Task list**: Render TaskRow for each task. Wrap in a client component for completion handling.

4. **Empty state**: "Nothing due today — enjoy the calm" with a subtle icon.

5. **Create `src/lib/utils.ts`** (if not exists) with date helpers:
   - `formatDate(date: Date): string` — Returns "Sunday, Feb 1" format.
   - `getDueDateLabel(date: Date | null): { label: string; variant: "overdue" | "today" | "tomorrow" | "future" } | null` — Returns the human label ("Overdue", "Today", "Tomorrow", "Feb 5") and color variant.
   - `isToday(date: Date): boolean`
   - `isTomorrow(date: Date): boolean`
   - `isPast(date: Date): boolean`

## Files to create
- `src/app/(views)/today/page.tsx` (replace placeholder)
- `src/lib/utils.ts` (or add to existing)

## Dependencies
- Requires TaskRow and Checkbox from Spec 005 (or if running in parallel, create local stubs and integrate after merge).

## Acceptance criteria
- [ ] Shows tasks due today (where `due_date` matches today's date).
- [ ] Shows deferred tasks where `defer_date <= today`.
- [ ] Does not show completed tasks.
- [ ] Header shows "Today" with the formatted current date below.
- [ ] Task completion animation works (reuses Spec 005 components).
- [ ] Empty state displays when no tasks match.
- [ ] Date formatting utilities are exported and reusable.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §3.2 Today
- API.md → Today View query
- UI-REFERENCE.md → Typography (view title, subtitle)
- SCHEMA.md → Task model (due_date, defer_date are @db.Date)
