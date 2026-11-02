import { z } from 'zod'

const emptyStringToNull = z.literal('').transform(() => null)

export const SongSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(100),
    artist: z.string().trim().max(100).optional().nullable().or(emptyStringToNull),
    key: z.string().trim().max(10).optional().nullable().or(emptyStringToNull),
    tempo: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
        z.number().int().min(20, 'Tempo must be at least 20 BPM').max(300, 'Tempo cannot exceed 300 BPM').nullable().optional()
    ),
    notes: z.string().optional().nullable().or(emptyStringToNull),
    lyrics: z.string().optional().nullable().or(emptyStringToNull),
    songlink: z.string().trim().url('Invalid URL format').optional().nullable().or(emptyStringToNull),
})

export type SongInput = z.infer<typeof SongSchema>