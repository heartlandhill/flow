import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProjectDetailList } from "./ProjectDetailList";
import { ProjectDetailHeader } from "./ProjectDetailHeader";
import { AddTaskButton } from "./AddTaskButton";
import type { TaskWithRelations } from "@/types";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Project detail page - displays all tasks for a specific project.
 * This is a server component that fetches data directly via Prisma.
 */
export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;

  // Query project with area, incomplete tasks, and counts
  // Wrap in try-catch to handle invalid UUID format errors from Prisma
  let project;
  try {
    project = await prisma.project.findUnique({
      where: { id },
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
            project: {
              include: {
                area: true,
              },
            },
            reminders: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });
  } catch {
    // Handle invalid UUID format or other Prisma errors
    notFound();
  }

  // Handle 404 for non-existent project ID
  if (!project) {
    notFound();
  }

  // Query completed task count separately for progress calculation
  const completedCount = await prisma.task.count({
    where: {
      project_id: id,
      completed: true,
    },
  });

  // Fetch all areas for the edit modal
  const areas = await prisma.area.findMany({
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  // Fetch all tags for the new task modal
  const allTags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      icon: true,
    },
  });

  // Calculate progress
  const totalTasks = project._count.tasks;
  const incompleteTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Get area color with fallback
  const areaColor = project.area.color || "var(--accent)";

  // Cast tasks to TaskWithRelations type
  const typedTasks = project.tasks as TaskWithRelations[];

  return (
    <div className="flex flex-col h-full view-content">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        {/* Back link */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="opacity-60"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Projects
        </Link>

        {/* Project name, area badge, and edit button */}
        <div className="mb-3">
          <ProjectDetailHeader
            project={{
              id: project.id,
              name: project.name,
              notes: project.notes,
              status: project.status,
              type: project.type,
              area_id: project.area_id,
              review_interval_days: project.review_interval_days,
            }}
            area={project.area}
            areas={areas}
          />
        </div>

        {/* Progress bar */}
        <div className="h-[3px] rounded-full bg-[var(--bg-hover)] mb-3 overflow-hidden max-w-md">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              backgroundColor: areaColor,
            }}
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[13px] text-[var(--text-secondary)]">
          <span>{incompleteTasks} remaining</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </header>

      {/* Task list or empty state */}
      <main className="flex-1 px-2 md:px-4 pb-24 md:pb-6 overflow-y-auto">
        {typedTasks.length === 0 ? (
          <EmptyState
            hasCompletedTasks={totalTasks > 0}
            projectId={id}
            projectName={project.name}
            areaColor={areaColor}
            allTags={allTags}
          />
        ) : (
          <>
            <ProjectDetailList initialTasks={typedTasks} projectId={id} projectType={project.type} />
            {/* Add Task button below task list */}
            <div className="px-2 pt-3 pb-2">
              <AddTaskButton
                projectId={id}
                projectName={project.name}
                areaColor={areaColor}
                allTags={allTags}
                variant="secondary"
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

interface EmptyStateProps {
  hasCompletedTasks: boolean;
  projectId: string;
  projectName: string;
  areaColor: string;
  allTags: { id: string; name: string; icon: string | null }[];
}

/**
 * Empty state displayed when project has no incomplete tasks.
 * Shows different messages for empty projects vs all tasks completed.
 * Includes an Add Task button to create tasks directly in the project.
 */
function EmptyState({
  hasCompletedTasks,
  projectId,
  projectName,
  areaColor,
  allTags,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-12 px-5 text-center">
      {hasCompletedTasks ? (
        <>
          <span className="text-[32px] mb-2.5" role="img" aria-label="Checkmark">
            ✓
          </span>
          <p className="text-[14px] text-[var(--text-tertiary)] mb-4">
            All tasks complete — nice work!
          </p>
        </>
      ) : (
        <>
          <span className="text-[32px] mb-2.5" role="img" aria-label="Clipboard">
            📋
          </span>
          <p className="text-[14px] text-[var(--text-tertiary)] mb-4">
            No tasks yet — add one to get started
          </p>
        </>
      )}
      <AddTaskButton
        projectId={projectId}
        projectName={projectName}
        areaColor={areaColor}
        allTags={allTags}
        variant="primary"
      />
    </div>
  );
}
