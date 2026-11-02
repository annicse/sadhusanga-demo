import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { SongSchema } from '@/lib/validations/song'
import { firstIssueMessage } from '@/lib/validations/utils'

// POST /api/sync/replay
//
// Replays ONE mutation that was captured offline. Body:
//   { action: 'CREATE_SONG' | 'UPDATE_SONG' | 'DELETE_SONG', payload, clientUpdatedAt }
//
// Status codes the client relies on (see processOfflineQueue in sync.ts):
//   200 → applied (CREATE returns the new id)
//   400 → invalid payload           (client drops the mutation)
//   404 → record no longer exists   (client drops the mutation)
//   409 → server has a newer version (last-write-wins; client drops the mutation)
//   401 / 5xx → client keeps the mutation and retries later
export async function POST(req: Request) {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { action, payload, clientUpdatedAt } = (await req.json()) as {
            action?: string
            payload?: Record<string, unknown>
            clientUpdatedAt?: string
        }
        const clientTime = clientUpdatedAt ? new Date(clientUpdatedAt) : null

        switch (action) {
            case 'CREATE_SONG': {
                const validation = SongSchema.safeParse(payload)
                if (!validation.success) {
                    return NextResponse.json({ error: firstIssueMessage(validation.error) }, { status: 400 })
                }
                const created = await prisma.song.create({
                    data: {
                        ...validation.data,
                        createdById: session.user.id,
                    }
                })
                return NextResponse.json({ success: true, id: created.id })
            }

            case 'UPDATE_SONG': {
                const { id, ...songData } = payload ?? {}
                if (typeof id !== 'string' || !id) {
                    return NextResponse.json({ error: 'Missing song id' }, { status: 400 })
                }
                const validation = SongSchema.safeParse(songData)
                if (!validation.success) {
                    return NextResponse.json({ error: firstIssueMessage(validation.error) }, { status: 400 })
                }

                const existing = await prisma.song.findUnique({ where: { id }, select: { updatedAt: true } })
                if (!existing) {
                    return NextResponse.json({ error: 'Song no longer exists' }, { status: 404 })
                }
                // Last-write-wins: if someone edited the song on the server AFTER the
                // offline edit was made, keep the server version.
                if (clientTime && !Number.isNaN(clientTime.getTime()) && existing.updatedAt > clientTime) {
                    return NextResponse.json({ error: 'A newer version exists on the server' }, { status: 409 })
                }

                await prisma.song.update({
                    where: { id },
                    data: validation.data
                })
                return NextResponse.json({ success: true })
            }

            case 'DELETE_SONG': {
                const id = payload?.id
                if (typeof id !== 'string' || !id) {
                    return NextResponse.json({ error: 'Missing song id' }, { status: 400 })
                }
                const existing = await prisma.song.findUnique({ where: { id }, select: { id: true } })
                if (!existing) {
                    return NextResponse.json({ success: true }) // already gone — idempotent
                }
                await prisma.$transaction([
                    prisma.song.delete({ where: { id } }),
                    prisma.deletedRecord.create({ data: { model: 'Song', recordId: id } }),
                ])
                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Unknown mutation action' }, { status: 400 })
        }
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Replay failed' },
            { status: 500 }
        )
    }
}
