"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { TaskRow } from "@/components/tasks/TaskRow";
import { completeTask } from "@/actions/tasks";
import type { TagWithTasks, TaskWithRelations } from "@/types";

interface TagsGridProps {
  initialTags: TagWithTasks[];
}

/**
 * Client component for the Tags view.
 * Displays a grid of tag cards with single-selection behavior.
 * When a tag is selected, shows a filtered list of incomplete tasks.
 */
export function TagsGrid({ initialTags }: TagsGridProps) {
  // Local state for tags (for optimistic task count updates)
  const [tags, setTags] = useState<TagWithTasks[]>(initialTags);
  // Currently selected tag ID (null = no selection)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  // Track tasks being completed (prevent double-clicks)
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // React transition for non-blocking server action calls
  const [, startTransition] = useTransition();

  // Get the currently selected tag
  const selectedTag = useMemo(
    () => tags.find((t) => t.id === selectedTagId) ?? null,
    [tags, selectedTagId]
  );

  // Sort tasks: due_date ASC (nulls last), then created_at DESC
  const sortedTasks = useMemo(() => {
    if (!selectedTag) return [];
    return [...selectedTag.tasks].sort((a, b) => {
      // due_date ASC, nulls last
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      if (a.due_date && b.due_date) {
        const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (dateDiff !== 0) return dateDiff;
      }
      // then created_at DESC
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [selectedTag]);

  // Handle tag card click
  const handleTagClick = useCallback((tagId: string) => {
    setSelectedTagId((prev) => (prev === tagId ? null : tagId));
  }, []);

  // Handle task completion
  const handleComplete = useCallback(
    (taskId: string) => {
      // Prevent completing the same task twice
      if (completingIds.has(taskId)) return;

      // Mark task as completing
      setCompletingIds((prev) => new Set(prev).add(taskId));

      // Find which tag(s) contain this task and optimistically update
      const taskToRemove = selectedTag?.tasks.find((t) => t.id === taskId);

      setTags((prevTags) =>
        prevTags.map((tag) => {
          const hasTask = tag.tasks.some((t) => t.id === taskId);
          if (!hasTask) return tag;
          return {
            ...tag,
            taskCount: tag.taskCount - 1,
            tasks: tag.tasks.filter((t) => t.id !== taskId),
          };
        })
      );

      // Call server action in a transition
      startTransition(async () => {
        const result = await completeTask(taskId);

        if (!result.success) {
          // Restore task on failure
          console.error("Failed to complete task:", result.error);
          if (taskToRemove) {
            setTags((prevTags) =>
              prevTags.map((tag) => {
                // Check if this tag originally had the task
                const originalTag = initialTags.find((t) => t.id === tag.id);
                const hadTask = originalTag?.tasks.some((t) => t.id === taskId);
                if (!hadTask) return tag;
                return {
                  ...tag,
                  taskCount: tag.taskCount + 1,
                  tasks: [...tag.tasks, taskToRemove],
                };
              })
            );
          }
        }

        // Remove from completing set
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      });
    },
    [selectedTag, completingIds, initialTags]
  );

  const handleSelect = useCallback(() => {
    // Task selection will be handled by TaskDetail component in a future spec
    // For now, this is a placeholder for the click handler
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Tag Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[10px] md:gap-3">
        {tags.map((tag) => (
          <TagCard
            key={tag.id}
            tag={tag}
            isActive={tag.id === selectedTagId}
            onClick={handleTagClick}
          />
        ))}
      </div>

      {/* Filtered Task List */}
      {selectedTag && (
        <div className="flex flex-col gap-2">
          {/* Section header */}
          <h2 className="text-[13px] text-[var(--text-secondary)] px-2 md:px-0">
            Tasks tagged {selectedTag.icon || "#"} {selectedTag.name}
          </h2>

          {/* Task list or empty state */}
          {sortedTasks.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-center">
              <p className="text-[14px] text-[var(--text-tertiary)]">
                No tasks with this tag
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {sortedTasks.map((task: TaskWithRelations) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TagCardProps {
  tag: TagWithTasks;
  isActive: boolean;
  onClick: (tagId: string) => void;
}

/**
 * Individual tag card component.
 * Shows emoji icon, tag name, and incomplete task count.
 */
function TagCard({ tag, isActive, onClick }: TagCardProps) {
  const handleClick = useCallback(() => {
    onClick(tag.id);
  }, [onClick, tag.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(tag.id);
      }
    },
    [onClick, tag.id]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        flex flex-col items-start gap-1.5
        p-3.5 rounded-[10px]
        border transition-colors duration-150
        text-left w-full
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2

        ${
          isActive
            ? "border-[var(--accent)] bg-[rgba(232,168,124,0.06)]"
            : "border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]"
        }
      `}
    >
      {/* Icon and count row */}
      <div className="flex items-center justify-between w-full">
        {/* Tag icon */}
        <span className="text-[18px]" role="img" aria-hidden="true">
          {tag.icon || "#"}
        </span>

        {/* Task count pill */}
        <span
          className={`
            text-[11px] font-medium px-1.5 py-0.5 rounded-full
            ${
              isActive
                ? "text-[var(--accent)] bg-[rgba(232,168,124,0.15)]"
                : "text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]"
            }
          `}
        >
          {tag.taskCount}
        </span>
      </div>

      {/* Tag name */}
      <span className="text-[14px] text-[var(--text-primary)] truncate w-full">
        {tag.name}
      </span>
    </button>
  );
}
