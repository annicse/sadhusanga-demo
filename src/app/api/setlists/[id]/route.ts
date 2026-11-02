import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/setlists/[id] — a single setlist plus its ordered song rows.
// Used by sync.ts → syncSetlist(id) after the order is saved.
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const [setlist, setlistSongs] = await Promise.all([
        prisma.setlist.findUnique({ where: { id } }),
        prisma.setlistSong.findMany({ where: { setlistId: id }, orderBy: { position: 'asc' } }),
    ])

    if (!setlist) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
        setlist: {
            ...setlist,
            event_date: setlist.event_date ? setlist.event_date.toISOString() : null,
            createdAt: setlist.createdAt.toISOString(),
            updatedAt: setlist.updatedAt.toISOString(),
        },
        setlistSongs,
    })
}
