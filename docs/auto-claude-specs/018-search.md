# Spec 018: Search

## Batch
6 (Polish) — Run after all previous batches. Can run in parallel with Spec 017.

## Description
Implement client-side search filtering in the desktop top bar. Typing in the search input filters the current view's tasks by title substring match. Simple, fast, no server round-trip.

## What to do

1. **Create search state management**:
   - Add a search context or use URL search params.
   - Recommended: `SearchContext` with `query` string and `setQuery` function.
   - Wrap the layout children in this context provider.

2. **Wire the TopBar search input**:
   - The search input in `src/components/layout/TopBar.tsx` is already rendered (from Spec 004).
   - Make it functional: on input change, update the search context.
   - Add a clear button (X) that appears when there's text.
   - Clear the search when navigating between views.

3. **Filter tasks in each view**:
   - In views that display tasks (Inbox, Today, Forecast, Projects, Tags), consume the search context.
   - Filter the task list client-side: `tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))`.
   - This means the task list components need to be client components (most already are for interactivity).
   - When search is active, show a "Showing results for '{query}'" indicator below the view header.
   - When search matches nothing, show "No tasks matching '{query}'".

4. **Clear on navigation**:
   - Use `usePathname()` to detect route changes.
   - Clear the search query when the path changes.

5. **Mobile**: Search is not in the bottom bar. Add a search icon in the mobile header that expands into a search input (overlays the header). Or skip mobile search for SLC and note it as a future enhancement.

## Files to create
- Search context provider (e.g., `src/components/SearchProvider.tsx`)

## Files to modify
- `src/app/layout.tsx` (wrap in SearchProvider)
- `src/components/layout/TopBar.tsx` (wire search input)
- All view pages that display tasks (add filter logic)

## Dependencies
- TopBar from Spec 004.
- All view pages from Batches 2-3.

## Acceptance criteria
- [ ] Typing in the search input filters tasks in the current view.
- [ ] Search is case-insensitive substring match on task title.
- [ ] Clearing the search shows all tasks again.
- [ ] Navigating to a different view clears the search.
- [ ] "No results" message when search matches nothing.
- [ ] Search works on Inbox, Today, Forecast, Projects (within project cards), and Tags (within filtered list).
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §4.4 Search
- UI-REFERENCE.md → TopBar component
