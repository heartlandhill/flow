"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronIcon } from "@/components/ui/Icons";
import { convertTaskToProject } from "@/actions/tasks";

/**
 * Area type for the modal props (minimal - just what we need for display)
 */
interface Area {
  id: string;
  name: string;
  color: string;
}

/**
 * Props for the ConvertToProjectModal component
 */
interface ConvertToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  areas: Area[];
  onConverted?: (projectId: string) => void;
}

/**
 * Modal dialog for converting an inbox task to a project.
 * Follows the NewProjectModal.tsx pattern for overlay, animations, and positioning.
 *
 * Entry point:
 * - "Convert to Project" button in TaskDetailContent for inbox tasks only
 *
 * GTD Workflow:
 * - During inbox processing, users ask "Is this a single action or a project?"
 * - When the answer is "project," this modal provides a streamlined conversion
 * - Task title becomes project name, original task is deleted
 */
export function ConvertToProjectModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  areas,
  onConverted,
}: ConvertToProjectModalProps) {
  // Form state (no name input - uses taskTitle)
  const [areaId, setAreaId] = useState("");
  const [projectType, setProjectType] = useState<"PARALLEL" | "SEQUENTIAL">("PARALLEL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom dropdown state for area selection
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  // Pre-select first area when modal opens
  useEffect(() => {
    if (isOpen) {
      // Pre-select first area if available and no area selected
      if (areas.length > 0 && !areaId) {
        setAreaId(areas[0].id);
      }
    }
  }, [isOpen, areas, areaId]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Close dropdown immediately
      setIsAreaDropdownOpen(false);
      // Delay clearing form fields to allow close animation
      const timer = setTimeout(() => {
        setAreaId("");
        setProjectType("PARALLEL");
        setError(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close area dropdown first if open, otherwise close modal
        if (isAreaDropdownOpen) {
          setIsAreaDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isAreaDropdownOpen]);

  // Handle click outside to close area dropdown
  useEffect(() => {
    if (!isAreaDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        areaDropdownRef.current &&
        !areaDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAreaDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAreaDropdownOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the overlay itself, not the modal
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = useCallback(async () => {
    // Don't submit if no area selected or already submitting
    if (!areaId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await convertTaskToProject(taskId, areaId, projectType);

      if (result.success && result.data) {
        onClose();
        // Notify parent of successful conversion with new project ID
        onConverted?.(result.data.id);
      } else {
        setError(result.error || "Failed to convert task to project");
      }
    } catch {
      setError("Failed to convert task to project");
    } finally {
      setIsSubmitting(false);
    }
  }, [taskId, areaId, projectType, isSubmitting, onClose, onConverted]);

  // Handle area selection from custom dropdown
  const handleAreaSelect = useCallback((selectedAreaId: string) => {
    setAreaId(selectedAreaId);
    setIsAreaDropdownOpen(false);
  }, []);

  // Get currently selected area for display
  const selectedArea = areas.find((area) => area.id === areaId);

  // Handle Enter key to submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Don't render anything when closed
  if (!isOpen) return null;

  // Handle edge case: no areas available
  const hasAreas = areas.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="convert-to-project-title"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      className={`
        fixed inset-0 z-50
        flex justify-center
        bg-black/60 backdrop-blur-sm
        animate-in fade-in duration-150
      `}
    >
      {/* Modal Card */}
      <div
        className={`
          /* Position at 15vh from top */
          mt-[15vh]
          h-fit

          /* Width: mobile calc(100% - 32px) max 420px, desktop 440px */
          w-[calc(100%-32px)] max-w-[420px]
          md:w-[440px] md:max-w-[440px]

          /* Styling */
          bg-[var(--bg-card)]
          border border-[var(--border)]
          rounded-[14px]
          shadow-xl

          /* Animation */
          animate-in fade-in slide-in-from-bottom-2 zoom-in-[0.97]
          duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <span
            id="convert-to-project-title"
            className={`
              text-[12px] font-medium tracking-[0.8px]
              text-[var(--text-tertiary)]
              uppercase
            `}
          >
            Convert to Project
          </span>
        </div>

        {/* Form Content */}
        <div className="px-4 py-2 space-y-4">
          {/* Task Title (Read-only) */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Project Name
            </label>
            <div
              className={`
                w-full
                px-3 py-3
                text-[16px] font-normal
                text-[var(--text-primary)]
                bg-[var(--bg-surface)]
                border border-[var(--border)]
                rounded-lg
              `}
            >
              {taskTitle}
            </div>
          </div>

          {/* Area Select - Custom dropdown with colored dots */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Area
            </label>
            {hasAreas ? (
              <div ref={areaDropdownRef} className="relative">
                {/* Dropdown trigger button */}
                <button
                  type="button"
                  onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
                  disabled={isSubmitting}
                  className={`
                    w-full
                    flex items-center justify-between
                    px-3 py-2
                    text-[14px]
                    text-[var(--text-primary)]
                    bg-[var(--bg-surface)]
                    border border-[var(--border)]
                    rounded-[6px]
                    transition-colors duration-150
                    disabled:opacity-60
                    ${isAreaDropdownOpen ? "border-[var(--accent)]" : "hover:border-[var(--text-tertiary)]"}
                  `}
                >
                  <span className="flex items-center gap-2">
                    {/* Colored dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: selectedArea?.color || "var(--text-tertiary)" }}
                    />
                    <span>{selectedArea?.name || "Select area"}</span>
                  </span>
                  <ChevronIcon
                    size={16}
                    className={`
                      text-[var(--text-tertiary)]
                      transition-transform duration-150
                      ${isAreaDropdownOpen ? "rotate-180" : ""}
                    `}
                  />
                </button>

                {/* Dropdown menu */}
                {isAreaDropdownOpen && (
                  <div
                    className={`
                      absolute top-full left-0 right-0 mt-1
                      py-1
                      bg-[var(--bg-card)]
                      border border-[var(--border)]
                      rounded-[6px]
                      shadow-lg
                      z-10
                      animate-in fade-in slide-in-from-top-1 duration-100
                    `}
                  >
                    {areas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => handleAreaSelect(area.id)}
                        className={`
                          w-full
                          flex items-center gap-2
                          px-3 py-2
                          text-[14px] text-left
                          transition-colors duration-100
                          ${
                            area.id === areaId
                              ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                          }
                        `}
                      >
                        {/* Colored dot */}
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: area.color }}
                        />
                        <span>{area.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-[#E88B8B] mt-1">
                No areas available. Please create an area first.
              </p>
            )}
          </div>

          {/* Type Toggle - Parallel/Sequential pills */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProjectType("PARALLEL")}
                disabled={isSubmitting}
                className={`
                  flex-1 px-3 py-2
                  text-[14px] font-medium
                  rounded-[6px]
                  border
                  transition-all duration-150
                  disabled:opacity-60
                  ${
                    projectType === "PARALLEL"
                      ? "bg-[rgba(232,168,124,0.12)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                  }
                `}
              >
                Parallel
              </button>
              <button
                type="button"
                onClick={() => setProjectType("SEQUENTIAL")}
                disabled={isSubmitting}
                className={`
                  flex-1 px-3 py-2
                  text-[14px] font-medium
                  rounded-[6px]
                  border
                  transition-all duration-150
                  disabled:opacity-60
                  ${
                    projectType === "SEQUENTIAL"
                      ? "bg-[rgba(232,168,124,0.12)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                  }
                `}
              >
                Sequential
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 pb-2">
            <p className="text-[12px] text-[#E88B8B]">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2">
          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`
              px-4 py-1.5
              text-[14px] font-medium
              text-[var(--text-secondary)]
              hover:text-[var(--text-primary)]
              transition-colors duration-150
              disabled:opacity-60
            `}
          >
            Cancel
          </button>

          {/* Create button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!areaId || isSubmitting}
            className={`
              px-4 py-1.5
              text-[14px] font-medium
              text-[var(--bg-root)]
              bg-[var(--accent)]
              rounded-md
              transition-all duration-150
              hover:opacity-90
              active:scale-[0.98] active:brightness-90
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isSubmitting ? "Converting..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}
