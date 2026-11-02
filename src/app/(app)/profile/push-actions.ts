'use server'

import { prisma } from "@/lib/prisma"
import { sendPushToUser } from "@/lib/push"
import { requireUser } from "@/lib/auth-guards"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

export async function savePushSubscription(sub: {
    endpoint: string
    p256dh: string
    auth: string
    isMobile?: boolean
    isStandalone?: boolean
}) {
    const user = await requireUser()

    if (!sub.endpoint || !sub.p256dh || !sub.auth) {
        return { error: "Invalid push subscription object" }
    }

    // Verify request is from a mobile device
    const headerList = await headers()
    const ua = headerList.get("user-agent") || ""
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
    const isMobile = sub.isMobile ?? isMobileUA

    if (!isMobile) {
        return { error: "Push notifications are only supported on mobile devices." }
    }

    // Ensure notifications are only enabled when installed as an app (standalone)
    if (sub.isStandalone === false) {
        return { error: "Push notifications require installing the app to your Home Screen." }
    }

    try {
        await prisma.pushSubscription.upsert({
            where: { endpoint: sub.endpoint },
            update: {
                userId: user.id,
                p256dh: sub.p256dh,
                auth: sub.auth
            },
            create: {
                userId: user.id,
                endpoint: sub.endpoint,
                p256dh: sub.p256dh,
                auth: sub.auth
            }
        })
        revalidatePath('/profile')
        return { success: true }
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to save push subscription" }
    }
}

export async function removePushSubscription(endpoint: string) {
    const user = await requireUser()

    try {
        await prisma.pushSubscription.deleteMany({
            where: {
                endpoint,
                userId: user.id
            }
        })
        revalidatePath('/profile')
        return { success: true }
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to remove push subscription" }
    }
}

export async function updateNotificationPreferences(formData: FormData) {
    const user = await requireUser()

    const notifyPracticeMorning = formData.get('notifyPracticeMorning') === 'on'
    const notifyPracticeOneHour = formData.get('notifyPracticeOneHour') === 'on'
    const notifyPracticeCancel = formData.get('notifyPracticeCancel') === 'on'
    const notifyPracticeChange = formData.get('notifyPracticeChange') === 'on'
    const notifyPracticeSuggestion = formData.get('notifyPracticeSuggestion') === 'on'
    const notifyPracticeVote = formData.get('notifyPracticeVote') === 'on'
    const notifyPracticeRsvp = formData.get('notifyPracticeRsvp') === 'on'

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                notifyPracticeMorning,
                notifyPracticeOneHour,
                notifyPracticeCancel,
                notifyPracticeChange,
                notifyPracticeSuggestion,
                notifyPracticeVote,
                notifyPracticeRsvp
            }
        })
        revalidatePath('/profile')
        return { success: true }
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Failed to update notification preferences" }
    }
}

export async function sendTestNotification() {
    const user = await requireUser()

    const result = await sendPushToUser(user.id, {
        title: "🎵 Sadhusanga Rehearsal Alert",
        body: "Push notifications are working perfectly on this device!",
        url: "/profile",
        tag: "test-notification"
    })

    if (result.count === 0) {
        return { error: "No active push subscription found for this device. Please enable notifications first." }
    }

    return { success: true, count: result.count }
}
