import { prisma } from "@/lib/db";
import { getToday, getDateRange, formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

/**
 * Helper to format date as YYYY-MM-DD for grouping
 */
function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Forecast page - displays tasks due in the next 14 days.
 * Features:
 * - Date strip showing 14 days (mobile: horizontal scroll, desktop: 7-column grid)
 * - Tasks grouped by day with colored dots indicating task count
 * - Task completion from within this view
 *
 * This is a server component that fetches data directly via Prisma.
 */
export default async function ForecastPage() {
  const today = getToday();

  // Calculate 14 days from today (inclusive)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 13); // 0-13 = 14 days

  // Get array of all 14 dates for the strip
  const dates = getDateRange(14);

  // Query tasks with due_date in the next 14 days
  const tasks = await prisma.task.findMany({
    where: {
      completed: false,
      due_date: {
        gte: today,
        lte: endDate,
      },
    },
    orderBy: [
      { due_date: "asc" },
      { sort_order: "asc" },
    ],
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
  });

  // Cast to TaskWithRelations type
  const typedTasks = tasks as TaskWithRelations[];

  // Group tasks by date key (YYYY-MM-DD)
  const tasksByDate = new Map<string, TaskWithRelations[]>();
  for (const task of typedTasks) {
    if (task.due_date) {
      const dateKey = getDateKey(task.due_date);
      const existing = tasksByDate.get(dateKey) || [];
      existing.push(task);
      tasksByDate.set(dateKey, existing);
    }
  }

  // Convert Map to plain object for serialization to client components
  const tasksByDateObj: Record<string, TaskWithRelations[]> = {};
  for (const [key, value] of tasksByDate) {
    tasksByDateObj[key] = value;
  }

  // Get days that have tasks (for the list below the strip)
  const daysWithTasks = dates.filter(
    (date) => (tasksByDate.get(getDateKey(date))?.length ?? 0) > 0
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[26px] md:text-[28px] font-normal text-[var(--text-primary)]">
            Forecast
          </h1>
          {typedTasks.length > 0 && (
            <span className="text-sm text-[var(--text-tertiary)]">
              {typedTasks.length}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">
          Next 14 days
        </p>
      </header>

      {/* Date Strip - placeholder until ForecastStrip component is created */}
      <section className="px-4 md:px-6 pb-4">
        {/* ForecastStrip will be rendered here in phase-3 */}
        {/* Props will be: dates, tasksByDate */}
      </section>

      {/* Task list or empty state */}
      <main className="flex-1 px-2 md:px-4 pb-24 md:pb-6 overflow-y-auto">
        {typedTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <TaskListPlaceholder
            daysWithTasks={daysWithTasks}
            tasksByDateObj={tasksByDateObj}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Temporary placeholder for task list until ForecastList is implemented.
 * Displays grouped tasks by day with count.
 */
function TaskListPlaceholder({
  daysWithTasks,
  tasksByDateObj
}: {
  daysWithTasks: Date[];
  tasksByDateObj: Record<string, TaskWithRelations[]>;
}) {
  return (
    <div className="space-y-6">
      {daysWithTasks.map((date) => {
        const dateKey = date.toISOString().split("T")[0];
        const dayTasks = tasksByDateObj[dateKey] || [];

        return (
          <div key={dateKey}>
            <div className="flex items-baseline gap-2 px-2 mb-2">
              <h2 className="font-display text-[16px] font-medium text-[var(--text-primary)]">
                {formatDate(date)}
              </h2>
              <span className="text-[13px] text-[var(--text-tertiary)]">
                {dayTasks.length}
              </span>
            </div>
            <div className="space-y-1">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)]"
                >
                  <div
                    className="w-4 h-4 rounded-full border-2"
                    style={{
                      borderColor: task.project?.area?.color || "#555"
                    }}
                  />
                  <span className="text-[var(--text-primary)]">{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Empty state displayed when no tasks are due in the next 14 days.
 * Shows a calm, encouraging message.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
      <span className="text-[48px] mb-4" role="img" aria-label="Calendar">
        📅
      </span>
      <p className="font-display text-lg text-[var(--text-secondary)]">
        Nothing scheduled for the next 2 weeks
      </p>
    </div>
  );
}
