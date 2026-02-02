"use client";

import { PlusIcon } from "@/components/ui/Icons";

interface FABProps {
  onClick: () => void;
  "aria-label"?: string;
}

export function FAB({
  onClick,
  "aria-label": ariaLabel = "Quick capture",
}: FABProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`
        /* Fixed position - bottom 72px (above bottom nav) + safe area */
        fixed right-4 z-50
        bottom-[calc(72px+env(safe-area-inset-bottom))]

        /* Size and shape */
        w-[52px] h-[52px] rounded-full

        /* Gradient background */
        bg-gradient-to-br from-[#E8A87C] to-[#d4916a]

        /* Shadow with accent color */
        shadow-[0_4px_20px_rgba(232,168,124,0.35)]

        /* Center the icon */
        flex items-center justify-center

        /* Press animation */
        transition-transform duration-150 ease-out
        active:scale-[0.92]

        /* Focus state */
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-root)]

        /* Hide on desktop (visible only below 768px) */
        md:hidden
      `}
    >
      <PlusIcon size={22} className="text-white" />
    </button>
  );
}
