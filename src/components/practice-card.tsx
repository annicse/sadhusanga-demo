import Link from "next/link"
import { Calendar, Clock, MapPin, Users, AlertCircle, CheckCircle2, XCircle, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Practice, PracticeRsvp, User, RsvpStatus, SuggestionStatus } from "@prisma/client"

export type PracticeWithDetails = Practice & {
    createdBy: Pick<User, 'id' | 'name' | 'email'>
    rsvps: Array<PracticeRsvp & {
        user: Pick<User, 'id' | 'name' | 'image' | 'instrument'>
    }>
    suggestions: Array<{ id: string; status: SuggestionStatus }>
}

interface PracticeCardProps {
    practice: PracticeWithDetails
    isHighlighted?: boolean
    currentUserId?: string
}

export function PracticeCard({ practice, isHighlighted = false, currentUserId }: PracticeCardProps) {
    const practiceDate = new Date(practice.date)

    // Format components in UTC to avoid local timezone drift from stored date
    const dayName = practiceDate.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })
    const dayNum = practiceDate.getUTCDate()
    const monthName = practiceDate.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })
    const fullDate = practiceDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    })

    const goingRsvps = practice.rsvps.filter(r => r.status === 'GOING')
    const currentUserRsvp = practice.rsvps.find(r => r.userId === currentUserId)?.status
    const pendingSuggestionsCount = practice.suggestions.filter(s => s.status === 'PENDING').length

    return (
        <Link
            href={`/practices/${practice.id}`}
            className={cn(
                "group block relative rounded-2xl border transition-all duration-200 overflow-hidden",
                practice.isCancelled
                    ? "border-red-500/20 bg-red-950/10 hover:border-red-500/40 opacity-80"
                    : isHighlighted
                        ? "border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] via-black/40 to-black/60 shadow-lg shadow-amber-500/5 hover:border-amber-500/60 ring-1 ring-amber-500/20"
                        : "border-white/10 bg-black/40 backdrop-blur-md hover:border-white/20 hover:bg-white/[0.03]"
            )}
        >
            {/* Top highlight bar */}
            {isHighlighted && !practice.isCancelled && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
            )}

            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Date badge + details */}
                <div className="flex items-start sm:items-center gap-4">
                    {/* Date Block */}
                    <div className={cn(
                        "flex flex-col items-center justify-center w-14 h-16 rounded-xl border shrink-0 font-mono shadow-inner",
                        practice.isCancelled
                            ? "bg-red-950/30 border-red-500/30 text-red-400"
                            : isHighlighted
                                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                                : "bg-white/5 border-white/10 text-zinc-300"
                    )}>
                        <span className="text-[10px] uppercase font-bold tracking-wider">{monthName}</span>
                        <span className="text-2xl font-black leading-none my-0.5">{dayNum}</span>
                        <span className="text-[10px] font-semibold text-zinc-400">{dayName}</span>
                    </div>

                    {/* Main Details */}
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={cn(
                                "text-lg font-bold tracking-tight transition-colors group-hover:text-primary",
                                practice.isCancelled ? "line-through text-zinc-400" : "text-white"
                            )}>
                                {fullDate}
                            </h3>

                            {isHighlighted && !practice.isCancelled && (
                                <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-2 py-0.5 font-semibold">
                                    Next Rehearsal
                                </Badge>
                            )}

                            {practice.isCancelled && (
                                <Badge variant="destructive" className="text-xs px-2 py-0.5 font-bold">
                                    Cancelled
                                </Badge>
                            )}

                            {pendingSuggestionsCount > 0 && !practice.isCancelled && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs px-2 py-0.5 font-medium">
                                    {pendingSuggestionsCount} Edit Suggested
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400">
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-300">
                                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                                {practice.time}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-zinc-300">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {practice.venue}
                            </span>
                            {practice.notes && (
                                <>
                                    <span>•</span>
                                    <span className="italic truncate max-w-[200px] text-zinc-400">
                                        "{practice.notes}"
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: RSVPs summary */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    {/* User's RSVP badge */}
                    {currentUserRsvp && (
                        <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            currentUserRsvp === 'GOING' && "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
                            currentUserRsvp === 'MAYBE' && "bg-amber-500/15 border-amber-500/30 text-amber-400",
                            currentUserRsvp === 'NOT_GOING' && "bg-red-500/15 border-red-500/30 text-red-400"
                        )}>
                            {currentUserRsvp === 'GOING' && <CheckCircle2 className="h-3 w-3" />}
                            {currentUserRsvp === 'MAYBE' && <HelpCircle className="h-3 w-3" />}
                            {currentUserRsvp === 'NOT_GOING' && <XCircle className="h-3 w-3" />}
                            You: {currentUserRsvp === 'GOING' ? 'Going' : currentUserRsvp === 'MAYBE' ? 'Maybe' : "Can't Go"}
                        </span>
                    )}

                    {/* Attendees Avatar Stack */}
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 overflow-hidden">
                            {goingRsvps.slice(0, 4).map((rsvp) => {
                                const initials = rsvp.user.name
                                    ? rsvp.user.name.substring(0, 2).toUpperCase()
                                    : 'U'
                                return (
                                    <Avatar key={rsvp.id} className="h-7 w-7 border-2 border-zinc-900 bg-zinc-800 ring-1 ring-white/10" title={rsvp.user.name || 'Band member'}>
                                        <AvatarImage src={rsvp.user.image || ''} />
                                        <AvatarFallback className="text-[10px] font-bold text-zinc-300">{initials}</AvatarFallback>
                                    </Avatar>
                                )
                            })}
                        </div>
                        <span className="text-xs text-zinc-400 font-medium">
                            {goingRsvps.length} {goingRsvps.length === 1 ? 'attending' : 'attending'}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
