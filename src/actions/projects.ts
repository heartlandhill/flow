"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type {
  ActionResult,
  Project,
  ProjectStatus,
  ProjectType,
} from "@/types";

/**
 * Input data for creating a new project.
 */
interface CreateProjectInput {
  name: string;
  areaId: string;
  notes?: string;
  status?: ProjectStatus;
  type?: ProjectType;
}

/**
 * Input data for updating an existing project.
 */
interface UpdateProjectInput {
  name?: string;
  notes?: string;
  status?: ProjectStatus;
  type?: ProjectType;
  areaId?: string;
  sortOrder?: number;
  reviewIntervalDays?: number;
  lastReviewedAt?: Date;
  nextReviewDate?: Date;
}

/**
 * Server action to create a new project.
 * Requires a name and area_id. Other fields use defaults.
 */
export async function createProject(
  input: CreateProjectInput
): Promise<ActionResult<Project>> {
  try {
    // Validate required inputs
    if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
      return { success: false, error: "Project name is required" };
    }

    if (!input.areaId || typeof input.areaId !== "string") {
      return { success: false, error: "Area ID is required" };
    }

    // Verify area exists
    const area = await prisma.area.findUnique({
      where: { id: input.areaId },
    });

    if (!area) {
      return { success: false, error: "Area not found" };
    }

    const project = await prisma.project.create({
      data: {
        name: input.name.trim(),
        area_id: input.areaId,
        notes: input.notes?.trim() ?? null,
        status: input.status ?? "ACTIVE",
        type: input.type ?? "PARALLEL",
      },
    });

    // Revalidate projects view
    revalidatePath("/projects");

    return { success: true, data: project };
  } catch (error) {
    console.error("Create project error:", error);
    return { success: false, error: "Failed to create project" };
  }
}

/**
 * Server action to update an existing project.
 * Only provided fields will be updated.
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<ActionResult<Project>> {
  try {
    // Validate project ID
    if (!projectId || typeof projectId !== "string") {
      return { success: false, error: "Project ID is required" };
    }

    // Verify project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      return { success: false, error: "Project not found" };
    }

    // If updating area, verify it exists
    if (input.areaId) {
      const area = await prisma.area.findUnique({
        where: { id: input.areaId },
      });

      if (!area) {
        return { success: false, error: "Area not found" };
      }
    }

    // Build update data, only including provided fields
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || input.name.trim().length === 0) {
        return { success: false, error: "Project name cannot be empty" };
      }
      updateData.name = input.name.trim();
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes?.trim() ?? null;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.areaId !== undefined) {
      updateData.area_id = input.areaId;
    }

    if (input.sortOrder !== undefined) {
      updateData.sort_order = input.sortOrder;
    }

    if (input.reviewIntervalDays !== undefined) {
      updateData.review_interval_days = input.reviewIntervalDays;
    }

    if (input.lastReviewedAt !== undefined) {
      updateData.last_reviewed_at = input.lastReviewedAt;
    }

    if (input.nextReviewDate !== undefined) {
      updateData.next_review_date = input.nextReviewDate;
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // Revalidate views that show projects
    revalidatePath("/projects");
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/review");

    return { success: true, data: project };
  } catch (error) {
    console.error("Update project error:", error);
    return { success: false, error: "Failed to update project" };
  }
}

/**
 * Server action to mark a project as reviewed.
 * Updates last_reviewed_at to now and calculates next_review_date based on review_interval_days.
 */
export async function markProjectReviewed(
  id: string
): Promise<ActionResult> {
  try {
    // Validate project ID
    if (!id || typeof id !== "string") {
      return { success: false, error: "Project ID is required" };
    }

    // Find the project
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (!project.review_interval_days) {
      return { success: false, error: "Project has no review interval" };
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + project.review_interval_days);

    // Update the project with review timestamps
    await prisma.project.update({
      where: { id },
      data: {
        last_reviewed_at: new Date(),
        next_review_date: nextReview,
      },
    });

    // Revalidate the review view
    revalidatePath("/review");
    // Revalidate layout to update navigation badges
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Mark project reviewed error:", error);
    return { success: false, error: "Failed to mark project as reviewed" };
  }
}
