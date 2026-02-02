# CLAUDE.md — Flow GTD

## Project Overview

Flow is a web-based GTD (Getting Things Done) task manager built as a Next.js application. It implements the core GTD workflow — capture, clarify, organize, reflect, engage — with a calm, focused UI inspired by Things 3 and OmniFocus. This is a single-user application.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Job Queue**: pg-boss (Postgres-native, no Redis)
- **Notifications**: ntfy (Android/GrapheneOS), Web Push API (desktop browsers)
- **Styling**: Tailwind CSS 4
- **Auth**: Simple session-based auth (single user, no OAuth)
- **Package Manager**: pnpm

## Project Structure

```
flow/
├── CLAUDE.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Redirects to /inbox
│   │   ├── globals.css
│   │   ├── (views)/
│   │   │   ├── inbox/page.tsx
│   │   │   ├── today/page.tsx
│   │   │   ├── forecast/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── tags/page.tsx
│   │   │   └── review/page.tsx
│   │   ├── api/
│   │   │   ├── notify/route.ts
│   │   │   ├── snooze/route.ts
│   │   │   └── push/subscribe/route.ts
│   │   └── login/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── MobileHeader.tsx
│   │   │   └── TopBar.tsx
│   │   ├── tasks/
│   │   │   ├── TaskRow.tsx
│   │   │   ├── TaskDetail.tsx
│   │   │   ├── TaskDetailSheet.tsx
│   │   │   └── QuickCapture.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   └── AreaGroup.tsx
│   │   ├── review/
│   │   │   └── ReviewCard.tsx
│   │   ├── forecast/
│   │   │   ├── ForecastStrip.tsx
│   │   │   └── ForecastDayGroup.tsx
│   │   └── ui/
│   │       ├── Checkbox.tsx
│   │       ├── Badge.tsx
│   │       ├── Sheet.tsx
│   │       └── FAB.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── notifications/
│   │   │   ├── ntfy.ts
│   │   │   ├── web-push.ts
│   │   │   └── scheduler.ts
│   │   └── utils.ts
│   ├── actions/
│   │   ├── tasks.ts
│   │   ├── projects.ts
│   │   ├── areas.ts
│   │   ├── tags.ts
│   │   └── reminders.ts
│   ├── hooks/
│   │   ├── useQuickCapture.ts
│   │   └── useKeyboardShortcuts.ts
│   └── types/
│       └── index.ts
├── public/
│   └── sw.js
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## Coding Conventions

### TypeScript

- Strict mode enabled. No `any` types.
- Use interfaces for object shapes, types for unions/intersections.
- Prefer `const` over `let`. Never use `var`.
- Use async/await, never raw Promises with `.then()`.
- Export shared types from `src/types/index.ts`.

### Naming

- Files: kebab-case for utilities (`date-utils.ts`), PascalCase for components (`TaskRow.tsx`).
- Components: PascalCase. Always use named exports.
- Functions: camelCase. Server actions prefixed with verb (`createTask`, `updateProject`, `deleteTag`).
- Database fields: snake_case in Prisma schema, camelCase in TypeScript (Prisma handles mapping).
- CSS: Tailwind utilities only. No custom CSS files except for fonts/variables in `globals.css`.

### Components

- All components are React Server Components by default.
- Add `"use client"` only when the component needs interactivity (event handlers, hooks, browser APIs).
- Keep client components as small and leaf-level as possible.
- Props interfaces defined inline above the component.
- No prop drilling beyond 2 levels — use server components to fetch data where needed.

### Data Fetching

- Server components fetch data directly via Prisma.
- Mutations use Next.js Server Actions (in `src/actions/`).
- Revalidate paths after mutations with `revalidatePath()`.
- No client-side data fetching libraries (no SWR, no React Query).

### Error Handling

- Server actions return `{ success: boolean; error?: string; data?: T }`.
- Use try/catch in server actions, never let errors propagate unhandled.
- Log errors server-side with `console.error`.

### Responsive Design

- Mobile-first. Write base styles for mobile, override with `md:` and `lg:` prefixes.
- Breakpoints: `md` (768px) for tablet/desktop sidebar, `lg` (1200px) for wider content.
- Bottom nav visible below `md`. Sidebar visible at `md` and above.
- Task detail: bottom sheet on mobile, side panel on desktop.

### Testing

- No tests in SLC scope. Code should be structured to be testable later.

## Key Behaviors

- **Quick Capture**: `Cmd+N` / `Ctrl+N` opens capture modal globally. On mobile, the FAB opens it. New items go to inbox.
- **Task Completion**: Checkbox triggers a 400ms animation, then marks complete. Completed tasks excluded from all active views.
- **Inbox Zero**: When inbox is empty, show empty state with ✨ icon.
- **Review Cycle**: Projects reviewed in sequence, one at a time, with next actions and prompting questions.
- **Forecast**: Horizontally scrollable date strip on mobile, grid on desktop. Shows next 14 days.

## Environment Variables

See ENV.md for full list. Critical vars:

- `DATABASE_URL` — Postgres connection string
- `SESSION_SECRET` — For cookie signing
- `NTFY_BASE_URL` — ntfy server URL
- `NTFY_TOPIC_PREFIX` — Prefix for user notification topics
- `NEXT_PUBLIC_VAPID_KEY` — Web Push VAPID public key
- `VAPID_PRIVATE_KEY` — Web Push VAPID private key

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio
pnpm db:seed      # Seed with sample data
```

## Important Notes for Agents

- Always read SPEC.md before implementing any view.
- Always read SCHEMA.md before touching database-related code.
- Always read UI-REFERENCE.md before creating or modifying components.
- Always read NOTIFICATIONS.md before touching `src/lib/notifications/`.
- Check for existing components before creating new ones.
- Never add dependencies without checking existing ones first.
- Run `pnpm build` after significant changes to catch type errors.
- The prototype file (`gtd-flow-responsive.jsx`) is the visual reference. Match it.
