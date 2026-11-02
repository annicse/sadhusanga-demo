import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SongView } from "@/components/song-view"

export default async function EditSongPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const id = params.id

    let song = null
    try {
        song = await prisma.song.findUnique({
            where: { id }
        })
    } catch (err) {
        // error handled below
    }

    if (!song) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <SongView song={song} />
        </div>
    )
}
