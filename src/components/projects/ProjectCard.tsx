"use client";

import { TaskRow } from "@/components/tasks/TaskRow";
import type { ProjectWithTasksAndCounts, TaskWithRelations, SomedayProject } from "@/types";

interface ProjectCardActiveProps {
  project: ProjectWithTasksAndCounts;
  completedCount: number;
  onTaskComplete: (taskId: string) => void;
  onTaskSelect?: (taskId: string) => void;
  variant: "active";
}

interface ProjectCardSomedayProps {
  project: SomedayProject;
  variant: "someday";
}

type ProjectCardProps = ProjectCardActiveProps | ProjectCardSomedayProps;

/**
 * Get tasks to display based on project type
 * - Sequential: only first incomplete task
 * - Parallel: up to 3 incomplete tasks
 */
function getDisplayedTasks(
  project: ProjectWithTasksAndCounts
): { tasks: ProjectWithTasksAndCounts["tasks"]; moreCount: number } {
  const incompleteTasks = project.tasks;

  if (project.type === "SEQUENTIAL") {
    // Sequential: only show first task
    const tasks = incompleteTasks.slice(0, 1);
    const moreCount = Math.max(0, incompleteTasks.length - 1);
    return { tasks, moreCount };
  } else {
    // Parallel: show up to 3 tasks
    const tasks = incompleteTasks.slice(0, 3);
    const moreCount = Math.max(0, incompleteTasks.length - 3);
    return { tasks, moreCount };
  }
}

/**
 * Calculate progress percentage
 */
function calculateProgress(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return (completedCount / totalCount) * 100;
}

/**
 * Get area color with fallback
 */
function getAreaColor(color: string | null): string {
  return color || "var(--accent)";
}

/**
 * ProjectCard component - displays a project with progress and task previews
 *
 * Two variants:
 * - active: Full card with progress bar and task previews
 * - someday: Compact card at 60% opacity with area label
 */
export function ProjectCard(props: ProjectCardProps) {
  if (props.variant === "someday") {
    return <SomedayCard project={props.project} />;
  }

  return (
    <ActiveCard
      project={props.project}
      completedCount={props.completedCount}
      onTaskComplete={props.onTaskComplete}
      onTaskSelect={props.onTaskSelect}
    />
  );
}

/**
 * Active project card with progress bar and task previews
 */
function ActiveCard({
  project,
  completedCount,
  onTaskComplete,
  onTaskSelect,
}: {
  project: ProjectWithTasksAndCounts;
  completedCount: number;
  onTaskComplete: (taskId: string) => void;
  onTaskSelect?: (taskId: string) => void;
}) {
  const areaColor = getAreaColor(project.area.color);
  const totalTasks = project._count.tasks;
  const remainingTasks = project.tasks.length;
  const progress = calculateProgress(completedCount, totalTasks);
  const { tasks: displayedTasks, moreCount } = getDisplayedTasks(project);

  // Convert tasks to TaskWithRelations for TaskRow
  // Pass project: null in displayTask to avoid showing redundant project pill inside project card
  // But also create contextTasks with full project info for TaskDetailPanel
  const displayTasks: TaskWithRelations[] = displayedTasks.map((task) => ({
    ...task,
    project: null,
    reminders: [],
  }));

  // Create context tasks with full project info for TaskDetailPanel
  const contextTasks: TaskWithRelations[] = displayedTasks.map((task) => ({
    ...task,
    project: {
      id: project.id,
      name: project.name,
      notes: project.notes,
      status: project.status,
      type: project.type,
      sort_order: project.sort_order,
      review_interval_days: project.review_interval_days,
      last_reviewed_at: project.last_reviewed_at,
      next_review_date: project.next_review_date,
      area_id: project.area_id,
      created_at: project.created_at,
      updated_at: project.updated_at,
      area: project.area,
    },
    reminders: [],
  }));

  return (
    <div
      className={`
        bg-[var(--bg-card)] border border-[var(--border)]
        rounded-[10px]

        /* Padding: 14px mobile, 16px desktop */
        p-3.5 md:p-4
      `}
    >
      {/* Header: Project name + remaining count */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3
          className="text-[15px] md:text-[14px] font-medium text-[var(--text-primary)] truncate"
        >
          {project.name}
        </h3>

        {/* Remaining count badge */}
        <span
          className="flex-shrink-0 text-[11px] font-medium text-[var(--text-secondary)]"
        >
          {remainingTasks} remaining
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] rounded-full bg-[var(--bg-hover)] mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: areaColor,
          }}
        />
      </div>

      {/* Task previews */}
      {displayTasks.length > 0 && (
        <div className="-mx-2">
          {displayTasks.map((task, index) => (
            <TaskRow
              key={task.id}
              task={task}
              contextTask={contextTasks[index]}
              onComplete={onTaskComplete}
              onSelect={onTaskSelect}
            />
          ))}
        </div>
      )}

      {/* "+N more" link */}
      {moreCount > 0 && (
        <div className="mt-1 pl-9">
          <span className="text-[12px] text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors">
            +{moreCount} more
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Someday project card - compact style at 60% opacity
 */
function SomedayCard({ project }: { project: SomedayProject }) {
  const areaColor = getAreaColor(project.area.color);

  return (
    <div
      className={`
        bg-[var(--bg-card)] border border-[var(--border)]
        rounded-[10px] opacity-60

        /* Compact padding */
        px-3.5 py-2.5 md:px-4 md:py-3

        /* Single row layout */
        flex items-center justify-between gap-3
      `}
    >
      {/* Project name */}
      <h3
        className="text-[14px] md:text-[13px] font-medium text-[var(--text-primary)] truncate flex-1"
      >
        {project.name}
      </h3>

      {/* Area label pill */}
      <span
        className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
        style={{
          backgroundColor: `${areaColor}20`,
          color: areaColor,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: areaColor }}
        />
        {project.area.name}
      </span>
    </div>
  );
}
