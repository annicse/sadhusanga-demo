'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function updateProfile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const display_name = formData.get('display_name') as string
    const instrument = formData.get('instrument') as string
    const password = formData.get('password') as string

    if (!display_name) {
        return { error: 'Display name is required' }
    }

    try {
        const updateData: any = {
            name: display_name,
            instrument,
        }

        if (password) {
            const bcrypt = require('bcryptjs')
            updateData.password = await bcrypt.hash(password, 10)
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        })
    } catch (err: any) {
        return { error: err.message }
    }

    revalidatePath('/profile')
    return { success: true }
}
