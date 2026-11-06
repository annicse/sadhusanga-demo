import { SongForm } from "@/components/song-form"

export const metadata = { title: "Add song" }

export default function NewSongPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Song</h1>
                    <p className="text-muted-foreground">
                        Add a new song to your repertoire.
                    </p>
                </div>
            </div>
            <SongForm />
        </div>
    )
}
