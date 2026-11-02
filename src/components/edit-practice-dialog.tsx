'use client'

import { useState, useTransition } from "react"
import { Pen, Loader2 } from "lucide-react"
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
import { updatePractice } from "@/app/(app)/practices/actions"
import type { Practice } from "@prisma/client"

interface EditPracticeDialogProps {
    practice: Practice
    trigger?: React.ReactNode
}

export function EditPracticeDialog({ practice, trigger }: EditPracticeDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()

    const practiceDate = new Date(practice.date)
    const initialDate = practiceDate.toISOString().split('T')[0]

    const [date, setDate] = useState(initialDate)
    const [time, setTime] = useState(practice.time)
    const [venue, setVenue] = useState(practice.venue)
    const [notes, setNotes] = useState(practice.notes || "")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('date', date)
        formData.append('time', time)
        formData.append('venue', venue)
        if (notes) formData.append('notes', notes)

        startTransition(async () => {
            const result = await updatePractice(practice.id, formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Practice updated successfully!")
                setOpen(false)
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
                        <Pen className="h-4 w-4" />
                        Edit Details
                    </Button>
                )}
            />
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">Edit Practice</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Update rehearsal schedule, location, or notes.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-practice-date" className="text-xs font-medium text-zinc-300">Date *</Label>
                        <Input
                            id="edit-practice-date"
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-black/40 border-white/10 text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-practice-time" className="text-xs font-medium text-zinc-300">Time</Label>
                            <Input
                                id="edit-practice-time"
                                type="text"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-practice-venue" className="text-xs font-medium text-zinc-300">Venue</Label>
                            <Input
                                id="edit-practice-venue"
                                type="text"
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="edit-practice-notes" className="text-xs font-medium text-zinc-300">Notes (Optional)</Label>
                        <Textarea
                            id="edit-practice-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
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
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
