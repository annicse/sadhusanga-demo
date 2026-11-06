'use client'

import { useOptimistic, useTransition } from "react"
import Link from "next/link"
import {
    Calendar,
    Clock,
    MapPin,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    HelpCircle,
    AlertTriangle,
    RotateCcw,
    ThumbsUp,
    ThumbsDown,
    Check,
    X,
    Loader2,
    Users,
    KeyRound
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditPracticeDialog } from "@/components/edit-practice-dialog"
import { SuggestEditDialog } from "@/components/suggest-edit-dialog"
import {
    rsvpPractice,
    toggleCancelPractice,
    voteSuggestion,
    applySuggestion,
    rejectSuggestion
} from "@/app/(app)/practices/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type {
    Practice,
    PracticeRsvp,
    PracticeSuggestion,
    PracticeSuggestionVote,
    User,
    RsvpStatus
} from "@prisma/client"

export type PracticeFullDetails = Practice & {
    createdBy: Pick<User, 'id' | 'name' | 'email'>
    rsvps: Array<PracticeRsvp & {
        user: Pick<User, 'id' | 'name' | 'image' | 'instrument'>
    }>
    suggestions: Array<PracticeSuggestion & {
        createdBy: Pick<User, 'id' | 'name' | 'image'>
        votes: Array<PracticeSuggestionVote & {
            user: Pick<User, 'id' | 'name' | 'image'>
        }>
    }>
}

interface PracticeDetailViewProps {
    practice: PracticeFullDetails
    currentUserId: string
    /** Rehearsal-room door code for this venue, resolved on the server (null = none / not configured). */
    doorCode?: string | null
}

type RsvpRow = PracticeFullDetails['rsvps'][number]

