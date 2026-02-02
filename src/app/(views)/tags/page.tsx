import { prisma } from "@/lib/db";
import { TagsGrid } from "./TagsGrid";
import type { TagWithTasks, TaskWithRelations } from "@/types";

/**
 * Tags page - displays a grid of tag cards for context-based task filtering.
 * Users can tap a tag (e.g., @computer, @home) to see all incomplete tasks
 * associated with that context, enabling quick context switching for GTD workflow.
 *
 * This is a server component that fetches data directly via Prisma.
 */
export default async function TagsPage() {
  // Query all tags with their incomplete tasks and full task relations
  const tags = await prisma.tag.findMany({
    orderBy: { sort_order: "asc" },
    include: {
      tasks: {
        where: { task: { completed: false } },
        include: {
          task: {
            include: {
              project: { include: { area: true } },
              tags: { include: { tag: true } },
              reminders: true,
            },
          },
        },
      },
    },
  });

  // Transform to TagWithTasks view model
  const tagsWithTasks: TagWithTasks[] = tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    icon: tag.icon,
    taskCount: tag.tasks.length,
    tasks: tag.tasks.map((tt) => tt.task as TaskWithRelations),
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-baseline gap-3 px-4 pt-6 pb-4 md:px-6 md:pt-8 md:pb-5">
        <h1 className="font-display text-[26px] md:text-[28px] font-normal text-[var(--text-primary)]">
          Tags
        </h1>
        {tagsWithTasks.length > 0 && (
          <span className="text-sm text-[var(--text-tertiary)]">
            {tagsWithTasks.length}
          </span>
        )}
      </header>

      {/* Tag grid or empty state */}
      <main className="flex-1 px-2 md:px-4 pb-24 md:pb-6">
        {tagsWithTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <TagsGrid initialTags={tagsWithTasks} />
        )}
      </main>
    </div>
  );
}

/**
 * Empty state displayed when no tags exist.
 * Shows a message encouraging the user to create tags for context filtering.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
      <span className="text-[48px] mb-4" role="img" aria-label="Label">
        🏷️
      </span>
      <p className="font-display text-lg text-[var(--text-secondary)]">
        No tags yet — create tags to organize by context
      </p>
    </div>
  );
}
