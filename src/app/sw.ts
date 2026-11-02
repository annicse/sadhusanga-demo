import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// -----------------------------------------------------------------------------
// Web Push Notifications
// -----------------------------------------------------------------------------

self.addEventListener("push", (event) => {
    let data: { title?: string; body?: string; url?: string; tag?: string } = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { body: event.data ? event.data.text() : undefined };
    }

    const title = data.title || "Sadhusanga Rehearsal Alert";
    // Use PNG icon for full compatibility — JPEG is not supported as badge on Android
    // Cast to `any` because TypeScript's NotificationOptions type is incomplete;
    // `renotify` is a real, widely-supported browser API option
    const options = {
        body: data.body || "You have an upcoming rehearsal.",
        icon: "/android-chrome-192x192.png",
        // Badge must be a small monochrome PNG (used by Android for status bar)
        badge: "/android-chrome-192x192.png",
        tag: data.tag || "practice-reminder",
        // renotify: true ensures a new notification shows even if the same tag exists
        renotify: true,
        data: {
            url: data.url || "/practices"
        }
    } as NotificationOptions;

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetPath: string = event.notification.data?.url || "/practices";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Try to focus an existing window first
            for (const client of clientList) {
                const clientUrl = new URL(client.url);
                if (clientUrl.pathname === targetPath || client.url.includes(targetPath)) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetPath);
            }
        })
    );
});
