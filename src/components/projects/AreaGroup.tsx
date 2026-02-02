"use client";

import { useState, useCallback, type ReactNode } from "react";
import { ChevronIcon } from "@/components/ui/Icons";

interface AreaGroupProps {
  /** Area name to display */
  name: string;
  /** Area color for the dot indicator */
  color: string | null;
  /** Number of projects in this area */
  projectCount: number;
  /** Whether the section starts expanded (default: true) */
  defaultExpanded?: boolean;
  /** Project cards or other content to render inside the group */
  children: ReactNode;
}

/**
 * Get area color with fallback to accent
 */
function getAreaColor(color: string | null): string {
  return color || "var(--accent)";
}

/**
 * AreaGroup component - Collapsible section for grouping projects by area
 *
 * Displays:
 * - Chevron icon (rotates when collapsed)
 * - Colored dot (10px, area color)
 * - Area name
 * - Project count badge
 *
 * Clicking the header toggles visibility of nested content (projects).
 */
export function AreaGroup({
  name,
  color,
  projectCount,
  defaultExpanded = true,
  children,
}: AreaGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const areaColor = getAreaColor(color);

  return (
    <div className="mb-6">
      {/* Collapsible header */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`${name} area, ${projectCount} ${projectCount === 1 ? "project" : "projects"}${isExpanded ? ", expanded" : ", collapsed"}`}
        className={`
          flex items-center gap-2 cursor-pointer
          rounded-md py-2 px-1 -mx-1

          /* Hover state */
          hover:bg-[var(--bg-hover)]

          /* Focus state */
          focus:outline-none focus-visible:bg-[var(--bg-hover)]

          /* Transition */
          transition-colors duration-150 ease-out
        `}
      >
        {/* Chevron icon - rotates when collapsed */}
        <div
          className={`
            text-[var(--text-tertiary)]
            transition-transform duration-200 ease-out
            ${isExpanded ? "rotate-90" : "rotate-0"}
          `}
        >
          <ChevronIcon size={16} />
        </div>

        {/* Colored dot (10px) */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: areaColor }}
        />

        {/* Area name */}
        <span
          className="text-[14px] font-medium text-[var(--text-primary)] flex-1 truncate"
        >
          {name}
        </span>

        {/* Project count badge */}
        <span
          className={`
            flex-shrink-0 text-[11px] font-medium
            px-1.5 py-0.5 rounded-full
            bg-[var(--bg-surface)] text-[var(--text-secondary)]
          `}
        >
          {projectCount}
        </span>
      </div>

      {/* Expandable content area */}
      <div
        className={`
          overflow-hidden transition-all duration-200 ease-out
          ${isExpanded ? "opacity-100 max-h-[9999px]" : "opacity-0 max-h-0"}
        `}
      >
        {/* Projects grid/stack with spacing */}
        <div className="mt-3 flex flex-col gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}
