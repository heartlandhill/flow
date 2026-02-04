"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ActionResult, Tag, TagWithCount } from "@/types";
import { requireUserId } from "@/lib/auth";

/**
 * Server action to create a new tag.
 * Creates a tag with the given name and optional icon.
 */
export async function createTag(data: {
  name: string;
  icon?: string;
}): Promise<ActionResult<Tag>> {
  try {
    const userId = await requireUserId();

    // Validate input
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
      return { success: false, error: "Tag name is required" };
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name.trim(),
        icon: data.icon || null,
        user_id: userId,
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
 * Server action to update an existing tag.
 * Updates the tag name and/or icon.
 */
export async function updateTag(
  tagId: string,
  data: {
    name?: string;
    icon?: string | null;
  }
): Promise<ActionResult<Tag>> {
  try {
    const userId = await requireUserId();

    // Validate tag ID
    if (!tagId || typeof tagId !== "string") {
      return { success: false, error: "Tag ID is required" };
    }

    // Validate that at least one field is being updated
    if (data.name === undefined && data.icon === undefined) {
      return { success: false, error: "No update data provided" };
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (typeof data.name !== "string" || data.name.trim().length === 0) {
        return { success: false, error: "Tag name cannot be empty" };
      }
    }

    // Build update data object
    const updateData: { name?: string; icon?: string | null } = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }
    if (data.icon !== undefined) {
      updateData.icon = data.icon;
    }

    const tag = await prisma.tag.update({
      where: { id: tagId, user_id: userId },
      data: updateData,
    });

    // Revalidate tags view to show updated tag
    revalidatePath("/tags");

    return { success: true, data: tag };
  } catch (error) {
    console.error("Update tag error:", error);
    return { success: false, error: "Failed to update tag" };
  }
}

/**
 * Server action to delete a tag.
 * The cascade delete in the schema will automatically remove all task_tag associations.
 */
export async function deleteTag(tagId: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();

    // Validate tag ID
    if (!tagId || typeof tagId !== "string") {
      return { success: false, error: "Tag ID is required" };
    }

    await prisma.tag.delete({
      where: { id: tagId, user_id: userId },
    });

    // Revalidate all views that show tags or tasks with tags
    revalidatePath("/tags");
    revalidatePath("/inbox");
    revalidatePath("/today");
    revalidatePath("/projects");

    return { success: true };
  } catch (error) {
    console.error("Delete tag error:", error);
    return { success: false, error: "Failed to delete tag" };
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
    const userId = await requireUserId();

    // Validate input
    if (!taskId || typeof taskId !== "string") {
      return { success: false, error: "Task ID is required" };
    }

    // Verify all tags belong to the user
    if (tagIds.length > 0) {
      const tagCount = await prisma.tag.count({
        where: {
          id: { in: tagIds },
          user_id: userId,
        },
      });

      if (tagCount !== tagIds.length) {
        return { success: false, error: "Invalid tag IDs" };
      }
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

/**
 * Query function to get all tags with their incomplete task counts.
 * Used by the tag management modal to display task counts next to each tag.
 * Returns tags ordered by sort_order with _count of incomplete tasks.
 */
export async function getTagsWithTaskCounts(): Promise<TagWithCount[]> {
  const userId = await requireUserId();

  const tags = await prisma.tag.findMany({
    where: { user_id: userId },
    orderBy: { sort_order: "asc" },
    include: {
      _count: {
        select: {
          tasks: {
            where: { task: { completed: false } },
          },
        },
      },
    },
  });

  return tags;
}
