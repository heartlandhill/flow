/**
 * Seed default areas and tags for a user.
 * Usage: npx ts-node prisma/seed-user-defaults.ts <username>
 *
 * If no username provided, seeds defaults for all users who don't have any areas yet.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default areas based on GTD life categories
const DEFAULT_AREAS = [
  { name: "Home", color: "#E8A87C", sort_order: 0 },
  { name: "Work", color: "#5B8BD4", sort_order: 1 },
  { name: "School", color: "#9B7ED4", sort_order: 2 },
  { name: "Health", color: "#9ED4A0", sort_order: 3 },
  { name: "Family", color: "#D49BA5", sort_order: 4 },
  { name: "Friends", color: "#5BC4BF", sort_order: 5 },
  { name: "Service", color: "#D4B85B", sort_order: 6 },
  { name: "Finance", color: "#6B8BA3", sort_order: 7 },
  { name: "Spiritual", color: "#A085D4", sort_order: 8 },
  { name: "Recreation", color: "#D4A05B", sort_order: 9 },
];

// Default tags for common GTD contexts
const DEFAULT_TAGS = [
  { name: "Computer", icon: "💻", sort_order: 0 },
  { name: "Errands", icon: "🏃", sort_order: 1 },
  { name: "Calls", icon: "📞", sort_order: 2 },
  { name: "Home", icon: "🏠", sort_order: 3 },
  { name: "Waiting For", icon: "⏳", sort_order: 4 },
  { name: "Deep Focus", icon: "🎯", sort_order: 5 },
];

async function seedUserDefaults(userId: string, username: string) {
  console.log(`\nSeeding defaults for user: ${username}`);

  // Check if user already has areas
  const existingAreas = await prisma.area.count({ where: { user_id: userId } });
  if (existingAreas > 0) {
    console.log(`  Skipping areas - user already has ${existingAreas} areas`);
  } else {
    // Create areas
    for (const area of DEFAULT_AREAS) {
      await prisma.area.create({
        data: { ...area, user_id: userId },
      });
    }
    console.log(`  Created ${DEFAULT_AREAS.length} areas`);
  }

  // Check if user already has tags
  const existingTags = await prisma.tag.count({ where: { user_id: userId } });
  if (existingTags > 0) {
    console.log(`  Skipping tags - user already has ${existingTags} tags`);
  } else {
    // Create tags
    for (const tag of DEFAULT_TAGS) {
      await prisma.tag.create({
        data: { ...tag, user_id: userId },
      });
    }
    console.log(`  Created ${DEFAULT_TAGS.length} tags`);
  }
}

async function main() {
  const targetUsername = process.argv[2];

  if (targetUsername) {
    // Seed for specific user
    const user = await prisma.user.findUnique({
      where: { username: targetUsername },
    });

    if (!user) {
      console.error(`User not found: ${targetUsername}`);
      process.exit(1);
    }

    await seedUserDefaults(user.id, user.username);
  } else {
    // Seed for all users without areas
    console.log("No username provided - seeding defaults for all users without areas...");

    const users = await prisma.user.findMany({
      select: { id: true, username: true },
    });

    for (const user of users) {
      await seedUserDefaults(user.id, user.username);
    }
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
