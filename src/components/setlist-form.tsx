'use client'

import { useState } from 'react'
import { createSetlist, updateSetlist, deleteSetlist } from '@/app/(app)/setlists/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type SetlistFormProps = {
    setlist?: {
        id: string
        name: string
        event_date: string | null
        venue: string | null
        comment: string | null
        playlist_link?: string | null
    }
}

export function SetlistForm({ setlist }: SetlistFormProps) {
    const isEditing = !!setlist
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)

        let result
        if (isEditing) {
            result = await updateSetlist(setlist.id, formData)
        } else {
            result = await createSetlist(formData)
        }

        if (result && 'error' in result) {
            setError(result.error || null)
        }
        setIsPending(false)
    }

    async function handleDelete() {
        if (confirm("Are you sure you want to delete this setlist?")) {
            setIsPending(true)
            const result = await deleteSetlist(setlist!.id)
            if (result && 'error' in result) {
                setError(result.error || null)
                setIsPending(false)
            }
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEditing ? 'Edit Details' : 'New Setlist'}</CardTitle>
                <CardDescription>
                    {isEditing ? 'Update the details for this setlist.' : 'Enter the details for your event or gig.'}
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" name="name" defaultValue={setlist?.name} placeholder="e.g. Summer Festival 2026" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="event_date">Event Date</Label>
                            <Input id="event_date" name="event_date" type="date" defaultValue={setlist?.event_date || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="venue">Venue</Label>
                            <Input id="venue" name="venue" defaultValue={setlist?.venue || ''} placeholder="e.g. The Grand Theater" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Comments</Label>
                        <Textarea
                            id="comment"
                            name="comment"
                            defaultValue={setlist?.comment || ''}
                            className="resize-none"
                            placeholder="e.g. Needs extra long soundcheck..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="playlist_link">YouTube / Spotify Playlist Link</Label>
                        <Input
                            id="playlist_link"
                            name="playlist_link"
                            type="url"
                            defaultValue={setlist?.playlist_link || ''}
                            placeholder="https://open.spotify.com/playlist/... or https://youtube.com/playlist?list=..."
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-6">
                    {isEditing ? (
                        <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    ) : (
                        <div></div> // empty spacer
                    )}
                    <div className="flex gap-2">
                        {!isEditing && (
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Save Details' : 'Create Setlist'}
                        </Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
