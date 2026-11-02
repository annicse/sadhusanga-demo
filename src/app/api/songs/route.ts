import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/songs[?since=<ISO date>]
//
// Used by sync.ts → syncSongs() to populate Dexie on the client.
//
//   without `since`: full snapshot  → { songs: [...all], deletedIds: [], serverTime, full: true }
//   with `since`:    delta          → { songs: [changed since], deletedIds: [deleted since], serverTime, full: false }
//
// Clients store `serverTime` and send it back as `since` next time, so each
// foreground sync only transfers what changed instead of every song + lyrics.
export async function GET(request: Request) {
    const session = await auth()

    // If no session, return 401 — Dexie sync will silently skip on error
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serverTime = new Date()
    const sinceParam = new URL(request.url).searchParams.get('since')
    const since = sinceParam ? new Date(sinceParam) : null
    const isDelta = !!since && !Number.isNaN(since.getTime())

    const [songs, deleted] = await Promise.all([
        prisma.song.findMany({
            where: isDelta ? { updatedAt: { gt: since } } : undefined,
            orderBy: { title: 'asc' },
        }),
        isDelta
            ? prisma.deletedRecord.findMany({
                where: { model: 'Song', deletedAt: { gt: since } },
                select: { recordId: true },
            })
            : Promise.resolve([] as { recordId: string }[]),
    ])

    // Prisma returns Date objects for createdAt/updatedAt. We explicitly
    // convert to ISO strings so IndexedDB receives a consistent string format.
    const serialised = songs.map(s => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    }))

    return NextResponse.json({
        songs: serialised,
        deletedIds: deleted.map(d => d.recordId),
        serverTime: serverTime.toISOString(),
        full: !isDelta,
    })
}
