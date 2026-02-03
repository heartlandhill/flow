"use client";

import { useState, useCallback } from "react";
import { EditProjectModal } from "@/components/projects/EditProjectModal";
import type { ProjectStatus, ProjectType } from "@/types";

/**
 * Area type for the header props (minimal - just what we need for display and modal)
 */
interface Area {
  id: string;
  name: string;
  color: string;
}

/**
 * Project data needed for display and editing
 */
interface ProjectData {
  id: string;
  name: string;
  notes: string | null;
  status: ProjectStatus;
  type: ProjectType;
  area_id: string;
  review_interval_days: number | null;
}

interface ProjectDetailHeaderProps {
  /** Project data for display and editing */
  project: ProjectData;
  /** Area for the project (for badge display) */
  area: Area;
  /** All areas for the EditProjectModal dropdown */
  areas: Area[];
}

/**
 * Client component wrapper for the project detail header.
 * Handles edit button click and modal state management.
 *
 * Displays:
 * - Project name heading
 * - Area badge with colored dot
 * - Edit button (accent color, similar to "New Project" button)
 */
export function ProjectDetailHeader({
  project,
  area,
  areas,
}: ProjectDetailHeaderProps) {
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal handlers
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Get area color with fallback
  const areaColor = area.color || "var(--accent)";

  return (
    <>
      {/* Project name and area badge */}
      <div className="flex items-center gap-3">
        <h1 className="font-display text-[26px] md:text-[28px] font-medium text-[var(--text-primary)]">
          {project.name}
        </h1>

        {/* Area badge */}
        <span
          className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
          style={{
            backgroundColor: `${areaColor}20`,
            color: areaColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: areaColor }}
          />
          {area.name}
        </span>

        {/* Edit button */}
        <button
          type="button"
          onClick={handleOpenModal}
          className={`
            flex items-center gap-1
            px-2.5 py-1
            text-[13px] font-medium
            text-[var(--accent)]
            bg-transparent
            rounded-md
            transition-all duration-150
            hover:bg-[rgba(232,168,124,0.12)]
            active:scale-[0.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
          `}
        >
          {/* Pencil icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            className="opacity-80"
          >
            <path
              d="M11.5 2.5L13.5 4.5M2 14L2.5 11.5L11 3L13 5L4.5 13.5L2 14Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Edit</span>
        </button>
      </div>

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={project}
        areas={areas}
      />
    </>
  );
}
