'use client';

import { SearchIcon, CloseIcon } from '@/components/ui/Icons';
import { useSearch } from '@/context/SearchContext';

export function TopBar() {
  const { query, setQuery, clearQuery } = useSearch();

  return (
    <header className="h-[52px] bg-transparent border-b border-[var(--border)] flex items-center justify-between px-6">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <SearchIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-md pl-10 pr-10 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Clear search"
          >
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-sm font-medium text-[var(--text-secondary)] ml-4">
        A
      </div>
    </header>
  );
}
