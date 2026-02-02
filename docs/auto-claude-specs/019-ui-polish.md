# Spec 019: UI Polish Pass

## Batch
6 (Polish) — Run last, after Specs 017-018 are merged.

## Description
Final visual refinement pass to ensure every component matches the prototype exactly. Fix spacing, colors, animations, and responsive behavior. This is the difference between "it works" and "it feels right."

## What to do

1. **Verify all color tokens**:
   - Inspect every component and confirm colors match UI-REFERENCE.md exactly.
   - Common issues: wrong gray shade for borders, wrong opacity on hover states, text colors slightly off.
   - Pay special attention to: `--bg-card` vs `--bg-surface` (they're different), due date badge colors, area color usage.

2. **Verify typography**:
   - All view titles: Newsreader 26px mobile / 28px desktop, weight 500.
   - Task titles in TaskRow: 15px mobile / 14px desktop, DM Sans 400.
   - Metadata: correct sizes from UI-REFERENCE.md type scale.
   - Ensure Google Fonts load on first paint (no FOUT/FOIT flash).

3. **Verify spacing**:
   - Content padding: 16px mobile, 40px desktop.
   - Bottom padding: 100px mobile (clears bottom nav + FAB), 60px desktop.
   - Task row padding: 14px 12px mobile, 10px 12px desktop.
   - Section gaps: 20-24px between groups.

4. **Verify animations**:
   - Task completion: checkbox fills (200ms) → row fades (400ms) → removed (500ms total). Should be buttery smooth.
   - Bottom sheet: slides up 250ms ease. Overlay fades 150ms.
   - Side panel: slides in + fades 200ms.
   - Quick Capture modal: fades + slides + scales 200ms.
   - No animation jank at 60fps. Test on throttled CPU.

5. **Verify responsive breakpoints**:
   - 375px (iPhone SE): Everything fits, no horizontal scroll, bottom nav fully visible, FAB doesn't overlap content.
   - 768px: Sidebar appears, bottom nav disappears, mobile header disappears.
   - 1280px: Content area max-width 860px (lg breakpoint).
   - Test intermediate widths (e.g., 600px tablet) for graceful transitions.

6. **Verify safe area handling**:
   - Bottom nav: has `padding-bottom: env(safe-area-inset-bottom)`.
   - FAB: positioned above bottom nav + safe area.
   - Content: not obscured by notch on top.

7. **Verify empty states**:
   - Inbox zero: ✨ + message.
   - Today empty: message.
   - Review done: ✅ + message.
   - All styled consistently: centered, Newsreader for heading, `var(--text-secondary)`.

8. **Verify interactive states**:
   - Nav items: hover (desktop), active, default states all distinct.
   - Buttons: hover darkens slightly, active scales 0.98.
   - Tag cards: active has accent border.
   - Area groups: chevron rotates on expand/collapse.
   - FAB: scales to 0.92 on press.

9. **Fix any visual regressions**:
   - Check that earlier batches haven't drifted from the prototype.
   - Common regressions: z-index conflicts, layout shifts when detail panel opens, scroll position jumping.

10. **Cross-browser check**:
    - Chrome (latest), Firefox (latest), Safari (latest on Mac).
    - Verify service worker registration (Chrome/Firefox only, Safari limited).
    - Verify fonts render consistently.

## Files to modify
- Potentially any component or CSS file. This is a refinement spec.

## Dependencies
- All previous specs must be merged.

## Acceptance criteria
- [ ] All colors match UI-REFERENCE.md token values exactly.
- [ ] All fonts and sizes match UI-REFERENCE.md type scale.
- [ ] All spacing matches UI-REFERENCE.md spacing table.
- [ ] Completion animation is smooth at 60fps.
- [ ] Bottom sheet, side panel, and modal animations are smooth.
- [ ] App looks correct at 375px, 768px, and 1280px widths.
- [ ] Safe area insets work on notched device (test with Chrome DevTools device emulation).
- [ ] All empty states display correctly.
- [ ] All hover, active, and focus states work.
- [ ] No visual regressions from earlier batches.
- [ ] Touch targets are at least 44px on mobile.
- [ ] No horizontal overflow on any view at any breakpoint.
- [ ] `pnpm build` succeeds with no warnings.

## References
- UI-REFERENCE.md → All sections (this is the source of truth)
- The prototype file (`gtd-flow-responsive.jsx`) — pixel-level reference
- SPEC.md → Empty states, view behaviors
