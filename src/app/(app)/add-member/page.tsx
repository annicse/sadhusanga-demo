import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { AddMemberForm } from "@/components/add-member-form"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"

export default async function AddMemberPage() {
    const session = await auth()

    if (!session?.user) redirect('/login')
    if (session.user.role !== 'admin') notFound() // admins only, same as /admin

    let profile = null

    try {
        profile = await prisma.user.findUnique({
            where: { id: session.user.id }
        })
    } catch (err) { }

    if (!profile) {
        return <div>Profile not found.</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Add Member</h1>
                    <p className="text-muted-foreground">
                        Add a new member to the band.
                    </p>

                </div>
            </div>
            <AddMemberForm profile={profile} />
        </div>
    )
}
