import { z } from 'zod'
import { DEFAULT_PRACTICE_TIME, DEFAULT_VENUE } from '@/lib/band-config'

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
const TimeString = z.string().trim().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24h), e.g. 20:00')

export const PracticeSchema = z.object({
    date: DateString,
    time: z.preprocess(emptyToUndefined, TimeString.optional()).transform(v => v ?? DEFAULT_PRACTICE_TIME),
    venue: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()).transform(v => v ?? DEFAULT_VENUE),
    notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()).transform(v => v ?? null),
})
export type PracticeInput = z.infer<typeof PracticeSchema>

export const RecurringPracticeSchema = z.object({
    dayOfWeek: z.preprocess(
        emptyToUndefined,
        z.coerce.number().int().min(0, 'Day of week must be 0-6').max(6, 'Day of week must be 0-6').optional()
    ).transform(v => v ?? 4), // Thursday
    time: z.preprocess(emptyToUndefined, TimeString.optional()).transform(v => v ?? DEFAULT_PRACTICE_TIME),
    venue: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()).transform(v => v ?? DEFAULT_VENUE),
    untilMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Target month must be YYYY-MM'),
})
export type RecurringPracticeInput = z.infer<typeof RecurringPracticeSchema>

export const SuggestionSchema = z.object({
    proposedDate: z.preprocess(emptyToUndefined, DateString.optional()).transform(v => v ?? null),
    proposedTime: z.preprocess(emptyToUndefined, TimeString.optional()).transform(v => v ?? null),
    proposedVenue: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()).transform(v => v ?? null),
    reason: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()).transform(v => v ?? null),
})
export type SuggestionInput = z.infer<typeof SuggestionSchema>