export function PracticeDetailView({ practice, currentUserId, doorCode }: PracticeDetailViewProps) {
    const [isPending, startTransition] = useTransition()

    const practiceDate = new Date(practice.date)
    const formattedDate = practiceDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    })

    // ── Optimistic RSVP ─────────────────────────────────────────────────────
    // The UI reflects the tapped status immediately; React reverts to the
    // server-provided `practice.rsvps` automatically if the action fails.
    const [optimisticRsvps, setOptimisticRsvp] = useOptimistic(
        practice.rsvps,
        (current: RsvpRow[], status: RsvpStatus): RsvpRow[] => {
            const mine = current.find(r => r.userId === currentUserId)
            if (mine) return current.map(r => (r.userId === currentUserId ? { ...r, status } : r))
            return [
                ...current,
                {
                    id: `optimistic-${currentUserId}`,
                    status,
                    comment: null,
                    practiceId: practice.id,
                    userId: currentUserId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: { id: currentUserId, name: 'You', image: null, instrument: null },
                },
            ]
        }
    )

    const currentUserRsvp = optimisticRsvps.find(r => r.userId === currentUserId)?.status

    const goingList = optimisticRsvps.filter(r => r.status === 'GOING')
    const maybeList = optimisticRsvps.filter(r => r.status === 'MAYBE')
    const notGoingList = optimisticRsvps.filter(r => r.status === 'NOT_GOING')

    // ── Optimistic votes ────────────────────────────────────────────────────
    const [optimisticSuggestions, setOptimisticVote] = useOptimistic(
        practice.suggestions,
        (current, vote: { suggestionId: string; agree: boolean }) =>
            current.map(s => {
                if (s.id !== vote.suggestionId) return s
                const mine = s.votes.find(v => v.userId === currentUserId)
                const votes = mine
                    ? s.votes.map(v => (v.userId === currentUserId ? { ...v, agree: vote.agree } : v))
                    : [
                        ...s.votes,
                        {
                            id: `optimistic-${currentUserId}`,
                            agree: vote.agree,
                            suggestionId: s.id,
                            userId: currentUserId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            user: { id: currentUserId, name: 'You', image: null },
                        },
                    ]
                return { ...s, votes }
            })
    )

    const pendingSuggestions = optimisticSuggestions.filter(s => s.status === 'PENDING')
    const resolvedSuggestions = optimisticSuggestions.filter(s => s.status !== 'PENDING')

    const handleRsvp = (status: RsvpStatus) => {
        startTransition(async () => {
            setOptimisticRsvp(status)
            const res = await rsvpPractice(practice.id, status)
            if (res?.error) toast.error(res.error)
            else toast.success(`RSVP updated: ${status === 'GOING' ? 'Going' : status === 'MAYBE' ? 'Maybe' : "Can't Go"}`)
        })
    }

    const handleToggleCancel = () => {
        if (!practice.isCancelled) {
            if (!confirm("Are you sure you want to cancel this practice session?")) return
            startTransition(async () => {
                const res = await toggleCancelPractice(practice.id, true)
                if (res?.error) toast.error(res.error)
                else toast.success("Practice cancelled")
            })
        } else {
            // Uncancel
            startTransition(async () => {
                const res = await toggleCancelPractice(practice.id, false)
                if (res?.error) toast.error(res.error)
                else toast.success("Practice un-cancelled!")
            })
        }
    }

    const handleVote = (suggestionId: string, agree: boolean) => {
        startTransition(async () => {
            setOptimisticVote({ suggestionId, agree })
            const res = await voteSuggestion(suggestionId, practice.id, agree)
            if (res?.error) toast.error(res.error)
            else toast.success(agree ? "Voted Yes" : "Voted No")
        })
    }

    const handleApplySuggestion = (suggestionId: string) => {
        if (!confirm("Are you sure you want to apply this suggestion and update the rehearsal schedule?")) return
        startTransition(async () => {
            const res = await applySuggestion(suggestionId, practice.id)
            if (res?.error) toast.error(res.error)
            else toast.success("Suggestion applied to practice schedule!")
        })
    }

    const handleRejectSuggestion = (suggestionId: string) => {
        if (!confirm("Dismiss this suggestion?")) return
        startTransition(async () => {
            const res = await rejectSuggestion(suggestionId, practice.id)
            if (res?.error) toast.error(res.error)
            else toast.success("Suggestion dismissed")
        })
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Top Navigation & Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href="/practices"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Practices
                </Link>

                <div className="flex items-center gap-2 flex-wrap">
                    <SuggestEditDialog practice={practice} />
                    <EditPracticeDialog practice={practice} />

                    <Button
                        variant={practice.isCancelled ? "outline" : "destructive"}
                        size="sm"
                        onClick={handleToggleCancel}
                        disabled={isPending}
                        className="gap-1.5"
                    >
                        {practice.isCancelled ? (
                            <>
                                <RotateCcw className="h-4 w-4 text-emerald-400" />
                                Un-cancel
                            </>
                        ) : (
                            <>
                                <X className="h-4 w-4" />
                                Cancel Practice
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Details Banner Card */}
            <div className={cn(
                "rounded-2xl border p-6 md:p-8 backdrop-blur-xl transition-all shadow-xl relative overflow-hidden",
                practice.isCancelled
                    ? "border-red-500/30 bg-gradient-to-br from-red-950/20 via-black/50 to-black/80"
                    : "border-white/10 bg-gradient-to-br from-white/[0.04] via-black/40 to-black/70"
            )}>
                {practice.isCancelled && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        This Practice is Cancelled
                    </div>
                )}

                <h1 className={cn(
                    "text-2xl sm:text-3xl md:text-4xl font-black tracking-tight",
                    practice.isCancelled ? "line-through text-zinc-400" : "text-white"
                )}>
                    {formattedDate}
                </h1>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary">
                            <Clock className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-[12px] text-zinc-400 font-medium">Time</div>
                            <div className="font-semibold text-white">{practice.time}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-primary">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-[12px] text-zinc-400 font-medium">Location</div>
                            <div className="font-semibold text-white">{practice.venue}</div>
                        </div>
                    </div>

                    {/* Rehearsal-room door code (resolved server-side from DOOR_CODE) */}
                    {doorCode && (
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-amber-400">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-[12px] text-zinc-400 font-medium">Door Code</div>
                                <div className="font-mono font-bold text-amber-400 text-base tracking-wider">*{doorCode}*</div>
                            </div>
                        </div>
                    )}
                </div>

                {practice.notes && (
                    <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-zinc-300">
                        <span className="font-semibold text-zinc-400 block text-xs mb-1 uppercase tracking-wider">Rehearsal Notes</span>
                        {practice.notes}
                    </div>
                )}
            </div>

            {/* RSVP Interaction Section */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Attendance & RSVPs
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                        Let the band know if you can make it to this rehearsal.
                    </p>
                </div>

                {/* RSVP Choice Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                        type="button"
                        variant={currentUserRsvp === 'GOING' ? 'default' : 'outline'}
                        onClick={() => handleRsvp('GOING')}
                        className={cn(
                            "h-12 text-sm font-semibold justify-center gap-2 transition-all",
                            currentUserRsvp === 'GOING'
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 border-emerald-500"
                                : "hover:border-emerald-500/50 hover:text-emerald-400"
                        )}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        Going ({goingList.length})
                    </Button>

                    <Button
                        type="button"
                        variant={currentUserRsvp === 'MAYBE' ? 'default' : 'outline'}
                        onClick={() => handleRsvp('MAYBE')}
                        className={cn(
                            "h-12 text-sm font-semibold justify-center gap-2 transition-all",
                            currentUserRsvp === 'MAYBE'
                                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 border-amber-500"
                                : "hover:border-amber-500/50 hover:text-amber-400"
                        )}
                    >
                        <HelpCircle className="h-4 w-4" />
                        Maybe ({maybeList.length})
                    </Button>

                    <Button
                        type="button"
                        variant={currentUserRsvp === 'NOT_GOING' ? 'default' : 'outline'}
                        onClick={() => handleRsvp('NOT_GOING')}
                        className={cn(
                            "h-12 text-sm font-semibold justify-center gap-2 transition-all",
                            currentUserRsvp === 'NOT_GOING'
                                ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 border-red-500"
                                : "hover:border-red-500/50 hover:text-red-400"
                        )}
                    >
                        <XCircle className="h-4 w-4" />
                        Can't Go ({notGoingList.length})
                    </Button>
                </div>

                {/* Attendees Lists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5">
                    {/* Going */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            Going ({goingList.length})
                        </span>
                        <div className="space-y-1.5">
                            {goingList.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">No responses yet</p>
                            ) : (
                                goingList.map(rsvp => (
                                    <div key={rsvp.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={rsvp.user.image || ''} />
                                            <AvatarFallback className="text-[12px] bg-zinc-800 text-zinc-200">
                                                {rsvp.user.name ? rsvp.user.name.substring(0, 2).toUpperCase() : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate min-w-0">
                                            <div className="text-xs font-medium text-zinc-200 truncate">{rsvp.user.name || 'Member'}</div>
                                            {rsvp.user.instrument && (
                                                <div className="text-[12px] text-zinc-400 truncate">{rsvp.user.instrument}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Maybe */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                            Maybe ({maybeList.length})
                        </span>
                        <div className="space-y-1.5">
                            {maybeList.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">No responses yet</p>
                            ) : (
                                maybeList.map(rsvp => (
                                    <div key={rsvp.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={rsvp.user.image || ''} />
                                            <AvatarFallback className="text-[12px] bg-zinc-800 text-zinc-200">
                                                {rsvp.user.name ? rsvp.user.name.substring(0, 2).toUpperCase() : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate min-w-0">
                                            <div className="text-xs font-medium text-zinc-200 truncate">{rsvp.user.name || 'Member'}</div>
                                            {rsvp.user.instrument && (
                                                <div className="text-[12px] text-zinc-400 truncate">{rsvp.user.instrument}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Can't Go */}
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                            Can't Go ({notGoingList.length})
                        </span>
                        <div className="space-y-1.5">
                            {notGoingList.length === 0 ? (
                                <p className="text-xs text-zinc-400 italic">No responses yet</p>
                            ) : (
                                notGoingList.map(rsvp => (
                                    <div key={rsvp.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={rsvp.user.image || ''} />
                                            <AvatarFallback className="text-[12px] bg-zinc-800 text-zinc-200">
                                                {rsvp.user.name ? rsvp.user.name.substring(0, 2).toUpperCase() : 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate min-w-0">
                                            <div className="text-xs font-medium text-zinc-200 truncate">{rsvp.user.name || 'Member'}</div>
                                            {rsvp.user.instrument && (
                                                <div className="text-[12px] text-zinc-400 truncate">{rsvp.user.instrument}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggestions & Team Voting Section */}
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Proposed Reschedules & Suggestions</h2>
                        <p className="text-xs text-zinc-400 mt-1">
                            Band members can suggest edits. Vote Yes or No. When agreed, click "Apply Suggestion" to update the rehearsal.
                        </p>
                    </div>
                    <SuggestEditDialog practice={practice} />
                </div>

                {pendingSuggestions.length === 0 ? (
                    <div className="p-6 text-center rounded-xl border border-dashed border-white/10 text-xs text-zinc-400">
                        No pending suggestions for this practice.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingSuggestions.map(suggestion => {
                            const yesVotes = suggestion.votes.filter(v => v.agree)
                            const noVotes = suggestion.votes.filter(v => !v.agree)
                            const currentUserVote = suggestion.votes.find(v => v.userId === currentUserId)?.agree

                            const proposedDateStr = suggestion.proposedDate
                                ? new Date(suggestion.proposedDate).toLocaleDateString(undefined, {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    timeZone: 'UTC'
                                })
                                : null

                            return (
                                <div
                                    key={suggestion.id}
                                    className="p-5 rounded-xl border border-blue-500/20 bg-blue-950/10 space-y-4"
                                >
                                    {/* Suggestion Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={suggestion.createdBy.image || ''} />
                                                <AvatarFallback className="text-[12px] bg-zinc-800">
                                                    {suggestion.createdBy.name ? suggestion.createdBy.name.substring(0, 2).toUpperCase() : 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-zinc-300 font-medium">
                                                <strong>{suggestion.createdBy.name || 'Member'}</strong> suggested changes:
                                            </span>
                                        </div>

                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[12px] self-start sm:self-auto">
                                            Voting in Progress
                                        </Badge>
                                    </div>

                                    {/* Proposed Changes list */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-black/40 border border-white/5 text-xs">
                                        {proposedDateStr && (
                                            <div>
                                                <span className="text-zinc-400 block text-[12px]">Proposed Date</span>
                                                <span className="font-semibold text-blue-400">{proposedDateStr}</span>
                                            </div>
                                        )}
                                        {suggestion.proposedTime && (
                                            <div>
                                                <span className="text-zinc-400 block text-[12px]">Proposed Time</span>
                                                <span className="font-semibold text-blue-400">{suggestion.proposedTime}</span>
                                            </div>
                                        )}
                                        {suggestion.proposedVenue && (
                                            <div>
                                                <span className="text-zinc-400 block text-[12px]">Proposed Venue</span>
                                                <span className="font-semibold text-blue-400">{suggestion.proposedVenue}</span>
                                            </div>
                                        )}
                                    </div>

                                    {suggestion.reason && (
                                        <div className="text-xs text-zinc-300 italic bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                                            "{suggestion.reason}"
                                        </div>
                                    )}

                                    {/* Voting Bar & Action Buttons */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                                        {/* Yes / No voting buttons */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant={currentUserVote === true ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleVote(suggestion.id, true)}
                                                className={cn(
                                                    "gap-1.5 h-8 text-xs",
                                                    currentUserVote === true && "bg-emerald-600 hover:bg-emerald-500 text-white"
                                                )}
                                            >
                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                Yes ({yesVotes.length})
                                            </Button>

                                            <Button
                                                type="button"
                                                variant={currentUserVote === false ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleVote(suggestion.id, false)}
                                                className={cn(
                                                    "gap-1.5 h-8 text-xs",
                                                    currentUserVote === false && "bg-red-600 hover:bg-red-500 text-white"
                                                )}
                                            >
                                                <ThumbsDown className="h-3.5 w-3.5" />
                                                No ({noVotes.length})
                                            </Button>

                                            {/* Avatars of voters */}
                                            <div className="flex -space-x-1.5 ml-2">
                                                {yesVotes.map(v => (
                                                    <Avatar key={v.id} className="h-5 w-5 border border-zinc-900" title={`${v.user.name}: Yes`}>
                                                        <AvatarImage src={v.user.image || ''} />
                                                        <AvatarFallback className="text-[12px] bg-emerald-900 text-emerald-200">
                                                            {v.user.name?.substring(0, 1) || 'Y'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {noVotes.map(v => (
                                                    <Avatar key={v.id} className="h-5 w-5 border border-zinc-900" title={`${v.user.name}: No`}>
                                                        <AvatarImage src={v.user.image || ''} />
                                                        <AvatarFallback className="text-[12px] bg-red-900 text-red-200">
                                                            {v.user.name?.substring(0, 1) || 'N'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Apply or Reject buttons */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRejectSuggestion(suggestion.id)}
                                                disabled={isPending}
                                                className="h-8 text-xs text-zinc-400 hover:text-red-400"
                                            >
                                                Dismiss
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleApplySuggestion(suggestion.id)}
                                                disabled={isPending}
                                                className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                                                title="Apply this suggested schedule to the practice session"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                                Apply Suggestion
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Resolved suggestions */}
                {resolvedSuggestions.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                        <span className="text-xs font-semibold text-zinc-400 block mb-2">Past Suggestions</span>
                        <div className="space-y-2">
                            {resolvedSuggestions.map(s => (
                                <div key={s.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02] text-zinc-400">
                                    <div className="flex items-center gap-2 truncate">
                                        <span>Suggested by {s.createdBy.name}</span>
                                        {s.reason && <span className="italic truncate text-zinc-400">"{s.reason}"</span>}
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[12px]",
                                            s.status === 'APPROVED' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-zinc-700 text-zinc-400"
                                        )}
                                    >
                                        {s.status === 'APPROVED' ? 'Applied' : 'Dismissed'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
