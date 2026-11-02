'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guards'
import type { Role } from '@prisma/client'

export async function updateUserRole(userId: string, newRole: Role) {
    await requireAdmin()

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        })
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update role' }
    }

    revalidatePath('/admin')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const admin = await requireAdmin()
    if (admin.id === userId) {
        return { error: 'You cannot delete your own account' }
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
    } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to delete user' }
    }

    revalidatePath('/admin')
    return { success: true }
}
