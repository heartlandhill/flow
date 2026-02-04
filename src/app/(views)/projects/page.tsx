import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { ProjectsList } from "./ProjectsList";
import type {
  AreaWithProjectsAndCounts,
  SomedayProject,
  CompletedCountResult,
} from "@/types";

/**
 * Minimal area type for NewProjectModal (id, name, color only)
 */
export interface AreaForModal {
  id: string;
  name: string;
  color: string;
}

/**
 * Projects page - displays all active projects grouped by area of responsibility.
 *
 * This is a server component that fetches data directly via Prisma:
 * 1. Areas with their active projects and incomplete tasks
 * 2. Completed task counts per project (for progress bars)
 * 3. Someday/Maybe projects
 * 4. All areas (for the NewProjectModal)
 */
export default async function ProjectsPage() {
  // Get current user ID (throws if not authenticated)
  const userId = await requireUserId();

  // Query 1: Areas with active projects and incomplete tasks
  const areasRaw = await prisma.area.findMany({
    where: { user_id: userId },
    orderBy: { sort_order: "asc" },
    include: {
      projects: {
        where: { status: "ACTIVE" },
        orderBy: { sort_order: "asc" },
        include: {
          area: true,
          tasks: {
            where: { completed: false },
            orderBy: { sort_order: "asc" },
            include: {
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          },
          _count: {
            select: { tasks: true },
          },
        },
      },
    },
  });

  // Query 2: Completed task counts per project (for progress calculation)
  const completedCountsRaw = await prisma.project.findMany({
    where: {
      user_id: userId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      _count: {
        select: {
          tasks: {
            where: { completed: true },
          },
        },
      },
    },
  });

  // Query 3: Someday projects
  const somedayProjectsRaw = await prisma.project.findMany({
    where: {
      user_id: userId,
      status: "SOMEDAY",
    },
    orderBy: { sort_order: "asc" },
    include: {
      area: true,
    },
  });

  // Query 4: All areas for the NewProjectModal dropdown
  const allAreasRaw = await prisma.area.findMany({
    where: { user_id: userId },
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  // Type cast results
  const areas = areasRaw as AreaWithProjectsAndCounts[];
  const completedCounts = completedCountsRaw as CompletedCountResult[];
  const somedayProjects = somedayProjectsRaw as SomedayProject[];
  const allAreas = allAreasRaw as AreaForModal[];

  // Build a map of project ID -> completed count for easy lookup
  const completedCountMap: Record<string, number> = {};
  for (const item of completedCounts) {
    completedCountMap[item.id] = item._count.tasks;
  }

  // Filter out areas with no active projects
  const areasWithProjects = areas.filter((area) => area.projects.length > 0);

  // Count total active projects
  const totalActiveProjects = areasWithProjects.reduce(
    (sum, area) => sum + area.projects.length,
    0
  );

  // Determine if we have any content to show
  const hasActiveProjects = totalActiveProjects > 0;
  const hasSomedayProjects = somedayProjects.length > 0;
  const hasAnyContent = hasActiveProjects || hasSomedayProjects;

  return (
    <div className="flex flex-col h-full view-content">
      {/* Header */}
      <header className="flex items-baseline gap-3 px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        <h1 className="font-display text-[26px] md:text-[28px] font-medium text-[var(--text-primary)]">
          Projects
        </h1>
        {totalActiveProjects > 0 && (
          <span className="text-sm text-[var(--text-tertiary)]">
            {totalActiveProjects}
          </span>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 md:px-6 pb-24 md:pb-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ProjectsList
          areas={areasWithProjects}
          completedCountMap={completedCountMap}
          somedayProjects={somedayProjects}
          allAreas={allAreas}
          isEmpty={!hasAnyContent}
        />
      </main>
    </div>
  );
}
