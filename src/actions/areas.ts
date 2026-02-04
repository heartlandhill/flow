"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ActionResult, Area } from "@/types";
import { requireUserId } from "@/lib/auth";

/**
 * Area with project count for management UI.
 */
export interface AreaWithProjectCount extends Area {
  _count: {
    projects: number;
  };
}

/**
 * Input data for creating a new area.
 */
interface CreateAreaInput {
  name: string;
  color?: string;
}

/**
 * Input data for updating an existing area.
 */
interface UpdateAreaInput {
  name?: string;
  color?: string;
  sortOrder?: number;
}

/**
 * Server action to get all areas with their project counts.
 * Returns areas sorted by sort_order ascending, then by name.
 * Used by the AreaManagementModal to display areas with project counts.
 */
export async function getAreasWithProjectCounts(): Promise<
  ActionResult<AreaWithProjectCount[]>
> {
  try {
    const areas = await prisma.area.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    });

    return { success: true, data: areas };
  } catch (error) {
    console.error("Get areas with project counts error:", error);
    return { success: false, error: "Failed to fetch areas" };
  }
}

/**
 * Server action to create a new area.
 * Requires a name. Color defaults to "#888888" if not specified.
 */
export async function createArea(
  input: CreateAreaInput
): Promise<ActionResult<Area>> {
  try {
    const userId = await requireUserId();

    // Validate required inputs
    if (
      !input.name ||
      typeof input.name !== "string" ||
      input.name.trim().length === 0
    ) {
      return { success: false, error: "Area name is required" };
    }

    const area = await prisma.area.create({
      data: {
        name: input.name.trim(),
        color: input.color?.trim() || "#888888",
        user_id: userId,
      },
    });

    // Revalidate projects view to show updated area list
    revalidatePath("/projects");

    return { success: true, data: area };
  } catch (error) {
    console.error("Create area error:", error);

    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, error: "An area with this name already exists" };
      }
    }

    return { success: false, error: "Failed to create area" };
  }
}

/**
 * Server action to update an existing area.
 * Only provided fields will be updated.
 */
export async function updateArea(
  areaId: string,
  input: UpdateAreaInput
): Promise<ActionResult<Area>> {
  try {
    // Validate area ID
    if (!areaId || typeof areaId !== "string") {
      return { success: false, error: "Area ID is required" };
    }

    // Verify area exists
    const existingArea = await prisma.area.findUnique({
      where: { id: areaId },
    });

    if (!existingArea) {
      return { success: false, error: "Area not found" };
    }

    // Build update data, only including provided fields
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || input.name.trim().length === 0) {
        return { success: false, error: "Area name cannot be empty" };
      }
      updateData.name = input.name.trim();
    }

    if (input.color !== undefined) {
      updateData.color = input.color?.trim() || "#888888";
    }

    if (input.sortOrder !== undefined) {
      updateData.sort_order = input.sortOrder;
    }

    const area = await prisma.area.update({
      where: { id: areaId },
      data: updateData,
    });

    // Revalidate projects view to show updated area
    revalidatePath("/projects");

    return { success: true, data: area };
  } catch (error) {
    console.error("Update area error:", error);

    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return { success: false, error: "An area with this name already exists" };
      }
    }

    return { success: false, error: "Failed to update area" };
  }
}

/**
 * Server action to delete an area.
 * If the area has projects, they must be reassigned to another area.
 * Uses a transaction to ensure atomic reassign + delete operations.
 */
export async function deleteArea(
  areaId: string,
  reassignToAreaId?: string
): Promise<ActionResult> {
  try {
    // Validate area ID
    if (!areaId || typeof areaId !== "string") {
      return { success: false, error: "Area ID is required" };
    }

    // Verify area exists and get project count
    const area = await prisma.area.findUnique({
      where: { id: areaId },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!area) {
      return { success: false, error: "Area not found" };
    }

    const projectCount = area._count.projects;

    // If area has projects, destination area is required
    if (projectCount > 0) {
      if (!reassignToAreaId || typeof reassignToAreaId !== "string") {
        return {
          success: false,
          error: "Destination area is required when deleting an area with projects",
        };
      }

      // Cannot reassign to self
      if (reassignToAreaId === areaId) {
        return {
          success: false,
          error: "Cannot reassign projects to the same area being deleted",
        };
      }

      // Verify destination area exists
      const destinationArea = await prisma.area.findUnique({
        where: { id: reassignToAreaId },
      });

      if (!destinationArea) {
        return { success: false, error: "Destination area not found" };
      }
    }

    // Use transaction to reassign projects and delete area atomically
    await prisma.$transaction(async (tx) => {
      // Move projects to destination area if any exist
      if (projectCount > 0 && reassignToAreaId) {
        await tx.project.updateMany({
          where: { area_id: areaId },
          data: { area_id: reassignToAreaId },
        });
      }

      // Delete the area
      await tx.area.delete({
        where: { id: areaId },
      });
    });

    // Revalidate all views that show areas or projects
    revalidatePath("/projects");
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/forecast");
    revalidatePath("/review");
    revalidatePath("/tags");
    // Revalidate layout to update navigation
    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Delete area error:", error);
    return { success: false, error: "Failed to delete area" };
  }
}
