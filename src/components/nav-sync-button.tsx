'use client'

import { useSync } from '@/lib/sync-context'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * A compact icon-only sync button for the navbar.
 * Reads state from the global SyncContext set up in the app layout.
 * Shows a small badge while offline changes are waiting to be uploaded.
 */
export function NavSyncButton() {
    const { isSyncing, lastSynced, pendingCount, triggerSync } = useSync()

    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={triggerSync}
                        disabled={isSyncing}
                        className="h-8 w-8 relative"
                        aria-label={pendingCount > 0 ? `Sync data (${pendingCount} pending)` : 'Sync data'}
                    />
                }
            >
                {isSyncing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />
                }
                {pendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-[12px] font-bold text-zinc-950 flex items-center justify-center">
                        {pendingCount}
                    </span>
                )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {isSyncing
                    ? 'Syncing…'
                    : pendingCount > 0
                        ? `${pendingCount} offline change${pendingCount === 1 ? '' : 's'} waiting to upload`
                        : lastSynced
                            ? `Last synced: ${lastSynced.toLocaleTimeString()}`
                            : 'Sync'}
            </TooltipContent>
        </Tooltip>
    )
}
