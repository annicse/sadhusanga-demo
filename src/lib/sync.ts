import {
    db,
    isOfflineId,
    type LocalSong,
    type LocalSetlist,
    type LocalSetlistSong,
    type MutationAction,
} from './db'

// ─────────────────────────────────────────────────────────────────────────────
// Sync bookkeeping
//
// Each table remembers the server time of its last successful sync in `meta`.
// The next sync sends it back as `?since=` and only receives what changed
// (plus tombstones for deletions). The first sync on a device is a full
// snapshot. We subtract a small overlap so clock skew / in-flight writes can
// never be missed — upserts are idempotent, so receiving a row twice is fine.
// ─────────────────────────────────────────────────────────────────────────────

export const META_SONGS_SYNCED_AT = 'songs.lastSyncAt'
export const META_SETLISTS_SYNCED_AT = 'setlists.lastSyncAt'
const OVERLAP_MS = 5_000

async function getMeta(key: string): Promise<string | undefined> {
    return (await db.meta.get(key))?.value
}

function nextSince(serverTime: string): string {
    return new Date(new Date(serverTime).getTime() - OVERLAP_MS).toISOString()
}

/** Forget sync cursors so the next sync is a full snapshot (e.g. after login as another user). */
export async function resetSyncCursors() {
    await db.meta.bulkDelete([META_SONGS_SYNCED_AT, META_SETLISTS_SYNCED_AT])
}

// ─────────────────────────────────────────────────────────────────────────────
// SONGS
// ─────────────────────────────────────────────────────────────────────────────

interface SongsSyncResponse {
    songs: LocalSong[]
    deletedIds: string[]
    serverTime: string
    full: boolean
}

/**
 * Pulls songs from the server into Dexie.
 *
 * - First run: full snapshot; removes local rows the server no longer has
 *   (except not-yet-replayed offline creations).
 * - Later runs: delta — upserts changed songs and deletes tombstoned ids.
 */
export async function syncSongs(): Promise<void> {
    try {
        const since = await getMeta(META_SONGS_SYNCED_AT)
        const url = since ? `/api/songs?since=${encodeURIComponent(since)}` : '/api/songs'
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return

        const data: SongsSyncResponse = await res.json()

        await db.transaction('rw', db.songs, db.meta, async () => {
            if (data.full) {
                // ── Stale cleanup (full snapshot only) ─────────────────────
                const serverIds = new Set(data.songs.map(s => s.id))
                const localIds = (await db.songs.toCollection().primaryKeys()) as string[]
                const staleIds = localIds.filter(id => !serverIds.has(id) && !isOfflineId(id))
                if (staleIds.length > 0) await db.songs.bulkDelete(staleIds)
            }
            if (data.songs.length > 0) await db.songs.bulkPut(data.songs)
            if (data.deletedIds.length > 0) await db.songs.bulkDelete(data.deletedIds)
            await db.meta.put({ key: META_SONGS_SYNCED_AT, value: nextSince(data.serverTime) })
        })
    } catch {
        // Network offline — silently skip, local data is still usable
    }
}

/** Fetches a single song by id and upserts it into Dexie. */
export async function syncSong(id: string): Promise<void> {
    try {
        const res = await fetch(`/api/songs/${id}`, { cache: 'no-store' })
        if (!res.ok) return
        const song: LocalSong = await res.json()
        await db.songs.put(song)
    } catch {
        // ignore
    }
}

/** Removes a song from the local Dexie cache. */
export async function removeSongLocally(id: string): Promise<void> {
    await db.songs.delete(id)
}

// ─────────────────────────────────────────────────────────────────────────────
// SETLISTS
// ─────────────────────────────────────────────────────────────────────────────

interface SetlistsSyncResponse {
    setlists: LocalSetlist[]
    setlistSongs: LocalSetlistSong[]
    deletedIds: string[]
    serverTime: string
    full: boolean
}

/** Replace the local join rows for the given setlists with the server's rows. */
async function replaceSetlistSongs(setlistIds: string[], rows: LocalSetlistSong[]) {
    if (setlistIds.length > 0) {
        await db.setlistSongs.where('setlistId').anyOf(setlistIds).delete()
    }
    if (rows.length > 0) await db.setlistSongs.bulkPut(rows)
}

/**
 * Pulls setlists AND their song rows into Dexie (full snapshot first, deltas after).
 */
