"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useOverlay } from "@/context/OverlayContext";
import { createTag, updateTag, deleteTag } from "@/actions/tags";
import type { TagWithCount } from "@/types";

/**
 * Props for the TagManagementModal component
 */
interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TagWithCount[];
  onUpdated?: () => void;
}

/**
 * Modal dialog for managing tags (CRUD operations).
 * Follows the EditProjectModal.tsx pattern for overlay, animations, and positioning.
 *
 * Entry points:
 * - "Manage Tags" button in Tags page header
 */
export function TagManagementModal({
  isOpen,
  onClose,
  tags,
  onUpdated,
}: TagManagementModalProps) {
  const { registerOverlay, unregisterOverlay } = useOverlay();
  const [isCreating, setIsCreating] = useState(false);

  // Register overlay when modal is open
  useEffect(() => {
    if (isOpen) {
      registerOverlay("tag-management-modal");
      return () => unregisterOverlay("tag-management-modal");
    }
  }, [isOpen, registerOverlay, unregisterOverlay]);

  // Reset create form state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the overlay itself, not the modal
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle successful tag creation
  const handleTagCreated = useCallback(() => {
    setIsCreating(false);
    onUpdated?.();
  }, [onUpdated]);

  // Cancel create mode
  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
  }, []);

  // Don't render anything when closed
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-management-title"
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
          /* Position at 10vh from top to account for content */
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
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span
            id="tag-management-title"
            className={`
              text-[12px] font-medium tracking-[0.8px]
              text-[var(--text-tertiary)]
              uppercase
            `}
          >
            Manage Tags
          </span>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className={`
              text-[var(--text-tertiary)]
              hover:text-[var(--text-secondary)]
              transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
              rounded-md p-1
            `}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content area - tag list will be added here */}
        <div className="px-4 py-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
          {tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="text-[24px] mb-2">#</span>
              <p className="text-[14px] text-[var(--text-secondary)]">
                No tags yet
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                Create your first tag to organize tasks by context
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {tags.map((tag) => (
                <TagListItem key={tag.id} tag={tag} onUpdated={onUpdated} />
              ))}
            </div>
          )}
        </div>

        {/* Footer - create new tag */}
        <div className="px-4 pb-4 pt-2">
          {isCreating ? (
            <CreateTagForm
              onCreated={handleTagCreated}
              onCancel={handleCancelCreate}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className={`
                w-full py-2.5
                text-[14px] font-medium
                text-[var(--accent)]
                bg-transparent
                border border-dashed border-[var(--border)]
                rounded-lg
                transition-all duration-150
                hover:border-[var(--accent)] hover:bg-[rgba(232,168,124,0.08)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
              `}
            >
              + New Tag
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Props for the CreateTagForm component
 */
interface CreateTagFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

/**
 * Inline form for creating a new tag.
 * Follows the same pattern as TagListItem edit mode for consistency.
 */
function CreateTagForm({ onCreated, onCancel }: CreateTagFormProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim();

    if (!trimmedName) {
      setError("Tag name is required");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createTag({
        name: trimmedName,
        icon: trimmedIcon || undefined,
      });

      if (result.success) {
        onCreated();
      } else {
        setError(result.error || "Failed to create tag");
      }
    } catch {
      setError("Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, icon, isSubmitting, onCreated]);

  // Handle key events in inputs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

  return (
    <div
      className={`
        flex flex-col gap-2 px-3 py-2.5
        bg-[var(--bg-surface)]
        border border-[var(--accent)]
        rounded-lg
        transition-colors duration-150
      `}
    >
      <div className="flex items-center gap-2">
        {/* Icon input */}
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder="#"
          maxLength={2}
          className={`
            w-10 h-9
            text-[18px] text-center
            text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)]
            bg-[var(--bg-root)]
            border border-[var(--border)]
            rounded-md
            focus:outline-none focus:border-[var(--accent)]
            transition-colors duration-150
            disabled:opacity-60
          `}
          aria-label="Tag icon (optional)"
        />

        {/* Name input */}
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder="Tag name"
          className={`
            flex-1 h-9
            px-2
            text-[14px]
            text-[var(--text-primary)]
            placeholder:text-[var(--text-tertiary)]
            bg-[var(--bg-root)]
            border border-[var(--border)]
            rounded-md
            focus:outline-none focus:border-[var(--accent)]
            transition-colors duration-150
            disabled:opacity-60
          `}
          aria-label="Tag name"
        />

        {/* Create button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className={`
            px-2.5 h-9
            text-[12px] font-medium
            text-[var(--bg-root)]
            bg-[var(--accent)]
            rounded-md
            transition-all duration-150
            hover:opacity-90
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isSubmitting ? "..." : "Create"}
        </button>

        {/* Cancel button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={`
            px-2.5 h-9
            text-[12px] font-medium
            text-[var(--text-secondary)]
            bg-[var(--bg-root)]
            border border-[var(--border)]
            rounded-md
            transition-all duration-150
            hover:bg-[var(--bg-hover)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)]
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          Cancel
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-[12px] text-[#E88B8B] px-1">{error}</p>
      )}
    </div>
  );
}

/**
 * Props for the TagListItem component
 */
interface TagListItemProps {
  tag: TagWithCount;
  onUpdated?: () => void;
}

/**
 * Individual tag row component for the management modal.
 * Displays icon, name, and task count in a consistent list format.
 * Supports inline editing of name and icon with click-to-edit.
 * Follows the TagCard pattern from TagsGrid.tsx for styling consistency.
 */
function TagListItem({ tag, onUpdated }: TagListItemProps) {
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(tag.name);
  const [editedIcon, setEditedIcon] = useState(tag.icon || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs for input focus management
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Format task count with proper pluralization for screen readers
  const taskCountLabel = useMemo(() => {
    const count = tag._count.tasks;
    return count === 1 ? "1 task" : `${count} tasks`;
  }, [tag._count.tasks]);

  // Reset form state when tag prop changes
  useEffect(() => {
    setEditedName(tag.name);
    setEditedIcon(tag.icon || "");
  }, [tag.name, tag.icon]);

  // Focus name input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Small delay to ensure render is complete
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  // Enter edit mode
  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  // Cancel editing and reset to original values
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedName(tag.name);
    setEditedIcon(tag.icon || "");
    setError(null);
  }, [tag.name, tag.icon]);

  // Save changes
  const handleSave = useCallback(async () => {
    const trimmedName = editedName.trim();
    const trimmedIcon = editedIcon.trim();

    // Don't save if name is empty
    if (!trimmedName) {
      setError("Tag name is required");
      return;
    }

    // Don't save if nothing changed
    if (trimmedName === tag.name && (trimmedIcon || null) === tag.icon) {
      setIsEditing(false);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateTag(tag.id, {
        name: trimmedName,
        icon: trimmedIcon || null,
      });

      if (result.success) {
        setIsEditing(false);
        onUpdated?.();
      } else {
        setError(result.error || "Failed to update tag");
      }
    } catch {
      setError("Failed to update tag");
    } finally {
      setIsSubmitting(false);
    }
  }, [editedName, editedIcon, tag.id, tag.name, tag.icon, isSubmitting, onUpdated]);

  // Handle key events in inputs
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSave, handleCancelEdit]
  );

  // Handle delete button click - show confirmation dialog
  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  // Handle cancel delete - close confirmation dialog
  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  // Handle confirm delete - calls deleteTag and handles success/failure
  const handleConfirmDelete = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteTag(tag.id);

      if (result.success) {
        // Close dialogs and notify parent on success
        setShowDeleteConfirm(false);
        setIsEditing(false);
        onUpdated?.();
      } else {
        setError(result.error || "Failed to delete tag");
        setShowDeleteConfirm(false);
      }
    } catch {
      setError("Failed to delete tag");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }, [tag.id, isDeleting, onUpdated]);

  // Handle overlay click for delete confirmation dialog
  const handleDeleteOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        setShowDeleteConfirm(false);
      }
    },
    []
  );

  // Edit mode UI
  if (isEditing) {
    return (
      <>
        <div
          className={`
            flex flex-col gap-2 px-3 py-2.5
            bg-[var(--bg-surface)]
            border border-[var(--accent)]
            rounded-lg
            transition-colors duration-150
          `}
        >
          <div className="flex items-center gap-2">
            {/* Icon input */}
            <input
              type="text"
              value={editedIcon}
              onChange={(e) => setEditedIcon(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || isDeleting}
              placeholder="#"
              maxLength={2}
              className={`
                w-10 h-9
                text-[18px] text-center
                text-[var(--text-primary)]
                placeholder:text-[var(--text-tertiary)]
                bg-[var(--bg-root)]
                border border-[var(--border)]
                rounded-md
                focus:outline-none focus:border-[var(--accent)]
                transition-colors duration-150
                disabled:opacity-60
              `}
              aria-label="Tag icon"
            />

            {/* Name input */}
            <input
              ref={nameInputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting || isDeleting}
              placeholder="Tag name"
              className={`
                flex-1 h-9
                px-2
                text-[14px]
                text-[var(--text-primary)]
                placeholder:text-[var(--text-tertiary)]
                bg-[var(--bg-root)]
                border border-[var(--border)]
                rounded-md
                focus:outline-none focus:border-[var(--accent)]
                transition-colors duration-150
                disabled:opacity-60
              `}
              aria-label="Tag name"
            />

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!editedName.trim() || isSubmitting || isDeleting}
              className={`
                px-2.5 h-9
                text-[12px] font-medium
                text-[var(--bg-root)]
                bg-[var(--accent)]
                rounded-md
                transition-all duration-150
                hover:opacity-90
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isSubmitting ? "..." : "Save"}
            </button>

            {/* Cancel button */}
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting || isDeleting}
              className={`
                px-2.5 h-9
                text-[12px] font-medium
                text-[var(--text-secondary)]
                bg-[var(--bg-root)]
                border border-[var(--border)]
                rounded-md
                transition-all duration-150
                hover:bg-[var(--bg-hover)]
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)]
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Cancel
            </button>
          </div>

          {/* Delete button and error row */}
          <div className="flex items-center justify-between">
            {/* Delete button */}
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isSubmitting || isDeleting}
              className={`
                text-[12px] font-medium
                text-[#E88B8B]
                transition-all duration-150
                hover:opacity-80
                focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E88B8B] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Delete Tag
            </button>

            {/* Error message */}
            {error && (
              <p className="text-[12px] text-[#E88B8B] px-1">{error}</p>
            )}
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-tag-confirm-title"
            onClick={handleDeleteOverlayClick}
            className={`
              fixed inset-0 z-[60]
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
                id="delete-tag-confirm-title"
                className="text-[16px] font-medium text-[var(--text-primary)] text-center mb-2"
              >
                Delete &ldquo;{tag.name}&rdquo;?
              </h3>

              {/* Description with task count warning */}
              <p className="text-[14px] text-[var(--text-secondary)] text-center mb-4">
                {tag._count.tasks > 0
                  ? `This tag is used by ${tag._count.tasks} ${tag._count.tasks === 1 ? "task" : "tasks"}. The tag will be removed from ${tag._count.tasks === 1 ? "that task" : "those tasks"}.`
                  : "This tag has no tasks and will be permanently deleted."}
              </p>

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
      </>
    );
  }

  // Normal display mode
  return (
    <div
      onClick={handleStartEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleStartEdit();
        }
      }}
      role="button"
      tabIndex={0}
      className={`
        flex items-center gap-3 px-3 py-2.5
        bg-[var(--bg-surface)]
        border border-[var(--border)]
        rounded-lg
        transition-colors duration-150
        hover:bg-[var(--bg-hover)]
        cursor-pointer
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]
      `}
      aria-label={`Edit tag: ${tag.name}`}
    >
      {/* Tag icon */}
      <span
        className="text-[18px] w-6 text-center flex-shrink-0"
        role="img"
        aria-hidden="true"
      >
        {tag.icon || "#"}
      </span>

      {/* Tag name */}
      <span className="flex-1 text-[14px] text-[var(--text-primary)] truncate min-w-0">
        {tag.name}
      </span>

      {/* Task count pill */}
      <span
        className={`
          text-[11px] font-medium
          text-[var(--text-tertiary)]
          bg-[var(--bg-root)]
          px-1.5 py-0.5 rounded-full
          flex-shrink-0
        `}
        aria-label={taskCountLabel}
      >
        {tag._count.tasks}
      </span>
    </div>
  );
}
