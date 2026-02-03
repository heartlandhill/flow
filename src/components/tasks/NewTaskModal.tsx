"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CloseIcon } from "@/components/ui/Icons";
import { createTaskInProject } from "@/actions/tasks";

/**
 * Tag type for the modal props (minimal - just what we need for display)
 */
interface Tag {
  id: string;
  name: string;
  icon: string | null;
}

/**
 * Props for the NewTaskModal component
 */
interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  areaColor: string;
  allTags: Tag[];
  onCreated?: () => void;
}

/**
 * Modal dialog for creating new tasks with full fields.
 * Used in project detail page for full task creation (vs QuickCapture for inbox).
 *
 * Entry points:
 * - "Add Task" button in project detail page
 * - "Add Task" CTA in project detail empty state
 */
export function NewTaskModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  areaColor,
  allTags,
  onCreated,
}: NewTaskModalProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [deferDate, setDeferDate] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Autofocus title input when modal opens
  useEffect(() => {
    if (isOpen) {
      // Autofocus with small delay to ensure animation has started
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Delay clearing form fields to allow close animation
      const timer = setTimeout(() => {
        setTitle("");
        setDueDate("");
        setDeferDate("");
        setSelectedTagIds(new Set());
        setNotes("");
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
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-grow textarea for notes
  const adjustTextareaHeight = useCallback(() => {
    const textarea = notesTextareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const minHeight = 112; // 4 rows minimum
    const newHeight = Math.max(textarea.scrollHeight, minHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNotes(e.target.value);
      adjustTextareaHeight();
    },
    [adjustTextareaHeight]
  );

  // Handle tag toggle
  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

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
    // Don't submit if empty or already submitting
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert date strings to Date objects (or null if empty)
      const dueDateValue = dueDate ? new Date(dueDate) : null;
      const deferDateValue = deferDate ? new Date(deferDate) : null;

      const result = await createTaskInProject(trimmedTitle, projectId, {
        due_date: dueDateValue,
        defer_date: deferDateValue,
        notes: notes.trim() || null,
        tagIds: Array.from(selectedTagIds),
      });

      if (result.success) {
        onClose();
        // Notify parent of successful creation
        onCreated?.();
      } else {
        setError(result.error || "Failed to create task");
      }
    } catch {
      setError("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    title,
    dueDate,
    deferDate,
    notes,
    selectedTagIds,
    projectId,
    isSubmitting,
    onClose,
    onCreated,
  ]);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-task-title"
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
          /* Position at 15vh from top, with bottom margin for scroll */
          mt-[15vh]
          mb-8
          h-fit

          /* Width: mobile calc(100% - 32px) max 480px, desktop 520px */
          w-[calc(100%-32px)] max-w-[480px]
          md:w-[520px] md:max-w-[520px]

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
          {/* Colored dot matching area */}
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: areaColor || "var(--accent)" }}
          />
          <span
            id="new-task-title"
            className={`
              text-[12px] font-medium tracking-[0.8px]
              text-[var(--text-tertiary)]
              uppercase
            `}
          >
            New Task in {projectName}
          </span>
        </div>

        {/* Form Content */}
        <div className="px-4 py-2 space-y-4">
          {/* Title Input */}
          <div>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              placeholder="Task title"
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

          {/* Due Date Field */}
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Due Date
            </span>
            <div className="relative w-fit min-w-[160px]">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 pr-8 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-60"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  disabled={isSubmitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-60"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Defer Date Field */}
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Deferred Until
            </span>
            <div className="relative w-fit min-w-[160px]">
              <input
                type="date"
                value={deferDate}
                onChange={(e) => setDeferDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 pr-8 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border)] text-[14px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-60"
              />
              {deferDate && (
                <button
                  type="button"
                  onClick={() => setDeferDate("")}
                  disabled={isSubmitting}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-60"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tags Field */}
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Tags
            </span>
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const isActive = selectedTagIds.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      disabled={isSubmitting}
                      className={`
                        inline-flex items-center gap-1 px-2 py-1 rounded-full text-[13px] font-medium
                        transition-colors
                        disabled:opacity-60
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
            )}
          </div>

          {/* Notes Field */}
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
              Notes
            </span>
            <textarea
              ref={notesTextareaRef}
              value={notes}
              onChange={handleNotesChange}
              disabled={isSubmitting}
              placeholder="Add notes..."
              className="w-full px-3.5 py-3 rounded-[10px] bg-[var(--bg-surface)] border border-[var(--border)] text-[14px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none disabled:opacity-60"
              style={{ minHeight: "112px" }}
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
            disabled={!title.trim() || isSubmitting}
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
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