export async function syncSetlists(): Promise<void> {
    try {
        const since = await getMeta(META_SETLISTS_SYNCED_AT)
        const url = since ? `/api/setlists?since=${encodeURIComponent(since)}` : '/api/setlists'
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return

        const data: SetlistsSyncResponse = await res.json()

        await db.transaction('rw', db.setlists, db.setlistSongs, db.meta, async () => {
            if (data.full) {
                const serverIds = new Set(data.setlists.map(s => s.id))
                const localIds = (await db.setlists.toCollection().primaryKeys()) as string[]
                const staleIds = localIds.filter(id => !serverIds.has(id))
                if (staleIds.length > 0) await db.setlists.bulkDelete(staleIds)
                await db.setlistSongs.clear()
                if (data.setlistSongs.length > 0) await db.setlistSongs.bulkPut(data.setlistSongs)
            } else {
                await replaceSetlistSongs(data.setlists.map(s => s.id), data.setlistSongs)
            }

            if (data.setlists.length > 0) await db.setlists.bulkPut(data.setlists)

            if (data.deletedIds.length > 0) {
                await db.setlists.bulkDelete(data.deletedIds)
                await db.setlistSongs.where('setlistId').anyOf(data.deletedIds).delete()
            }

            await db.meta.put({ key: META_SETLISTS_SYNCED_AT, value: nextSince(data.serverTime) })
        })
    } catch {
        // ignore
    }
}

/** Fetches a single setlist (+ its song rows) and upserts it into Dexie. */
export async function syncSetlist(id: string): Promise<void> {
    try {
        const res = await fetch(`/api/setlists/${id}`, { cache: 'no-store' })
        if (!res.ok) return
        const data: { setlist: LocalSetlist; setlistSongs: LocalSetlistSong[] } = await res.json()
        await db.transaction('rw', db.setlists, db.setlistSongs, async () => {
            await db.setlists.put(data.setlist)
            await replaceSetlistSongs([id], data.setlistSongs)
        })
    } catch {
        // ignore
    }
}

/** Removes a setlist (and its song rows) from the local Dexie cache. */
export async function removeSetlistLocally(id: string): Promise<void> {
    await db.transaction('rw', db.setlists, db.setlistSongs, async () => {
        await db.setlists.delete(id)
        await db.setlistSongs.where('setlistId').equals(id).delete()
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE WRITE QUEUE
//
// Forms call `queueOfflineMutation` when `navigator.onLine` is false (after
// applying the change to Dexie optimistically). `processOfflineQueue` replays
// the queue in order when connectivity returns.
// ─────────────────────────────────────────────────────────────────────────────

export async function queueOfflineMutation(action: MutationAction, payload: Record<string, string>) {
    await db.mutationQueue.add({
        action,
        payload,
        createdAt: Date.now(),
    })
}

export interface ReplayResult {
    replayed: number
    /** Mutations dropped because the server rejected them (validation / conflict). */
    dropped: number
    /** True if replay stopped early (offline / not signed in / server error) and will retry later. */
    interrupted: boolean
}

export async function processOfflineQueue(): Promise<ReplayResult> {
    const result: ReplayResult = { replayed: 0, dropped: 0, interrupted: false }
    if (typeof navigator !== 'undefined' && !navigator.onLine) return result

    const pending = await db.mutationQueue.orderBy('createdAt').toArray()

    for (const mutation of pending) {
        let res: Response
        try {
            res = await fetch('/api/sync/replay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: mutation.action,
                    payload: mutation.payload,
                    clientUpdatedAt: new Date(mutation.createdAt).toISOString(),
                }),
            })
        } catch {
            result.interrupted = true // network dropped again — keep the queue, retry later
            break
        }

        if (res.ok) {
            const body = (await res.json().catch(() => ({}))) as { id?: string }
            if (mutation.action === 'CREATE_SONG' && mutation.payload.tempId) {
                // Swap the temporary offline row for the real server row
                await db.songs.delete(mutation.payload.tempId)
                if (body.id) await syncSong(body.id)
            }
            if (mutation.id !== undefined) await db.mutationQueue.delete(mutation.id)
            result.replayed++
            continue
        }

        if (res.status === 401 || res.status >= 500) {
            result.interrupted = true // not signed in / server trouble — retry later
            break
        }

        // 4xx (validation error, conflict, record gone): this mutation can never
        // succeed, so drop it; the following sync restores the server's version.
        if (mutation.id !== undefined) await db.mutationQueue.delete(mutation.id)
        result.dropped++
    }

    return result
}
