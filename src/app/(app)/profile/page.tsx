import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ProfileForm } from "@/components/profile-form"
import { NotificationSettings } from "@/components/notification-settings"
import { PushNotificationTester } from "@/components/push-notification-tester"
import { redirect } from "next/navigation"
import Link from "next/link"

export const metadata = { title: "Profile" }

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user) redirect('/login')

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id }
    })

    if (!profile) {
        return <div>Profile not found.</div>
    }

    return (
        <div className="space-y-8 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Your Profile</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Manage your account and rehearsal notifications.
                    </p>
                </div>
                {session.user.role === 'admin' && (
                    <Link
                        href="/add-member"
                        className="text-xs text-primary hover:underline font-medium"
                    >
                        + Add member
                    </Link>
                )}
            </div>

            <ProfileForm profile={profile} />

            <NotificationSettings user={profile} />

            <PushNotificationTester />
        </div>
    )
}
