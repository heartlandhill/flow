# Spec 009: Projects View

## Batch
3 (Remaining Views) — Run after Batch 2. Can run in parallel with Specs 008, 010, 011.

## Description
Build the Projects view — the organizational hub of GTD. Shows all projects grouped by Area of responsibility, with collapsible sections, progress bars, nested task previews, and a separate Someday/Maybe section for deferred projects.

## What to do

1. **Create `src/app/(views)/projects/page.tsx`** (server component):
   - Two queries:
     ```typescript
     // Active projects grouped by area
     const areas = await prisma.area.findMany({
       orderBy: { sort_order: "asc" },
       include: {
         projects: {
           where: { status: "ACTIVE" },
           orderBy: { sort_order: "asc" },
           include: {
             tasks: {
               where: { completed: false },
               orderBy: { sort_order: "asc" },
               include: { tags: { include: { tag: true } } }
             },
             _count: { select: { tasks: true } } // Total tasks for progress
           }
         }
       }
     });

     // Total task counts per project (for progress calculation)
     // Also need completed task count per project
     const projectStats = await prisma.project.findMany({
       where: { status: "ACTIVE" },
       select: {
         id: true,
         _count: { select: { tasks: { where: { completed: true } } } },
         tasks: { select: { id: true } }
       }
     });

     // Someday projects
     const somedayProjects = await prisma.project.findMany({
       where: { status: "SOMEDAY" },
       include: { area: true }
     });
     ```
   - Pass data to client components.

2. **Create `src/components/projects/AreaGroup.tsx`** (client component):
   - Collapsible section for one area.
   - **Header** (click to toggle):
     - Chevron icon (rotates 90° when expanded).
     - Colored dot (10px circle, area color).
     - Area name (DM Sans 14px, weight 500, `var(--text-primary)`).
     - Project count badge (pill, `var(--bg-surface)`, `var(--text-secondary)`).
   - **Expanded**: renders ProjectCard for each project in the area.
   - **Collapsed**: just the header.
   - Default state: expanded. Use `useState` for toggle.

3. **Create `src/components/projects/ProjectCard.tsx`** (component):
   - **Active project card**:
     - Background: `var(--bg-card)`. Border: 1px solid `var(--border)`. Border-radius: 10px. Padding: 14-16px.
     - **Header row**: project name (DM Sans 14px, weight 500) + task count badge ("N remaining", `var(--text-secondary)` 12px).
     - **Progress bar**: 3px tall. Track: `var(--bg-hover)`. Fill: area color. Width = (completed / total * 100)%.
     - **Task preview**: Up to 3 TaskRows with reduced padding. For **sequential** projects, only show the first incomplete task. For **parallel** projects, show up to 3.
     - **"+N more" link**: If more than 3 remaining tasks, show "+N more" in `var(--text-secondary)` 12px below the tasks.
   - **Someday project card** (used in the Someday section):
     - Compact: single row. Project name + area label (small pill with area color). Entire card at 60% opacity.

4. **Someday/Maybe section**:
   - Below all area groups. Separated by a horizontal rule.
   - Header: "Someday / Maybe" in Newsreader 18px.
   - List of compact someday ProjectCards.
   - Collapsible (default: collapsed if more than 3 items).

5. **View header**: "Projects" in Newsreader 26px/28px.

6. **Create server actions** in `src/actions/projects.ts`:
   - `createProject(data: CreateProjectInput)` — See API.md.
   - `updateProject(id: string, data: UpdateProjectInput)` — See API.md.
   - These won't be wired to UI in this spec (no create/edit project UI yet) but should exist for other specs to use.

## Files to create
- `src/app/(views)/projects/page.tsx` (replace placeholder)
- `src/components/projects/AreaGroup.tsx`
- `src/components/projects/ProjectCard.tsx`
- `src/actions/projects.ts`

## Dependencies
- TaskRow component from Spec 005.

## Acceptance criteria
- [ ] Projects are grouped under their areas.
- [ ] Each area section is collapsible (click header to toggle).
- [ ] Area headers show colored dot, name, and project count.
- [ ] Active project cards show name, remaining count, progress bar (area-colored), up to 3 task previews.
- [ ] Sequential projects show only the first incomplete task.
- [ ] Parallel projects show up to 3 incomplete tasks.
- [ ] "+N more" appears when a project has more than 3 remaining tasks.
- [ ] Progress bar width reflects completion percentage.
- [ ] Someday/Maybe section shows at the bottom with compact cards at 60% opacity.
- [ ] Task completion works from within project cards.
- [ ] `pnpm build` succeeds.

## References
- SPEC.md → §3.4 Projects (especially sequential vs parallel behavior)
- API.md → Projects View queries, project server actions
- UI-REFERENCE.md → ProjectCard, AreaGroup patterns
- SCHEMA.md → Project model (type, status fields)
