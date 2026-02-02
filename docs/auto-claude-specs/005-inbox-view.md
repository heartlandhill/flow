# Spec 005: Inbox View

## Batch
2 (Layout & Core Views) — Run after Batch 1. Can run in parallel with Specs 004, 006, 007.

## Description
Build the Inbox view — the GTD capture bucket. Displays all unclarified tasks, supports completion via animated checkboxes. Also creates the reusable TaskRow and Checkbox components used by every other view.

## What to do

1. **Create `src/components/ui/Checkbox.tsx`** (client component):
   - Circle checkbox. Mobile: 24px, 2px border. Desktop: 20px, 1.8px border.
   - Default state: `var(--text-tertiary)` border, transparent fill.
   - Hover (desktop only): accent border, `rgba(232,168,124,0.1)` fill.
   - Props: `checked: boolean`, `onCheck: () => void`, `className?: string`.
   - Use `<button>` element for accessibility with `role="checkbox"` and `aria-checked`.
   - When clicked, trigger the parent's completion handler (animation is in TaskRow).

2. **Create `src/components/tasks/TaskRow.tsx`** (client component):
   - Flex row: Checkbox + content area + optional notes icon.
   - **Content area**:
     - Line 1: task title (`var(--text-primary)`, 15px mobile / 14px desktop, DM Sans 400).
     - Line 2 (meta): project label (colored pill, 12px) + tag emojis (mobile: emoji only, desktop: emoji + name at 11px) + due date badge (inline).
     - If task has no project/tags/due date, line 2 is omitted.
   - **Due date badge** colors per UI-REFERENCE.md:
     - Overdue: `#E88B8B` text, `rgba(232,139,139,0.14)` bg.
     - Today: `#F2D06B` text, `rgba(242,208,107,0.12)` bg.
     - Tomorrow: `#E8A87C` text, `rgba(232,168,124,0.12)` bg.
     - Future: `var(--text-secondary)` text, `var(--bg-surface)` bg.
   - **Notes icon**: Small NoteIcon in `var(--text-tertiary)` on the far right if `task.notes` exists.
   - **Completion animation**: When checkbox is clicked:
     1. Checkbox fills with accent + checkmark, scales to 1.1x (200ms).
     2. Entire row fades to 30% opacity and scales to 97% (400ms ease).
     3. After 500ms total, call the `onComplete` server action.
   - Props: `task: TaskWithRelations`, `onComplete: (id: string) => void`, `onSelect: (id: string) => void`.
   - Clicking the row (not checkbox) calls `onSelect`.
   - Padding: 14px 12px mobile, 10px 12px desktop. Border-radius: 6px.

3. **Create `src/actions/tasks.ts`** with initial server actions:

   **`createTask(title: string)`**:
   - Creates task with `inbox: true`, all other fields default.
   - Revalidates `/inbox`.
   - Returns `{ success: true, data: task }`.

   **`completeTask(id: string)`**:
   - Sets `completed = true`, `completed_at = now()`.
   - Revalidates `/inbox`, `/today`, `/forecast`, `/projects`.
   - Returns `{ success: true }`.

4. **Create `src/app/(views)/inbox/page.tsx`** (server component):
   - Query: `prisma.task.findMany({ where: { inbox: true, completed: false }, orderBy: { created_at: "desc" }, include: { tags: { include: { tag: true } }, project: { include: { area: true } } } })`.
   - **Header**: "Inbox" in Newsreader 26px/28px, with count in parentheses.
   - **Task list**: Map over tasks, render TaskRow for each.
   - **Empty state**: When no tasks, show centered content: ✨ emoji (48px) + "Inbox zero — everything is processed" (Newsreader, `var(--text-secondary)`).
   - The task list is wrapped in a client component that handles completion state transitions (optimistic removal after animation).

5. **Create `src/types/index.ts`** with the shared types (if not already complete from Spec 001):
   ```typescript
   import type { Task, Project, Area, Tag, TaskTag, Reminder } from "@prisma/client";

   export type TaskWithRelations = Task & {
     tags: (TaskTag & { tag: Tag })[];
     project: (Project & { area: Area }) | null;
   };

   export type ProjectWithTasks = Project & {
     area: Area;
     tasks: TaskWithRelations[];
   };

   export type AreaWithProjects = Area & {
     projects: ProjectWithTasks[];
   };
   ```

## Files to create
- `src/components/ui/Checkbox.tsx`
- `src/components/tasks/TaskRow.tsx`
- `src/app/(views)/inbox/page.tsx` (replace placeholder)
- `src/actions/tasks.ts`
- `src/types/index.ts` (update if exists)

## Acceptance criteria
- [ ] Inbox shows only tasks where `inbox = true AND completed = false`.
- [ ] Tasks are ordered by created_at descending.
- [ ] Each TaskRow shows title, project label (colored by area), tag emojis, due date badge, notes icon.
- [ ] Due date badge is color-coded correctly (overdue=red, today=yellow, tomorrow=amber, future=gray).
- [ ] Clicking the checkbox triggers the completion animation (fill → fade → remove).
- [ ] After animation completes, the task is marked complete in the database.
- [ ] When all tasks are completed, the empty state displays.
- [ ] "Inbox" heading shows with the correct font and task count.
- [ ] TaskRow and Checkbox are exported and reusable by other views.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §3.1 Inbox, §4.5 Task Completion Animation
- API.md → Tasks server actions, Inbox view query
- UI-REFERENCE.md → Checkbox, TaskRow, Due Date Colors, Typography
- SCHEMA.md → Task model with relations
