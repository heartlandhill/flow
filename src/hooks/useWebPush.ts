"use client";

import { useState, useCallback, useEffect } from "react";

type WebPushStatus = "idle" | "loading" | "enabled" | "denied" | "unsupported";

interface UseWebPushReturn {
  status: WebPushStatus;
  isSupported: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

/**
 * Convert a base64 URL-encoded string to a Uint8Array.
 * Required for the VAPID public key when subscribing to push notifications.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser supports Web Push notifications.
 */
function checkSupport(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Get initial status based on current browser permission state.
 */
function getInitialStatus(): WebPushStatus {
  if (!checkSupport()) return "unsupported";
  if (typeof Notification !== "undefined" && Notification.permission === "denied") {
    return "denied";
  }
  return "idle";
}

export function useWebPush(): UseWebPushReturn {
  const [status, setStatus] = useState<WebPushStatus>(getInitialStatus);
  const isSupported = checkSupport();

  // Check for existing subscription on mount
  useEffect(() => {
    if (!isSupported) return;

    async function checkExistingSubscription() {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            setStatus("enabled");
          } else if (Notification.permission === "denied") {
            setStatus("denied");
          }
        }
      } catch {
        // Silent fail - just use initial state
      }
    }

    checkExistingSubscription();
  }, [isSupported]);

  const enable = useCallback(async () => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }

    setStatus("loading");

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Get the VAPID public key from environment
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      if (!vapidKey) {
        throw new Error("VAPID public key not configured");
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys?.p256dh,
            auth: subscription.toJSON().keys?.auth,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register subscription");
      }

      setStatus("enabled");
    } catch (error) {
      console.error("Failed to enable web push:", error);
      // Revert to appropriate status based on permission
      if (Notification.permission === "denied") {
        setStatus("denied");
      } else {
        setStatus("idle");
      }
    }
  }, [isSupported]);

  const disable = useCallback(async () => {
    if (!isSupported) return;

    setStatus("loading");

    try {
      // Get the service worker registration
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!registration) {
        setStatus("idle");
        return;
      }

      // Get the current subscription
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setStatus("idle");
        return;
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Notify server to deactivate subscription
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      setStatus("idle");
    } catch (error) {
      console.error("Failed to disable web push:", error);
      setStatus("idle");
    }
  }, [isSupported]);

  return {
    status,
    isSupported,
    enable,
    disable,
  };
}
