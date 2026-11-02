'use client'

/**
 * SyncContext
 *
 * Manages data synchronisation globally so that:
 *  1. Sync runs ONCE when the app first loads.
 *  2. Sync runs again when the user brings the app back to the foreground
 *     (tab becomes visible or window regains focus — covers minimise / multitask).
 *  3. A manual sync can be triggered from anywhere (e.g. the navbar button).
 *  4. Writes captured while offline (mutationQueue) are replayed first whenever
 *     we are online, so the pull that follows already reflects them.
 *
 * Both SongsList and SetlistsList no longer trigger their own syncs; they simply
 * read from Dexie via useLiveQuery and the data is always fresh because this
 * context keeps it up to date.
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { db } from '@/lib/db'
import { syncSongs, syncSetlists, processOfflineQueue } from '@/lib/sync'

interface SyncContextValue {
    isSyncing: boolean
    lastSynced: Date | null
    /** Number of offline changes still waiting to be sent to the server. */
    pendingCount: number
    triggerSync: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue>({
    isSyncing: false,
    lastSynced: null,
    pendingCount: 0,
    triggerSync: async () => { },
})

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const [isSyncing, setIsSyncing] = useState(false)
    const [lastSynced, setLastSynced] = useState<Date | null>(null)
    // Prevent concurrent syncs
    const syncingRef = useRef(false)

    const pendingCount = useLiveQuery(() => db.mutationQueue.count(), [], 0)

    const triggerSync = useCallback(async () => {
        if (syncingRef.current) return
        syncingRef.current = true
        setIsSyncing(true)
        try {
            // 1. Push: replay anything written while offline
            const replay = await processOfflineQueue()
            if (replay.replayed > 0) {
                toast.success(`Synced ${replay.replayed} offline change${replay.replayed === 1 ? '' : 's'}`)
            }
            if (replay.dropped > 0) {
                toast.error(`${replay.dropped} offline change${replay.dropped === 1 ? ' was' : 's were'} rejected by the server`)
            }
            // 2. Pull: fetch what changed on the server (delta after the first full sync)
            await Promise.all([syncSongs(), syncSetlists()])
            setLastSynced(new Date())
        } finally {
            setIsSyncing(false)
            syncingRef.current = false
        }
    }, [])

    // ── Run once on initial load ────────────────────────────────────────────
    useEffect(() => {
        triggerSync()
    }, [triggerSync])

    // ── Re-sync when app comes back to the foreground ───────────────────────
    // visibilitychange covers: switching tabs, minimising, multitasking
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                triggerSync()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [triggerSync])

    // ── Replay the offline queue as soon as connectivity returns ────────────
    useEffect(() => {
        const handleOnline = () => { triggerSync() }
        window.addEventListener('online', handleOnline)
        return () => window.removeEventListener('online', handleOnline)
    }, [triggerSync])

    return (
        <SyncContext.Provider value={{ isSyncing, lastSynced, pendingCount: pendingCount ?? 0, triggerSync }}>
            {children}
        </SyncContext.Provider>
    )
}

/** Hook for consuming the sync context in any client component. */
export function useSync() {
    return useContext(SyncContext)
}
