"use client";

import { TaskRow } from "@/components/tasks/TaskRow";
import { formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

interface ForecastDayGroupProps {
  date: Date;
  tasks: TaskWithRelations[];
  onComplete: (taskId: string) => void;
  onSelect?: (taskId: string) => void;
}

/**
 * ForecastDayGroup component for displaying a day header and its tasks.
 * Used in the Forecast view to group tasks by due date.
 *
 * Only rendered for days that have tasks - empty days are skipped.
 *
 * Structure:
 * - Day header: Newsreader 16px/500 with task count badge
 * - Task list: TaskRow for each task in the day
 */
export function ForecastDayGroup({
  date,
  tasks,
  onComplete,
  onSelect,
}: ForecastDayGroupProps) {
  // Don't render if no tasks for this day
  if (tasks.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Day header with date and task count */}
      <div className="flex items-baseline gap-2 px-2 mb-2">
        <h2 className="font-display text-[16px] font-medium text-[var(--text-primary)]">
          {formatDate(date)}
        </h2>
        <span className="text-[13px] text-[var(--text-tertiary)]">
          {tasks.length}
        </span>
      </div>
      {/* Task list for this day */}
      <div className="flex flex-col">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onComplete}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
