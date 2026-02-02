# UI-REFERENCE.md — Flow GTD Design System

## Design Philosophy

Calm, warm, focused. Inspired by Things 3's restraint and OmniFocus's depth. Dark theme only (SLC). The UI should feel like a quiet room, not a dashboard. Every element earns its place.

The interactive prototype file (`gtd-flow-responsive.jsx`) is the canonical visual reference. When in doubt, match the prototype.

## Color Tokens

### Core Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-root` | `#1a1a1e` | Page background |
| `--bg-sidebar` | `#141416` | Sidebar, bottom bar, header |
| `--bg-surface` | `#222226` | Cards, inputs, secondary surfaces |
| `--bg-hover` | `#2a2a2f` | Hover states |
| `--bg-selected` | `#2d2d35` | Selected/active states |
| `--bg-card` | `#26262b` | Elevated cards, modals |
| `--border` | `#333338` | Borders, dividers |
| `--text-primary` | `#e8e4df` | Headings, task titles |
| `--text-secondary` | `#8a877f` | Metadata, descriptions |
| `--text-tertiary` | `#5e5c57` | Disabled, placeholder |
| `--accent` | `#E8A87C` | Primary accent (copper/amber) |

### Area Colors

| Area | Color | Usage |
|------|-------|-------|
| Work | `#E8A87C` | Project dots, labels, badges |
| Personal | `#85B7D5` | Project dots, labels, badges |
| Health | `#9ED4A0` | Project dots, labels, badges |

### View Accent Colors

| View | Color |
|------|-------|
| Inbox | `#E8A87C` |
| Today | `#F2D06B` |
| Forecast | `#85B7D5` |
| Projects | `#C4A7E7` |
| Tags | `#9ED4A0` |
| Review | `#E88B8B` |

### Due Date Colors

| State | Text | Background |
|-------|------|------------|
| Overdue | `#E88B8B` | `rgba(232,139,139,0.14)` |
| Today | `#F2D06B` | `rgba(242,208,107,0.12)` |
| Tomorrow | `#E8A87C` | `rgba(232,168,124,0.12)` |
| Future | `--text-secondary` | `--bg-surface` |

## Typography

### Fonts

- **Display/Headings**: `'Newsreader', serif` (Google Fonts). View titles, detail title, brand name.
- **Body/UI**: `'DM Sans', sans-serif` (Google Fonts). Everything else.

### Scale

