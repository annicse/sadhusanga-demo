import webpush from "web-push"
import { prisma } from "@/lib/prisma"

// Single source of truth for the VAPID key pair. The public half is also
// exposed to the browser via NEXT_PUBLIC_VAPID_PUBLIC_KEY (see src/lib/vapid.ts).
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com"

// VAPID setup is deferred to first use rather than done at import time.
// `next build` evaluates route modules with NODE_ENV=production while
// collecting page data, so throwing here would fail the build whenever the
// keys are absent from the build environment (e.g. Vercel without env vars).
let vapidConfigured = false
let vapidWarned = false

function ensureVapidConfigured(): boolean {
    if (vapidConfigured) return true
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
        vapidConfigured = true
        return true
    }
    if (!vapidWarned) {
        vapidWarned = true
        const msg = "NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are not set — push notifications are disabled."
        if (process.env.NODE_ENV === "production") console.error(msg)
        else console.warn(msg)
    }
    return false
}

export interface PushPayload {
    title: string
    body: string
    url?: string
    tag?: string
}

export async function sendPushNotification(
    sub: { id?: string; endpoint: string; p256dh: string; auth: string },
    payload: PushPayload
) {
    if (!ensureVapidConfigured()) {
        return { error: "VAPID keys not configured" }
    }

    const pushSubscription: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
        }
    }

    try {
        await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
        )
        return { success: true }
    } catch (err: any) {
        console.error("Failed to send push notification:", err?.statusCode || err?.message)
        // If subscription has expired or is unsubscribed (404 Not Found or 410 Gone), prune from database
        if (err?.statusCode === 404 || err?.statusCode === 410) {
            try {
                await prisma.pushSubscription.deleteMany({
                    where: { endpoint: sub.endpoint }
                })
                console.log(`Pruned expired push subscription: ${sub.endpoint}`)
            } catch (dbErr) {
                console.error("Failed to delete expired subscription:", dbErr)
            }
        }
        return { error: err.message }
    }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
    })

    if (subscriptions.length === 0) {
        return { count: 0 }
    }

    const results = await Promise.allSettled(
        subscriptions.map(sub => sendPushNotification(sub, payload))
    )

    return { count: subscriptions.length, results }
}

export type NotificationPreference =
    | 'notifyPracticeMorning'
    | 'notifyPracticeOneHour'
    | 'notifyPracticeCancel'
    | 'notifyPracticeChange'
    | 'notifyPracticeSuggestion'
    | 'notifyPracticeVote'
    | 'notifyPracticeRsvp'

export async function sendPushToUsersWithPreference(
    preferenceField: NotificationPreference,
    payload: PushPayload,
    excludeUserId?: string
) {
    try {
        const users = await prisma.user.findMany({
            where: {
                [preferenceField]: true,
                ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
                pushSubscriptions: { some: {} }
            },
            select: { id: true }
        })

        if (users.length === 0) return { count: 0 }

        const results = await Promise.allSettled(
            users.map(u => sendPushToUser(u.id, payload))
        )

        return { count: users.length, results }
    } catch (err) {
        console.error(`Failed to send push notifications for ${preferenceField}:`, err)
        return { count: 0, error: err }
    }
}

