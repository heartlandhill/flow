import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { getToday, getDateRange } from "@/lib/utils";
import { filterAvailableTasks } from "@/lib/task-utils";
import { ForecastStrip } from "@/components/forecast/ForecastStrip";
import { ForecastList } from "@/components/forecast/ForecastList";
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
  // Get current user ID (throws if not authenticated)
  const userId = await requireUserId();
  const today = getToday();

  // Calculate 14 days from today (inclusive)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 13); // 0-13 = 14 days

  // Get array of all 14 dates for the strip
  const dates = getDateRange(14);

  // Query tasks with due_date in the next 14 days
  const tasks = await prisma.task.findMany({
    where: {
      user_id: userId,
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

  // Filter to only available tasks (sequential projects: first incomplete only)
  const availableTasks = filterAvailableTasks(typedTasks);

  // Group tasks by date key (YYYY-MM-DD)
  const tasksByDate = new Map<string, TaskWithRelations[]>();
  for (const task of availableTasks) {
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
    <div className="flex flex-col h-full view-content">
      {/* Header */}
      <header className="flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[26px] md:text-[28px] font-medium text-[var(--text-primary)]">
            Forecast
          </h1>
          {availableTasks.length > 0 && (
            <span className="text-sm text-[var(--text-tertiary)]">
              {availableTasks.length}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">
          Next 14 days
        </p>
      </header>

      {/* Date Strip - 14 day calendar view */}
      <section className="px-4 md:px-6 pb-4">
        <ForecastStrip dates={dates} tasksByDate={tasksByDateObj} />
      </section>

      {/* Task list or empty state */}
      <main className="flex-1 px-2 md:px-4 pb-24 md:pb-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {availableTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <ForecastList
            initialTasks={availableTasks}
            tasksByDate={tasksByDateObj}
            daysWithTasks={daysWithTasks}
          />
        )}
      </main>
    </div>
  );
}

/**
 * Empty state displayed when no tasks are due in the next 14 days.
 * Shows a calm, encouraging message.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center py-12 px-5 text-center">
      <span className="text-[32px] mb-2.5" role="img" aria-label="Calendar">
        📅
      </span>
      <p className="text-[14px] text-[var(--text-tertiary)]">
        Nothing scheduled for the next 2 weeks
      </p>
    </div>
  );
}
