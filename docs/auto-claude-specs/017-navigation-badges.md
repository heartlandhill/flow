# Spec 017: Navigation Badges

## Batch
6 (Polish) — Run after all previous batches.

## Description
Wire live data to the navigation badge counts in the sidebar and bottom tab bar. Badges should show accurate, real-time counts for Inbox, Today, and Review, updating after every mutation.

## What to do

1. **Create a data-fetching layer for badge counts**:
   - Create `src/lib/queries/badge-counts.ts`:
     ```typescript
     export async function getBadgeCounts() {
       const today = new Date();
       today.setHours(0, 0, 0, 0);

       const [inboxCount, todayCount, reviewCount] = await Promise.all([
         prisma.task.count({ where: { inbox: true, completed: false } }),
         prisma.task.count({
           where: {
             completed: false,
             OR: [
               { due_date: today },
               { defer_date: { lte: today } }
             ]
           }
         }),
         prisma.project.count({
           where: {
             status: "ACTIVE",
             review_interval_days: { not: null },
             OR: [
               { next_review_date: null },
               { next_review_date: { lte: today } }
             ]
           }
         }),
       ]);

       return { inbox: inboxCount, today: todayCount, review: reviewCount };
     }
     ```

2. **Pass badge counts through the layout**:
   - In `src/app/layout.tsx` (server component), call `getBadgeCounts()`.
   - Pass the counts as props to Sidebar and BottomNav.
   - This means badge counts refresh on every page navigation.

3. **Update Sidebar** to use real counts:
   - Replace hardcoded badge values with the props.
   - Show badge only when count > 0.

4. **Update BottomNav** to use real counts:
   - Same: replace hardcoded values.
   - Badge on Inbox and Today items.

5. **Ensure revalidation covers badges**:
   - Every server action that changes task or project state should call `revalidatePath("/", "layout")` or revalidate the layout.
   - This ensures the layout re-renders with fresh badge counts after mutations.
   - Verify that `createTask`, `completeTask`, `clarifyTask`, `updateTask`, `deleteTask`, and `markProjectReviewed` all trigger a layout revalidation.

## Files to create
- `src/lib/queries/badge-counts.ts`

## Files to modify
- `src/app/layout.tsx` (fetch and pass badge counts)
- `src/components/layout/Sidebar.tsx` (accept count props)
- `src/components/layout/BottomNav.tsx` (accept count props)
- Various server actions (ensure they revalidate the layout)

## Dependencies
- Layout shell from Spec 004.
- All server actions from Specs 005, 009, 011, 013.

## Acceptance criteria
- [ ] Inbox badge shows accurate count of inbox tasks.
- [ ] Today badge shows accurate count of tasks due today + available deferred tasks.
- [ ] Review badge shows count of projects needing review (due or never reviewed).
- [ ] Badges show only when count > 0.
- [ ] Creating a task via Quick Capture increments the Inbox badge.
- [ ] Completing a task decrements the relevant badge(s).
- [ ] Clarifying a task (moving out of inbox) decrements Inbox badge.
- [ ] Marking a project reviewed updates the Review badge.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §4.3 Navigation (badge descriptions)
- UI-REFERENCE.md → Navigation (badge styling)
- API.md → Badge count queries
