'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Plus, GripVertical, Trash2, ArrowUp, ArrowDown, Save, Printer, MonitorOff, Monitor, ExternalLink, WifiOff } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateSetlistSongs } from '@/app/(app)/setlists/actions'
import { SetlistForm } from './setlist-form'
import { ChordSheet } from '@/components/chord-sheet'
import { db } from '@/lib/db'
import { syncSetlist, META_SETLISTS_SYNCED_AT } from '@/lib/sync'
import Link from 'next/link'

type Song = {
    id: string
    title: string
    artist: string | null
    key: string | null
    tempo: number | null
    notes?: string | null
    lyrics?: string | null
    songlink?: string | null
}

type SetlistSong = {
    id: string
    song_id: string
    position: number
    performance_note: string | null
    songs: Song
}

type SetlistMeta = {
    id: string
    name: string
    event_date: string | Date | null
    venue: string | null
    comment: string | null
    playlist_link?: string | null
}

/**
 * Setlist detail / builder.
 *
 * Data source: the server renders the page with Prisma data (fast first paint,
 * works on a fresh device). After that the component reads the setlist, its
 * song rows and the song library from Dexie via `useLiveQuery`, so the page
 * keeps working offline (served from the service-worker cache) and reflects
 * background syncs. Unsaved drag/add/remove edits live in `edits` and take
 * precedence until saved.
 */
