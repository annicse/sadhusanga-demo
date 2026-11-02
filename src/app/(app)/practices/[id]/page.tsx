import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { PracticeDetailView, type PracticeFullDetails } from "@/components/practice-detail-view"
import { doorCodeForVenue } from "@/lib/band-config"

export const dynamic = "force-dynamic"

export default async function PracticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user) redirect('/login')

    const { id } = await params

    const practice = await prisma.practice.findUnique({
        where: { id },
        include: {
            createdBy: {
                select: { id: true, name: true, email: true }
            },
            rsvps: {
                include: {
                    user: {
                        select: { id: true, name: true, image: true, instrument: true }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            },
            suggestions: {
                include: {
                    createdBy: {
                        select: { id: true, name: true, image: true }
                    },
                    votes: {
                        include: {
                            user: {
                                select: { id: true, name: true, image: true }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    })

    if (!practice) {
        notFound()
    }

    return (
        <PracticeDetailView
            practice={practice as unknown as PracticeFullDetails}
            currentUserId={session.user.id}
            doorCode={doorCodeForVenue(practice.venue)}
        />
    )
}
