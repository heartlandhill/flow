# Spec 012: Task Detail Panel

## Batch
4 (Task Detail) — Run after Batch 3. Must complete before Spec 013.

## Description
Build the task detail view that appears when a user clicks a task row. On mobile, it's a draggable bottom sheet. On desktop, it's a slide-in side panel. Displays all task fields in a read-only format.

## What to do

1. **Create `src/components/ui/Sheet.tsx`** (client component):
   - Reusable bottom sheet primitive.
   - Props: `isOpen: boolean`, `onClose: () => void`, `children: ReactNode`.
   - **Overlay**: Fixed full-screen, `rgba(0,0,0,0.5)`. Click to close. Fade in 150ms.
   - **Sheet**: Fixed to bottom. Top-left and top-right radius: 16px. Background: `var(--bg-card)`. Max height: 85vh. Overflow-y: auto.
   - **Drag handle**: 36px wide, 4px tall, centered at top with 12px padding. Background: `var(--text-tertiary)` at 40% opacity. Border-radius: 2px.
   - **Animation**: Slide up from bottom (translateY 100% → 0, 250ms ease). On close: reverse.
   - **Body scroll lock**: Prevent background scrolling when sheet is open.

2. **Create `src/components/tasks/TaskDetailSheet.tsx`** (client component, mobile):
   - Uses Sheet primitive.
   - Visible only below `md` breakpoint.
   - Renders TaskDetailContent inside the sheet.

3. **Create `src/components/tasks/TaskDetail.tsx`** (client component, desktop):
   - Fixed side panel, 340px wide, slides in from right.
   - Background: `var(--bg-sidebar)`. Left border: 1px solid `var(--border)`.
   - Close button (X icon) in top-right corner.
   - Animation: opacity 0→1, translateX 12px→0, 200ms ease.
   - Visible only at `md`+ breakpoint.
   - Renders TaskDetailContent inside the panel.

4. **Create TaskDetailContent** (shared between sheet and panel):
   - **Title**: Newsreader 20px, weight 500, `var(--text-primary)`.
   - **Project label**: Colored pill (area color background at 15% opacity, area color text). "No project" in `var(--text-tertiary)` if none.
   - **Due date**: Inline with icon. Color-coded (overdue/today/tomorrow/future). "No due date" if none.
   - **Defer date**: Same styling as due date. Label: "Deferred until [date]". Hidden if none.
   - **Tags**: Row of tag pills. Each: emoji + name, `var(--bg-surface)` background, `var(--border)` border. "No tags" if none.
   - **Notes**: If present, rendered in a card with `var(--bg-surface)` background, 10px radius, 14px padding. Text in `var(--text-secondary)` 14px. If no notes, section is omitted entirely.
   - **Edit button**: In the header area. Accent-colored text button "Edit". (Functionality wired in Spec 013.)
   - All sections have 16px vertical spacing between them.

5. **Wire task selection from all views**:
   - Add a shared context or state mechanism for "selected task."
   - Options: URL search param (`?task=<id>`), or a React context provider.
   - Recommended: React context (`SelectedTaskContext`) in the root layout.
   - When a TaskRow is clicked (not the checkbox), set the selected task ID.
   - The detail panel/sheet reads from context and fetches the full task.
   - For server components: the detail content can fetch the task server-side via a separate data fetch, or the task data can be passed from the parent view.
   - Simplest approach: pass the full task data from TaskRow to the context, avoiding an extra fetch.

6. **Closing behavior**:
   - Mobile: tap overlay, tap close button, or swipe down.
   - Desktop: tap close button, press Escape.
   - Closing clears the selected task context.

## Files to create
- `src/components/ui/Sheet.tsx`
- `src/components/tasks/TaskDetailSheet.tsx`
- `src/components/tasks/TaskDetail.tsx`

## Files to modify
- `src/components/tasks/TaskRow.tsx` (add onSelect handler that opens detail)
- `src/app/layout.tsx` (add SelectedTaskContext provider, render detail panel/sheet)

## Dependencies
- TaskRow from Spec 005 (already exists).
- All view pages from Batch 2-3 (task detail should work from any view).

## Acceptance criteria
- [ ] Clicking a task row on any view opens the detail panel.
- [ ] Mobile (below 768px): bottom sheet slides up with drag handle.
- [ ] Desktop (768px+): side panel slides in from right (340px).
- [ ] Detail shows: title (Newsreader), project (colored), due date (color-coded), defer date, tags, notes.
- [ ] Missing fields are handled gracefully (no empty sections for null values).
- [ ] Notes display in a subtle card only when present.
- [ ] Pressing Escape or clicking outside/close button dismisses the detail.
- [ ] Bottom sheet prevents background scrolling.
- [ ] Animations are smooth (sheet: 250ms slide, panel: 200ms slide+fade).
- [ ] Edit button is visible (non-functional until Spec 013).
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §4.2 Task Detail
- UI-REFERENCE.md → Bottom Sheet, Side Panel, Due Date Colors
