import { prisma } from "@/lib/db";
import { InboxList } from "./InboxList";
import type { TaskWithRelations } from "@/types";

/**
 * Inbox page - displays all unclarified tasks (inbox = true, completed = false).
 * This is a server component that fetches data directly via Prisma.
 */
export default async function InboxPage() {
  // Query inbox tasks with relations needed for display
  const tasks = await prisma.task.findMany({
    where: {
      inbox: true,
      completed: false,
    },
    orderBy: {
      created_at: "desc",
    },
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
      <header className="flex items-baseline gap-3 px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        <h1 className="font-display text-[26px] md:text-[28px] font-medium text-[var(--text-primary)]">
          Inbox
        </h1>
        {typedTasks.length > 0 && (
          <span className="text-sm text-[var(--text-tertiary)]">
            {typedTasks.length}
          </span>
        )}
      </header>

      {/* Task list or empty state */}
      <main className="flex-1 px-2 md:px-4 pb-24 md:pb-6">
        {typedTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <InboxList initialTasks={typedTasks} />
        )}
      </main>
    </div>
  );
}

/**
 * Empty state displayed when inbox has no tasks.
 * Shows a celebratory message encouraging "inbox zero" achievement.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center py-12 px-5 text-center">
      <span className="text-[32px] mb-2.5" role="img" aria-label="Sparkles">
        ✨
      </span>
      <p className="text-[14px] text-[var(--text-tertiary)]">
        Inbox zero — everything is processed
      </p>
    </div>
  );
}
