import { getBoss } from "./scheduler";

/**
 * Initialize the notification system on server startup.
 * Only starts pg-boss if PGBOSS_ENABLED=true.
 *
 * This guard exists for multi-instance deployments where only
 * one instance should run the pg-boss worker.
 */
export async function initNotifications(): Promise<void> {
  const enabled = process.env.PGBOSS_ENABLED === "true";

  if (!enabled) {
    console.log("[Notifications] pg-boss disabled (PGBOSS_ENABLED !== 'true')");
    return;
  }

  try {
    console.log("[Notifications] Initializing pg-boss...");
    await getBoss();
    console.log("[Notifications] pg-boss initialized successfully");
  } catch (error) {
    console.error("[Notifications] Failed to initialize pg-boss:", error);
    throw error;
  }
}
