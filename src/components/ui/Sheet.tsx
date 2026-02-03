"use client";

import { useCallback, useEffect, useState } from "react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  "aria-label"?: string;
}

/**
 * Reusable bottom sheet primitive component.
 * Slides up from the bottom with overlay backdrop.
 * Features:
 * - Fixed overlay with rgba(0,0,0,0.5), 150ms fade
 * - Sheet slides from bottom: translateY(100% → 0), 250ms ease
 * - 16px top corners radius, var(--bg-card) background
 * - 85vh max height
 * - Drag handle: 36x4px centered
 * - Body scroll lock when open
 * - Click overlay to dismiss
 */
export function Sheet({
  isOpen,
  onClose,
  children,
  "aria-label": ariaLabel = "Sheet panel",
}: SheetProps) {
  // Track animation state for exit animations
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle open/close with animation states
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to ensure DOM is ready before animating in
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for exit animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 250); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Body scroll lock when sheet is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if clicking the overlay itself, not the sheet
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Don't render anything when not visible
  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50
        flex items-end
        transition-colors duration-150 ease-out
        ${isAnimating ? "bg-black/50" : "bg-transparent"}
      `}
    >
      {/* Sheet Container */}
      <div
        className={`
          /* Full width, bottom-anchored */
          w-full

          /* Max height with safe area */
          max-h-[85vh]

          /* Styling */
          bg-[var(--bg-card)]
          rounded-t-[16px]

          /* Shadow for depth */
          shadow-[0_-4px_20px_rgba(0,0,0,0.15)]

          /* Overflow handling */
          overflow-hidden
          flex flex-col

          /* Animation: slide up from bottom */
          transition-transform duration-[250ms] ease-out
          ${isAnimating ? "translate-y-0" : "translate-y-full"}
        `}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 flex-shrink-0">
          <div
            className={`
              w-[36px] h-[4px]
              rounded-full
              bg-[var(--text-tertiary)]
              opacity-40
            `}
          />
        </div>

        {/* Content Area - scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
