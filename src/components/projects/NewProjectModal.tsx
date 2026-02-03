"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronIcon } from "@/components/ui/Icons";
import { createProject } from "@/actions/projects";
import { deleteTask } from "@/actions/tasks";

/**
 * Area type for the modal props (minimal - just what we need for display)
 */
interface Area {
  id: string;
  name: string;
  color: string;
}

/**
 * Props for the NewProjectModal component
 */
interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: Area[];
  onCreated?: (projectId: string) => void;
  /** Optional default name to pre-fill the input (e.g., when converting a task) */
  defaultName?: string;
  /** Optional task ID to delete after project creation (for task-to-project conversion) */
  taskIdToConvert?: string;
  /** Optional custom header title (defaults to "New Project") */
  headerTitle?: string;
}

/**
 * Modal dialog for creating new projects.
 * Follows the QuickCapture.tsx pattern for overlay, animations, and positioning.
 *
 * Entry points:
 * - "New Project" button in Projects page header
 * - "Create Project" CTA in Projects page empty state
 * - "+ New Project" link in task edit panel
 */
export function NewProjectModal({
  isOpen,
  onClose,
  areas,
  onCreated,
  defaultName = "",
  taskIdToConvert,
  headerTitle,
}: NewProjectModalProps) {
  // Form state - initialize with defaultName if provided
  const [name, setName] = useState(defaultName);
  const [areaId, setAreaId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom dropdown state for area selection
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-select first area, set default name, and autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Pre-select first area if available and no area selected
      if (areas.length > 0 && !areaId) {
        setAreaId(areas[0].id);
      }

      // Set default name if provided
      if (defaultName) {
        setName(defaultName);
      }

      // Autofocus with small delay to ensure animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        // Select all text if there's a default name (for easy replacement)
        if (defaultName && inputRef.current) {
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, areas, areaId, defaultName]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Close dropdown immediately
      setIsAreaDropdownOpen(false);
      // Delay clearing form fields to allow close animation
      const timer = setTimeout(() => {
        setName("");
        setAreaId("");
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
    // Don't submit if empty, no area selected, or already submitting
    const trimmedName = name.trim();
    if (!trimmedName || !areaId || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createProject({
        name: trimmedName,
        areaId,
        type: "SEQUENTIAL",
      });

      if (result.success && result.data) {
        // If converting a task, delete the original task
        if (taskIdToConvert) {
          const deleteResult = await deleteTask(taskIdToConvert);
          if (!deleteResult.success) {
            console.error("Failed to delete converted task:", deleteResult.error);
            // Still consider conversion successful - project was created
          }
        }

        onClose();
        // Notify parent of successful creation with new project ID
        onCreated?.(result.data.id);
      } else {
        setError(result.error || "Failed to create project");
      }
    } catch {
      setError("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, areaId, isSubmitting, onClose, onCreated, taskIdToConvert]);

  // Handle area selection from custom dropdown
  const handleAreaSelect = useCallback((selectedAreaId: string) => {
    setAreaId(selectedAreaId);
    setIsAreaDropdownOpen(false);
  }, []);

  // Get currently selected area for display
  const selectedArea = areas.find((area) => area.id === areaId);

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

  // Use portal to render at document root (fixes positioning when opened from bottom sheets)
  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
      onClick={handleOverlayClick}
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
          /* Position at 15vh from top, reduced on mobile for more space */
          mt-[10vh] md:mt-[15vh]

          /* Max height with flex layout for overflow handling */
          max-h-[80vh]
          flex flex-col

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
        <div className="flex items-center gap-2 px-4 pt-4 pb-2 flex-shrink-0">
          <span
            id="new-project-title"
            className={`
              text-[12px] font-medium tracking-[0.8px]
              text-[var(--text-tertiary)]
              uppercase
            `}
          >
            {headerTitle || "New Project"}
          </span>
        </div>

        {/* Form Content - scrollable */}
        <div className="px-4 py-2 space-y-4 flex-1 overflow-y-auto">
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
                      /* Limit height with scrollable overflow for many areas */
                      max-h-[150px] overflow-y-auto
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

        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 pb-2 flex-shrink-0">
            <p className="text-[12px] text-[#E88B8B]">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2 flex-shrink-0">
          {/* Hint text */}
          <span className="text-[12px] text-[var(--text-tertiary)]">
            Press <kbd className="font-medium">Enter</kbd> to create
          </span>

          {/* Create button */}
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
            {isSubmitting
              ? taskIdToConvert
                ? "Converting..."
                : "Creating..."
              : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );

  // Render via portal to document body for correct positioning
  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
