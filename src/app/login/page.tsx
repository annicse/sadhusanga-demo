'use client'

import { useActionState } from 'react'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, null)

    return (
        <main id="main-content" tabIndex={-1} className="flex min-h-screen w-full items-center justify-center px-4 focus:outline-none">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <h1 className="text-2xl leading-snug font-medium">Login</h1>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" autoComplete="email" placeholder="m@example.com" required aria-invalid={state?.error ? true : undefined} aria-describedby={state?.error ? 'login-error' : undefined} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" autoComplete="current-password" required aria-invalid={state?.error ? true : undefined} aria-describedby={state?.error ? 'login-error' : undefined} />
                        </div>
                        {state?.error && (
                            <p id="login-error" role="alert" className="text-sm font-medium text-destructive">
                                {state.error}
                            </p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending ? "Signing in..." : "Sign in"}
                        </Button>

                        {/*
                        <div className="text-center text-sm">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                                Sign up
                            </Link>
                        </div>
                        */}
                    </CardFooter>
                </form>
            </Card>
        </main>
    )
}
