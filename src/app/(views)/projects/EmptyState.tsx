export interface EmptyStateProps {
  /** Callback when "Create Project" button is clicked */
  onCreateClick?: () => void;
}

/**
 * Empty state displayed when there are no projects.
 * Used by both the server component page and the client component ProjectsList.
 */
export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-12 px-5 text-center">
      <span className="text-[32px] mb-2.5" role="img" aria-label="Folder">
        📁
      </span>
      <p className="text-[14px] text-[var(--text-tertiary)] mb-4">
        No projects yet — create one to get started
      </p>
      {onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          className={`
            px-4 py-2
            text-[14px] font-medium
            text-[var(--bg-root)]
            bg-[var(--accent)]
            rounded-md
            transition-all duration-150
            hover:opacity-90
            active:scale-[0.98] active:brightness-90
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2
          `}
        >
          Create Project
        </button>
      )}
    </div>
  );
}
