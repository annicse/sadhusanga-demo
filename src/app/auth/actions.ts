'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'

// Note: there is intentionally no public `signup` action. Accounts are created
// by admins via /add-member (see add-member/actions.ts).

export async function login(prevState: unknown, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
        })

        if (result?.error) {
            return { error: 'Invalid login credentials' }
        }
    } catch (err: unknown) {
        if ((err as { type?: string })?.type === 'CredentialsSignin') {
            return { error: 'Invalid login credentials' }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function logout() {
    await signOut({ redirectTo: '/login' })
}
