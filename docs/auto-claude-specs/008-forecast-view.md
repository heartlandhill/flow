# Spec 008: Forecast View

## Batch
3 (Remaining Views) — Run after Batch 2. Can run in parallel with Specs 009-011.

## Description
Build the Forecast view — a 14-day lookahead showing upcoming due dates. Features a horizontally scrollable date strip on mobile (grid on desktop) with colored dots indicating tasks per day, and a vertical grouped task list below.

## What to do

1. **Create `src/app/(views)/forecast/page.tsx`** (server component):
   - Generate an array of the next 14 dates starting from today.
   - Query tasks:
     ```typescript
     prisma.task.findMany({
       where: {
         completed: false,
         due_date: { gte: today, lte: fourteenDaysFromNow }
       },
       orderBy: { due_date: "asc" },
       include: { project: { include: { area: true } }, tags: { include: { tag: true } } }
     })
     ```
   - Group tasks by date for the list below the strip.
   - Pass date array and grouped tasks to client components.

2. **Create `src/components/forecast/ForecastStrip.tsx`** (client component):
   - **Mobile**: Horizontally scrollable container (`overflow-x: auto`, `scrollbar-width: none`). Each date cell is 60px wide, `var(--bg-surface)`, border-radius 10px, with 8px gap between cells.
   - **Desktop** (md+): CSS grid with 7 columns. Cells expand to fill. Two rows for 14 days.
   - **Date cell contents**:
     - Day name: 10px uppercase, `var(--text-tertiary)`. E.g., "SUN".
     - Day number: 18px, `var(--text-primary)`. E.g., "1".
     - Colored dots row: up to 3 small dots (6px) representing tasks. Dot color = task's project area color (gray `#555` if no project). More than 3 tasks: show 3 dots.
   - **Today's cell**: 2px accent border, subtle accent background tint (`rgba(232,168,124,0.08)`).
   - **Cells with no tasks**: No dots, slightly dimmer text.

3. **Create `src/components/forecast/ForecastDayGroup.tsx`** (component):
   - Renders a day group in the list below the strip.
   - **Day header**: Formatted date (e.g., "Saturday, Feb 1") in Newsreader 16px, weight 500. Right: task count.
   - **Task list**: TaskRows for each task due that day.
   - Only days with tasks are shown in the list (empty days are skipped).

4. **View header**: "Forecast" in Newsreader 26px/28px. Subtitle: "Next 14 days" in 13px `var(--text-secondary)`.

5. **Add date formatting helper** to `src/lib/utils.ts` (add to existing):
   - `getDayName(date: Date): string` — "SUN", "MON", etc.
   - `getDateRange(days: number): Date[]` — Array of dates from today to N days ahead.

## Files to create
- `src/app/(views)/forecast/page.tsx` (replace placeholder)
- `src/components/forecast/ForecastStrip.tsx`
- `src/components/forecast/ForecastDayGroup.tsx`

## Files to modify
- `src/lib/utils.ts` (add date helpers)

## Dependencies
- TaskRow component from Spec 005.

## Acceptance criteria
- [ ] Shows the next 14 days in the date strip.
- [ ] Today's cell has an accent border and tint.
- [ ] Colored dots appear on cells with due tasks (color matches project area).
- [ ] Mobile: strip scrolls horizontally.
- [ ] Desktop: strip is a 7-column grid.
- [ ] Below the strip, tasks are grouped by day with day headers.
- [ ] Days with no tasks appear in the strip but not in the list.
- [ ] Task completion works from this view.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §3.3 Forecast
- API.md → Forecast View query
- UI-REFERENCE.md → Forecast Strip, Color Tokens (Area Colors)
