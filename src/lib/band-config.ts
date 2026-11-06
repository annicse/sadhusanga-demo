// Band-wide settings that used to be hard-coded across the app.
// Server-only: these read non-public env vars. Pass values to client
// components as props when they need them.

/** IANA timezone the band rehearses in. Drives "today", "morning" and start-time maths. */
export const BAND_TIMEZONE = process.env.BAND_TIMEZONE || 'Europe/Oslo'

/** Default rehearsal venue and start time used when a form leaves them blank. */
export const DEFAULT_VENUE = process.env.DEFAULT_VENUE || 'Demo Studio'
export const DEFAULT_PRACTICE_TIME = '20:00'

/** Venues (case-insensitive substring match) whose rehearsal room needs a door code. */
const DOOR_CODE_VENUE_MATCH = (process.env.DOOR_CODE_VENUE_MATCH || 'demo studio').toLowerCase()

/**
 * Returns the rehearsal-room door code for a venue, or null when the venue
 * has no code or DOOR_CODE is not configured.
 */
export function doorCodeForVenue(venue: string | null | undefined): string | null {
    const code = process.env.DOOR_CODE
    if (!code) return null
    if (!venue) return null
    return venue.toLowerCase().includes(DOOR_CODE_VENUE_MATCH) ? code : null
}
