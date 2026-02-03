"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AreaGroup } from "@/components/projects/AreaGroup";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import { AreaManagementModal } from "@/components/areas/AreaManagementModal";
import { completeTask } from "@/actions/tasks";
import { useSearch } from "@/context/SearchContext";
import { PlusIcon } from "@/components/ui/Icons";
import type { AreaWithProjectsAndCounts, SomedayProject } from "@/types";
import type { AreaForModal } from "./page";
import { EmptyState } from "./page";

interface ProjectsListProps {
  /** Areas with their active projects */
  areas: AreaWithProjectsAndCounts[];
  /** Map of project ID -> completed task count */
  completedCountMap: Record<string, number>;
  /** Someday/Maybe projects */
  somedayProjects: SomedayProject[];
  /** All areas for the NewProjectModal dropdown */
  allAreas: AreaForModal[];
  /** Whether the projects list is empty (no active or someday projects) */
  isEmpty: boolean;
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
  allAreas,
  isEmpty,
}: ProjectsListProps) {
  // Router for navigation after project creation
  const router = useRouter();
  // Modal state for NewProjectModal
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Modal state for AreaManagementModal
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  // Track which tasks are being completed to prevent double-clicks
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  // React transition for non-blocking server action calls
  const [, startTransition] = useTransition();
  // Search context for filtering
  const { query } = useSearch();

  // Modal handlers
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Area management modal handlers
  const handleOpenAreaModal = useCallback(() => {
    setIsAreaModalOpen(true);
  }, []);

  const handleCloseAreaModal = useCallback(() => {
    setIsAreaModalOpen(false);
  }, []);

  // Handle areas changed - refresh the page to update project groupings
  const handleAreasChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  // Navigate to project detail page after creation
  const handleProjectCreated = useCallback((projectId: string) => {
    router.push(`/projects/${projectId}`);
  }, [router]);

  // Filter tasks within projects based on search query
  const filteredAreas = useMemo(() => {
    if (!query.trim()) return areas;

    const lowerQuery = query.toLowerCase();
    return areas.map((area) => ({
      ...area,
      projects: area.projects.map((project) => ({
        ...project,
        tasks: project.tasks.filter((task) =>
          task.title.toLowerCase().includes(lowerQuery)
        ),
      })),
    }));
  }, [areas, query]);

  const isSearchActive = query.trim().length > 0;

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
  const handleTaskSelect = useCallback((_taskId: string) => {
    // Task selection will be handled by TaskDetail component in a future spec
  }, []);

  // Determine Someday section default state (collapsed if >3 items)
  const somedayDefaultExpanded = somedayProjects.length <= 3;

  // Show empty state when no projects exist
  if (isEmpty) {
    return (
      <>
        {/* Action header with Manage Areas button even in empty state */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={handleOpenAreaModal}
            className={`
              flex items-center gap-1.5
              px-3 py-1.5
              text-[14px] font-medium
              text-[var(--text-secondary)]
              bg-transparent
              rounded-md
              transition-all duration-150
              hover:bg-[var(--bg-hover)]
              hover:text-[var(--text-primary)]
              active:scale-[0.98]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
            `}
          >
            <span>Manage Areas</span>
          </button>
        </div>
        <EmptyState onCreateClick={handleOpenModal} />
        <NewProjectModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          areas={allAreas}
          onCreated={handleProjectCreated}
        />
        <AreaManagementModal
          isOpen={isAreaModalOpen}
          onClose={handleCloseAreaModal}
          onAreasChanged={handleAreasChanged}
        />
      </>
    );
  }

  return (
    <div>
      {/* Action header with Manage Areas and New Project buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          type="button"
          onClick={handleOpenAreaModal}
          className={`
            flex items-center gap-1.5
            px-3 py-1.5
            text-[14px] font-medium
            text-[var(--text-secondary)]
            bg-transparent
            rounded-md
            transition-all duration-150
            hover:bg-[var(--bg-hover)]
            hover:text-[var(--text-primary)]
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
          `}
        >
          <span>Manage Areas</span>
        </button>
        <button
          type="button"
          onClick={handleOpenModal}
          className={`
            flex items-center gap-1.5
            px-3 py-1.5
            text-[14px] font-medium
            text-[var(--accent)]
            bg-transparent
            rounded-md
            transition-all duration-150
            hover:bg-[rgba(232,168,124,0.12)]
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
          `}
        >
          <PlusIcon size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Search results indicator */}
      {isSearchActive && (
        <div className="px-4 py-2 text-sm text-[var(--text-secondary)]">
          Showing results for &apos;{query}&apos;
        </div>
      )}

      {/* Active projects grouped by area */}
      {filteredAreas.map((area) => (
        <AreaGroup
          key={area.id}
          name={area.name}
          color={area.color}
          projectCount={area.projects.length}
          defaultExpanded={true}
        >
          {area.projects.map((project) => {
            // Check if this project has matching tasks during search
            const hasMatchingTasks = project.tasks.length > 0;

            return (
              <div key={project.id}>
                <ProjectCard
                  project={project}
                  completedCount={completedCountMap[project.id] || 0}
                  onTaskComplete={handleTaskComplete}
                  onTaskSelect={handleTaskSelect}
                  variant="active"
                />
                {/* Empty state when search is active but no tasks match */}
                {isSearchActive && !hasMatchingTasks && (
                  <div className="px-4 py-2 text-sm text-[var(--text-secondary)] -mt-2 mb-2">
                    No tasks matching &apos;{query}&apos;
                  </div>
                )}
              </div>
            );
          })}
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

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        areas={allAreas}
        onCreated={handleProjectCreated}
      />

      {/* Area Management Modal */}
      <AreaManagementModal
        isOpen={isAreaModalOpen}
        onClose={handleCloseAreaModal}
        onAreasChanged={handleAreasChanged}
      />
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
