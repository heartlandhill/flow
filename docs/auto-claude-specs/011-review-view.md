# Spec 011: Review View

## Batch
3 (Remaining Views) — Run after Batch 2. Can run in parallel with Specs 008-010.

## Description
Build the weekly Review view — the most distinctive GTD feature. Steps through each active project one at a time, showing stats, next actions, and prompting questions. This is how users maintain their trusted system.

## What to do

1. **Create `src/app/(views)/review/page.tsx`** (server component):
   - Query reviewable projects:
     ```typescript
     const projects = await prisma.project.findMany({
       where: {
         status: "ACTIVE",
         review_interval_days: { not: null }
       },
       orderBy: { next_review_date: "asc" },
       include: {
         area: true,
         tasks: {
           orderBy: { sort_order: "asc" },
           include: { tags: { include: { tag: true } } }
         }
       }
     });
     ```
   - Calculate per-project: total tasks, completed tasks, incomplete tasks, completion percentage.
   - Pass to a client component that manages the step-through state.

2. **Create `src/components/review/ReviewCard.tsx`** (client component):
   - This component manages the current project index and renders one project at a time.
   - **Progress indicator** (top): "2 of 4" in DM Sans 13px, `var(--text-secondary)`.
   - **Area badge**: Small pill, area color background with dark text, area name, border-radius 50%.
   - **Project name**: Newsreader 22px, weight 500, margin-top 8px.
   - **Stats row**: Two stat blocks side by side.
     - "Remaining" stat: large number (20-22px, DM Sans 600) + "REMAINING" label (10px uppercase, tracking 0.8px, `var(--text-tertiary)`).
     - "Complete" stat: percentage (20-22px, DM Sans 600) + "COMPLETE" label.
   - **Progress bar**: 4px tall. Track: `var(--bg-hover)`. Fill: area color. Full width.
   - **Next Actions section**:
     - Header: "NEXT ACTIONS" (12px uppercase, DM Sans 500, tracking 0.8px).
     - List of TaskRows for incomplete tasks (show all, not limited to 3 like the projects view).
     - For sequential projects, still show all incomplete tasks here (review is a time to see the full picture).
   - **Prompting Questions section**:
     - Background: `var(--bg-surface)`. Padding: 14px. Border-radius: 8px.
     - Three questions, each as italic text with "→" prefix, in `var(--text-secondary)`:
       1. "Is this project still relevant?"
       2. "What's the next physical action?"
       3. "Is anything stuck or waiting?"
   - **Action buttons** (bottom):
     - Left: "Previous" (secondary: `var(--bg-surface)` bg, `var(--text-secondary)` text). Hidden on first project.
     - Right: "Mark Reviewed" (primary: accent bg, dark text). On last project, label changes to "Finish Review".
     - Mobile: buttons are full width, stacked vertically (primary on top).
     - Desktop: buttons side by side, right-aligned.

3. **Review flow behavior**:
   - "Mark Reviewed" calls `markProjectReviewed` server action, then advances the index.
   - "Previous" decrements the index (does NOT undo the review — the timestamp stays).
   - After the last project is reviewed, show the **completion state**:
     - ✅ emoji (48px) + "All projects reviewed — you're on top of things." (Newsreader, `var(--text-secondary)`).

4. **Create or update `src/actions/projects.ts`** — add `markProjectReviewed`:
   ```typescript
   export async function markProjectReviewed(id: string) {
     const project = await prisma.project.findUnique({ where: { id } });
     if (!project || !project.review_interval_days) {
       return { success: false, error: "Project not found or has no review interval" };
     }

     const nextReview = new Date();
     nextReview.setDate(nextReview.getDate() + project.review_interval_days);

     await prisma.project.update({
       where: { id },
       data: {
         last_reviewed_at: new Date(),
         next_review_date: nextReview,
       }
     });

     revalidatePath("/review");
     return { success: true };
   }
   ```

5. **Empty state** (when no projects need review):
   - "No projects to review right now" with a subtle icon.

6. **View header**: "Review" in Newsreader 26px/28px.

## Files to create
- `src/app/(views)/review/page.tsx` (replace placeholder)
- `src/components/review/ReviewCard.tsx`

## Files to modify
- `src/actions/projects.ts` (add `markProjectReviewed`)

## Dependencies
- TaskRow from Spec 005.
- `src/actions/projects.ts` from Spec 009 (or create fresh if running in parallel).

## Acceptance criteria
- [ ] Shows one project at a time, ordered by next_review_date ascending.
- [ ] Progress indicator shows "X of Y" correctly.
- [ ] Area badge displays with correct color.
- [ ] Stats show remaining count and completion percentage.
- [ ] Progress bar width reflects completion.
- [ ] All incomplete tasks are listed under "Next Actions."
- [ ] Three prompting questions display in a styled card.
- [ ] "Mark Reviewed" updates `last_reviewed_at` and `next_review_date` in the database.
- [ ] "Mark Reviewed" advances to the next project.
- [ ] "Previous" goes back without undoing the review.
- [ ] "Previous" is hidden on the first project.
- [ ] Last project shows "Finish Review" instead of "Mark Reviewed."
- [ ] After finishing, the completion state displays.
- [ ] Empty state shows when no projects need review.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §3.6 Review
- API.md → Review query, markProjectReviewed
- UI-REFERENCE.md → ReviewCard component pattern
