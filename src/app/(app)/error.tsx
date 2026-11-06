'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Error boundary for every page under the (app) route group.
 * Next.js renders this instead of the default error screen when a page or
 * server action throws (e.g. "Unauthorized", database unreachable).
 */
export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    const isAuthError = /unauthori[sz]ed|forbidden/i.test(error.message)

    return (
        <div className="max-w-lg mx-auto mt-12 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/20 via-black/50 to-black/80 p-8 text-center space-y-4 shadow-xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">
                {isAuthError ? "You don't have access to that" : 'Something went wrong'}
            </h1>
            <p className="text-sm text-zinc-400">
                {isAuthError
                    ? 'This action is limited to admins or you have been signed out.'
                    : 'The page hit an unexpected error. You can try again, or go back to the dashboard.'}
            </p>
            {error.digest && (
                <p className="text-[12px] text-zinc-400 font-mono">ref: {error.digest}</p>
            )}
            <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" onClick={reset} className="gap-1.5">
                    <RotateCcw className="h-4 w-4" /> Try again
                </Button>
                <Link href="/" className="text-sm text-primary hover:underline">
                    Back to dashboard
                </Link>
            </div>
        </div>
    )
}
