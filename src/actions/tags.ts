"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ActionResult, Tag } from "@/types";

/**
 * Server action to create a new tag.
 * Creates a tag with the given name and optional icon.
 */
export async function createTag(data: {
  name: string;
  icon?: string;
}): Promise<ActionResult<Tag>> {
  try {
    // Validate input
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      return { success: false, error: "Tag name is required" };
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name.trim(),
        icon: data.icon || null,
      },
    });

    // Revalidate tags view to show new tag
    revalidatePath("/tags");

    return { success: true, data: tag };
  } catch (error) {
    console.error("Create tag error:", error);
    return { success: false, error: "Failed to create tag" };
  }
}

/**
 * Server action to set the tags for a task.
 * Replaces all existing tags with the provided tag IDs.
 * Uses a transaction to ensure atomicity.
 */
export async function setTaskTags(
  taskId: string,
  tagIds: string[]
): Promise<ActionResult> {
  try {
    // Validate input
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    // Use transaction to delete existing tags and create new ones
    await prisma.$transaction(async (tx) => {
      // Delete all existing task-tag relationships for this task
      await tx.taskTag.deleteMany({
        where: { task_id: taskId },
      });

      // Create new task-tag relationships
      if (tagIds.length > 0) {
        await tx.taskTag.createMany({
          data: tagIds.map((tagId) => ({
            task_id: taskId,
            tag_id: tagId,
          })),
        });
      }
    });

    // Revalidate all views that show tasks with tags
    revalidatePath("/tags");
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/projects");

    return { success: true };
  } catch (error) {
    console.error("Set task tags error:", error);
    return { success: false, error: "Failed to set task tags" };
  }
}
