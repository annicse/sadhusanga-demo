'use client'

import { useState, useTransition } from "react"
import { MessageSquarePlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { createSuggestion } from "@/app/(app)/practices/actions"
import type { Practice } from "@prisma/client"

interface SuggestEditDialogProps {
    practice: Practice
    trigger?: React.ReactNode
}

export function SuggestEditDialog({ practice, trigger }: SuggestEditDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const practiceDate = new Date(practice.date)
    const defaultDate = practiceDate.toISOString().split('T')[0]

    const [proposedDate, setProposedDate] = useState(defaultDate)
    const [proposedTime, setProposedTime] = useState(practice.time)
    const [proposedVenue, setProposedVenue] = useState(practice.venue)
    const [reason, setReason] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        if (proposedDate) formData.append('proposedDate', proposedDate)
        if (proposedTime) formData.append('proposedTime', proposedTime)
        if (proposedVenue) formData.append('proposedVenue', proposedVenue)
        if (reason) formData.append('reason', reason)

        startTransition(async () => {
            const result = await createSuggestion(practice.id, formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Edit suggested! Band members can now vote on it.")
                setOpen(false)
                setReason("")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={(props) => trigger ? (
                    <span {...props} className="inline-block cursor-pointer">{trigger}</span>
                ) : (
                    <Button {...props} type="button" variant="outline" size="sm" className="gap-1.5">
                        <MessageSquarePlus className="h-4 w-4 text-blue-400" />
                        Suggest Edit
                    </Button>
                )}
            />
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">Suggest Edit</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Propose an alternative date, time, or venue for this practice. Band members can vote Yes or No.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="suggest-date" className="text-xs font-medium text-zinc-300">Proposed Date</Label>
                        <Input
                            id="suggest-date"
                            type="date"
                            value={proposedDate}
                            onChange={(e) => setProposedDate(e.target.value)}
                            className="bg-black/40 border-white/10 text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="suggest-time" className="text-xs font-medium text-zinc-300">Proposed Time</Label>
                            <Input
                                id="suggest-time"
                                type="text"
                                placeholder="20:00"
                                value={proposedTime}
                                onChange={(e) => setProposedTime(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="suggest-venue" className="text-xs font-medium text-zinc-300">Proposed Venue</Label>
                            <Input
                                id="suggest-venue"
                                type="text"
                                placeholder="Demo Studio"
                                value={proposedVenue}
                                onChange={(e) => setProposedVenue(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="suggest-reason" className="text-xs font-medium text-zinc-300">
                            Reason for Suggestion *
                        </Label>
                        <Textarea
                            id="suggest-reason"
                            required
                            placeholder="E.g. Can we move to Friday because 2 members have travel on Thursday?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-black/40 border-white/10 text-white text-sm resize-none h-20"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} className="gap-1.5">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Post Suggestion
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
