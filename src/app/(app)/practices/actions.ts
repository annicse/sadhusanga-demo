'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Prisma, RsvpStatus } from "@prisma/client"
import { sendPushToUsersWithPreference, sendPushToUser } from "@/lib/push"
import { requireUser, assertCanEdit } from "@/lib/auth-guards"
import { PracticeSchema, RecurringPracticeSchema, SuggestionSchema } from "@/lib/validations/practice"
import { firstIssueMessage } from "@/lib/validations/utils"
import { calendarDayFromString, startOfBandToday } from "@/lib/time"

const DAY_MS = 24 * 60 * 60 * 1000

/** Short human date for push bodies, e.g. "Thu, Oct 8". Dates are calendar days so UTC is correct. */
function shortDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    })
}

function errorMessage(err: unknown, fallback: string) {
    return err instanceof Error && err.message ? err.message : fallback
}

export async function createPractice(formData: FormData) {
    const user = await requireUser()

    const validation = PracticeSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }
    const { date: dateStr, time, venue, notes } = validation.data

    let result
    try {
        result = await prisma.practice.create({
            data: {
                date: calendarDayFromString(dateStr), // calendar day; wall-clock lives in `time`
                time,
                venue,
                notes,
                createdById: user.id
            }
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to create practice") }
    }

    revalidatePath('/practices')
    revalidatePath('/')
    redirect(`/practices/${result.id}`)
}

export async function createRecurringPractices(formData: FormData) {
    const user = await requireUser()

    const validation = RecurringPracticeSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }
    const { dayOfWeek, time, venue, untilMonth } = validation.data

    const [targetYear, targetMonth] = untilMonth.split('-').map(Number)
    // Last calendar day of the target month
    const endDay = new Date(Date.UTC(targetYear, targetMonth, 0))

    // Start generating from tomorrow (band timezone)
    const datesToCreate: Date[] = []
    for (let day = new Date(startOfBandToday().getTime() + DAY_MS); day <= endDay; day = new Date(day.getTime() + DAY_MS)) {
        if (day.getUTCDay() === dayOfWeek) datesToCreate.push(day)
    }

    if (datesToCreate.length === 0) {
        return { error: "No matching dates found in the selected range." }
    }

    try {
        await prisma.practice.createMany({
            data: datesToCreate.map(d => ({
                date: d,
                time,
                venue,
                createdById: user.id
            }))
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to generate recurring practices") }
    }

    revalidatePath('/practices')
    revalidatePath('/')
    return { success: true, count: datesToCreate.length }
}

export async function updatePractice(id: string, formData: FormData) {
    const user = await requireUser()

    const validation = PracticeSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }
    const { date: dateStr, time, venue, notes } = validation.data

    try {
        const existing = await prisma.practice.findUnique({ where: { id }, select: { createdById: true } })
        if (!existing) return { error: "Practice not found" }
        assertCanEdit(user, existing)

        await prisma.practice.update({
            where: { id },
            data: {
                date: calendarDayFromString(dateStr),
                time,
                venue,
                notes,
                // The schedule changed, so the reminders must be re-evaluated
                morningReminderSentAt: null,
                oneHourReminderSentAt: null,
            }
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to update practice") }
    }

    revalidatePath('/practices')
    revalidatePath(`/practices/${id}`)
    revalidatePath('/')
    return { success: true }
}

export async function toggleCancelPractice(id: string, isCancelled: boolean) {
    const user = await requireUser()

    let practice
    try {
        const existing = await prisma.practice.findUnique({ where: { id }, select: { createdById: true } })
        if (!existing) return { error: "Practice not found" }
        assertCanEdit(user, existing)

        practice = await prisma.practice.update({
            where: { id },
            data: {
                isCancelled,
                cancelReason: null
            }
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to update cancellation status") }
    }

    const dateStr = shortDate(practice.date)

    if (isCancelled) {
        sendPushToUsersWithPreference('notifyPracticeCancel', {
            title: "⚠️ Practice Cancelled",
            body: `Rehearsal on ${dateStr} has been cancelled.`,
            url: `/practices/${id}`,
            tag: `practice-cancel-${id}`
        }, user.id).catch(console.error)
    } else {
        sendPushToUsersWithPreference('notifyPracticeCancel', {
            title: "✅ Practice Restored",
            body: `Rehearsal on ${dateStr} is back on at ${practice.venue} (${practice.time})!`,
            url: `/practices/${id}`,
            tag: `practice-cancel-${id}`
        }, user.id).catch(console.error)
    }

    revalidatePath('/practices')
    revalidatePath(`/practices/${id}`)
    revalidatePath('/')
    return { success: true }
}

export async function rsvpPractice(practiceId: string, status: RsvpStatus, comment?: string) {
    const user = await requireUser()

    try {
        await prisma.practiceRsvp.upsert({
            where: {
                practiceId_userId: {
                    practiceId,
                    userId: user.id
                }
            },
            update: {
                status,
                comment: comment || null
            },
            create: {
                practiceId,
                userId: user.id,
                status,
                comment: comment || null
            }
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to submit RSVP") }
    }

    // Trigger push notification to members who want RSVP alerts (fire-and-forget)
    prisma.practice.findUnique({
        where: { id: practiceId },
        select: { date: true, venue: true }
    }).then(practice => {
        if (!practice) return
        const dateStr = shortDate(practice.date)
        const actorName = user.name || "A band member"
        let body = `${actorName} updated RSVP for rehearsal on ${dateStr}.`
        if (status === 'GOING') {
            body = `✅ ${actorName} is going to rehearsal on ${dateStr}!`
        } else if (status === 'NOT_GOING') {
            body = `❌ ${actorName} cannot make it to rehearsal on ${dateStr}.`
        } else if (status === 'MAYBE') {
            body = `❓ ${actorName} marked maybe for rehearsal on ${dateStr}.`
        }

        sendPushToUsersWithPreference('notifyPracticeRsvp', {
            title: "Rehearsal RSVP",
            body,
            url: `/practices/${practiceId}`,
            tag: `rsvp-${practiceId}-${user.id}`
        }, user.id).catch(console.error)
    }).catch(console.error)

    revalidatePath('/practices')
    revalidatePath(`/practices/${practiceId}`)
    revalidatePath('/')
    return { success: true }
}

export async function createSuggestion(practiceId: string, formData: FormData) {
    const user = await requireUser()

    const validation = SuggestionSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }
    const { proposedDate: proposedDateStr, proposedTime, proposedVenue, reason } = validation.data

    if (!proposedDateStr && !proposedTime && !proposedVenue) {
        return { error: "Suggest at least one change (date, time or venue)" }
    }

    try {
        await prisma.practiceSuggestion.create({
            data: {
                practiceId,
                proposedDate: proposedDateStr ? calendarDayFromString(proposedDateStr) : null,
                proposedTime,
                proposedVenue,
                reason,
                createdById: user.id,
                // Automatically register the author's affirmative vote
                votes: {
                    create: {
                        userId: user.id,
                        agree: true
                    }
                }
            }
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to submit suggestion") }
    }

    // Trigger push notification to members (fire-and-forget)
    prisma.practice.findUnique({
        where: { id: practiceId },
        select: { date: true }
    }).then(practice => {
        if (!practice) return
        const actorName = user.name || "A band member"
        sendPushToUsersWithPreference('notifyPracticeSuggestion', {
            title: "💬 Rehearsal Reschedule Suggested",
            body: `${actorName} suggested a change for practice on ${shortDate(practice.date)}. Tap to vote!`,
            url: `/practices/${practiceId}`,
            tag: `suggestion-${practiceId}`
        }, user.id).catch(console.error)
    }).catch(console.error)

    revalidatePath(`/practices/${practiceId}`)
    return { success: true }
}

export async function voteSuggestion(suggestionId: string, practiceId: string, agree: boolean) {
    const user = await requireUser()

    try {
        await prisma.practiceSuggestionVote.upsert({
            where: {
                suggestionId_userId: {
                    suggestionId,
                    userId: user.id
                }
            },
            update: {
                agree
            },
            create: {
                suggestionId,
                userId: user.id,
                agree
            }
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to record vote") }
    }

    // Notify suggestion creator (fire-and-forget)
    prisma.practiceSuggestion.findUnique({
        where: { id: suggestionId },
        select: { createdById: true }
    }).then(suggestion => {
        if (suggestion && suggestion.createdById !== user.id) {
            const actorName = user.name || "A band member"
            sendPushToUser(suggestion.createdById, {
                title: agree ? "👍 Vote on Your Suggestion" : "👎 Vote on Your Suggestion",
                body: `${actorName} voted ${agree ? 'Yes' : 'No'} on your rehearsal suggestion.`,
                url: `/practices/${practiceId}`,
                tag: `vote-${suggestionId}`
            }).catch(console.error)
        }
    }).catch(console.error)

    revalidatePath(`/practices/${practiceId}`)
    return { success: true }
}

export async function applySuggestion(suggestionId: string, practiceId: string) {
    const user = await requireUser()

    try {
        const suggestion = await prisma.practiceSuggestion.findUnique({
            where: { id: suggestionId }
        })

        if (!suggestion) {
            return { error: "Suggestion not found" }
        }

        const existing = await prisma.practice.findUnique({ where: { id: practiceId }, select: { createdById: true } })
        if (!existing) return { error: "Practice not found" }
        assertCanEdit(user, existing)

        const updateData: Prisma.PracticeUpdateInput = {
            // Schedule changes → reminders must be re-evaluated by the cron
            morningReminderSentAt: null,
            oneHourReminderSentAt: null,
        }
        if (suggestion.proposedDate) updateData.date = suggestion.proposedDate
        if (suggestion.proposedTime) updateData.time = suggestion.proposedTime
        if (suggestion.proposedVenue) updateData.venue = suggestion.proposedVenue

        await prisma.$transaction([
            prisma.practice.update({
                where: { id: practiceId },
                data: updateData
            }),
            prisma.practiceSuggestion.update({
                where: { id: suggestionId },
                data: { status: "APPROVED" }
            })
        ])

        // Notify band members that the schedule has been updated (fire-and-forget)
        prisma.practice.findUnique({
            where: { id: practiceId },
            select: { date: true, time: true, venue: true }
        }).then(updatedPractice => {
            if (!updatedPractice) return
            sendPushToUsersWithPreference('notifyPracticeChange', {
                title: "🔄 Rehearsal Rescheduled",
                body: `Practice updated: now on ${shortDate(updatedPractice.date)} at ${updatedPractice.time} (${updatedPractice.venue}).`,
                url: `/practices/${practiceId}`,
                tag: `practice-change-${practiceId}`
            }, user.id).catch(console.error)
        }).catch(console.error)

    } catch (err) {
        return { error: errorMessage(err, "Failed to apply suggestion") }
    }

    revalidatePath('/practices')
    revalidatePath(`/practices/${practiceId}`)
    revalidatePath('/')
    return { success: true }
}

export async function rejectSuggestion(suggestionId: string, practiceId: string) {
    const user = await requireUser()

    try {
        const existing = await prisma.practice.findUnique({ where: { id: practiceId }, select: { createdById: true } })
        if (!existing) return { error: "Practice not found" }
        assertCanEdit(user, existing)

        await prisma.practiceSuggestion.update({
            where: { id: suggestionId },
            data: { status: "REJECTED" }
        })
    } catch (err) {
        return { error: errorMessage(err, "Failed to reject suggestion") }
    }

    revalidatePath(`/practices/${practiceId}`)
    return { success: true }
}
