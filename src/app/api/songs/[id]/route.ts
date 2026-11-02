import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/songs/[id]
// Returns a single song by id.
// Used by sync.ts → syncSong(id) after a create or update mutation.
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const song = await prisma.song.findUnique({ where: { id } })

    if (!song) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
        ...song,
        createdAt: song.createdAt.toISOString(),
        updatedAt: song.updatedAt.toISOString(),
    })
}
