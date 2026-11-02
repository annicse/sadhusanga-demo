import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SongForm } from "@/components/song-form"

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">View / Edit Song</h1>
                    <p className="text-muted-foreground">
                        Updating details for {song.title}.
                    </p>
                </div>
            </div>
            <SongForm song={song} />
        </div>
    )
}
