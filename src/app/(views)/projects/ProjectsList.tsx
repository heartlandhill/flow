"use client";

import { useState, useCallback, useTransition } from "react";
import { AreaGroup } from "@/components/projects/AreaGroup";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { completeTask } from "@/actions/tasks";
import type { AreaWithProjectsAndCounts, SomedayProject } from "@/types";

interface ProjectsListProps {
  /** Areas with their active projects */
  areas: AreaWithProjectsAndCounts[];
  /** Map of project ID -> completed task count */
  completedCountMap: Record<string, number>;
  /** Someday/Maybe projects */
  somedayProjects: SomedayProject[];
}

/**
 * Client component for rendering the projects list with task completion handling.
 *
 * Renders:
 * - Area groups with their active projects
 * - Someday/Maybe section at the bottom
 */
export function ProjectsList({
  areas,
  completedCountMap,
  somedayProjects,
}: ProjectsListProps) {
  // Track which tasks are being completed to prevent double-clicks
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // React transition for non-blocking server action calls
  const [, startTransition] = useTransition();

  // Handler for task completion
  const handleTaskComplete = useCallback(
    (taskId: string) => {
      // Prevent completing the same task twice
      if (completingIds.has(taskId)) return;

      // Mark task as completing
      setCompletingIds((prev) => new Set(prev).add(taskId));

      // Call server action in a transition
      startTransition(async () => {
        const result = await completeTask(taskId);

        if (!result.success) {
          console.error("Failed to complete task:", result.error);
        }

        // Remove from completing set
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      });
    },
    [completingIds]
  );

  // Placeholder for task selection (future implementation)
  const handleTaskSelect = useCallback((taskId: string) => {
    // Task selection will be handled by TaskDetail component in a future spec
  }, []);

  // Determine Someday section default state (collapsed if >3 items)
  const somedayDefaultExpanded = somedayProjects.length <= 3;

  return (
    <div>
      {/* Active projects grouped by area */}
      {areas.map((area) => (
        <AreaGroup
          key={area.id}
          name={area.name}
          color={area.color}
          projectCount={area.projects.length}
          defaultExpanded={true}
        >
          {area.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              completedCount={completedCountMap[project.id] || 0}
              onTaskComplete={handleTaskComplete}
              onTaskSelect={handleTaskSelect}
              variant="active"
            />
          ))}
        </AreaGroup>
      ))}

      {/* Someday/Maybe section */}
      {somedayProjects.length > 0 && (
        <>
          {/* Separator */}
          <hr className="border-t border-[var(--border)] my-6" />

          {/* Someday section */}
          <SomedaySection
            projects={somedayProjects}
            defaultExpanded={somedayDefaultExpanded}
          />
        </>
      )}
    </div>
  );
}

/**
 * Someday/Maybe collapsible section
 */
function SomedaySection({
  projects,
  defaultExpanded,
}: {
  projects: SomedayProject[];
  defaultExpanded: boolean;
}) {
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

  return (
    <div className="mb-6">
      {/* Section header */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-label={`Someday/Maybe, ${projects.length} ${projects.length === 1 ? "project" : "projects"}${isExpanded ? ", expanded" : ", collapsed"}`}
        className={`
          flex items-center gap-2 cursor-pointer
          rounded-md py-2 px-1 -mx-1
          hover:bg-[var(--bg-hover)]
          focus:outline-none focus-visible:bg-[var(--bg-hover)]
          transition-colors duration-150 ease-out
        `}
      >
        {/* Chevron icon */}
        <div
          className={`
            text-[var(--text-tertiary)]
            transition-transform duration-200 ease-out
            ${isExpanded ? "rotate-90" : "rotate-0"}
          `}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </div>

        {/* Section title */}
        <h2 className="font-display text-[18px] font-normal text-[var(--text-secondary)]">
          Someday/Maybe
        </h2>

        {/* Project count badge */}
        <span
          className={`
            flex-shrink-0 text-[11px] font-medium
            px-1.5 py-0.5 rounded-full
            bg-[var(--bg-surface)] text-[var(--text-secondary)]
          `}
        >
          {projects.length}
        </span>
      </div>

      {/* Expandable content */}
      <div
        className={`
          overflow-hidden transition-all duration-200 ease-out
          ${isExpanded ? "opacity-100 max-h-[9999px]" : "opacity-0 max-h-0"}
        `}
      >
        <div className="mt-3 flex flex-col gap-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} variant="someday" />
          ))}
        </div>
      </div>
    </div>
  );
}
