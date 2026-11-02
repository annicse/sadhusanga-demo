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
import { format } from 'date-fns'

export type SetlistRow = {
    id: string
    name: string
    event_date: string | null
    venue: string | null
}

export function SetlistsList({ query, initialSetlists }: { query: string; initialSetlists?: SetlistRow[] }) {
    // Read from local Dexie — instant, works offline.
    // Syncing is handled globally by SyncProvider in the layout.
    // `initialSetlists` (server-rendered) is shown until Dexie answers.
    const setlists = useLiveQuery(() => {
        if (query) {
            return db.setlists
                .orderBy('name')
                .filter(s =>
                    s.name.toLowerCase().includes(query.toLowerCase()) ||
                    (s.venue?.toLowerCase().includes(query.toLowerCase()) ?? false)
                )
                .toArray()
        }
        // Sort by event_date descending — null dates go last
        return db.setlists.orderBy('event_date').reverse().toArray()
    }, [query], initialSetlists)

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Event Date</TableHead>
                        <TableHead>Venue</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {setlists === undefined ? (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Loading…
                            </TableCell>
                        </TableRow>
                    ) : setlists.length > 0 ? (
                        setlists.map(setlist => (
                            <TableRow key={setlist.id} className="group cursor-pointer">
                                <TableCell className="font-medium">
                                    <Link href={`/setlists/${setlist.id}`} className="block text-zinc-100 group-hover:text-amber-400 group-hover:underline transition-colors">
                                        {setlist.name}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-zinc-300">
                                    {setlist.event_date
                                        ? format(new Date(setlist.event_date), 'PPP')
                                        : '–'}
                                </TableCell>
                                <TableCell className="text-zinc-400">{setlist.venue || '–'}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                {query ? `No setlists matching "${query}".` : 'No setlists yet. Create your first one!'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
