import { auth } from '@/auth'
import type { Role } from '@prisma/client'

export type SessionUser = {
    id: string
    name?: string | null
    email?: string | null
    role: Role
}

/** Throws unless a user is signed in. Returns the session user with a typed role. */
export async function requireUser(): Promise<SessionUser> {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Unauthorized')
    return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user.role === 'admin' ? 'admin' : 'user') as Role,
    }
}

/** Throws unless the signed-in user is an admin. */
export async function requireAdmin(): Promise<SessionUser> {
    const user = await requireUser()
    if (user.role !== 'admin') throw new Error('Unauthorized: Admins only')
    return user
}

/**
 * Central place for the "who may edit what" decision.
 *
 * Current policy: every signed-in band member may edit or delete any song,
 * setlist or practice. This is deliberate for a single small band. If the app
 * ever needs ownership rules (e.g. only the creator or an admin may delete),
 * change this function instead of every server action.
 */
export function canEdit(
    user: SessionUser,
    entity?: { createdById?: string | null } | null
): boolean {
    void entity
    return !!user.id
}

/** Throws unless `canEdit` allows the operation. */
export function assertCanEdit(user: SessionUser, entity?: { createdById?: string | null } | null) {
    if (!canEdit(user, entity)) throw new Error('Forbidden')
}
