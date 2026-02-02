# Spec 007: Quick Capture

## Batch
2 (Layout & Core Views) — Run after Batch 1. Can run in parallel with Specs 004-006.

## Description
Build the global Quick Capture modal and the mobile floating action button (FAB). This is how tasks enter the system — the most important interaction in a GTD app. The modal is available on every page via keyboard shortcut (Cmd+N / Ctrl+N) or the FAB.

## What to do

1. **Create `src/hooks/useKeyboardShortcuts.ts`** (client hook):
   - Listens for `Cmd+N` (Mac) / `Ctrl+N` (Windows/Linux) globally.
   - Calls a provided callback (open capture modal).
   - Listens for `Escape` globally — calls a dismiss callback.
   - Uses `useEffect` with `keydown` event listener.
   - Prevents default browser behavior for Cmd+N.

2. **Create `src/hooks/useQuickCapture.ts`** (client hook):
   - Manages capture modal state: `isOpen`, `open()`, `close()`.
   - Uses `useKeyboardShortcuts` internally.

3. **Create `src/components/tasks/QuickCapture.tsx`** (client component):
   - **Overlay**: Fixed full-screen, `rgba(0,0,0,0.6)` with `backdrop-filter: blur(4px)`. Click to dismiss.
   - **Modal**: Centered, 15vh from top. Width: `calc(100% - 32px)` mobile (max 480px), 520px desktop. Border-radius: 14px. Background: `var(--bg-card)`. Border: 1px solid `var(--border)`.
   - **Header**: Uppercase label "NEW INBOX ITEM" (12px, DM Sans 500, tracking 0.8px, `var(--text-tertiary)`) + inbox icon.
   - **Input**: Full width, 16px DM Sans, `var(--bg-surface)` background, no border. Placeholder: "What's on your mind?" in `var(--text-tertiary)`. Autofocus on open.
   - **Footer**: Top border. Left: hint text "Press Enter to save" in `var(--text-tertiary)` 12px. Right: submit button with accent background, "Add to Inbox" label, 14px.
   - **Animation**: On open — overlay fades in (150ms), modal fades in + slides up 10px + scales from 0.97 (200ms ease).
   - **Behavior**:
     - Enter key: creates task, clears input, optionally keeps modal open for rapid entry (close on Escape or overlay click).
     - Actually, for SLC: Enter creates task and closes modal.
     - Escape: closes without creating.
     - Click outside: closes without creating.
   - Uses `createTask` server action from `src/actions/tasks.ts`.

4. **Create `src/components/ui/FAB.tsx`** (client component):
   - Mobile only (`md:hidden`).
   - Fixed position: bottom 72px + safe-area-inset-bottom, right 16px.
   - 52px circle. Gradient: `linear-gradient(135deg, #E8A87C, #d4916a)`.
   - Shadow: `0 4px 20px rgba(232,168,124,0.35)`.
   - Contains PlusIcon at 22px, white.
   - Active (pressed) state: `transform: scale(0.92)`.
   - onClick: opens the Quick Capture modal.

5. **Integrate into root layout** (`src/app/layout.tsx`):
   - Add a client wrapper component that provides the Quick Capture context.
   - Render `<QuickCapture />` and `<FAB />` inside the layout so they're available on all pages.
   - The FAB's onClick and the sidebar's "New Inbox Item" button both trigger the same capture modal.

## Files to create
- `src/hooks/useKeyboardShortcuts.ts`
- `src/hooks/useQuickCapture.ts`
- `src/components/tasks/QuickCapture.tsx`
- `src/components/ui/FAB.tsx`

## Files to modify
- `src/app/layout.tsx` (add QuickCapture and FAB)
- `src/components/layout/Sidebar.tsx` (wire "New Inbox Item" button to open capture)

## Dependencies
- Requires `createTask` server action from Spec 005's `src/actions/tasks.ts`. If running in parallel, create a minimal version of the action.

## Acceptance criteria
- [ ] Pressing Cmd+N (Mac) / Ctrl+N (other) opens the capture modal.
- [ ] FAB is visible on mobile (below 768px), hidden on desktop.
- [ ] Tapping FAB opens the capture modal.
- [ ] Sidebar "New Inbox Item" button opens the capture modal.
- [ ] Modal input autofocuses when opened.
- [ ] Typing a title and pressing Enter creates a task in inbox and closes the modal.
- [ ] Pressing Escape closes the modal without creating.
- [ ] Clicking the overlay closes the modal without creating.
- [ ] Modal animation is smooth (fade + slide + scale).
- [ ] Empty input does not create a task (Enter is a no-op if empty).
- [ ] FAB has correct gradient, shadow, and scale-on-press animation.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §4.1 Quick Capture
- UI-REFERENCE.md → Capture Modal, FAB
- CLAUDE.md → Key Behaviors (Quick Capture)
- API.md → createTask server action
