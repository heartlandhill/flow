"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuickCapture } from "@/hooks/useQuickCapture";
import { createTask } from "@/actions/tasks";
import { InboxIcon } from "@/components/ui/Icons";

/**
 * QuickCapture modal for rapidly adding tasks to the inbox.
 * Triggered by:
 * - Cmd+N / Ctrl+N keyboard shortcut (via useQuickCapture)
 * - Mobile FAB tap
 * - Sidebar "Quick Capture" button
 */
export function QuickCapture() {
  const { isOpen, close, projectId, projectName, areaColor } = useQuickCapture();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure animation has started
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Delay clearing to allow close animation
      const timer = setTimeout(() => {
        setTitle("");
        setError(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    // Don't submit if empty or already submitting
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createTask(trimmedTitle);

      if (result.success) {
        close();
      } else {
        setError(result.error || "Failed to create task");
      }
    } catch {
      setError("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }, [title, isSubmitting, close]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      // Escape is handled globally by useKeyboardShortcuts
    },
    [handleSubmit]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the overlay itself, not the modal
      if (e.target === e.currentTarget) {
        close();
      }
    },
    [close]
  );

  // Don't render anything when closed
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-capture-title"
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
          /* Position at 15vh from top */
          mt-[15vh]
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
          {projectName ? (
            <>
              {/* Colored dot matching area */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: areaColor || "var(--accent)" }}
              />
              <span
                id="quick-capture-title"
                className={`
                  text-[12px] font-medium tracking-[0.8px]
                  text-[var(--text-tertiary)]
                  uppercase
                `}
              >
                New Task in {projectName}
              </span>
            </>
          ) : (
            <>
              <InboxIcon
                size={16}
                className="text-[var(--text-tertiary)]"
              />
              <span
                id="quick-capture-title"
                className={`
                  text-[12px] font-medium tracking-[0.8px]
                  text-[var(--text-tertiary)]
                  uppercase
                `}
              >
                New Inbox Item
              </span>
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            placeholder="What do you need to do?"
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
            Press <kbd className="font-medium">Enter</kbd> to add
          </span>

          {/* Submit button */}
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
            {isSubmitting ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
