"use client";

import { useCallback, useEffect } from "react";
import { useOverlay } from "@/context/OverlayContext";
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

  // Register overlay when modal is open
  useEffect(() => {
    if (isOpen) {
      registerOverlay("tag-management-modal");
      return () => unregisterOverlay("tag-management-modal");
    }
  }, [isOpen, registerOverlay, unregisterOverlay]);

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
              {/* Tag list placeholder - will be implemented in subtask-2-2 */}
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className={`
                    flex items-center gap-3 px-3 py-2.5
                    bg-[var(--bg-surface)]
                    border border-[var(--border)]
                    rounded-lg
                  `}
                >
                  <span className="text-[16px] w-6 text-center">
                    {tag.icon || "#"}
                  </span>
                  <span className="flex-1 text-[14px] text-[var(--text-primary)]">
                    {tag.name}
                  </span>
                  <span
                    className={`
                      text-[12px] text-[var(--text-tertiary)]
                      bg-[var(--bg-root)]
                      px-2 py-0.5 rounded-full
                    `}
                  >
                    {tag._count.tasks}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - placeholder for create new tag */}
        <div className="px-4 pb-4 pt-2">
          <button
            type="button"
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
        </div>
      </div>
    </div>
  );
}
