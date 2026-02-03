import { prisma } from "@/lib/db";

export interface BadgeCounts {
  inbox: number;
  today: number;
  review: number;
}

export async function getBadgeCounts(): Promise<BadgeCounts> {
  // Set today to midnight for consistent date comparisons
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [inbox, todayCount, review] = await Promise.all([
    // Inbox: incomplete inbox tasks
    prisma.task.count({
      where: { inbox: true, completed: false },
    }),
    // Today: due today OR deferred and available today
    prisma.task.count({
      where: {
        completed: false,
        OR: [
          { due_date: today },
          { defer_date: { lte: today } },
        ],
      },
    }),
    // Review: active projects needing review
    prisma.project.count({
      where: {
        status: "ACTIVE",
        review_interval_days: { not: null },
        OR: [
          { next_review_date: null },
          { next_review_date: { lte: today } },
        ],
      },
    }),
  ]);

  return { inbox, today: todayCount, review };
}
