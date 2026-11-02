import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/setlists[?since=<ISO date>]
//
// Same contract as /api/songs, plus the setlist→song join rows so the setlist
// detail page can render fully offline:
//
//   { setlists, setlistSongs, deletedIds, serverTime, full }
//
// In delta mode `setlistSongs` contains ALL rows for every changed setlist
// (updateSetlistSongs bumps the setlist's updatedAt), so the client replaces
// those setlists' rows wholesale.
export async function GET(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serverTime = new Date()
    const sinceParam = new URL(request.url).searchParams.get('since')
    const since = sinceParam ? new Date(sinceParam) : null
    const isDelta = !!since && !Number.isNaN(since.getTime())

    const [setlists, deleted] = await Promise.all([
        prisma.setlist.findMany({
            where: isDelta ? { updatedAt: { gt: since } } : undefined,
            orderBy: { event_date: 'desc' },
        }),
        isDelta
            ? prisma.deletedRecord.findMany({
                where: { model: 'Setlist', deletedAt: { gt: since } },
                select: { recordId: true },
            })
            : Promise.resolve([] as { recordId: string }[]),
    ])

    const setlistSongs = await prisma.setlistSong.findMany({
        where: isDelta ? { setlistId: { in: setlists.map(s => s.id) } } : undefined,
        orderBy: [{ setlistId: 'asc' }, { position: 'asc' }],
    })

    const serialised = setlists.map(s => ({
        ...s,
        event_date: s.event_date ? s.event_date.toISOString() : null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
    }))

    return NextResponse.json({
        setlists: serialised,
        setlistSongs,
        deletedIds: deleted.map(d => d.recordId),
        serverTime: serverTime.toISOString(),
        full: !isDelta,
    })
}
