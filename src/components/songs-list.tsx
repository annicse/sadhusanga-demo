'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import Link from 'next/link'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Loader2 } from 'lucide-react'

export type SongRow = {
    id: string
    title: string
    artist: string | null
    key: string | null
    tempo: number | null
}

export function SongsList({ query, initialSongs }: { query: string; initialSongs?: SongRow[] }) {
    // Read from local Dexie — instant, works offline.
    // Syncing is handled globally by SyncProvider in the layout.
    // `initialSongs` (server-rendered) is shown until Dexie answers, so there is
    // no loading flash and a brand-new device has data before its first sync.
    const songs = useLiveQuery(() => {
        if (query) {
            return db.songs
                .orderBy('title')
                .filter(song =>
                    song.title.toLowerCase().includes(query.toLowerCase()) ||
                    (song.artist?.toLowerCase().includes(query.toLowerCase()) ?? false)
                )
                .toArray()
        }
        return db.songs.orderBy('title').toArray()
    }, [query], initialSongs)

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Artist</TableHead>
                        <TableHead className="w-[100px]">Key</TableHead>
                        <TableHead className="w-[100px]">Tempo</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {songs === undefined ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Loading…
                            </TableCell>
                        </TableRow>
                    ) : songs.length > 0 ? (
                        songs.map(song => (
                            <TableRow key={song.id} className="group cursor-pointer">
                                <TableCell className="font-medium">
                                    <Link href={`/songs/${song.id}`} className="block text-zinc-100 group-hover:text-amber-400 group-hover:underline transition-colors">
                                        {song.title}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-zinc-300">{song.artist || '–'}</TableCell>
                                <TableCell className="text-zinc-400 font-mono text-xs">{song.key || '–'}</TableCell>
                                <TableCell className="text-zinc-400 text-xs">{song.tempo ? `${song.tempo} BPM` : '–'}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                {query ? `No songs matching "${query}".` : 'No songs yet. Add your first song!'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
