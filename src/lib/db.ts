import Dexie, { type EntityTable } from 'dexie'

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript types — these mirror your Prisma models.
// Dates are stored as ISO strings because IndexedDB can store them,
// but JSON serialisation from the API will send them as strings anyway.
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalSong {
    id: string
    title: string
    artist: string | null
    key: string | null
    tempo: number | null
    notes: string | null
    lyrics: string | null
    songlink: string | null
    createdById: string
    createdAt: string   // ISO string, e.g. "2024-01-15T10:30:00.000Z"
    updatedAt: string
}

export interface LocalSetlist {
    id: string
    name: string
    event_date: string | null
    venue: string | null
    comment: string | null
    playlist_link: string | null
    createdById: string
    createdAt: string
    updatedAt: string
}

export interface LocalSetlistSong {
    id: string
    setlistId: string
    songId: string
    position: number
    performance_note: string | null
}

/** A write captured while offline, replayed via POST /api/sync/replay. */
export type MutationAction = 'CREATE_SONG' | 'UPDATE_SONG' | 'DELETE_SONG'

export interface PendingMutation {
    id?: number
    action: MutationAction
    /** Raw form values (strings) + `id` for updates/deletes, `tempId` for creates. */
    payload: Record<string, string>
    /** Client wall-clock when the change was made; used for last-write-wins on replay. */
    createdAt: number
}

/** Key/value store for sync bookkeeping (e.g. last successful sync time per table). */
export interface SyncMeta {
    key: string
    value: string
}

/** Prefix used for ids of songs created while offline (replaced by the server id on replay). */
export const OFFLINE_ID_PREFIX = 'offline-'
export const isOfflineId = (id: string) => id.startsWith(OFFLINE_ID_PREFIX)

// ─────────────────────────────────────────────────────────────────────────────
// The Dexie database class
//
// Think of this like your Prisma schema, but for the browser.
// Each .stores() call defines which fields are INDEXED (searchable/sortable).
// You don't list every field — only the ones you'll query or sort by.
//
//   &id       → primary key (the & marks it as unique primary key)
//   title     → regular index (lets you do .where('title').equals(...))
//   artist    → regular index
//
// Fields that are NOT listed (like lyrics, notes, tempo) are still STORED,
// they just can't be used in .where() queries — you'd filter them in JS.
// ─────────────────────────────────────────────────────────────────────────────

class SadhusangaDB extends Dexie {
    songs!: EntityTable<LocalSong, 'id'>
    setlists!: EntityTable<LocalSetlist, 'id'>
    setlistSongs!: EntityTable<LocalSetlistSong, 'id'>
    mutationQueue!: EntityTable<PendingMutation, 'id'>
    meta!: EntityTable<SyncMeta, 'key'>

    constructor() {
        super('sadhusanga-db') // this is the name shown in Chrome DevTools

        // Version 1 — initial schema.
        // IMPORTANT: Never edit an existing version once deployed.
        this.version(1).stores({
            songs: '&id, title, artist, createdById',
            setlists: '&id, name, createdById',
            setlistSongs: '&id, setlistId, songId',
        })

        // Version 2 — added event_date index to setlists so we can
        // sort by it with .orderBy('event_date').
        this.version(2).stores({
            songs: '&id, title, artist, createdById',
            setlists: '&id, name, event_date, createdById',
            setlistSongs: '&id, setlistId, songId',
        })

        // Version 3 - added mutationQueue
        this.version(3).stores({
            songs: '&id, title, artist, createdById',
            setlists: '&id, name, event_date, createdById',
            setlistSongs: '&id, setlistId, songId',
            mutationQueue: '++id, action, createdAt'
        })

        // Version 4 - added `meta` (sync bookkeeping for delta sync) and a
        // compound index so a setlist's songs can be read in position order.
        this.version(4).stores({
            songs: '&id, title, artist, createdById',
            setlists: '&id, name, event_date, createdById',
            setlistSongs: '&id, setlistId, songId, [setlistId+position]',
            mutationQueue: '++id, action, createdAt',
            meta: '&key',
        })
    }
}

// Export a single shared instance — just like src/lib/prisma.ts exports prisma
export const db = new SadhusangaDB()
