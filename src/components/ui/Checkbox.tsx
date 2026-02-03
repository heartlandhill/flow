"use client";

import { CheckIcon } from "@/components/ui/Icons";

interface CheckboxProps {
  checked: boolean;
  completing?: boolean;
  onCheck: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  completing = false,
  onCheck,
  disabled = false,
  "aria-label": ariaLabel = "Mark task complete",
}: CheckboxProps) {
  // Determine current visual state
  const isCheckedOrCompleting = checked || completing;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !checked && !completing) {
          onCheck();
        }
      }}
      className={`
        group
        flex-shrink-0 flex items-center justify-center
        transition-all duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-root)]

        /* Touch target: 44px on mobile for accessibility, smaller on desktop */
        w-11 h-11
        md:w-8 md:h-8

        /* Negative margin to compensate for larger touch target without affecting layout */
        -m-[10px]
        md:-m-[6px]

        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Visual checkbox - 24px mobile, 20px desktop */}
      <span
        className={`
          flex items-center justify-center
          rounded-full transition-all duration-200 ease-out

          /* Mobile: 24px, 2px border */
          w-6 h-6 border-2

          /* Desktop: 20px, 1.8px border */
          md:w-5 md:h-5 md:border-[1.8px]

          ${
            isCheckedOrCompleting
              ? /* Checked/completing state: accent fill */
                `bg-[var(--accent)] border-[var(--accent)] ${completing ? "scale-110" : ""}`
              : /* Default state: tertiary border, transparent fill */
                `bg-transparent border-[var(--text-tertiary)]
                 /* Hover state (desktop only): accent border + 10% accent fill */
                 md:group-hover:border-[var(--accent)] md:group-hover:bg-[rgba(232,168,124,0.1)]`
          }
        `}
      >
        {isCheckedOrCompleting && (
          <CheckIcon
            size={12}
            className={`
              text-[var(--bg-root)]
              transition-opacity duration-150
              /* Slightly smaller icon on desktop */
              md:[&]:w-[11px] md:[&]:h-[11px]
            `}
          />
        )}
      </span>
    </button>
  );
}
