"use client";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Flow app logo - three stacked waves suggesting flow and movement.
 */
export function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent, #E8A87C)" />
          <stop offset="100%" stopColor="#C47A5A" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="6" fill="url(#logo-grad)" />
      {/* Three stacked waves */}
      <path
        d="M5 10c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M5 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M5 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />
    </svg>
  );
}
