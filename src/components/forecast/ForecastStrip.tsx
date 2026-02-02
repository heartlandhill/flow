"use client";

import { getDayName, isToday } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

interface ForecastStripProps {
  dates: Date[];
  tasksByDate: Record<string, TaskWithRelations[]>;
}

/**
 * Helper to format date as YYYY-MM-DD for looking up tasks
 */
function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get the dot color for a task based on project area color
 * Falls back to #555 if no area color is available
 */
function getDotColor(task: TaskWithRelations): string {
  return task.project?.area?.color || "#555";
}

/**
 * ForecastStrip - Date strip component for the Forecast view.
 *
 * Displays 14 days in a responsive layout:
 * - Mobile: Horizontal scrollable strip with hidden scrollbar
 * - Desktop: 7-column CSS grid (2 rows for 14 days)
 *
 * Each cell shows:
 * - Day name (e.g., "SUN", "MON")
 * - Day number (e.g., "1", "14")
 * - Up to 3 colored dots representing tasks due that day
 */
export function ForecastStrip({ dates, tasksByDate }: ForecastStripProps) {
  return (
    <div
      className={`
        /* Mobile: horizontal scroll with hidden scrollbar */
        flex gap-2 overflow-x-auto
        [scrollbar-width:none]
        [-webkit-overflow-scrolling:touch]
        [&::-webkit-scrollbar]:hidden

        /* Desktop: 7-column grid */
        md:grid md:grid-cols-7 md:gap-2 md:overflow-visible
      `}
    >
      {dates.map((date) => {
        const dateKey = getDateKey(date);
        const dayTasks = tasksByDate[dateKey] || [];
        const isTodayDate = isToday(date);

        return (
          <DateCell
            key={dateKey}
            date={date}
            tasks={dayTasks}
            isToday={isTodayDate}
          />
        );
      })}
    </div>
  );
}

interface DateCellProps {
  date: Date;
  tasks: TaskWithRelations[];
  isToday: boolean;
}

/**
 * DateCell - Individual cell in the date strip.
 *
 * Shows:
 * - Day name: 10px uppercase, tertiary color
 * - Day number: 18px, primary color
 * - Up to 3 dots: 6px diameter, colored by area
 *
 * Today's cell has special styling:
 * - 2px accent border
 * - rgba(232,168,124,0.08) background tint
 */
function DateCell({ date, tasks, isToday }: DateCellProps) {
  const dayName = getDayName(date);
  const dayNumber = date.getDate();

  // Get up to 3 dot colors from tasks
  const dotColors = tasks.slice(0, 3).map(getDotColor);

  return (
    <div
      className={`
        /* Base cell styling */
        flex flex-col items-center justify-center
        py-3 rounded-lg
        transition-colors duration-150

        /* Mobile: fixed 60px width */
        w-[60px] min-w-[60px]

        /* Desktop: expand to fill grid cell */
        md:w-auto md:min-w-0

        /* Today styling: accent border + tinted background */
        ${isToday
          ? "border-2 border-[var(--accent)] bg-[rgba(232,168,124,0.08)]"
          : "border border-transparent bg-[var(--bg-surface)]"
        }
      `}
    >
      {/* Day name: 10px uppercase tertiary */}
      <span className="text-[10px] font-medium uppercase text-[var(--text-tertiary)] leading-none">
        {dayName}
      </span>

      {/* Day number: 18px primary */}
      <span className="text-[18px] font-normal text-[var(--text-primary)] leading-tight mt-1">
        {dayNumber}
      </span>

      {/* Task dots: max 3, 6px each */}
      <div className="flex items-center gap-1 mt-2 h-[6px]">
        {dotColors.map((color, index) => (
          <span
            key={index}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}
