'use client'

import { useState } from "react"
import { updateUserRole, deleteUser } from "@/app/(app)/admin/actions"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Loader2, Shield, ShieldAlert, Trash2 } from "lucide-react"

export function AdminUserTable({ profiles, currentUserId }: { profiles: any[], currentUserId: string }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleRoleChange = async (userId: string, currentRole: string) => {
        setLoadingId(userId)
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        await updateUserRole(userId, newRole as 'user' | 'admin')
        setLoadingId(null)
    }

    const handleDelete = async (userId: string) => {
        if (confirm("Are you sure you want to remove this user from the band? Their songs and setlists might become unlinked.")) {
            setLoadingId(userId)
            await deleteUser(userId)
            setLoadingId(null)
        }
    }

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Instrument</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                            <TableCell className="font-medium">
                                {profile.display_name}
                                {profile.id === currentUserId && <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">(You)</span>}
                            </TableCell>
                            <TableCell>{profile.email}</TableCell>
                            <TableCell>{profile.instrument || "-"}</TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${profile.role === 'admin'
                                        ? 'bg-red-500/10 text-red-500 ring-red-500/20 dark:text-red-400 dark:ring-red-400/20'
                                        : 'bg-primary/10 text-primary ring-primary/20'
                                    }`}>
                                    {profile.role}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={loadingId === profile.id || profile.id === currentUserId}
                                        onClick={() => handleRoleChange(profile.id, profile.role)}
                                        title="Toggle Admin Role"
                                    >
                                        {loadingId === profile.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : profile.role === 'admin' ? (
                                            <ShieldAlert className="h-4 w-4 text-orange-500" />
                                        ) : (
                                            <Shield className="h-4 w-4 text-green-500" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10"
                                        disabled={loadingId === profile.id || profile.id === currentUserId}
                                        onClick={() => handleDelete(profile.id)}
                                        title="Remove User"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
