'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser, assertCanEdit } from '@/lib/auth-guards'
import { SongSchema } from '@/lib/validations/song'
import { firstIssueMessage } from '@/lib/validations/utils'

export async function createSong(formData: FormData) {
    const user = await requireUser()

    // Convert FormData entries to a plain object, then validate (does not throw)
    const validation = SongSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }

    let result
    try {
        result = await prisma.song.create({
            data: {
                ...validation.data,
                createdById: user.id
            }
        })
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to create song' }
    }

    revalidatePath('/')
    revalidatePath('/songs')
    return { success: true, id: result.id }
}

export async function updateSong(id: string, formData: FormData) {
    const user = await requireUser()

    const validation = SongSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        return { error: firstIssueMessage(validation.error) }
    }

    try {
        const existing = await prisma.song.findUnique({ where: { id }, select: { createdById: true } })
        if (!existing) return { error: 'Song not found' }
        assertCanEdit(user, existing)

        await prisma.song.update({
            where: { id },
            data: validation.data
        })
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update song' }
    }

    revalidatePath('/')
    revalidatePath(`/songs/${id}`)
    return { success: true }
}

export async function deleteSong(id: string) {
    const user = await requireUser()

    try {
        const existing = await prisma.song.findUnique({ where: { id }, select: { createdById: true } })
        if (!existing) return { error: 'Song not found' }
        assertCanEdit(user, existing)

        // Delete + tombstone in one transaction so delta-syncing clients learn about it
        await prisma.$transaction([
            prisma.song.delete({ where: { id } }),
            prisma.deletedRecord.create({ data: { model: 'Song', recordId: id } }),
        ])
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to delete song' }
    }

    revalidatePath('/')
    revalidatePath('/songs')
    return { success: true }
}
