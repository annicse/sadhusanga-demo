import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { SetlistsList } from "@/components/setlists-list"

import { buttonVariants } from "@/components/ui/button-variants"

export const metadata = { title: "Setlists" }

export default async function SetlistsPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams
    const query = searchParams?.q || ""

    const session = await auth()
    if (!session?.user) return null

    // Server-rendered initial rows; the client list then reads live data from Dexie.
    const setlists = await prisma.setlist.findMany({
        where: query
            ? {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { venue: { contains: query, mode: 'insensitive' } },
                ],
            }
            : undefined,
        orderBy: { event_date: 'desc' },
        select: { id: true, name: true, event_date: true, venue: true },
    })
    const initialSetlists = setlists.map(s => ({
        ...s,
        event_date: s.event_date ? s.event_date.toISOString() : null,
    }))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Setlists</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your gig setlists and running orders.
                    </p>
                </div>
                <Link
                    href="/setlists/new"
                    className={buttonVariants({ variant: "default" })}
                >
                    <Plus className="h-4 w-4" />
                    Create Setlist
                </Link>
            </div>

            <div className="flex items-center space-x-2">
                <form className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
                    <Input
                        name="q"
                        type="search"
                        placeholder="Search setlists or venues..."
                        defaultValue={query}
                        className="pl-9.5 h-10 rounded-xl"
                    />
                </form>
            </div>

            <SetlistsList query={query} initialSetlists={initialSetlists} />
        </div>
    )
}

