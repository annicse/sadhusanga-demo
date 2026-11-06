import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { SongsList } from "@/components/songs-list"

// ─────────────────────────────────────────────────────────────────────────────
// This page component is a SERVER component — it runs on the server.
// It handles auth, reads search params, and renders the page shell.
//
// The actual song table is delegated to <SongsList> which is a CLIENT component
// that reads from Dexie (IndexedDB) and syncs from the server API.
//
// Why this split?
//   - Auth and search params are better handled server-side (no client round-trip)
//   - Dexie/IndexedDB can only run in the browser (client), not on the server
//
// We also pass a server-rendered `initialSongs` list so the first paint shows
// real rows (no spinner) and a brand-new device has data before its first sync.
// ─────────────────────────────────────────────────────────────────────────────

import { buttonVariants } from "@/components/ui/button-variants"

export const metadata = { title: "Songs" }

export default async function SongsDashboard(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams
  const query = searchParams?.q || ""

  const session = await auth()
  if (!session?.user) return null

  const initialSongs = await prisma.song.findMany({
    where: query
      ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { artist: { contains: query, mode: 'insensitive' } },
        ],
      }
      : undefined,
    orderBy: { title: 'asc' },
    select: { id: true, title: true, artist: true, key: true, tempo: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Songs</h1>
          <p className="text-muted-foreground text-sm">
            Manage your gig repertoire and song library.
          </p>
        </div>
        <Link
          href="/songs/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="h-4 w-4" />
          Add Song
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <form className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
          <Input
            name="q"
            type="search"
            placeholder="Search songs or artists..."
            defaultValue={query}
            className="pl-9.5 h-10 rounded-xl"
          />
        </form>
      </div>

      {/*
        SongsList is a client component.
        We pass `query` down as a prop — it will use it to filter Dexie results.
      */}
      <SongsList query={query} initialSongs={initialSongs} />
    </div>
  )
}
