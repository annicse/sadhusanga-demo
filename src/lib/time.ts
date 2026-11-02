import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { BAND_TIMEZONE, DEFAULT_PRACTICE_TIME } from './band-config'

/**
 * How practice dates are stored
 * ─────────────────────────────
 * `Practice.date` is a CALENDAR DAY stored as UTC midnight (e.g. 2026-10-08T00:00:00Z).
 * `Practice.time`  is the wall-clock start in the band's timezone ("20:00").
 *
 * The real instant is only computed when needed (cron reminders) with
 * `practiceStartInstant`, using the band's IANA timezone, so DST is handled
 * by the tz database instead of a hard-coded UTC offset.
 *
 * Legacy rows that stored "20:00 UTC" on the practice day still work: their UTC
 * date part is the correct calendar day, and `time` has always been the source
 * of truth for the wall-clock start.
 */

/** "YYYY-MM-DD" for `date` as seen in the band's timezone. */
export function bandDateString(date: Date = new Date()): string {
    return formatInTimeZone(date, BAND_TIMEZONE, 'yyyy-MM-dd')
}

/** Current hour (0-23) in the band's timezone. */
export function bandHour(date: Date = new Date()): number {
    return Number(formatInTimeZone(date, BAND_TIMEZONE, 'H'))
}

/** Parses "YYYY-MM-DD" into the calendar-day Date used for `Practice.date`. */
export function calendarDayFromString(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d))
}

/** Calendar-day Date for "today" in the band's timezone. */
export function startOfBandToday(now: Date = new Date()): Date {
    return calendarDayFromString(bandDateString(now))
}

/** Last millisecond of a calendar day (UTC representation). */
export function endOfCalendarDay(day: Date): Date {
    return new Date(day.getTime() + 24 * 60 * 60 * 1000 - 1)
}

/** "YYYY-MM-DD" of a stored calendar-day Date. */
export function calendarDayString(day: Date): string {
    return formatInTimeZone(day, 'UTC', 'yyyy-MM-dd')
}

/** Parses "20:00" / "8:00" into [hours, minutes]; falls back to the default start time. */
export function parseTime(time: string | null | undefined): [number, number] {
    const match = (time ?? '').trim().match(/^(\d{1,2}):(\d{2})$/)
    if (!match) return parseTime(DEFAULT_PRACTICE_TIME)
    const h = Number(match[1])
    const m = Number(match[2])
    if (h > 23 || m > 59) return parseTime(DEFAULT_PRACTICE_TIME)
    return [h, m]
}

/** The real instant a practice starts, from its calendar day and wall-clock time. */
export function practiceStartInstant(day: Date, time: string | null | undefined): Date {
    const [h, m] = parseTime(time)
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    return fromZonedTime(`${calendarDayString(day)}T${hh}:${mm}:00`, BAND_TIMEZONE)
}
