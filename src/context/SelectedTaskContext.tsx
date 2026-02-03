"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  createElement,
  ReactNode,
} from "react";
import type { TaskWithRelations } from "@/types";

interface SelectedTaskContextValue {
  selectedTask: TaskWithRelations | null;
  selectTask: (task: TaskWithRelations) => void;
  clearSelectedTask: () => void;
}

const SelectedTaskContext = createContext<SelectedTaskContextValue | null>(null);

interface SelectedTaskProviderProps {
  children: ReactNode;
}

export function SelectedTaskProvider({ children }: SelectedTaskProviderProps) {
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const selectTask = useCallback((task: TaskWithRelations) => {
    setSelectedTask(task);
  }, []);

  const clearSelectedTask = useCallback(() => {
    setSelectedTask(null);
  }, []);

  return createElement(
    SelectedTaskContext.Provider,
    { value: { selectedTask, selectTask, clearSelectedTask } },
    children
  );
}

export function useSelectedTask(): SelectedTaskContextValue {
  const context = useContext(SelectedTaskContext);

  if (!context) {
    throw new Error("useSelectedTask must be used within a SelectedTaskProvider");
  }

  return context;
}
