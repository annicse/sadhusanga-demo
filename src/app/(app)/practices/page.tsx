import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Calendar } from "lucide-react"
import { PracticeCard, type PracticeWithDetails } from "@/components/practice-card"
import { PracticeFormDialog } from "@/components/practice-form-dialog"
import { startOfBandToday } from "@/lib/time"

export const dynamic = "force-dynamic"

export default async function PracticesPage() {
    const session = await auth()
    if (!session?.user) redirect('/login')

    // Query next upcoming practice dates (max 10), "today" measured in the band's timezone
    const upcomingPractices = await prisma.practice.findMany({
        where: {
            date: {
                gte: startOfBandToday()
            }
        },
        orderBy: {
            date: 'asc'
        },
        take: 10,
        include: {
            createdBy: {
                select: { id: true, name: true, email: true }
            },
            rsvps: {
                include: {
                    user: {
                        select: { id: true, name: true, image: true, instrument: true }
                    }
                }
            },
            suggestions: {
                select: { id: true, status: true }
            }
        }
    })

    // Index of the first non-cancelled upcoming practice to highlight (or 0)
    const highlightIndex = upcomingPractices.findIndex(p => !p.isCancelled)

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                        <Calendar className="h-7 w-7 text-primary" />
                        Band Practices
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Upcoming rehearsals, attendance RSVPs, and scheduling.
                    </p>
                </div>

                <PracticeFormDialog />
            </div>

            {/* Upcoming Practices List */}
            {upcomingPractices.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed border-white/15 bg-black/30 backdrop-blur-md space-y-4">
                    <div className="p-4 rounded-full bg-white/5 w-16 h-16 mx-auto flex items-center justify-center text-zinc-400">
                        <Calendar className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">No Upcoming Practices Scheduled</h3>
                        <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                            Schedule a single rehearsal session or generate repeated practice dates for a chosen weekday.
                        </p>
                    </div>
                    <PracticeFormDialog />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                        <span>Next {upcomingPractices.length} Scheduled Rehearsals</span>
                        <span>Click any rehearsal to RSVP or suggest changes</span>
                    </div>

                    <div className="space-y-3">
                        {upcomingPractices.map((practice, index) => (
                            <PracticeCard
                                key={practice.id}
                                practice={practice as PracticeWithDetails}
                                isHighlighted={index === highlightIndex}
                                currentUserId={session.user.id}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
