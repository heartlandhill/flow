# Spec 004: Responsive Layout Shell

## Batch
2 (Layout & Core Views) — Run after Batch 1 (Specs 001-003) is merged. Can run in parallel with Specs 005-007.

## Description
Build the root layout with all navigation chrome: desktop sidebar, mobile bottom tab bar, mobile header with hamburger menu, and desktop top bar. No view content — just the navigation skeleton that all views render inside. This is the visual backbone of the app.

## What to do

1. **Create SVG icon components** at `src/components/ui/Icons.tsx`:
   - Export named components for each icon: `InboxIcon`, `TodayIcon`, `ForecastIcon`, `ProjectsIcon`, `TagsIcon`, `ReviewIcon`, `PlusIcon`, `CheckIcon`, `ChevronIcon`, `CloseIcon`, `BackIcon`, `SearchIcon`, `MenuIcon`, `NoteIcon`.
   - All icons: stroke-based, 1.8px stroke width, round line caps and joins, `currentColor` for stroke.
   - Accept `size` prop (default 20) and `className`.

2. **Create `src/components/layout/Sidebar.tsx`** (desktop only, hidden below `md`):
   - Width: 240px. Background: `var(--bg-sidebar)`. Right border: 1px solid `var(--border)`.
   - **Brand section** (top): 28px rounded square mark (gradient from accent to darker copper) + "Flow" in Newsreader 18px weight 500.
   - **Nav items** (6): Inbox, Today, Forecast, Projects, Tags, Review. Each is a Next.js `<Link>`:
     - Icon (20px) + label (13.5px DM Sans) + optional count badge (right-aligned).
     - Padding: 8px 12px. Border-radius: 6px.
     - Default: `var(--text-secondary)` text.
     - Active (current route): `var(--bg-selected)` background, `var(--text-primary)` text, view accent color on icon.
     - Hover: `var(--bg-hover)` background.
   - **Badges**: Inbox and Today show count badges (right side). Badge: 18px min-width pill, accent background, 9px white text. Review shows a badge too.
   - **Quick Capture button** (bottom): Dashed border, "New Inbox Item" label, "⌘N" keyboard hint on right. Full width minus padding.
   - Use `usePathname()` from `next/navigation` to determine active route. This makes Sidebar a client component.

3. **Create `src/components/layout/BottomNav.tsx`** (mobile only, visible below `md`):
   - Fixed to bottom. Full width. Background: `var(--bg-sidebar)`. Top border.
   - Respects `safe-area-inset-bottom` (add padding).
   - 5 items: Inbox, Today, Forecast, Projects, Tags. (Review is in hamburger menu.)
   - Each: icon (20px) + label (10px) stacked vertically, centered.
   - Active: accent color on icon and label.
   - Inactive: `var(--text-tertiary)`.
   - Badges on Inbox and Today: 16px circle, accent bg, 9px white text, positioned top-right of icon.
   - Use `<Link>` components. Client component for `usePathname()`.

4. **Create `src/components/layout/MobileHeader.tsx`** (mobile only, visible below `md`):
   - Fixed to top. Full width. Height: 56px. Background: `var(--bg-sidebar)`. Bottom border.
   - Left: brand mark (smaller, 24px) + "Flow" text.
   - Right: hamburger menu button (MenuIcon).
   - Tapping hamburger opens a bottom sheet with all 6 nav items (styled like the sidebar nav items but in a sheet).
   - The bottom sheet includes a "New Inbox Item" button at the bottom.
   - Sheet dismisses on item tap or overlay click.

5. **Create `src/components/layout/TopBar.tsx`** (desktop only, visible at `md`+):
   - Height: 56px. Background: transparent (sits on `bg-root`). Bottom border.
   - Left: search input (bg-surface, 6px radius, search icon, placeholder "Search tasks...").
   - Right: user avatar circle (32px, initials "A", bg-surface).
   - Search is non-functional for now — just the visual input.

6. **Update `src/app/layout.tsx`** to compose everything:
   - Wrap children in a flex layout.
   - Desktop: sidebar on left, main content area on right (with TopBar above content).
   - Mobile: MobileHeader at top, content in middle (with top padding for header), BottomNav at bottom.
   - Use Tailwind responsive classes (`hidden md:block`, `md:hidden`) to toggle layouts.
   - Content area should have bottom padding: 100px on mobile (for bottom nav), 60px on desktop.

7. **Create placeholder view pages** (if they don't exist) so navigation works:
   - `src/app/(views)/inbox/page.tsx` → "Inbox" heading
   - `src/app/(views)/today/page.tsx` → "Today" heading
   - `src/app/(views)/forecast/page.tsx` → "Forecast" heading
   - `src/app/(views)/projects/page.tsx` → "Projects" heading
   - `src/app/(views)/tags/page.tsx` → "Tags" heading
   - `src/app/(views)/review/page.tsx` → "Review" heading

   Each is a simple server component with just a heading so you can verify navigation.

## Files to create
- `src/components/ui/Icons.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/components/layout/MobileHeader.tsx`
- `src/components/layout/TopBar.tsx`
- `src/app/(views)/inbox/page.tsx`
- `src/app/(views)/today/page.tsx`
- `src/app/(views)/forecast/page.tsx`
- `src/app/(views)/projects/page.tsx`
- `src/app/(views)/tags/page.tsx`
- `src/app/(views)/review/page.tsx`

## Files to modify
- `src/app/layout.tsx`

## Acceptance criteria
- [ ] At 375px width: mobile header at top, content in middle, bottom tab bar at bottom. No sidebar visible.
- [ ] At 1280px width: sidebar on left (240px), top bar above content, no bottom bar, no mobile header.
- [ ] Clicking nav items navigates between views (URL changes, active state updates).
- [ ] Active route is highlighted in both sidebar and bottom bar.
- [ ] Sidebar badges render (hardcoded counts like "4" for Inbox are fine).
- [ ] Mobile hamburger opens a bottom sheet with all 6 nav items.
- [ ] Brand mark + "Flow" display correctly with Newsreader font.
- [ ] Quick Capture button in sidebar renders with dashed border and ⌘N hint.
- [ ] Bottom nav respects safe-area-inset-bottom.
- [ ] `pnpm build` succeeds.

## References
- UI-REFERENCE.md → Navigation section (Sidebar, Bottom Bar, Mobile Header), Color Tokens, Typography
- CLAUDE.md → Project Structure (file paths), Responsive Design conventions
- SPEC.md → §4.3 Navigation
