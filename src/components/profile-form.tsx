'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/(app)/profile/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function ProfileForm({ profile }: { profile: any }) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        setSuccess(false)

        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirm_password') as string

        if (password && password !== confirmPassword) {
            setError('Passwords do not match')
            setIsPending(false)
            return
        }

        const result = await updateProfile(formData)

        if (result && 'error' in result) {
            setError(result.error || null)
        } else {
            setSuccess(true)
        }

        setIsPending(false)
    }

    return (
        <Card className="max-w-xl">
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                    Update your personal details and instrument.
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}
                    {success && <div className="text-sm font-medium text-green-500 dark:text-green-400">Profile updated successfully!</div>}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type='email' value={profile.email} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">New password</Label>
                        <Input id="password" type='password' name='password' minLength={6} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm password</Label>
                        <Input id="confirm_password" type='password' name='confirm_password' minLength={6} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name *</Label>
                        <Input id="display_name" name="display_name" defaultValue={profile.name} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instrument">Primary Instrument / Role</Label>
                        <Input id="instrument" name="instrument" defaultValue={profile.instrument || ''} placeholder="e.g. Guitar, Vocals, Sound Engineer" />
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label>Account Role</Label>
                        <div>
                            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 capitalize">
                                {profile.role}
                            </span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t p-6">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
