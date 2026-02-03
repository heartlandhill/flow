import { prisma } from "@/lib/db";
import { ReviewCard } from "@/components/review/ReviewCard";
import { markProjectReviewed } from "@/actions/projects";
import { completeTask } from "@/actions/tasks";
import type { ReviewableProject, ReviewProjectStats } from "@/types";

/**
 * Review page - displays projects one at a time for weekly review.
 *
 * This is a server component that fetches data directly via Prisma:
 * 1. All active projects with review_interval_days set
 * 2. Ordered by next_review_date ascending (oldest/overdue first)
 * 3. Includes area and tasks (with tags) for each project
 * 4. Calculates completion stats for each project
 */
export default async function ReviewPage() {
  // Query reviewable projects:
  // - status must be ACTIVE
  // - must have review_interval_days set (not null)
  // - order by next_review_date ascending (oldest first, null values last)
  const projectsRaw = await prisma.project.findMany({
    where: {
      status: "ACTIVE",
      review_interval_days: { not: null },
    },
    orderBy: [
      { next_review_date: { sort: "asc", nulls: "last" } },
    ],
    include: {
      area: true,
      tasks: {
        orderBy: { sort_order: "asc" },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
    },
  });

  // Type cast results
  const projects = projectsRaw as ReviewableProject[];

  // Calculate stats for each project
  const projectsWithStats = projects.map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((task) => task.completed).length;
    const incompleteTasks = totalTasks - completedTasks;
    const completionPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    const stats: ReviewProjectStats = {
      totalTasks,
      completedTasks,
      incompleteTasks,
      completionPercentage,
    };

    return { project, stats };
  });

  // Check if there are any projects to review
  const hasProjects = projectsWithStats.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-baseline gap-3 px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        <h1 className="font-display text-[26px] md:text-[28px] font-medium text-[var(--text-primary)]">
          Review
        </h1>
        {hasProjects && (
          <span className="text-sm text-[var(--text-tertiary)]">
            {projectsWithStats.length} project{projectsWithStats.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 md:px-6 pb-24 md:pb-6 overflow-y-auto">
        {!hasProjects ? (
          <EmptyState />
        ) : (
          <ReviewCard
            projectsWithStats={projectsWithStats}
            onMarkReviewed={markProjectReviewed}
            onTaskComplete={completeTask}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Empty state displayed when there are no projects to review.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
      <span className="text-[48px] mb-4" role="img" aria-label="Sparkles">
        ✨
      </span>
      <p className="font-display text-lg text-[var(--text-secondary)]">
        No projects to review right now
      </p>
    </div>
  );
}
