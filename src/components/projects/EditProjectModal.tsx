"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronIcon } from "@/components/ui/Icons";
import { updateProject } from "@/actions/projects";
import type { ProjectStatus, ProjectType } from "@/types";

/**
 * Area type for the modal props (minimal - just what we need for display)
 */
interface Area {
  id: string;
  name: string;
  color: string;
}

/**
 * Project type for the modal props (fields we need to display and edit)
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

/**
 * Props for the EditProjectModal component
 */
interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  areas: Area[];
  onUpdated?: () => void;
}

/**
 * Review interval options for the dropdown
 */
const REVIEW_INTERVAL_OPTIONS = [
  { value: 7, label: "Weekly" },
  { value: 14, label: "Bi-weekly" },
  { value: 30, label: "Monthly" },
  { value: null, label: "None" },
] as const;

/**
 * Modal dialog for editing existing projects.
 * Follows the NewProjectModal.tsx pattern for overlay, animations, and positioning.
 *
 * Entry points:
 * - Edit button in Project detail page header
 * - (Optional) Three-dot menu in ProjectCard
 */
export function EditProjectModal({
  isOpen,
  onClose,
  project,
  areas,
  onUpdated,
}: EditProjectModalProps) {
  // Form state - pre-filled with current project values
  const [name, setName] = useState(project.name);
  const [areaId, setAreaId] = useState(project.area_id);
  const [projectType, setProjectType] = useState<ProjectType>(project.type);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [reviewIntervalDays, setReviewIntervalDays] = useState<number | null>(
    project.review_interval_days
  );
  const [notes, setNotes] = useState(project.notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom dropdown state for area selection
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  // Custom dropdown state for review interval selection
  const [isIntervalDropdownOpen, setIsIntervalDropdownOpen] = useState(false);
  const intervalDropdownRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form state when project changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setAreaId(project.area_id);
      setProjectType(project.type);
      setStatus(project.status);
      setReviewIntervalDays(project.review_interval_days);
      setNotes(project.notes || "");
      setError(null);

      // Autofocus with small delay to ensure animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, project]);

  // Clear dropdown state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAreaDropdownOpen(false);
      setIsIntervalDropdownOpen(false);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close dropdowns first if open, otherwise close modal
        if (isAreaDropdownOpen) {
          setIsAreaDropdownOpen(false);
        } else if (isIntervalDropdownOpen) {
          setIsIntervalDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isAreaDropdownOpen, isIntervalDropdownOpen]);

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

  // Handle click outside to close interval dropdown
  useEffect(() => {
    if (!isIntervalDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        intervalDropdownRef.current &&
        !intervalDropdownRef.current.contains(e.target as Node)
      ) {
        setIsIntervalDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isIntervalDropdownOpen]);

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
    // Don't submit if empty name, no area selected, or already submitting
    const trimmedName = name.trim();
    if (!trimmedName || !areaId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateProject(project.id, {
        name: trimmedName,
        areaId,
        type: projectType,
        status,
        reviewIntervalDays: reviewIntervalDays,
        notes: notes.trim() || null,
      });

      if (result.success) {
        onClose();
        onUpdated?.();
      } else {
        setError(result.error || "Failed to update project");
      }
    } catch {
      setError("Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    areaId,
    projectType,
    status,
    reviewIntervalDays,
    notes,
    project.id,
    isSubmitting,
    onClose,
    onUpdated,
  ]);

  // Handle area selection from custom dropdown
  const handleAreaSelect = useCallback((selectedAreaId: string) => {
    setAreaId(selectedAreaId);
    setIsAreaDropdownOpen(false);
  }, []);

  // Handle interval selection from custom dropdown
  const handleIntervalSelect = useCallback((value: number | null) => {
    setReviewIntervalDays(value);
    setIsIntervalDropdownOpen(false);
  }, []);

  // Get currently selected area for display
  const selectedArea = areas.find((area) => area.id === areaId);

  // Get currently selected interval label for display
  const selectedIntervalLabel =
    REVIEW_INTERVAL_OPTIONS.find((opt) => opt.value === reviewIntervalDays)
      ?.label || "None";

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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
      aria-labelledby="edit-project-title"
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50
        flex justify-center
        bg-black/60 backdrop-blur-sm
        animate-in fade-in duration-150
        overflow-y-auto
      `}
    >
      {/* Modal Card */}
      <div
        className={`
          /* Position at 10vh from top to account for more content */
          mt-[10vh] mb-[10vh]
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
            id="edit-project-title"
            className={`
              text-[12px] font-medium tracking-[0.8px]
              text-[var(--text-tertiary)]
              uppercase
            `}
          >
            Edit Project
          </span>
        </div>

        {/* Form Content */}
        <div className="px-4 py-2 space-y-4">
          {/* Name Input */}
          <div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Project name"
              className={`
                w-full
                px-3 py-3
                text-[16px] font-normal
                text-[var(--text-primary)]
                placeholder:text-[var(--text-tertiary)]
                bg-[var(--bg-surface)]
                border border-[var(--border)]
                rounded-lg
                focus:outline-none focus:border-[var(--accent)]
                transition-colors duration-150
                disabled:opacity-60
              `}
            />
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
                      style={{
                        backgroundColor:
                          selectedArea?.color || "var(--text-tertiary)",
                      }}
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

          {/* Type Toggle - Single switch with labels */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Type
            </label>
            <button
              type="button"
              onClick={() => setProjectType(projectType === "SEQUENTIAL" ? "PARALLEL" : "SEQUENTIAL")}
              disabled={isSubmitting}
              className={`
                relative w-full h-[38px]
                bg-[var(--bg-surface)]
                border border-[var(--border)]
                rounded-[6px]
                transition-colors duration-150
                disabled:opacity-60
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
              `}
            >
              {/* Sliding indicator */}
              <span
                className={`
                  absolute top-[3px] bottom-[3px] w-[calc(50%-4px)]
                  bg-[var(--bg-card)]
                  border border-[var(--border)]
                  rounded-[4px]
                  shadow-sm
                  transition-all duration-200 ease-out
                  ${projectType === "SEQUENTIAL" ? "left-[3px]" : "left-[calc(50%+2px)]"}
                `}
              />
              {/* Labels */}
              <span className="relative z-10 flex h-full">
                <span
                  className={`
                    flex-1 flex items-center justify-center
                    text-[13px] font-medium
                    transition-colors duration-150
                    ${projectType === "SEQUENTIAL" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}
                  `}
                >
                  Sequential
                </span>
                <span
                  className={`
                    flex-1 flex items-center justify-center
                    text-[13px] font-medium
                    transition-colors duration-150
                    ${projectType === "PARALLEL" ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}
                  `}
                >
                  Parallel
                </span>
              </span>
            </button>
          </div>

          {/* Status Toggle - Active/Someday/Completed pills */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Status
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("ACTIVE")}
                disabled={isSubmitting}
                className={`
                  flex-1 px-3 py-2
                  text-[14px] font-medium
                  rounded-[6px]
                  border
                  transition-all duration-150
                  disabled:opacity-60
                  ${
                    status === "ACTIVE"
                      ? "bg-[rgba(232,168,124,0.12)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                  }
                `}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus("SOMEDAY")}
                disabled={isSubmitting}
                className={`
                  flex-1 px-3 py-2
                  text-[14px] font-medium
                  rounded-[6px]
                  border
                  transition-all duration-150
                  disabled:opacity-60
                  ${
                    status === "SOMEDAY"
                      ? "bg-[rgba(232,168,124,0.12)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                  }
                `}
              >
                Someday
              </button>
              <button
                type="button"
                onClick={() => setStatus("COMPLETED")}
                disabled={isSubmitting}
                className={`
                  flex-1 px-3 py-2
                  text-[14px] font-medium
                  rounded-[6px]
                  border
                  transition-all duration-150
                  disabled:opacity-60
                  ${
                    status === "COMPLETED"
                      ? "bg-[rgba(232,168,124,0.12)] border-[var(--accent)] text-[var(--accent)]"
                      : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                  }
                `}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Review Interval Select - Custom dropdown */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Review Interval
            </label>
            <div ref={intervalDropdownRef} className="relative">
              {/* Dropdown trigger button */}
              <button
                type="button"
                onClick={() =>
                  setIsIntervalDropdownOpen(!isIntervalDropdownOpen)
                }
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
                  ${isIntervalDropdownOpen ? "border-[var(--accent)]" : "hover:border-[var(--text-tertiary)]"}
                `}
              >
                <span>{selectedIntervalLabel}</span>
                <ChevronIcon
                  size={16}
                  className={`
                    text-[var(--text-tertiary)]
                    transition-transform duration-150
                    ${isIntervalDropdownOpen ? "rotate-180" : ""}
                  `}
                />
              </button>

              {/* Dropdown menu */}
              {isIntervalDropdownOpen && (
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
                  {REVIEW_INTERVAL_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleIntervalSelect(option.value)}
                      className={`
                        w-full
                        px-3 py-2
                        text-[14px] text-left
                        transition-colors duration-100
                        ${
                          option.value === reviewIntervalDays
                            ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes Textarea */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="Add notes about this project..."
              rows={3}
              className={`
                w-full
                px-3 py-2
                text-[14px] font-normal
                text-[var(--text-primary)]
                placeholder:text-[var(--text-tertiary)]
                bg-[var(--bg-surface)]
                border border-[var(--border)]
                rounded-lg
                focus:outline-none focus:border-[var(--accent)]
                transition-colors duration-150
                disabled:opacity-60
                resize-none
              `}
            />
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
          {/* Hint text */}
          <span className="text-[12px] text-[var(--text-tertiary)]">
            Press <kbd className="font-medium">Enter</kbd> to save
          </span>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim() || !areaId || isSubmitting}
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
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
