import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Calendar, Clock, MapPin, KeyRound, ArrowRight, CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { doorCodeForVenue, DEFAULT_VENUE } from "@/lib/band-config"
import { bandHour, startOfBandToday } from "@/lib/time"

export const dynamic = "force-dynamic"

export const metadata = { title: "Home" }

export default async function SongsDashboard() {
  const randomGreeting = () => {
    const hour = bandHour()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const session = await auth()
  if (!session?.user) return null

  // Fetch the most recent upcoming non-cancelled practice (today in band time or later)
  const nextPractice = await prisma.practice.findFirst({
    where: {
      date: { gte: startOfBandToday() },
      isCancelled: false
    },
    orderBy: { date: 'asc' },
    include: {
      rsvps: {
        include: {
          user: {
            select: { id: true, name: true, image: true, instrument: true }
          }
        }
      }
    }
  })

  const goingAttendees = nextPractice?.rsvps.filter(r => r.status === 'GOING') || []
  const userRsvp = nextPractice?.rsvps.find(r => r.userId === session.user.id)?.status
  // Door code for the next practice's venue (or the default venue when nothing is scheduled)
  const doorCode = doorCodeForVenue(nextPractice?.venue ?? DEFAULT_VENUE)

  const formattedDate = nextPractice
    ? new Date(nextPractice.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      })
    : null

  return (
    <div className="space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {randomGreeting()}, {session?.user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Welcome back to Sadhusanga band portal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/practices"
            className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"}
          >
            <Calendar className="h-4 w-4" />
            See practices
          </Link>

          <Link
            href="/songs/new"
            className={buttonVariants({ variant: "default", size: "sm" }) + " gap-1.5 shadow-md"}
          >
            <Plus className="h-4 w-4" />
            Add Song
          </Link>
        </div>
      </div>

      {/* Rehearsal Highlight Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-black/40 to-black/60 p-6 md:p-7 backdrop-blur-xl relative overflow-hidden shadow-xl ring-1 ring-amber-500/20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs px-2.5 py-0.5 font-bold">
                Next Jamming Date
              </Badge>
              {userRsvp === 'GOING' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> You're Going
                </span>
              )}
            </div>

            {nextPractice ? (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {formattedDate}
                </h2>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-1 font-medium text-zinc-200">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    {nextPractice.time}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-zinc-200">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {nextPractice.venue}
                  </span>
                  {doorCode && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-medium text-amber-400">
                        <KeyRound className="h-3.5 w-3.5" />
                        Door code: <strong className="font-mono text-sm tracking-wider font-bold text-white">*{doorCode}*</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-white">No Upcoming Practice Scheduled</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Click below to view the schedule or set up upcoming rehearsal dates.
                </p>
                {doorCode && (
                  <div className="mt-2 text-xs text-zinc-300 inline-flex items-center gap-1">
                    <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                    Door code: <strong className="font-mono text-white font-bold">*{doorCode}*</strong>
                  </div>
                )}
              </div>
            )}

            {/* Going Attendees Preview */}
            {nextPractice && goingAttendees.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex -space-x-2 overflow-hidden">
                  {goingAttendees.slice(0, 5).map(rsvp => (
                    <Avatar key={rsvp.id} className="h-6 w-6 border-2 border-zinc-950 bg-zinc-800" title={rsvp.user.name || 'Member'}>
                      <AvatarImage src={rsvp.user.image || ''} />
                      <AvatarFallback className="text-[9px] font-bold text-zinc-300">
                        {rsvp.user.name ? rsvp.user.name.substring(0, 2).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-xs text-zinc-400 font-medium">
                  {goingAttendees.length} attending
                </span>
              </div>
            )}
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {nextPractice && (
              <Link
                href={`/practices/${nextPractice.id}`}
                className={buttonVariants({ variant: "default", size: "sm" }) + " gap-1.5 font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950"}
              >
                RSVP & Details
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/practices"
              className={buttonVariants({ variant: "outline", size: "sm" }) + " gap-1.5"}
            >
              <Calendar className="h-4 w-4" />
              See practices
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


