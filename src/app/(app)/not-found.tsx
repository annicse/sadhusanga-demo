import Link from 'next/link'
import { SearchX } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'

/** Rendered by `notFound()` from any page under (app), e.g. a deleted song or setlist. */
export default function AppNotFound() {
    return (
        <div className="max-w-lg mx-auto mt-12 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                <SearchX className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Not found</h1>
            <p className="text-sm text-zinc-400">
                This song, setlist or practice does not exist — it may have been deleted by another band member.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
                <Link href="/songs" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Songs</Link>
                <Link href="/setlists" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Setlists</Link>
                <Link href="/practices" className={buttonVariants({ variant: 'outline', size: 'sm' })}>Practices</Link>
            </div>
        </div>
    )
}
