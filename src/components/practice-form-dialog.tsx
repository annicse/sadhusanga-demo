'use client'

import { useState, useTransition } from "react"
import { Plus, Calendar, Repeat, Loader2 } from "lucide-react"
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
import { createPractice, createRecurringPractices } from "@/app/(app)/practices/actions"

interface PracticeFormDialogProps {
    trigger?: React.ReactNode
}

export function PracticeFormDialog({ trigger }: PracticeFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState<'single' | 'recurring'>('single')
    const [isPending, startTransition] = useTransition()

    // Single practice form state
    const todayStr = new Date().toISOString().split('T')[0]
    const [date, setDate] = useState(todayStr)
    const [time, setTime] = useState("20:00")
    const [venue, setVenue] = useState("Demo Studio")
    const [customVenue, setCustomVenue] = useState("")
    const [notes, setNotes] = useState("")

    // Recurring form state
    const [dayOfWeek, setDayOfWeek] = useState("4") // 4 = Thursday
    const [recurringTime, setRecurringTime] = useState("20:00")
    const [recurringVenue, setRecurringVenue] = useState("Demo Studio")

    // Default target month = next month
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const defaultUntilMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
    const [untilMonth, setUntilMonth] = useState(defaultUntilMonth)

    const effectiveVenue = venue === 'custom' ? customVenue : venue

    const handleCreateSingle = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('date', date)
        formData.append('time', time)
        formData.append('venue', effectiveVenue || "Demo Studio")
        if (notes) formData.append('notes', notes)

        startTransition(async () => {
            const result = await createPractice(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Practice scheduled successfully!")
                setOpen(false)
            }
        })
    }

    const handleCreateRecurring = (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('dayOfWeek', dayOfWeek)
        formData.append('time', recurringTime)
        formData.append('venue', recurringVenue)
        formData.append('untilMonth', untilMonth)

        startTransition(async () => {
            const result = await createRecurringPractices(formData)
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                toast.success(`Generated ${result.count} recurring practice sessions!`)
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
                    <Button {...props} type="button" className="gap-1.5 shadow-md">
                        <Plus className="h-4 w-4" />
                        Schedule Practice
                    </Button>
                )}
            />
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">Schedule Practice</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Add an upcoming band rehearsal or generate recurring dates.
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Switcher */}
                <div className="flex rounded-lg bg-white/5 p-1 border border-white/10 gap-1 mt-1">
                    <button
                        type="button"
                        onClick={() => setTab('single')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            tab === 'single'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Calendar className="h-3.5 w-3.5" />
                        Single Date
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('recurring')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            tab === 'recurring'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        <Repeat className="h-3.5 w-3.5" />
                        Repeated Dates
                    </button>
                </div>

                {/* Single Form */}
                {tab === 'single' && (
                    <form onSubmit={handleCreateSingle} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="practice-date" className="text-xs font-medium text-zinc-300">Date *</Label>
                            <Input
                                id="practice-date"
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-black/40 border-white/10 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="practice-time" className="text-xs font-medium text-zinc-300">Time</Label>
                                <Input
                                    id="practice-time"
                                    type="text"
                                    placeholder="20:00"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="practice-venue-select" className="text-xs font-medium text-zinc-300">Venue</Label>
                                <select
                                    id="practice-venue-select"
                                    value={venue}
                                    onChange={(e) => setVenue(e.target.value)}
                                    className="w-full h-9 rounded-md border border-white/40 bg-black/60 px-3 py-1 text-sm text-white"
                                >
                                    <option value="Demo Studio">Demo Studio (Default)</option>
                                    <option value="Community Hall">Community Hall</option>
                                    <option value="custom">Other (Free text)</option>
                                </select>
                            </div>
                        </div>

                        {venue === 'custom' && (
                            <div className="space-y-1.5">
                                <Label htmlFor="practice-custom-venue" className="text-xs font-medium text-zinc-300">Custom Venue Location</Label>
                                <Input
                                    id="practice-custom-venue"
                                    placeholder="Enter venue name / location"
                                    value={customVenue}
                                    onChange={(e) => setCustomVenue(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="practice-notes" className="text-xs font-medium text-zinc-300">Notes (Optional)</Label>
                            <Textarea
                                id="practice-notes"
                                placeholder="E.g. Focus on the new songs or bring acoustic guitars"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-black/40 border-white/10 text-white text-sm resize-none h-18"
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
                                Schedule Practice
                            </Button>
                        </div>
                    </form>
                )}

                {/* Recurring Form */}
                {tab === 'recurring' && (
                    <form onSubmit={handleCreateRecurring} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="recurring-day" className="text-xs font-medium text-zinc-300">Day of the Week</Label>
                                <select
                                    id="recurring-day"
                                    value={dayOfWeek}
                                    onChange={(e) => setDayOfWeek(e.target.value)}
                                    className="w-full h-9 rounded-md border border-white/40 bg-black/60 px-3 py-1 text-sm text-white"
                                >
                                    <option value="1">Monday</option>
                                    <option value="2">Tuesday</option>
                                    <option value="3">Wednesday</option>
                                    <option value="4">Thursday (Default)</option>
                                    <option value="5">Friday</option>
                                    <option value="6">Saturday</option>
                                    <option value="0">Sunday</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="recurring-time" className="text-xs font-medium text-zinc-300">Time</Label>
                                <Input
                                    id="recurring-time"
                                    type="text"
                                    value={recurringTime}
                                    onChange={(e) => setRecurringTime(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="recurring-venue" className="text-xs font-medium text-zinc-300">Venue</Label>
                                <Input
                                    id="recurring-venue"
                                    type="text"
                                    value={recurringVenue}
                                    onChange={(e) => setRecurringVenue(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="recurring-until-month" className="text-xs font-medium text-zinc-300">Until Month</Label>
                                <Input
                                    id="recurring-until-month"
                                    type="month"
                                    required
                                    value={untilMonth}
                                    onChange={(e) => setUntilMonth(e.target.value)}
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        <p className="text-[12px] text-zinc-400 bg-white/5 p-2.5 rounded-lg border border-white/5">
                            This will automatically generate weekly rehearsal sessions for the selected weekday until the end of <strong>{untilMonth}</strong>.
                        </p>

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
                                Generate Sessions
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
