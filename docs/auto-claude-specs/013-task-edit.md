# Spec 013: Task Edit Mode

## Batch
4 (Task Detail) — Run after Spec 012 is merged.

## Description
Add editing capability to the task detail panel. Clicking "Edit" switches from display mode to edit mode with form inputs. Supports changing all task fields including project assignment, which is how tasks get clarified out of the inbox.

## What to do

1. **Edit mode toggle** in TaskDetailContent:
   - "Edit" button (from Spec 012) toggles between display and edit modes.
   - Edit mode: all display fields become form inputs.
   - Cancel button: reverts to display mode without saving.
   - Save button: applies changes and returns to display mode.

2. **Form fields in edit mode**:
   - **Title**: Text input, 16px DM Sans. Pre-filled with current value. Full width.
   - **Project**: Select dropdown.
     - Options grouped by area: `<optgroup label="Work">`, `<optgroup label="Personal">`, etc.
     - First option: "No project" (sets project_id to null).
     - List all active and someday projects.
     - Styled with `var(--bg-surface)` background.
   - **Due date**: `<input type="date">`. Pre-filled. Clearable (add a small X button to remove the date).
   - **Defer date**: Same as due date.
   - **Tags**: Multi-select.
     - Show all available tags as toggle pills. Tapping a pill toggles it on/off.
     - Active: accent border + tint. Inactive: `var(--bg-surface)` + border.
     - Each pill: emoji + name.
   - **Notes**: `<textarea>`, 4 rows minimum, auto-grows. `var(--bg-surface)` background.

3. **Action buttons** (bottom of edit mode):
   - "Cancel" (secondary, left): `var(--bg-surface)` background.
   - "Save" (primary, right): accent background, dark text.
   - Mobile: full-width stacked (Save on top).
   - Desktop: side by side, right-aligned.

4. **Create/update server actions** in `src/actions/tasks.ts`:

   **`updateTask(id: string, data: UpdateTaskInput)`**:
   - Updates the task fields that changed.
   - If `project_id` is set and the task had `inbox = true`, automatically set `inbox = false`.
   - Revalidates relevant paths.

   **`clarifyTask(id: string, data: ClarifyInput)`**:
   - Sets `inbox = false`.
   - Updates project_id, tags, due_date, defer_date.
   - For tags: deletes all existing TaskTag records, creates new ones for the provided tag IDs.
   - Revalidates `/inbox` and other paths.

   Use `setTaskTags(taskId, tagIds)` from `src/actions/tags.ts` (created in Spec 010) or implement inline.

5. **Delete task**:
   - Small "Delete" text button at the very bottom of edit mode, in `#E88B8B` (red).
   - Tapping shows a confirmation: "Delete this task?" with Cancel / Delete buttons.
   - Calls `deleteTask(id)` server action and closes the detail panel.

6. **`deleteTask`** server action in `src/actions/tasks.ts`:
   - Permanently deletes the task (cascades to task_tags, reminders).
   - Revalidates all view paths.

## Files to modify
- Task detail content component (from Spec 012)
- `src/actions/tasks.ts` (add updateTask, clarifyTask, deleteTask)
- `src/actions/tags.ts` (add setTaskTags if not done in Spec 010)

## Dependencies
- Spec 012 (Task Detail Panel) must be merged first.
- Tag data and project data queries for the dropdowns.

## Acceptance criteria
- [ ] Clicking "Edit" switches to edit mode with form inputs pre-filled.
- [ ] Title can be edited and saved.
- [ ] Project can be changed via dropdown (grouped by area).
- [ ] Setting "No project" clears the project assignment.
- [ ] Assigning a project to an inbox task automatically removes it from inbox.
- [ ] Due date and defer date can be set, changed, and cleared.
- [ ] Tags can be toggled on/off with visual feedback (accent border).
- [ ] Notes can be edited in a textarea.
- [ ] "Save" persists all changes and returns to display mode.
- [ ] "Cancel" discards all changes and returns to display mode.
- [ ] Delete task shows confirmation, then removes the task and closes the panel.
- [ ] The view behind the detail panel refreshes to reflect changes.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §4.2 Task Detail (editing section)
- API.md → updateTask, clarifyTask, deleteTask, setTaskTags
- UI-REFERENCE.md → Component patterns, Color Tokens
