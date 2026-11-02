import { z } from 'zod'

export const AddMemberSchema = z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(200),
    display_name: z.string().trim().min(1, 'Display name is required').max(100),
})

export type AddMemberInput = z.infer<typeof AddMemberSchema>
