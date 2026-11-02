import { z } from 'zod'

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

export const SetlistSchema = z.object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    event_date: z.preprocess(
        emptyToNull,
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Event date must be YYYY-MM-DD').nullable().optional()
    ).transform(v => (v ? new Date(`${v}T00:00:00.000Z`) : null)),
    venue: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()).transform(v => v ?? null),
    comment: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().optional()).transform(v => v ?? null),
    playlist_link: z.preprocess(
        emptyToNull,
        z.string().trim().url('Playlist link must be a valid URL').nullable().optional()
    ).transform(v => v ?? null),
})

export type SetlistInput = z.infer<typeof SetlistSchema>

/** Ordered list of song ids for `updateSetlistSongs`. */
export const SetlistSongIdsSchema = z.array(z.string().min(1)).max(500)
