"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ForecastIcon, CloseIcon } from "@/components/ui/Icons";
import { updateTask, deleteTask } from "@/actions/tasks";
import { useSelectedTask } from "@/context/SelectedTaskContext";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import type { TaskWithRelations, UpdateTaskInput } from "@/types";

// Simplified type for project dropdown - just need id, name, and area info
interface ProjectForDropdown {
  id: string;
  name: string;
}

interface AreaWithProjects {
  id: string;
  name: string;
  color: string;
  projects: ProjectForDropdown[];
}

// Simplified type for tag toggle pills
interface TagForToggle {
  id: string;
  name: string;
  icon: string | null;
}

interface TaskDetailContentProps {
  task: TaskWithRelations;
  onEditClick?: () => void;
  /** Areas with their projects for the project dropdown */
  areasWithProjects?: AreaWithProjects[];
  /** All available tags for tag toggle pills */
  allTags?: TagForToggle[];
}

/**
 * Get the due date display info based on temporal proximity
 * Replicates logic from TaskRow.tsx for consistency
 */
function getDueDateInfo(dueDate: Date | null): {
  label: string;
  textColor: string;
  bgColor: string;
} | null {
  if (!dueDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Format date label
  const formatDate = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  if (diffDays < 0) {
    // Overdue
    return {
      label: formatDate(due),
      textColor: "text-[#E88B8B]",
      bgColor: "bg-[rgba(232,139,139,0.14)]",
    };
  } else if (diffDays === 0) {
    // Today
    return {
      label: "Today",
      textColor: "text-[#F2D06B]",
      bgColor: "bg-[rgba(242,208,107,0.12)]",
    };
  } else if (diffDays === 1) {
    // Tomorrow
    return {
      label: "Tomorrow",
      textColor: "text-[#E8A87C]",
      bgColor: "bg-[rgba(232,168,124,0.12)]",
    };
  } else {
    // Future
    return {
      label: formatDate(due),
      textColor: "text-[var(--text-secondary)]",
      bgColor: "bg-[var(--bg-surface)]",
    };
  }
}

/**
 * Get defer date display info - uses same color coding as due dates
 */
function getDeferDateInfo(deferDate: Date | null): {
  label: string;
  textColor: string;
  bgColor: string;
} | null {
  if (!deferDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const defer = new Date(deferDate.getFullYear(), deferDate.getMonth(), deferDate.getDate());

  const diffTime = defer.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Format date label
  const formatDate = (date: Date): string => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  if (diffDays < 0) {
    // Past defer date (task should be visible)
    return {
      label: formatDate(defer),
      textColor: "text-[var(--text-secondary)]",
      bgColor: "bg-[var(--bg-surface)]",
    };
  } else if (diffDays === 0) {
    // Deferred until today
    return {
      label: "Today",
      textColor: "text-[#F2D06B]",
      bgColor: "bg-[rgba(242,208,107,0.12)]",
    };
  } else if (diffDays === 1) {
    // Deferred until tomorrow
    return {
      label: "Tomorrow",
      textColor: "text-[#E8A87C]",
      bgColor: "bg-[rgba(232,168,124,0.12)]",
    };
  } else {
    // Future defer date
    return {
      label: formatDate(defer),
      textColor: "text-[var(--text-secondary)]",
      bgColor: "bg-[var(--bg-surface)]",
    };
  }
}

/**
 * Get area color for project label
 */
function getAreaColor(areaColor: string | null | undefined): string {
  // Use the area's color if provided, fallback to accent
  return areaColor || "var(--accent)";
}

/**
 * TaskDetailContent renders task fields in display or edit mode.
 * Shared between mobile bottom sheet and desktop side panel.
 */
export function TaskDetailContent({ task, onEditClick, areasWithProjects = [], allTags = [] }: TaskDetailContentProps) {
  const { clearSelectedTask, updateSelectedTask } = useSelectedTask();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert Date to YYYY-MM-DD string for input type="date"
  const dateToInputString = (date: Date | null): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  // Form state for edit mode - pre-filled with current values
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedNotes, setEditedNotes] = useState(task.notes || "");
  const [editedProjectId, setEditedProjectId] = useState<string | null>(task.project_id);
  const [editedDueDate, setEditedDueDate] = useState(dateToInputString(task.due_date));
  const [editedDeferDate, setEditedDeferDate] = useState(dateToInputString(task.defer_date));
  const [editedTagIds, setEditedTagIds] = useState<Set<string>>(
    () => new Set(task.tags.map((t) => t.tag_id))
  );

  // Ref for notes textarea auto-grow
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  const dueDateInfo = getDueDateInfo(task.due_date);
  const deferDateInfo = getDeferDateInfo(task.defer_date);
  const areaColor = getAreaColor(task.project?.area?.color);
  const hasNotes = task.notes && task.notes.trim().length > 0;
  const hasTags = task.tags.length > 0;

  // Auto-grow textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = notesTextareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";
    // Calculate minimum height (4 rows * lineHeight of approximately 1.5 * 14px font = 84px, plus padding)
    const minHeight = 112; // 4 rows with some padding
    const newHeight = Math.max(textarea.scrollHeight, minHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Adjust textarea height when notes change or edit mode is entered
  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [isEditing, editedNotes, adjustTextareaHeight]);

  // Handle entering edit mode
  const handleEditClick = () => {
    // Pre-fill form state with current values
    setEditedTitle(task.title);
    setEditedNotes(task.notes || "");
    setEditedProjectId(task.project_id);
    setEditedDueDate(dateToInputString(task.due_date));
    setEditedDeferDate(dateToInputString(task.defer_date));
    setEditedTagIds(new Set(task.tags.map((t) => t.tag_id)));
    setError(null);
    setIsEditing(true);
    onEditClick?.();
  };

  // Handle canceling edit mode (return to display mode)
  const handleCancelClick = () => {
    // Reset form state to original values
    setEditedTitle(task.title);
    setEditedNotes(task.notes || "");
    setEditedProjectId(task.project_id);
    setEditedDueDate(dateToInputString(task.due_date));
    setEditedDeferDate(dateToInputString(task.defer_date));
    setEditedTagIds(new Set(task.tags.map((t) => t.tag_id)));
    setError(null);
    setIsEditing(false);
  };

  // Handle tag toggle
  const handleTagToggle = (tagId: string) => {
    setEditedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  // Handle notes textarea change with auto-grow
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedNotes(e.target.value);
  };

  // Handle delete button click - show confirmation dialog
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  // Handle cancel delete - close confirmation dialog
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Handle confirm delete - calls deleteTask and closes panel on success
  const handleConfirmDelete = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteTask(task.id);

      if (result.success) {
        // Close panel on success - view will refresh via revalidatePath
        clearSelectedTask();
      } else {
        setError(result.error || "Failed to delete task");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("Failed to delete task");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }, [task.id, isDeleting, clearSelectedTask]);

  // Handle form submission - saves all edited fields
  const handleSubmit = useCallback(async () => {
    // Don't submit if empty title or already submitting
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Build update data object
      const updateData: UpdateTaskInput = {
        title: trimmedTitle,
        notes: editedNotes || null,
        project_id: editedProjectId,
        due_date: editedDueDate ? new Date(editedDueDate) : null,
        defer_date: editedDeferDate ? new Date(editedDeferDate) : null,
        tagIds: Array.from(editedTagIds),
      };

      const result = await updateTask(task.id, updateData);

      if (result.success && result.data) {
        // Update the selected task in context with the returned data
        updateSelectedTask(result.data);
        // Exit edit mode on success
        setIsEditing(false);
      } else if (!result.success) {
        setError(result.error || "Failed to save task");
      }
    } catch {
      setError("Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    editedTitle,
    editedNotes,
    editedProjectId,
    editedDueDate,
    editedDeferDate,
    editedTagIds,
    task.id,
    isSubmitting,
    updateSelectedTask,
  ]);

  // Handle overlay click for delete confirmation dialog
  const handleDeleteOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        setShowDeleteConfirm(false);
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header with title and edit/cancel button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        {isEditing ? (
          // Edit mode: show editable title input
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="flex-1 px-3 py-2 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] text-[16px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            placeholder="Task title"
            autoFocus
          />
        ) : (
          // Display mode: show title text
          <h2
            className="font-newsreader text-[20px] font-medium leading-snug text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-newsreader)" }}
          >
            {task.title}
          </h2>
        )}
        {isEditing ? (
          <button
            type="button"
            onClick={handleCancelClick}
            className="flex-shrink-0 text-[14px] font-medium text-[var(--text-secondary)] hover:opacity-80 transition-opacity"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEditClick}
            className="flex-shrink-0 text-[14px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity"
          >
            Edit
          </button>
        )}
      </div>

      {/* Field sections with 16px spacing */}
      <div className="flex flex-col gap-4">
        {/* Project field */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Project
          </span>
          {isEditing ? (
            // Edit mode: show dropdown with projects grouped by area
            <div className="flex flex-col gap-1">
              <select
                value={editedProjectId || ""}
                onChange={(e) => setEditedProjectId(e.target.value || null)}
                className="w-full px-3 py-2 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              >
                <option value="">No project</option>
                {areasWithProjects.length > 0 ? (
                  areasWithProjects.map((area) => (
                    <optgroup key={area.id} label={area.name}>
                      {area.projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                ) : (
                  <option value="" disabled>
                    No projects available
                  </option>
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowNewProjectModal(true)}
                className="text-[12px] text-[var(--text-secondary)] mt-1 hover:underline text-left w-fit"
              >
                + New Project
              </button>
            </div>
          ) : task.project ? (
            // Display mode with project
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[13px] font-medium w-fit"
              style={{
                backgroundColor: `${areaColor}20`,
                color: areaColor,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: areaColor }}
              />
              {task.project.name}
            </span>
          ) : (
            // Display mode without project
            <span className="text-[14px] text-[var(--text-tertiary)]">
              No project
            </span>
          )}
        </div>

        {/* Due date field */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Due Date
          </span>
          {isEditing ? (
            // Edit mode: show date input with clearable X button
            <div className="relative w-fit min-w-[160px]">
              <input
                type="date"
                value={editedDueDate}
                onChange={(e) => setEditedDueDate(e.target.value)}
                className="w-full px-3 py-2 pr-8 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
              {editedDueDate && (
                <button
                  type="button"
                  onClick={() => setEditedDueDate("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
          ) : dueDateInfo ? (
            <span
              className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[13px] font-medium w-fit
                ${dueDateInfo.textColor} ${dueDateInfo.bgColor}
              `}
            >
              <ForecastIcon size={14} className="flex-shrink-0" />
              {dueDateInfo.label}
            </span>
          ) : (
            <span className="text-[14px] text-[var(--text-tertiary)]">
              No due date
            </span>
          )}
        </div>

        {/* Defer date field - always shown in edit mode, only shown if present in display mode */}
        {(isEditing || deferDateInfo) && (
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Deferred Until
            </span>
            {isEditing ? (
              // Edit mode: show date input with clearable X button
              <div className="relative w-fit min-w-[160px]">
                <input
                  type="date"
                  value={editedDeferDate}
                  onChange={(e) => setEditedDeferDate(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
                {editedDeferDate && (
                  <button
                    type="button"
                    onClick={() => setEditedDeferDate("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>
            ) : deferDateInfo ? (
              <span
                className={`
                  inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[13px] font-medium w-fit
                  ${deferDateInfo.textColor} ${deferDateInfo.bgColor}
                `}
              >
                <ForecastIcon size={14} className="flex-shrink-0" />
                {deferDateInfo.label}
              </span>
            ) : null}
          </div>
        )}

        {/* Tags field */}
        <div className="flex flex-col gap-1">
          <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Tags
          </span>
          {isEditing ? (
            // Edit mode: show toggle pills for all available tags
            allTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const isActive = editedTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-[13px] font-medium
                        transition-colors
                        ${
                          isActive
                            ? "border border-[var(--accent)] bg-[rgba(232,168,124,0.12)] text-[var(--accent)]"
                            : "border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]"
                        }
                      `}
                    >
                      <span>{tag.icon || "#"}</span>
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span className="text-[14px] text-[var(--text-tertiary)]">
                No tags available
              </span>
            )
          ) : hasTags ? (
            // Display mode with tags
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((taskTag) => (
                <span
                  key={taskTag.tag_id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[13px] font-medium bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]"
                >
                  <span>{taskTag.tag.icon || "#"}</span>
                  {taskTag.tag.name}
                </span>
              ))}
            </div>
          ) : (
            // Display mode without tags
            <span className="text-[14px] text-[var(--text-tertiary)]">
              No tags
            </span>
          )}
        </div>

        {/* Notes field */}
        {isEditing ? (
          // Edit mode: show editable textarea with auto-grow
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Notes
            </span>
            <textarea
              ref={notesTextareaRef}
              value={editedNotes}
              onChange={handleNotesChange}
              placeholder="Add notes..."
              className="w-full px-3.5 py-3 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border)] text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              style={{ minHeight: "112px" }}
            />
          </div>
        ) : (
          // Display mode: only show notes if present
          hasNotes && (
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                Notes
              </span>
              <div className="bg-[var(--bg-surface)] rounded-[10px] p-3.5">
                <p className="text-[14px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
                  {task.notes}
                </p>
              </div>
            </div>
          )
        )}

        {/* Error message - shown in edit mode when there's an error */}
        {isEditing && error && (
          <div className="mt-4">
            <p className="text-[12px] text-[#E88B8B]">{error}</p>
          </div>
        )}

        {/* Action buttons - only shown in edit mode */}
        {isEditing && (
          <>
            {/* Mobile layout: stacked full-width, Save on top */}
            <div className="flex flex-col gap-2 md:hidden mt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!editedTitle.trim() || isSubmitting}
                className={`
                  w-full py-2.5
                  text-[14px] font-medium
                  text-[#1a1a1e]
                  bg-[var(--accent)]
                  rounded-md
                  transition-all duration-150
                  hover:opacity-90
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSubmitting}
                className={`
                  w-full py-2.5
                  text-[14px] font-medium
                  text-[var(--text-secondary)]
                  bg-[var(--bg-surface)]
                  border border-[var(--border)]
                  rounded-md
                  transition-all duration-150
                  hover:opacity-80
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isSubmitting}
                className={`
                  w-full py-2.5
                  text-[14px] font-medium
                  text-[#E88B8B]
                  bg-transparent
                  rounded-md
                  transition-all duration-150
                  hover:opacity-80
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E88B8B] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Delete
              </button>
            </div>

            {/* Desktop layout: Delete on left, Cancel/Save on right */}
            <div className="hidden md:flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={isSubmitting}
                className={`
                  px-4 py-2
                  text-[14px] font-medium
                  text-[#E88B8B]
                  bg-transparent
                  rounded-md
                  transition-all duration-150
                  hover:opacity-80
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E88B8B] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelClick}
                  disabled={isSubmitting}
                  className={`
                    px-4 py-2
                    text-[14px] font-medium
                    text-[var(--text-secondary)]
                    bg-[var(--bg-surface)]
                    border border-[var(--border)]
                    rounded-md
                    transition-all duration-150
                    hover:opacity-80
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!editedTitle.trim() || isSubmitting}
                  className={`
                    px-4 py-2
                    text-[14px] font-medium
                    text-[#1a1a1e]
                    bg-[var(--accent)]
                    rounded-md
                    transition-all duration-150
                    hover:opacity-90
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          onClick={handleDeleteOverlayClick}
          className={`
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/60 backdrop-blur-sm
            animate-in fade-in duration-150
          `}
        >
          {/* Dialog Card */}
          <div
            className={`
              /* Width */
              w-[calc(100%-32px)] max-w-[320px]

              /* Styling */
              bg-[var(--bg-card)]
              border border-[var(--border)]
              rounded-[14px]
              shadow-xl
              p-5

              /* Animation */
              animate-in fade-in slide-in-from-bottom-2 zoom-in-[0.97]
              duration-200
            `}
          >
            {/* Title */}
            <h3
              id="delete-confirm-title"
              className="text-[16px] font-medium text-[var(--text-primary)] text-center mb-4"
            >
              Delete this task?
            </h3>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className={`
                  flex-1 py-2.5
                  text-[14px] font-medium
                  text-[var(--text-secondary)]
                  bg-[var(--bg-surface)]
                  border border-[var(--border)]
                  rounded-md
                  transition-all duration-150
                  hover:opacity-80
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`
                  flex-1 py-2.5
                  text-[14px] font-medium
                  text-white
                  bg-[#E88B8B]
                  rounded-md
                  transition-all duration-150
                  hover:opacity-90
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E88B8B] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        areas={areasWithProjects.map((a) => ({ id: a.id, name: a.name, color: a.color }))}
        onCreated={(projectId) => {
          setEditedProjectId(projectId);
          setShowNewProjectModal(false);
        }}
      />
    </div>
  );
}