| Element | Size | Font | Weight |
|---------|------|------|--------|
| View title (h1) | 26px mobile / 28px desktop | Newsreader | 500 |
| Task detail title | 20px | Newsreader | 500 |
| Review project name | 22px | Newsreader | 500 |
| Brand name | 18px | Newsreader | 500 |
| Section heading (h2) | 18px | Newsreader | 500 |
| Task title | 15px mobile / 14px desktop | DM Sans | 400 |
| Nav item | 13.5px | DM Sans | 400 |
| Project label | 12px | DM Sans | 500 |
| Due date badge | 11px | DM Sans | 500 |
| Button text | 14px mobile / 13px desktop | DM Sans | 500 |
| Uppercase headers | 12px, tracking 0.8px | DM Sans | 500 |
| Capture input | 16px | DM Sans | 400 |
| Badge/count | 11px | DM Sans | 500 |

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet" />
```

## Spacing

| Context | Value |
|---------|-------|
| Content padding mobile | 16px (p-4) |
| Content padding desktop | 40px (p-10) |
| Task row padding mobile | 14px 12px |
| Task row padding desktop | 10px 12px |
| Card padding mobile | 14px |
| Card padding desktop | 16px |
| Bottom padding mobile views | 100px (clears bottom nav) |
| Bottom padding desktop views | 60px |
| Section gap | 20-24px |

## Border Radius

| Element | Radius |
|---------|--------|
| Cards, tag cards, modals | 10px |
| Buttons, task rows, inputs, nav items | 6px |
| Bottom sheet corners | 16px |
| Brand mark | 8px |
| Checkbox | 50% |
| Badges | 50% (pill) |
| Capture modal | 14px |

## Shadows

Minimal. Only on elevated elements:

| Element | Shadow |
|---------|--------|
| FAB | `0 4px 20px rgba(232,168,124,0.35)` |
| Capture modal | `0 20px 60px rgba(0,0,0,0.5)` |
| Everything else | None |

## Component Patterns

### Checkbox
- Mobile: 24px, 2px border. Desktop: 20px, 1.8px border.
- Default: tertiary border, transparent. Hover: accent border, 10% accent fill.
- Completing: accent fill, scale 1.1x, checkmark. Completed: tertiary fill, checkmark.

### TaskRow
- Flex: checkbox + content + notes icon. Content: title (line 1), meta (line 2).
- Meta: project label (colored) + tag emojis + due badge (inline).
- Selected: `bg-selected` + border. Completing: 30% opacity, 97% scale, 400ms.

### Bottom Sheet (mobile detail)
- Slides up. 16px top radius. Drag handle: 36×4px centered. Max 85vh. Overlay: rgba(0,0,0,0.5).

### Side Panel (desktop detail)
- 340px. Slides from right. `bg-sidebar`. Left border.

### FAB (mobile only)
- 52px circle. Bottom 72px + safe-area, right 16px. Gradient copper. Plus icon.

### Capture Modal
- Centered, 15vh from top. Width: 100%-32px mobile / 520px desktop. 14px radius.
- Header + input + footer with submit button. Overlay with blur.

### Navigation
- **Sidebar** (desktop): 240px, 6 nav items, brand, capture button with ⌘N hint.
- **Bottom Bar** (mobile): 5 items (Inbox, Today, Forecast, Projects, Tags). Icon + label stacked.
- **Mobile Header**: Brand left, hamburger right. Opens full nav as bottom sheet.

### Forecast Strip
- Horizontal scroll mobile. 60px cells. Today: accent border. Day name + number + dots.

### ProjectCard
- `bg-card`, border, 10px radius. Name + count + 3px progress bar + nested TaskRows.

### ReviewCard
- `bg-card`, generous padding. Area badge + large name + stats + progress + questions + actions.

### Tag Cards
- 2 cols mobile, 3 desktop. Emoji + name + count. Active: accent border.

## Animations

| Name | Properties | Duration | Usage |
|------|-----------|----------|-------|
| fadeIn | opacity 0→1, translateY 4-6px→0 | 200-250ms ease | View transitions |
| sheetUp | translateY 100%→0 | 250ms ease | Bottom sheets |
| slideInDesktop | opacity 0→1, translateX 12px→0 | 200ms ease | Side panel |
| captureIn | opacity 0→1, translateY -10px→0, scale 0.97→1 | 200ms ease | Capture modal |
| fadeOverlay | opacity 0→1 | 150ms ease | Overlays |
| completion | Checkbox: scale 1.1x + fill (200ms). Row: opacity 0.3 + scale 0.97 | 400ms total | Task completion |

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| 0-767px | Mobile: bottom tab bar, mobile header, FAB, bottom sheets, 2-col tags, horizontal forecast |
| 768px+ (md) | Desktop: sidebar, top bar, side panel, 3-col tags, no FAB/bottom bar |
| 1200px+ (lg) | Wider content area (860px max) |

## Icons

Inline SVGs. Stroke-based, 1.8px weight, round caps/joins. No icon library. Core set: Inbox, Today, Forecast, Projects, Tags, Review, Plus, Check, Chevron, Close, Back, Search, Menu, Note.

## Accessibility Baseline

- All interactive elements keyboard-focusable.
- Checkboxes are `<button>` with aria labels.
- Color never sole indicator — paired with text/icons.
- Modal focus trapping.
- Minimum 44px touch targets on mobile.
