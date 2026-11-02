import Navbar from "@/components/navbar"
import { SyncProvider } from "@/lib/sync-context"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SyncProvider>
            <div className="relative flex min-h-screen flex-col bg-transparent">
                <Navbar />
                <main className="flex-1">
                    <div className="container px-4 py-6 md:py-8 lg:py-12 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SyncProvider>
    )
}