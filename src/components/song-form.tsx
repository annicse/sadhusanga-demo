'use client'

import { useState } from 'react'
import { createSong, updateSong, deleteSong } from '@/app/(app)/songs/actions'
import { syncSong, removeSongLocally } from '@/lib/sync'
import { createSongOffline, updateSongOffline, deleteSongOffline, isOffline } from '@/lib/offline-songs'
import { isOfflineId } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type SongFormProps = {
    song?: {
        id: string
        title: string
        artist: string | null
        key: string | null
        tempo: number | null
        notes: string | null
        lyrics: string | null
        songlink: string | null
    }
}

export function SongForm({ song }: SongFormProps) {
    const isEditing = !!song
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        setSuccessMessage(null)

        // ── Offline path: write to Dexie + queue, replayed by SyncProvider later ──
        // (also used for editing a song that was itself created offline and not yet uploaded)
        if (isOffline() || (isEditing && isOfflineId(song.id))) {
            const offlineResult = isEditing
                ? await updateSongOffline(song.id, formData)
                : await createSongOffline(formData)
            if ('error' in offlineResult) {
                setError(offlineResult.error)
                toast.error(offlineResult.error)
            } else {
                toast.success('Saved offline — will upload when you are back online')
                // Song pages are server-rendered, so go to the list (served from Dexie)
                router.push(isEditing && !isOfflineId(song.id) ? `/songs/${song.id}` : '/songs')
            }
            setIsPending(false)
            return
        }

        let result
        if (isEditing) {
            result = await updateSong(song.id, formData)
            if (result && 'error' in result) {
                setError(result.error || 'Failed to update song')
                toast.error(result.error || 'Failed to update song')
            } else if (result?.success) {
                // Server saved — now pull the updated record into Dexie
                await syncSong(song.id)
                setSuccessMessage('Song updated successfully!')
                toast.success('Song updated successfully!')
                router.push(`/songs/${song.id}`)
            }
        } else {
            result = await createSong(formData)
            if (result && 'error' in result) {
                setError(result.error || 'Failed to create song')
                toast.error(result.error || 'Failed to create song')
            } else if (result?.success && result?.id) {
                // Server created — pull the new song into Dexie
                await syncSong(result.id)
                setSuccessMessage('Song added successfully!')
                toast.success('Song added successfully!')
                router.push(`/songs/${result.id}`)
            }
        }

        setIsPending(false)
    }

    async function handleDelete() {
        if (confirm("Are you sure you want to delete this song?")) {
            setIsPending(true)

            if (isOffline() || isOfflineId(song!.id)) {
                await deleteSongOffline(song!.id)
                toast.success('Deleted offline — will sync when you are back online')
                router.push('/songs')
                return
            }

            const result = await deleteSong(song!.id)
            if (result && 'error' in result) {
                setError(result.error || null)
                toast.error(result.error || 'Failed to delete song')
                setIsPending(false)
            } else if (result?.success) {
                await removeSongLocally(song!.id)
                toast.success('Song deleted successfully')
                router.push('/')
            }
        }
    }

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>{isEditing ? 'Edit Song' : 'Add New Song'}</CardTitle>
                <CardDescription>
                    {isEditing ? 'Update the details for this song.' : 'Enter the details for your new song.'}
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}
                    {successMessage && (
                        <div className="flex items-center gap-2 p-3 text-sm font-medium text-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" name="title" defaultValue={song?.title} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="artist">Artist</Label>
                            <Input id="artist" name="artist" defaultValue={song?.artist || ''} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="key">Key</Label>
                            <Input id="key" name="key" defaultValue={song?.key || ''} placeholder="e.g. C#m" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tempo">Tempo (BPM)</Label>
                            <Input id="tempo" name="tempo" type="number" defaultValue={song?.tempo || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="songlink">Song link</Label>
                            <Input id="songlink" name="songlink" type="url" defaultValue={song?.songlink || ''} />
                        </div>

                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Performance Notes</Label>
                        <Input id="notes" name="notes" defaultValue={song?.notes || ''} placeholder="e.g. Intro is double length" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lyrics">Lyrics & Chords</Label>
                        <Textarea
                            id="lyrics"
                            name="lyrics"
                            defaultValue={song?.lyrics || ''}
                            className="min-h-[300px] font-mono whitespace-pre"
                            placeholder={"Enter lyrics and chords here...\n[C] Hello [Am] world"}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                    {isEditing ? (
                        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Song
                        </Button>
                    ) : (
                        <div></div> // empty spacer
                    )}
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Save Changes' : 'Create Song'}
                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
