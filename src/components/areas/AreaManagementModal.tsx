"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getAreasWithProjectCounts,
  createArea,
  updateArea,
  deleteArea,
  type AreaWithProjectCount,
} from "@/actions/areas";
import { useOverlay } from "@/context/OverlayContext";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";

/**
 * Preset colors for area color selection
 */
const AREA_COLORS = [
  "#E88A7C", // Coral red
  "#E8A87C", // Warm orange (accent)
  "#E8D27C", // Golden yellow
  "#7CE8A8", // Mint green
  "#7CD2E8", // Sky blue
  "#7C8AE8", // Periwinkle
  "#C87CE8", // Lavender purple
  "#888888", // Neutral gray
];

/**
 * Props for the AreaManagementModal component
 */
interface AreaManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAreasChanged?: () => void;
}

/**
 * Modal dialog for managing areas (create, edit, delete).
 * Follows the NewProjectModal.tsx and EditProjectModal.tsx patterns.
 *
 * Entry points:
 * - "Manage Areas" button in Projects page header
 */
export function AreaManagementModal({
  isOpen,
  onClose,
  onAreasChanged,
}: AreaManagementModalProps) {
  const { registerOverlay, unregisterOverlay } = useOverlay();

  // Area list state
  const [areas, setAreas] = useState<AreaWithProjectCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New area form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaColor, setNewAreaColor] = useState(AREA_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  // Edit area state
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  const [reassignToAreaId, setReassignToAreaId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const newAreaInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Register overlay when modal is open
  useEffect(() => {
    if (isOpen) {
      registerOverlay("area-management-modal");
      return () => unregisterOverlay("area-management-modal");
    }
  }, [isOpen, registerOverlay, unregisterOverlay]);

  // Load areas when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAreas();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setIsAddingNew(false);
        setNewAreaName("");
        setNewAreaColor(AREA_COLORS[0]);
        setEditingAreaId(null);
        setDeletingAreaId(null);
        setError(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus new area input when adding
  useEffect(() => {
    if (isAddingNew) {
      const timer = setTimeout(() => {
        newAreaInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAddingNew]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingAreaId) {
      const timer = setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editingAreaId]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close delete confirmation first
        if (deletingAreaId) {
          setDeletingAreaId(null);
          setReassignToAreaId("");
          return;
        }
        // Cancel editing
        if (editingAreaId) {
          setEditingAreaId(null);
          return;
        }
        // Cancel adding new
        if (isAddingNew) {
          setIsAddingNew(false);
          setNewAreaName("");
          return;
        }
        // Close modal
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, deletingAreaId, editingAreaId, isAddingNew]);

  const loadAreas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getAreasWithProjectCounts();

    if (result.success && result.data) {
      setAreas(result.data);
    } else {
      setError(result.error || "Failed to load areas");
    }

    setIsLoading(false);
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Create new area
  const handleCreateArea = useCallback(async () => {
    const trimmedName = newAreaName.trim();
    if (!trimmedName || isCreating) return;

    setIsCreating(true);
    setError(null);

    const result = await createArea({
      name: trimmedName,
      color: newAreaColor,
    });

    if (result.success) {
      setNewAreaName("");
      setNewAreaColor(AREA_COLORS[0]);
      setIsAddingNew(false);
      await loadAreas();
      onAreasChanged?.();
    } else {
      setError(result.error || "Failed to create area");
    }

    setIsCreating(false);
  }, [newAreaName, newAreaColor, isCreating, loadAreas, onAreasChanged]);

  // Start editing an area
  const handleStartEdit = useCallback((area: AreaWithProjectCount) => {
    setEditingAreaId(area.id);
    setEditName(area.name);
    setEditColor(area.color);
    setIsAddingNew(false);
  }, []);

  // Save area edit
  const handleSaveEdit = useCallback(async () => {
    if (!editingAreaId || isUpdating) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      setError("Area name cannot be empty");
      return;
    }

    setIsUpdating(true);
    setError(null);

    const result = await updateArea(editingAreaId, {
      name: trimmedName,
      color: editColor,
    });

    if (result.success) {
      setEditingAreaId(null);
      await loadAreas();
      onAreasChanged?.();
    } else {
      setError(result.error || "Failed to update area");
    }

    setIsUpdating(false);
  }, [editingAreaId, editName, editColor, isUpdating, loadAreas, onAreasChanged]);

  // Start delete flow
  const handleStartDelete = useCallback(
    (area: AreaWithProjectCount) => {
      setDeletingAreaId(area.id);
      // Pre-select first available area for reassignment
      const otherAreas = areas.filter((a) => a.id !== area.id);
      if (otherAreas.length > 0) {
        setReassignToAreaId(otherAreas[0].id);
      }
      setEditingAreaId(null);
      setIsAddingNew(false);
    },
    [areas]
  );

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingAreaId || isDeleting) return;

    const areaToDelete = areas.find((a) => a.id === deletingAreaId);
    if (!areaToDelete) return;

    // If area has projects, reassignment is required
    if (areaToDelete._count.projects > 0 && !reassignToAreaId) {
      setError("Please select a destination area for the projects");
      return;
    }

    setIsDeleting(true);
    setError(null);

    const result = await deleteArea(
      deletingAreaId,
      areaToDelete._count.projects > 0 ? reassignToAreaId : undefined
    );

    if (result.success) {
      setDeletingAreaId(null);
      setReassignToAreaId("");
      await loadAreas();
      onAreasChanged?.();
    } else {
      setError(result.error || "Failed to delete area");
    }

    setIsDeleting(false);
  }, [deletingAreaId, reassignToAreaId, isDeleting, areas, loadAreas, onAreasChanged]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeletingAreaId(null);
    setReassignToAreaId("");
  }, []);

  // Handle Enter key in inputs
  const handleNewAreaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleCreateArea();
      }
    },
    [handleCreateArea]
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSaveEdit();
      }
    },
    [handleSaveEdit]
  );

  // Don't render when closed
  if (!isOpen) return null;

  // Get area being deleted for display
  const areaToDelete = deletingAreaId
    ? areas.find((a) => a.id === deletingAreaId)
    : null;

  // Get other areas for reassignment dropdown
  const otherAreas = deletingAreaId
    ? areas.filter((a) => a.id !== deletingAreaId)
    : [];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="area-management-title"
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
          /* Position at 10vh from top */
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
            id="area-management-title"
            className={`
              text-[12px] font-medium tracking-[0.8px]
              text-[var(--text-tertiary)]
              uppercase
            `}
          >
            Manage Areas
          </span>

          {/* Add Area button */}
          {!isAddingNew && !editingAreaId && (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className={`
                flex items-center gap-1
                text-[13px] font-medium
                text-[var(--accent)]
                hover:opacity-80
                transition-opacity duration-150
              `}
            >
              <PlusIcon size={16} />
              <span>Add Area</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-2 space-y-2">
          {/* Loading state */}
          {isLoading && (
            <div className="py-8 text-center text-[var(--text-tertiary)]">
              Loading areas...
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-[#E88B8B]/10 border border-[#E88B8B]/30">
              <p className="text-[13px] text-[#E88B8B]">{error}</p>
            </div>
          )}

          {/* New area form */}
          {isAddingNew && (
            <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] space-y-3">
              {/* Name input */}
              <input
                ref={newAreaInputRef}
                type="text"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                onKeyDown={handleNewAreaKeyDown}
                disabled={isCreating}
                placeholder="Area name"
                className={`
                  w-full
                  px-3 py-2
                  text-[14px] font-normal
                  text-[var(--text-primary)]
                  placeholder:text-[var(--text-tertiary)]
                  bg-[var(--bg-card)]
                  border border-[var(--border)]
                  rounded-lg
                  focus:outline-none focus:border-[var(--accent)]
                  transition-colors duration-150
                  disabled:opacity-60
                `}
              />

              {/* Color picker */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-tertiary)] mb-1.5">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {AREA_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewAreaColor(color)}
                      disabled={isCreating}
                      className={`
                        w-7 h-7 rounded-full
                        transition-all duration-150
                        disabled:opacity-60
                        ${
                          newAreaColor === color
                            ? "ring-2 ring-offset-2 ring-offset-[var(--bg-surface)]"
                            : "hover:scale-110"
                        }
                      `}
                      style={{
                        backgroundColor: color,
                        ringColor: newAreaColor === color ? color : undefined,
                      }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewAreaName("");
                    setError(null);
                  }}
                  disabled={isCreating}
                  className={`
                    px-3 py-1.5
                    text-[13px] font-medium
                    text-[var(--text-secondary)]
                    hover:text-[var(--text-primary)]
                    transition-colors duration-150
                    disabled:opacity-60
                  `}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateArea}
                  disabled={!newAreaName.trim() || isCreating}
                  className={`
                    px-3 py-1.5
                    text-[13px] font-medium
                    text-[var(--bg-root)]
                    bg-[var(--accent)]
                    rounded-md
                    transition-all duration-150
                    hover:opacity-90
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          )}

          {/* Areas list */}
          {!isLoading && areas.length > 0 && (
            <div className="space-y-1">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className={`
                    group
                    p-3 rounded-lg
                    bg-[var(--bg-surface)]
                    border border-[var(--border)]
                    transition-colors duration-150
                    ${editingAreaId === area.id ? "border-[var(--accent)]" : ""}
                  `}
                >
                  {editingAreaId === area.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      {/* Name input */}
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        disabled={isUpdating}
                        placeholder="Area name"
                        className={`
                          w-full
                          px-3 py-2
                          text-[14px] font-normal
                          text-[var(--text-primary)]
                          placeholder:text-[var(--text-tertiary)]
                          bg-[var(--bg-card)]
                          border border-[var(--border)]
                          rounded-lg
                          focus:outline-none focus:border-[var(--accent)]
                          transition-colors duration-150
                          disabled:opacity-60
                        `}
                      />

                      {/* Color picker */}
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-tertiary)] mb-1.5">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {AREA_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditColor(color)}
                              disabled={isUpdating}
                              className={`
                                w-7 h-7 rounded-full
                                transition-all duration-150
                                disabled:opacity-60
                                ${
                                  editColor === color
                                    ? "ring-2 ring-offset-2 ring-offset-[var(--bg-surface)]"
                                    : "hover:scale-110"
                                }
                              `}
                              style={{
                                backgroundColor: color,
                                ringColor: editColor === color ? color : undefined,
                              }}
                              aria-label={`Select color ${color}`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAreaId(null);
                            setError(null);
                          }}
                          disabled={isUpdating}
                          className={`
                            px-3 py-1.5
                            text-[13px] font-medium
                            text-[var(--text-secondary)]
                            hover:text-[var(--text-primary)]
                            transition-colors duration-150
                            disabled:opacity-60
                          `}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={!editName.trim() || isUpdating}
                          className={`
                            px-3 py-1.5
                            text-[13px] font-medium
                            text-[var(--bg-root)]
                            bg-[var(--accent)]
                            rounded-md
                            transition-all duration-150
                            hover:opacity-90
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="flex items-center gap-3">
                      {/* Color dot */}
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: area.color }}
                      />

                      {/* Name - clickable to edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(area)}
                        className={`
                          flex-1 text-left
                          text-[14px] font-medium
                          text-[var(--text-primary)]
                          hover:text-[var(--accent)]
                          transition-colors duration-150
                        `}
                      >
                        {area.name}
                      </button>

                      {/* Project count badge */}
                      <span
                        className={`
                          px-2 py-0.5
                          text-[12px] font-medium
                          text-[var(--text-tertiary)]
                          bg-[var(--bg-card)]
                          rounded-full
                        `}
                      >
                        {area._count.projects}{" "}
                        {area._count.projects === 1 ? "project" : "projects"}
                      </span>

                      {/* Delete button - shown on hover */}
                      <button
                        type="button"
                        onClick={() => handleStartDelete(area)}
                        className={`
                          p-1.5 rounded
                          text-[var(--text-tertiary)]
                          opacity-0 group-hover:opacity-100
                          hover:text-[#E88B8B] hover:bg-[#E88B8B]/10
                          transition-all duration-150
                        `}
                        aria-label={`Delete ${area.name}`}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && areas.length === 0 && !error && (
            <div className="py-8 text-center text-[var(--text-tertiary)]">
              <p className="text-[14px]">No areas yet</p>
              <p className="text-[12px] mt-1">
                Click &quot;Add Area&quot; to create your first area
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 pb-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`
              px-4 py-1.5
              text-[14px] font-medium
              text-[var(--text-secondary)]
              hover:text-[var(--text-primary)]
              transition-colors duration-150
            `}
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {deletingAreaId && areaToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-area-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelDelete();
            }
          }}
          className={`
            fixed inset-0 z-50
            flex items-center justify-center
            bg-black/60 backdrop-blur-sm
            animate-in fade-in duration-150
          `}
        >
          {/* Dialog Card */}
          <div
            className={`
              /* Width */
              w-[calc(100%-32px)] max-w-[360px]

              /* Styling */
              bg-[var(--bg-card)]
              border border-[var(--border)]
              rounded-[14px]
              shadow-xl
              p-5

              /* Animation */
              animate-in fade-in slide-in-from-bottom-2 zoom-in-[0.97]
              duration-200
            `}
          >
            {/* Title */}
            <h3
              id="delete-area-title"
              className="text-[16px] font-medium text-[var(--text-primary)] text-center mb-2"
            >
              Delete &quot;{areaToDelete.name}&quot;?
            </h3>

            {/* Description */}
            {areaToDelete._count.projects > 0 ? (
              <div className="mb-4">
                <p className="text-[14px] text-[var(--text-secondary)] text-center mb-3">
                  This area has {areaToDelete._count.projects}{" "}
                  {areaToDelete._count.projects === 1 ? "project" : "projects"}.
                  Choose where to move them:
                </p>

                {/* Reassignment dropdown */}
                <select
                  value={reassignToAreaId}
                  onChange={(e) => setReassignToAreaId(e.target.value)}
                  disabled={isDeleting}
                  className={`
                    w-full
                    px-3 py-2
                    text-[14px]
                    text-[var(--text-primary)]
                    bg-[var(--bg-surface)]
                    border border-[var(--border)]
                    rounded-lg
                    focus:outline-none focus:border-[var(--accent)]
                    transition-colors duration-150
                    disabled:opacity-60
                  `}
                >
                  {otherAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-[14px] text-[var(--text-secondary)] text-center mb-4">
                This area has no projects and can be safely deleted.
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className={`
                  flex-1 py-2.5
                  text-[14px] font-medium
                  text-[var(--text-secondary)]
                  bg-[var(--bg-surface)]
                  border border-[var(--border)]
                  rounded-md
                  transition-all duration-150
                  hover:opacity-80
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting || (areaToDelete._count.projects > 0 && otherAreas.length === 0)}
                className={`
                  flex-1 py-2.5
                  text-[14px] font-medium
                  text-white
                  bg-[#E88B8B]
                  rounded-md
                  transition-all duration-150
                  hover:opacity-90
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E88B8B] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render via portal to document body
  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
