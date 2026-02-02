# Spec 001: Project Scaffolding

## Batch
1 (Foundation) — Run first. No dependencies.

## Description
Initialize the Flow GTD Next.js project with all base configuration, dependencies, and the database schema definition. This is the foundation that every other spec builds on.

## What to do

1. **Create Next.js app** using `pnpm create next-app@latest flow --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`.

2. **Configure TypeScript** in `tsconfig.json`:
   - Enable strict mode (`"strict": true`).
   - Path alias: `"@/*"` maps to `"./src/*"`.

3. **Install runtime dependencies**:
   ```
   pnpm add @prisma/client pg-boss web-push bcryptjs
   ```

4. **Install dev dependencies**:
   ```
   pnpm add -D prisma @types/bcryptjs @types/web-push
   ```

5. **Set up Prisma**:
   - Run `pnpm prisma init`.
   - Replace the generated `prisma/schema.prisma` with the full schema from SCHEMA.md. This includes all 9 models: Area, Project, Task, Tag, TaskTag, Reminder, NotificationSubscription, User, Session, plus all enums.
   - Validate with `pnpm prisma validate`.

6. **Create Prisma client singleton** at `src/lib/db.ts`:
   ```typescript
   import { PrismaClient } from "@prisma/client";

   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

   export const prisma = globalForPrisma.prisma ?? new PrismaClient();

   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```

7. **Create `src/app/globals.css`** with:
   - Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`).
   - CSS custom properties from UI-REFERENCE.md (all color tokens: `--bg-root`, `--bg-sidebar`, `--bg-surface`, `--bg-hover`, `--bg-selected`, `--bg-card`, `--border`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--accent`).
   - Body styles: `background: var(--bg-root); color: var(--text-primary); font-family: 'DM Sans', sans-serif;`.

8. **Add Google Fonts** to `src/app/layout.tsx`:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300;1,9..40,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap" rel="stylesheet" />
   ```

9. **Create `.env.example`** per ENV.md with all variable placeholders (no secrets).

10. **Configure `package.json` scripts**:
    ```json
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "postinstall": "prisma generate"
    ```

11. **Create placeholder `src/types/index.ts`** exporting the shared TypeScript types that mirror the Prisma models (TaskWithRelations, ProjectWithTasks, AreaWithProjects, etc.).

12. **Create `src/app/page.tsx`** that redirects to `/inbox`:
    ```typescript
    import { redirect } from "next/navigation";
    export default function Home() { redirect("/inbox"); }
    ```

## Files to create
- `prisma/schema.prisma`
- `src/lib/db.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/types/index.ts`
- `.env.example`
- (Modify `tsconfig.json`, `package.json`, `tailwind.config.ts`)

## Acceptance criteria
- [ ] `pnpm dev` starts without errors.
- [ ] `pnpm build` succeeds with no type errors.
- [ ] `pnpm prisma validate` passes.
- [ ] CSS custom properties are available (inspect body element in dev tools).
- [ ] Google Fonts (DM Sans, Newsreader) load in the browser.
- [ ] Visiting `/` redirects to `/inbox` (404 is fine since the inbox page doesn't exist yet).
- [ ] `.env.example` contains all variables from ENV.md.
- [ ] TypeScript strict mode is enabled.

## References
- CLAUDE.md → Project Structure, Coding Conventions
- SCHEMA.md → Full Prisma schema
- UI-REFERENCE.md → Color Tokens, Typography → Font Loading
- ENV.md → Environment Variables, Package Scripts
