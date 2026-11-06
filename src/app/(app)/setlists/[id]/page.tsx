import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { SetlistBuilder } from "@/components/setlist-builder"

export const metadata = { title: "Setlist" }

export default async function SetlistPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const id = params.id

    const session = await auth()
    if (!session?.user) return null

    const setlist = await prisma.setlist.findUnique({ where: { id } })
    if (!setlist) notFound()

    // Songs already in the setlist (ordered) and the full library for the sidebar.
    // These are the initial values; the client component then reads live data from Dexie.
    const [setlistSongs, allSongs] = await Promise.all([
        prisma.setlistSong.findMany({
            where: { setlistId: id },
            include: { song: true },
            orderBy: { position: 'asc' }
        }),
        prisma.song.findMany({ orderBy: { title: 'asc' } }),
    ])

    return (
        <div className="max-w-7xl mx-auto printable-area">
            <SetlistBuilder
                setlist={{
                    ...setlist,
                    event_date: setlist.event_date ? setlist.event_date.toISOString() : null,
                }}
                initialSetlistSongs={setlistSongs.map(sls => ({
                    id: sls.id,
                    song_id: sls.songId,
                    position: sls.position,
                    performance_note: sls.performance_note,
                    songs: sls.song,
                }))}
                allSongs={allSongs}
            />
        </div>
    )
}
