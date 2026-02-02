import { prisma } from "@/lib/db";
import { getToday, formatDate } from "@/lib/utils";
import { TodayList } from "./TodayList";
import type { TaskWithRelations } from "@/types";

/**
 * Today page - displays tasks requiring attention today.
 * This includes:
 * - Tasks with due_date = today
 * - Deferred tasks where defer_date <= today AND due_date is null
 *
 * This is a server component that fetches data directly via Prisma.
 */
export default async function TodayPage() {
  const today = getToday();

  // Query today's tasks with relations needed for display
  const tasks = await prisma.task.findMany({
    where: {
      completed: false,
      OR: [
        { due_date: today },
        { defer_date: { lte: today }, due_date: null },
      ],
    },
    orderBy: [
      { project_id: "asc" },
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex flex-col px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[26px] md:text-[28px] font-normal text-[var(--text-primary)]">
            Today
          </h1>
          {typedTasks.length > 0 && (
            <span className="text-sm text-[var(--text-tertiary)]">
              {typedTasks.length}
            </span>
          )}
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">
          {formatDate(new Date())}
        </p>
      </header>

      {/* Task list or empty state */}
      <main className="flex-1 px-2 md:px-4 pb-24 md:pb-6">
        {typedTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <TodayList initialTasks={typedTasks} />
        )}
      </main>
    </div>
  );
}

/**
 * Empty state displayed when no tasks are due today.
 * Shows a calm, encouraging message.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
      <span className="text-[48px] mb-4" role="img" aria-label="Sun">
        ☀️
      </span>
      <p className="font-display text-lg text-[var(--text-secondary)]">
        Nothing due today — enjoy the calm
      </p>
    </div>
  );
}
