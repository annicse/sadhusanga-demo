'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser, assertCanEdit } from '@/lib/auth-guards'
import { SetlistSchema, SetlistSongIdsSchema } from '@/lib/validations/setlist'
import { firstIssueMessage } from '@/lib/validations/utils'

export async function createSetlist(formData: FormData) {
    const user = await requireUser()

    const validation = SetlistSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }

    let result
    try {
        result = await prisma.setlist.create({
            data: {
                ...validation.data,
                createdById: user.id
            }
        })
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to create setlist' }
    }

    revalidatePath('/setlists')
    redirect(`/setlists/${result.id}`)
}

export async function updateSetlist(id: string, formData: FormData) {
    const user = await requireUser()

    const validation = SetlistSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }

    try {
        const existing = await prisma.setlist.findUnique({ where: { id }, select: { createdById: true } })
        if (!existing) return { error: 'Setlist not found' }
        assertCanEdit(user, existing)

        await prisma.setlist.update({
            where: { id },
            data: validation.data
        })
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update setlist' }
    }

    revalidatePath('/setlists')
    revalidatePath(`/setlists/${id}`)
    redirect(`/setlists/${id}`)
}

export async function deleteSetlist(id: string) {
    const user = await requireUser()

    try {
        const existing = await prisma.setlist.findUnique({ where: { id }, select: { createdById: true } })
        if (!existing) return { error: 'Setlist not found' }
        assertCanEdit(user, existing)

        // Delete + tombstone in one transaction so delta-syncing clients learn about it
        await prisma.$transaction([
            prisma.setlist.delete({ where: { id } }),
            prisma.deletedRecord.create({ data: { model: 'Setlist', recordId: id } }),
        ])
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to delete setlist' }
    }

    revalidatePath('/setlists')
    redirect('/setlists')
}

// Manage songs in a setlist
export async function updateSetlistSongs(setlistId: string, songIds: string[]) {
    const user = await requireUser()

    const validation = SetlistSongIdsSchema.safeParse(songIds)
    if (!validation.success) {
        return { error: 'Invalid song list' }
    }
    // Ignore duplicates (unique [setlistId, songId]) while preserving first-seen order
    const uniqueIds = Array.from(new Set(validation.data))

    try {
        const existing = await prisma.setlist.findUnique({ where: { id: setlistId }, select: { createdById: true } })
        if (!existing) return { error: 'Setlist not found' }
        assertCanEdit(user, existing)

        // Run as transaction: delete existing and create new
        await prisma.$transaction(async (tx) => {
            await tx.setlistSong.deleteMany({
                where: { setlistId }
            })

            if (uniqueIds.length > 0) {
                await tx.setlistSong.createMany({
                    data: uniqueIds.map((songId, index) => ({
                        setlistId,
                        songId,
                        position: index,
                    }))
                })
            }

            // Bump the parent's updatedAt so `?since=` delta sync picks up the new order
            await tx.setlist.update({
                where: { id: setlistId },
                data: { updatedAt: new Date() }
            })
        })
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to save setlist order' }
    }

    revalidatePath(`/setlists/${setlistId}`)
    return { success: true }
}
