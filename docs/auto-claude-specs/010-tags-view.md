# Spec 010: Tags View

## Batch
3 (Remaining Views) — Run after Batch 2. Can run in parallel with Specs 008, 009, 011.

## Description
Build the Tags view — context-based task filtering. Shows a grid of tag cards, and tapping one filters the task list below to show only tasks with that tag. This is how GTD context switching works: you're at your computer, tap @computer, see everything you can do there.

## What to do

1. **Create `src/app/(views)/tags/page.tsx`** (server component):
   - Query all tags with their incomplete task counts:
     ```typescript
     const tags = await prisma.tag.findMany({
       orderBy: { sort_order: "asc" },
       include: {
         tasks: {
           where: { task: { completed: false } },
           include: {
             task: {
               include: {
                 project: { include: { area: true } },
                 tags: { include: { tag: true } }
               }
             }
           }
         }
       }
     });
     ```
   - Transform to: `{ id, name, icon, taskCount, tasks: TaskWithRelations[] }[]`.
   - Pass to client component for interactive filtering.

2. **Create tag card grid** (client component within the page or a separate component):
   - **Grid layout**: 2 columns on mobile (gap: 10px), 3 columns on desktop (gap: 12px).
   - **Each tag card**:
     - Background: `var(--bg-surface)`. Border: 1px solid `var(--border)`. Border-radius: 10px. Padding: 14px.
     - Content: emoji icon (18px) + tag name (DM Sans 14px, weight 400) + count badge (right side, pill shape, `var(--bg-hover)`, `var(--text-secondary)` 11px).
     - **Active state**: accent border (`var(--accent)`), subtle accent background tint (`rgba(232,168,124,0.06)`).
     - Click: toggles active state.
   - **Selection behavior**: Only one tag active at a time. Clicking the active tag deactivates it. Clicking a different tag switches to that one.

3. **Filtered task list** (below the grid):
   - When a tag is active: show all incomplete tasks with that tag.
   - Tasks ordered by due_date ascending (nulls last), then created_at descending.
   - Render using TaskRow.
   - Header above the list: "Tasks tagged [tag name]" in DM Sans 13px, `var(--text-secondary)`.
   - When no tag is active: show nothing (just the grid).
   - When active tag has no tasks: show "No tasks with this tag" message.

4. **View header**: "Tags" in Newsreader 26px/28px.

5. **Create server actions** in `src/actions/tags.ts`:
   - `createTag(data: { name: string; icon?: string })` — See API.md.
   - `setTaskTags(taskId: string, tagIds: string[])` — Replaces all tags on a task.
   - These won't be wired to UI in this spec but should exist.

## Files to create
- `src/app/(views)/tags/page.tsx` (replace placeholder)
- `src/actions/tags.ts`

## Dependencies
- TaskRow component from Spec 005.

## Acceptance criteria
- [ ] Tags displayed in a 2-column grid (mobile) / 3-column grid (desktop).
- [ ] Each card shows emoji icon, tag name, and incomplete task count.
- [ ] Tapping a tag activates it (accent border + tint) and shows filtered tasks below.
- [ ] Only one tag can be active at a time.
- [ ] Tapping the active tag deactivates it and hides the task list.
- [ ] Filtered tasks are ordered by due_date (nulls last), then created_at.
- [ ] Task completion works from the filtered list.
- [ ] Tags with 0 tasks still show in the grid (with "0" count).
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §3.5 Tags
- API.md → Tags View query, tag server actions
- UI-REFERENCE.md → Tag Cards
