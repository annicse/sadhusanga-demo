'use client'

import { useState } from 'react'
import { addMember } from '@/app/(app)/add-member/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export function AddMemberForm({ profile }: { profile: any }) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        setError(null)
        setSuccess(false)

        const result = await addMember(formData)

        if (result && 'error' in result) {
            setError(result.error || null)
        } else {
            setSuccess(true)
        }

        setIsPending(false)
    }

    return (
        <Card className="max-w-xl">
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && <div className="text-sm font-medium text-destructive">{error}</div>}
                    {success && <div className="text-sm font-medium text-green-500 dark:text-green-400">Member added successfully!</div>}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" name="email" type='email' required />
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor="password">Password *</Label>
                        <Input id="password" name="password" type="password" required minLength={6} />
                    </div>

                    <div className="space-y-2 mb-6">
                        <Label htmlFor="display_name">Display Name *</Label>
                        <Input id="display_name" name="display_name" required />
                    </div>
                </CardContent>

                <CardFooter className="border-t p-6">
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Member
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
