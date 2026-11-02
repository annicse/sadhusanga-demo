import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPushToUser } from "@/lib/push"
import { doorCodeForVenue } from "@/lib/band-config"
import { bandHour, endOfCalendarDay, practiceStartInstant, startOfBandToday } from "@/lib/time"

export const dynamic = "force-dynamic"

/** Hour (in the band's timezone) from which the "practice today" reminder may be sent. */
const MORNING_REMINDER_HOUR = 8

// Vercel Cron calls GET with `Authorization: Bearer <CRON_SECRET>` automatically
// when the CRON_SECRET env var is set on the project.
export async function GET(request: Request) {
    return handleCron(request)
}

async function handleCron(request: Request) {
    // Fail closed: without a configured secret the endpoint cannot be used at all.
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 })
    }
    if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const today = startOfBandToday(now)

    // All scheduled, non-cancelled practices on today's calendar day (band timezone)
    const practicesToday = await prisma.practice.findMany({
        where: {
            date: { gte: today, lte: endOfCalendarDay(today) },
            isCancelled: false
        }
    })

    if (practicesToday.length === 0) {
        return NextResponse.json({
            message: "No practices scheduled for today.",
            checkedAt: now.toISOString()
        })
    }

    let morningAlertsCount = 0
    let oneHourAlertsCount = 0

    for (const practice of practicesToday) {
        const start = practiceStartInstant(practice.date, practice.time)
        const diffMinutes = (start.getTime() - now.getTime()) / (1000 * 60)

        const doorCode = doorCodeForVenue(practice.venue)
        const doorCodeText = doorCode ? ` Lydrom code: *${doorCode}*.` : ""

        // 1. MORNING REMINDER — once per practice, from 08:00 band time
        if (!practice.morningReminderSentAt && bandHour(now) >= MORNING_REMINDER_HOUR) {
            const morningSubscribers = await prisma.user.findMany({
                where: {
                    notifyPracticeMorning: true,
                    pushSubscriptions: { some: {} }
                },
                select: { id: true }
            })

            const morningPayload = {
                title: `🎵 Rehearsal Today at ${practice.time}!`,
                body: `Practice today at ${practice.venue}.${doorCodeText} Tap to view details and RSVP.`,
                url: `/practices/${practice.id}`,
                tag: `practice-morning-${practice.id}`
            }

            await Promise.allSettled(
                morningSubscribers.map(u => sendPushToUser(u.id, morningPayload))
            )

            await prisma.practice.update({
                where: { id: practice.id },
                data: { morningReminderSentAt: now }
            })

            morningAlertsCount += morningSubscribers.length
        }

        // 2. ONE HOUR BEFORE — once per practice, within 65 min before start
        //    (and up to 15 min after, in case the cron tick was late)
        if (!practice.oneHourReminderSentAt && diffMinutes <= 65 && diffMinutes >= -15) {
            const oneHourSubscribers = await prisma.user.findMany({
                where: {
                    notifyPracticeOneHour: true,
                    pushSubscriptions: { some: {} }
                },
                select: { id: true }
            })

            const oneHourPayload = {
                title: `🎸 Practice in 1 hour (${practice.time})!`,
                body: `Rehearsal begins soon at ${practice.venue}.${doorCodeText}`,
                url: `/practices/${practice.id}`,
                tag: `practice-1h-${practice.id}`
            }

            await Promise.allSettled(
                oneHourSubscribers.map(u => sendPushToUser(u.id, oneHourPayload))
            )

            await prisma.practice.update({
                where: { id: practice.id },
                data: { oneHourReminderSentAt: now }
            })

            oneHourAlertsCount += oneHourSubscribers.length
        }
    }

    return NextResponse.json({
        success: true,
        checkedAt: now.toISOString(),
        practicesCount: practicesToday.length,
        morningAlertsCount,
        oneHourAlertsCount
    })
}
