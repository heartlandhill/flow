"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ActionResult, Area } from "@/types";

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