export function SetlistBuilder({
    setlist: serverSetlist,
    initialSetlistSongs,
    allSongs: serverSongs,
}: {
    setlist: SetlistMeta
    initialSetlistSongs: SetlistSong[]
    allSongs: Song[]
}) {
    const setlistId = serverSetlist.id

    // ── Live local data (server props are the defaults until Dexie answers) ──
    const setlist = useLiveQuery(() => db.setlists.get(setlistId), [setlistId], serverSetlist) ?? serverSetlist
    const allSongs = useLiveQuery(() => db.songs.orderBy('title').toArray(), [], serverSongs) ?? serverSongs
    const localRows = useLiveQuery(async () => {
        // Until the first full sync has happened, an empty table means "unknown", not "empty".
        const synced = !!(await db.meta.get(META_SETLISTS_SYNCED_AT))
        if (!synced) return null
        return db.setlistSongs.where('setlistId').equals(setlistId).sortBy('position')
    }, [setlistId], null)

    const savedItems = useMemo<SetlistSong[]>(() => {
        if (!localRows) return initialSetlistSongs
        const songById = new Map(allSongs.map(s => [s.id, s]))
        return localRows
            .map(row => {
                const song = songById.get(row.songId)
                return song
                    ? { id: row.id, song_id: row.songId, position: row.position, performance_note: row.performance_note, songs: song }
                    : null
            })
            .filter((x): x is SetlistSong => x !== null)
    }, [localRows, allSongs, initialSetlistSongs])

    // Unsaved edits (null = no local edits, show saved order)
    const [edits, setEdits] = useState<SetlistSong[] | null>(null)
    const items = edits ?? savedItems
    const isDirty = edits !== null

    const [isSaving, setIsSaving] = useState(false)
    const [isEditingData, setIsEditingData] = useState(false)
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
    const [isOffline, setIsOffline] = useState(false)

    useEffect(() => {
        const update = () => setIsOffline(!navigator.onLine)
        window.addEventListener('online', update)
        window.addEventListener('offline', update)
        return () => {
            window.removeEventListener('online', update)
            window.removeEventListener('offline', update)
        }
    }, [])

    // Available songs not in the setlist
    const availableSongs = allSongs.filter(
        (song) => !items.some((item) => item.song_id === song.id)
    )

    const handleDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) return

        const newItems = Array.from(items)
        const [reorderedItem] = newItems.splice(result.source.index, 1)
        newItems.splice(result.destination.index, 0, reorderedItem)

        // Update positions
        setEdits(newItems.map((item, index) => ({ ...item, position: index })))
    }, [items])

    const addSong = (song: Song) => {
        const newItem: SetlistSong = {
            id: `temp-${Date.now()}`, // Temporary ID until saved
            song_id: song.id,
            position: items.length,
            performance_note: null,
            songs: song,
        }
        setEdits([...items, newItem])
    }

    const removeSong = (index: number) => {
        const newItems = Array.from(items)
        newItems.splice(index, 1)
        // Re-index remaining items
        setEdits(newItems.map((item, i) => ({ ...item, position: i })))
    }

    const saveSetlist = async () => {
        if (!navigator.onLine) {
            toast.error('You are offline — reconnect to save the running order.')
            return
        }
        setIsSaving(true)
        const songIds = items.map(item => item.song_id)
        const result = await updateSetlistSongs(setlistId, songIds)
        if (result && 'error' in result) {
            toast.error(result.error || 'Failed to save setlist')
        } else {
            // Pull the saved rows into Dexie, then drop local edits so the live data takes over
            await syncSetlist(setlistId)
            setEdits(null)
            toast.success('Running order saved')
        }
        setIsSaving(false)
    }

    // Single-pointer / keyboard alternative to drag-and-drop (WCAG 2.5.7)
    const moveSong = (index: number, direction: -1 | 1) => {
        const target = index + direction
        if (target < 0 || target >= items.length) return
        const newItems = Array.from(items)
        const [moved] = newItems.splice(index, 1)
        newItems.splice(target, 0, moved)
        setEdits(newItems.map((item, i) => ({ ...item, position: i })))
        toast.message(`${moved.songs.title} moved to position ${target + 1}`)
    }

    const toggleWakeLock = async () => {
        if ('wakeLock' in navigator) {
            if (wakeLock) {
                await wakeLock.release()
                setWakeLock(null)
            } else {
                try {
                    const lock = await navigator.wakeLock.request('screen')
                    setWakeLock(lock)

                    lock.addEventListener('release', () => {
                        setWakeLock(null)
                    })
                } catch (err) {
                    console.error('Wake Lock request failed:', err)
                }
            }
        } else {
            alert("Screen Wake Lock API not supported in this browser.")
        }
    }

    // Release Wake Lock when component unmounts
    useEffect(() => {
        return () => {
            if (wakeLock) {
                wakeLock.release()
            }
        }
    }, [wakeLock])

    return (
        <div className="space-y-8 print:space-y-0">
            {/* =========================================================================
               PAGE 1: Setlist Overview & Running Order
               ========================================================================= */}
            <div className="print-page-break-after space-y-8 print:space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-white/10 print:border-zinc-300 print:pb-3">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-bold tracking-tight text-white print:text-black print:text-2xl">{setlist.name}</h1>
                            {setlist.playlist_link && (
                                <a
                                    href={setlist.playlist_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors print:hidden"
                                    title="Listen to playlist"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Listen
                                </a>
                            )}
                        </div>
                        <p className="text-muted-foreground print:text-zinc-600 print:text-sm mt-1.5 flex flex-wrap gap-x-2">
                            {setlist.venue && <span>{setlist.venue}</span>}
                            {setlist.event_date && <span>• {new Date(setlist.event_date).toLocaleDateString()}</span>}
                            {setlist.comment && <span className="italic block w-full mt-1 print:text-zinc-500">{setlist.comment}</span>}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 print:hidden">
                        <Button variant={wakeLock ? "default" : "secondary"} onClick={toggleWakeLock} title="Keep Screen On" aria-pressed={!!wakeLock}>
                            {wakeLock ? <Monitor className="w-4 h-4 mr-2" /> : <MonitorOff className="w-4 h-4 mr-2" />}
                            {wakeLock ? "Screen ON" : "Screen Normal"}
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Print
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditingData(!isEditingData)}>
                            {isEditingData ? "Done Editing Details" : "Edit Details"}
                        </Button>
                        <Button onClick={saveSetlist} disabled={isSaving || !isDirty} title={isDirty ? 'Save the running order' : 'No unsaved changes'}>
                            <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : isDirty ? "Save Order" : "Saved"}
                        </Button>
                    </div>
                </div>

                {isOffline && (
                    <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 print:hidden">
                        <WifiOff className="h-3.5 w-3.5" />
                        You are offline — showing the last synced version. Reconnect to save changes.
                    </div>
                )}

                {isEditingData && (
                    <div className="p-4 bg-muted/30 rounded-lg border print:hidden">
                        <h3 className="text-lg font-medium mb-4">Edit Setlist Metadata</h3>
                        <SetlistForm setlist={{
                            ...setlist,
                            event_date: setlist.event_date
                                ? new Date(setlist.event_date).toISOString().slice(0, 10)
                                : null,
                        }} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
                    {/* Main Setlist Area - Page 1 */}
                    <div className="lg:col-span-2 space-y-4 print:w-full print:space-y-3">
                        <h2 className="text-xl font-semibold text-white print:text-black">Running Order</h2>
                        {items.length === 0 && (
                            <div className="p-8 text-center border border-white/10 border-dashed rounded-xl bg-black/30 backdrop-blur-md text-muted-foreground print:border-zinc-300 print:text-zinc-500">
                                Your setlist is empty. Add songs from the library.
                            </div>
                        )}

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="setlist">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 print:space-y-0 print:divide-y print:divide-zinc-200">
                                        {items.map((item, index) => (
                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`group flex items-center gap-3 p-3 bg-black/40 backdrop-blur-md border rounded-xl transition-all print:bg-transparent print:border-none print:rounded-none print:py-2.5 print:px-0 print:border-b print:border-zinc-200 print:shadow-none ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-primary border-transparent bg-black/70' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                                                            }`}
                                                    >
                                                        <div {...provided.dragHandleProps} aria-label={`Reorder ${item.songs.title}`} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground print:hidden">
                                                            <GripVertical className="h-5 w-5" />
                                                        </div>

                                                        <div className="font-medium min-w-8 text-muted-foreground print:text-zinc-500 tabular-nums font-mono print:text-sm">
                                                            {index + 1}.
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/songs/${item.songs.id}`} className="font-semibold block truncate hover:underline text-white print:text-black print:text-sm" target="_blank">
                                                                {item.songs.title}
                                                            </Link>
                                                            <div className="text-sm text-muted-foreground print:text-zinc-600 flex gap-3 items-center mt-0.5">
                                                                {item.songs.artist && <span className="truncate print:text-xs">{item.songs.artist}</span>}
                                                                {item.songs.key && <span className="font-mono bg-muted print:bg-zinc-100 print:border print:border-zinc-300 px-1.5 py-0.5 rounded text-xs font-semibold print:text-black">{item.songs.key}</span>}
                                                                {item.songs.tempo && <span className="text-xs print:text-zinc-700">{item.songs.tempo} BPM</span>}
                                                                {item.performance_note && (
                                                                    <span className="text-xs italic text-amber-400 print:text-amber-900 print:bg-amber-50 print:px-1.5 print:rounded">Note: {item.performance_note}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center print:hidden">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                aria-label={`Move ${item.songs.title} up`}
                                                                disabled={index === 0}
                                                                onClick={() => moveSong(index, -1)}
                                                            >
                                                                <ArrowUp className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                aria-label={`Move ${item.songs.title} down`}
                                                                disabled={index === items.length - 1}
                                                                onClick={() => moveSong(index, 1)}
                                                            >
                                                                <ArrowDown className="h-4 w-4" />
                                                            </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`Remove ${item.songs.title} from setlist`}
                                                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 print:hidden"
                                                            onClick={() => removeSong(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* Available Songs Sidebar (Hidden in Print) */}
                    <div className="space-y-4 print:hidden">
                        <div className="sticky top-20 border border-white/10 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md shadow-xl flex flex-col max-h-[calc(100vh-8rem)]">
                            <div className="p-4 border-b border-white/10 bg-white/[0.02] font-semibold text-white">
                                Available Library
                            </div>
                            <div className="p-2 flex-1 overflow-y-auto min-h-[300px]">
                                {availableSongs.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No more songs available.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {availableSongs.map(song => (
                                            <div key={song.id} className="flex items-center justify-between p-2 hover:bg-white/10 rounded-lg text-sm transition-colors">
                                                <div className="truncate pr-2">
                                                    <div className="font-medium truncate text-zinc-100">{song.title}</div>
                                                    <div className="text-xs text-zinc-400 truncate">{song.artist || '-'}</div>
                                                </div>
                                                <Button size="icon-sm" variant="ghost" className="h-8 w-8 shrink-0 hover:bg-white/15 text-zinc-300 hover:text-white" onClick={() => addSong(song)} aria-label={`Add ${song.title} to setlist`}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* =========================================================================
               PRINT-ONLY: Songs with Chords and Details (Pages 2+)
               ========================================================================= */}
            <div className="hidden print:block space-y-8 print:space-y-0">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="print-page-break-before"
                    >
                        {/* Song Header */}
                        <div className="border-b border-zinc-300 pb-2.5 mb-4">
                            <div className="flex justify-between items-baseline">
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 mr-2 font-mono">
                                        #{index + 1}
                                    </span>
                                    <h2 className="text-xl font-bold inline text-zinc-950">{item.songs.title}</h2>
                                    {item.songs.artist && (
                                        <p className="text-xs text-zinc-400 mt-0.5">{item.songs.artist}</p>
                                    )}
                                </div>
                                <div className="flex gap-2 text-xs font-mono">
                                    {item.songs.key && (
                                        <span className="border border-zinc-300 bg-zinc-50 px-2 py-0.5 rounded font-bold text-zinc-900">
                                            Key: {item.songs.key}
                                        </span>
                                    )}
                                    {item.songs.tempo && (
                                        <span className="border border-zinc-300 bg-zinc-50 px-2 py-0.5 rounded text-zinc-800">
                                            {item.songs.tempo} BPM
                                        </span>
                                    )}
                                </div>
                            </div>

                            {(item.performance_note || item.songs.notes) && (
                                <div className="mt-2 text-[12px] italic bg-zinc-50 p-2 rounded border border-zinc-200 text-zinc-800">
                                    {item.performance_note && (
                                        <div><strong>Setlist Note:</strong> {item.performance_note}</div>
                                    )}
                                    {item.songs.notes && (
                                        <div><strong>Song Note:</strong> {item.songs.notes}</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Full Song Chord Sheet */}
                        <ChordSheet
                            lyrics={item.songs.lyrics || ''}
                            fontSizeClass="text-sm"
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
