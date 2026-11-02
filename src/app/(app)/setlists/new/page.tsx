import { SetlistForm } from "@/components/setlist-form"

export default function NewSetlistPage() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Setlist</h1>
                    <p className="text-muted-foreground">
                        Plan your next gig or jam session.
                    </p>
                </div>
            </div>
            <SetlistForm />
        </div>
    )
}
