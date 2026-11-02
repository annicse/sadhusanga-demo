'use client'

import { db, OFFLINE_ID_PREFIX, type LocalSong } from './db'
import { queueOfflineMutation } from './sync'
import { SongSchema } from './validations/song'
import { firstIssueMessage } from './validations/utils'

/**
 * Offline-first writes for songs.
 *
 * When the device is offline the form cannot reach the Server Action, so we:
 *   1. validate locally with the same Zod schema the server uses,
 *   2. apply the change to Dexie so the UI updates immediately,
 *   3. queue the raw form values; SyncProvider replays them when back online.
 */

type Result = { success: true; id: string } | { error: string }

function formToRecord(formData: FormData): Record<string, string> {
    const out: Record<string, string> = {}
    formData.forEach((v, k) => { if (typeof v === 'string') out[k] = v })
    return out
}

function toLocalFields(data: ReturnType<typeof SongSchema.parse>) {
    return {
        title: data.title,
        artist: data.artist ?? null,
        key: data.key ?? null,
        tempo: data.tempo ?? null,
        notes: data.notes ?? null,
        lyrics: data.lyrics ?? null,
        songlink: data.songlink ?? null,
    }
}

export async function createSongOffline(formData: FormData, userId = ''): Promise<Result> {
    const raw = formToRecord(formData)
    const parsed = SongSchema.safeParse(raw)
    if (!parsed.success) return { error: firstIssueMessage(parsed.error) }

    const now = new Date().toISOString()
    const tempId = `${OFFLINE_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const song: LocalSong = { id: tempId, ...toLocalFields(parsed.data), createdById: userId, createdAt: now, updatedAt: now }

    await db.transaction('rw', db.songs, db.mutationQueue, async () => {
        await db.songs.put(song)
        await queueOfflineMutation('CREATE_SONG', { tempId, ...raw })
    })
    return { success: true, id: tempId }
}

export async function updateSongOffline(id: string, formData: FormData): Promise<Result> {
    const raw = formToRecord(formData)
    const parsed = SongSchema.safeParse(raw)
    if (!parsed.success) return { error: firstIssueMessage(parsed.error) }

    const now = new Date().toISOString()
    await db.transaction('rw', db.songs, db.mutationQueue, async () => {
        const existing = await db.songs.get(id)
        await db.songs.put({
            id,
            createdById: existing?.createdById ?? '',
            createdAt: existing?.createdAt ?? now,
            ...toLocalFields(parsed.data),
            updatedAt: now,
        })
        await queueOfflineMutation('UPDATE_SONG', { id, ...raw })
    })
    return { success: true, id }
}

export async function deleteSongOffline(id: string): Promise<Result> {
    await db.transaction('rw', db.songs, db.mutationQueue, async () => {
        await db.songs.delete(id)
        // A song created offline and never uploaded has nothing to delete on the server:
        // drop its pending CREATE instead of queueing a DELETE.
        if (id.startsWith(OFFLINE_ID_PREFIX)) {
            const creates = await db.mutationQueue.where('action').equals('CREATE_SONG').toArray()
            const mine = creates.find(m => m.payload.tempId === id)
            if (mine?.id !== undefined) await db.mutationQueue.delete(mine.id)
            return
        }
        await queueOfflineMutation('DELETE_SONG', { id })
    })
    return { success: true, id }
}

export const isOffline = () => typeof navigator !== 'undefined' && !navigator.onLine
