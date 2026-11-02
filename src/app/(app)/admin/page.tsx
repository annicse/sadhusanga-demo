import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { AdminUserTable } from "@/components/admin-user-table"

export default async function AdminPage() {
    const session = await auth()

    if (!session?.user) redirect('/login')

    if (session.user.role !== 'admin') {
        notFound() // Hide admin page from non-admins
    }

    // Fetch all profiles
    let profiles: any[] = []
    try {
        profiles = await prisma.user.findMany({
            orderBy: { name: 'asc' }
        })
    } catch (err) { }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-red-500 dark:text-red-400">Admin Panel</h1>
                    <p className="text-muted-foreground">
                        Manage band members and application access.
                    </p>
                </div>
            </div>

            <AdminUserTable profiles={profiles || []} currentUserId={session.user.id} />
        </div>
    )
}
