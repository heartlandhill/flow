import type {
  Area,
  Project,
  Task,
  Tag,
  TaskTag,
  Reminder,
  NotificationSubscription,
  User,
  Session,
  ProjectStatus,
  ProjectType,
  ReminderStatus,
  SubscriptionType,
} from "@prisma/client";

// Re-export Prisma types
export type {
  Area,
  Project,
  Task,
  Tag,
  TaskTag,
  Reminder,
  NotificationSubscription,
  User,
  Session,
  ProjectStatus,
  ProjectType,
  ReminderStatus,
  SubscriptionType,
};

// Task with relations
export interface TaskWithRelations extends Task {
  project: (Project & { area: Area }) | null;
  tags: (TaskTag & { tag: Tag })[];
  reminders: Reminder[];
}

// Simplified task with just tags
export interface TaskWithTags extends Task {
  tags: (TaskTag & { tag: Tag })[];
}

// Project with tasks
export interface ProjectWithTasks extends Project {
  area: Area;
  tasks: Task[];
}

// Area with projects
export interface AreaWithProjects extends Area {
  projects: ProjectWithTasks[];
}

// Tag with task count
export interface TagWithCount extends Tag {
  _count: {
    tasks: number;
  };
}

// Project with tasks and counts for Projects view
export interface ProjectWithTasksAndCounts extends Project {
  area: Area;
  tasks: TaskWithTags[];
  _count: { tasks: number };
}

// Area with projects for Projects view
export interface AreaWithProjectsAndCounts extends Area {
  projects: ProjectWithTasksAndCounts[];
}

// Someday project (minimal - just needs area for display)
export interface SomedayProject extends Project {
  area: Area;
}

// Completed count result for project progress calculation
export interface CompletedCountResult {
  id: string;
  _count: { tasks: number };
}

// Project with full relations for Review view
export interface ReviewableProject extends Project {
  area: Area;
  tasks: TaskWithTags[];
}

// Computed stats for a project in Review
export interface ReviewProjectStats {
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  completionPercentage: number;
}

// Server action response type
export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}
