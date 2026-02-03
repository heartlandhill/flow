"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { SearchIcon, ChevronIcon, CheckIcon } from "@/components/ui/Icons";
import { useOverlay } from "@/context/OverlayContext";

/**
 * Simplified type for project dropdown - just need id and name
 */
interface ProjectForDropdown {
  id: string;
  name: string;
}

/**
 * Area with its projects for grouping in the dropdown
 */
interface AreaWithProjects {
  id: string;
  name: string;
  color: string;
  projects: ProjectForDropdown[];
}

/**
 * Props for the ProjectPicker component
 */
interface ProjectPickerProps {
  /** Currently selected project ID, or null for no project */
  value: string | null;
  /** Callback when selection changes */
  onChange: (projectId: string | null) => void;
  /** Areas with their projects */
  areasWithProjects: AreaWithProjects[];
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Callback to open new project modal */
  onNewProject?: () => void;
}

/**
 * Selectable item in the flattened list for keyboard navigation
 */
interface SelectableItem {
  id: string | null;
  name: string;
  type: "no-project" | "project";
  areaColor?: string;
}

/**
 * Searchable combobox for project selection with area grouping.
 * Replaces native <select> in task edit mode.
 *
 * Features:
 * - Search input to filter projects by name
 * - Projects grouped by area with colored dots
 * - Keyboard navigation (arrows, enter, escape)
 * - Click outside to close
 * - FAB hiding via overlay registration
 */
export function ProjectPicker({
  value,
  onChange,
  areasWithProjects,
  disabled = false,
  onNewProject,
}: ProjectPickerProps) {
  const { registerOverlay, unregisterOverlay } = useOverlay();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Find the currently selected project and its area color
  const selectedProject = useMemo(() => {
    if (!value) return null;
    for (const area of areasWithProjects) {
      const project = area.projects.find((p) => p.id === value);
      if (project) {
        return { ...project, areaColor: area.color };
      }
    }
    return null;
  }, [value, areasWithProjects]);

  // Filter projects by search query and build selectable items list
  const { filteredAreas, selectableItems } = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // Filter areas and their projects
    const filtered = areasWithProjects
      .map((area) => ({
        ...area,
        projects: query
          ? area.projects.filter((p) => p.name.toLowerCase().includes(query))
          : area.projects,
      }))
      .filter((area) => area.projects.length > 0);

    // Build flat list of selectable items for keyboard navigation
    const items: SelectableItem[] = [
      { id: null, name: "No Project", type: "no-project" },
    ];

    for (const area of filtered) {
      for (const project of area.projects) {
        items.push({
          id: project.id,
          name: project.name,
          type: "project",
          areaColor: area.color,
        });
      }
    }

    return { filteredAreas: filtered, selectableItems: items };
  }, [areasWithProjects, searchQuery]);

  // Check if there are any projects at all
  const hasAnyProjects = areasWithProjects.some((a) => a.projects.length > 0);

  // Register overlay when picker is open
  useEffect(() => {
    if (isOpen) {
      registerOverlay("project-picker");
      return () => unregisterOverlay("project-picker");
    }
  }, [isOpen, registerOverlay, unregisterOverlay]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset state when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Use mousedown to catch clicks before focus changes
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Handle selection
  const handleSelect = useCallback(
    (projectId: string | null) => {
      onChange(projectId);
      setIsOpen(false);
    },
    [onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < selectableItems.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < selectableItems.length) {
            handleSelect(selectableItems[highlightedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [selectableItems, highlightedIndex, handleSelect]
  );

  // Handle trigger button click
  const handleTriggerClick = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [disabled, isOpen]);

  // Handle new project click
  const handleNewProjectClick = useCallback(() => {
    setIsOpen(false);
    onNewProject?.();
  }, [onNewProject]);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-3 py-2 text-[14px]
          bg-[var(--bg-surface)]
          border border-[var(--border)] rounded-[6px]
          transition-colors duration-150
          ${isOpen ? "border-[var(--accent)]" : "hover:border-[var(--text-tertiary)]"}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {selectedProject ? (
          <span className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedProject.areaColor }}
            />
            <span className="truncate">{selectedProject.name}</span>
          </span>
        ) : (
          <span className="text-[var(--text-tertiary)]">No project</span>
        )}
        <ChevronIcon
          size={16}
          className={`flex-shrink-0 ml-2 transition-transform duration-150 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 right-0 mt-1
            bg-[var(--bg-card)]
            border border-[var(--border)]
            rounded-[8px]
            shadow-lg
            z-20
            overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-100
          `}
        >
          {/* Search input - sticky at top */}
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <SearchIcon
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-1.5 text-[14px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-[6px] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-tertiary)]"
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div ref={listRef} className="max-h-[280px] overflow-y-auto">
            {/* No Project option - always visible */}
            <button
              ref={(el) => {
                itemRefs.current[0] = el;
              }}
              type="button"
              onClick={() => handleSelect(null)}
              onMouseEnter={() => setHighlightedIndex(0)}
              className={`
                w-full px-3 py-2 text-left text-[14px]
                transition-colors duration-75
                ${highlightedIndex === 0 ? "bg-[var(--bg-surface)]" : ""}
                ${value === null ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}
              `}
            >
              <span className="flex items-center justify-between">
                <span>No Project</span>
                {value === null && (
                  <CheckIcon size={14} className="flex-shrink-0 text-[var(--accent)]" />
                )}
              </span>
            </button>

            {/* Area groups with projects */}
            {hasAnyProjects ? (
              filteredAreas.length > 0 ? (
                filteredAreas.map((area) => {
                  // Find the starting index for projects in this area
                  let areaStartIndex = 1; // Start after "No Project"
                  for (const a of filteredAreas) {
                    if (a.id === area.id) break;
                    areaStartIndex += a.projects.length;
                  }

                  return (
                    <div key={area.id}>
                      {/* Area header - non-clickable */}
                      <div className="px-3 py-1.5 flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: area.color }}
                        />
                        <span className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                          {area.name}
                        </span>
                      </div>

                      {/* Projects in this area */}
                      {area.projects.map((project, projectIndex) => {
                        const itemIndex = areaStartIndex + projectIndex;
                        const isHighlighted = highlightedIndex === itemIndex;
                        const isSelected = value === project.id;

                        return (
                          <button
                            ref={(el) => {
                              itemRefs.current[itemIndex] = el;
                            }}
                            key={project.id}
                            type="button"
                            onClick={() => handleSelect(project.id)}
                            onMouseEnter={() => setHighlightedIndex(itemIndex)}
                            className={`
                              w-full px-3 py-2 pl-7 text-left text-[14px]
                              transition-colors duration-75
                              ${isHighlighted ? "bg-[var(--bg-surface)]" : ""}
                              ${isSelected ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}
                            `}
                          >
                            <span className="flex items-center justify-between">
                              <span className="truncate">{project.name}</span>
                              {isSelected && (
                                <CheckIcon
                                  size={14}
                                  className="flex-shrink-0 text-[var(--accent)]"
                                />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                // No results for search
                <div className="px-3 py-4 text-center text-[14px] text-[var(--text-tertiary)]">
                  No projects found
                </div>
              )
            ) : (
              // No projects available at all
              <div className="px-3 py-4 text-center text-[14px] text-[var(--text-tertiary)]">
                No projects available
              </div>
            )}
          </div>

          {/* New Project link - sticky at bottom */}
          {onNewProject && (
            <div className="p-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleNewProjectClick}
                className="w-full px-3 py-1.5 text-left text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                + New Project
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
