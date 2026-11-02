import { describe, it, expect } from 'vitest'
import {
    bandDateString,
    bandHour,
    calendarDayFromString,
    calendarDayString,
    endOfCalendarDay,
    parseTime,
    practiceStartInstant,
    startOfBandToday,
} from '../time'

// BAND_TIMEZONE defaults to Europe/Oslo (CET = UTC+1 in winter, CEST = UTC+2 in summer)

describe('calendar-day helpers', () => {
    it('stores a YYYY-MM-DD as UTC midnight and round-trips it', () => {
        const day = calendarDayFromString('2026-10-08')
        expect(day.toISOString()).toBe('2026-10-08T00:00:00.000Z')
        expect(calendarDayString(day)).toBe('2026-10-08')
    })

    it('endOfCalendarDay is the last millisecond of that day', () => {
        const day = calendarDayFromString('2026-10-08')
        expect(endOfCalendarDay(day).toISOString()).toBe('2026-10-08T23:59:59.999Z')
    })

    it('legacy rows stored as "20:00 UTC" still map to the right calendar day', () => {
        const legacy = new Date('2026-10-08T20:00:00.000Z')
        expect(calendarDayString(legacy)).toBe('2026-10-08')
    })
})

describe('band-local "today"', () => {
    it('uses the band timezone, not UTC, to decide which day it is', () => {
        // 23:30 UTC on Oct 8 is already 01:30 on Oct 9 in Oslo (CEST)
        const lateEvening = new Date('2026-10-08T23:30:00.000Z')
        expect(bandDateString(lateEvening)).toBe('2026-10-09')
        expect(startOfBandToday(lateEvening).toISOString()).toBe('2026-10-09T00:00:00.000Z')
        expect(bandHour(lateEvening)).toBe(1)
    })
})

describe('parseTime', () => {
    it('parses HH:MM and H:MM', () => {
        expect(parseTime('20:00')).toEqual([20, 0])
        expect(parseTime('8:30')).toEqual([8, 30])
    })
    it('falls back to the default start time for garbage', () => {
        expect(parseTime('8 PM')).toEqual([20, 0])
        expect(parseTime('')).toEqual([20, 0])
        expect(parseTime('25:99')).toEqual([20, 0])
    })
})

describe('practiceStartInstant (DST-aware)', () => {
    it('summer: 20:00 Oslo (CEST, UTC+2) is 18:00 UTC', () => {
        const start = practiceStartInstant(calendarDayFromString('2026-07-02'), '20:00')
        expect(start.toISOString()).toBe('2026-07-02T18:00:00.000Z')
    })

    it('winter: 20:00 Oslo (CET, UTC+1) is 19:00 UTC', () => {
        const start = practiceStartInstant(calendarDayFromString('2026-12-10'), '20:00')
        expect(start.toISOString()).toBe('2026-12-10T19:00:00.000Z')
    })

    it('works for legacy rows whose date carries a UTC time component', () => {
        const start = practiceStartInstant(new Date('2026-12-10T20:00:00.000Z'), '20:00')
        expect(start.toISOString()).toBe('2026-12-10T19:00:00.000Z')
    })
})
