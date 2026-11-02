'use server'

import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-guards"
import { AddMemberSchema } from "@/lib/validations/member"
import bcrypt from "bcryptjs"

export async function addMember(formData: FormData) {
    // Only admins may create accounts. Throws (→ error boundary) for non-admins.
    await requireAdmin()

    const validation = AddMemberSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validation.success) {
        const issue = validation.error.issues[0]
        return { error: issue.message }
    }
    const { email, password, display_name } = validation.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return { error: 'A member with this email already exists' }
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: display_name,
                role: 'user',
            }
        })
        return { success: true }
    } catch {
        return { error: 'Failed to add member' }
    }
}
