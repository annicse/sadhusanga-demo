import { describe, it, expect } from 'vitest'
import { isChord, isSectionHeader, isChordLine, transposeChord } from '../chords'

describe('Chord Detection Engine', () => {
    it('correctly identifies valid musical chords', () => {
        expect(isChord('Am')).toBe(true)
        expect(isChord('C#m7')).toBe(true)
        expect(isChord('D/F#')).toBe(true)
        expect(isChord('Bsus4')).toBe(true)
    })

    it('rejects regular lyrics as chords', () => {
        expect(isChord('Desert')).toBe(false)
        expect(isChord('highway')).toBe(false)
        expect(isChord('the')).toBe(false)
    })

    it('identifies section headers', () => {
        expect(isSectionHeader('[Verse 1]')).toBe(true)
        expect(isSectionHeader('Chorus:')).toBe(true)
        expect(isSectionHeader('Bridge')).toBe(true)
        expect(isSectionHeader('Am7')).toBe(false)
    })

    it('identifies full chord lines', () => {
        expect(isChordLine('Am   C   G   D')).toBe(true)
        expect(isChordLine('On a dark desert highway')).toBe(false)
    })
})

describe('Chord Transposition Engine', () => {
    it('transposes simple major and minor chords up', () => {
        expect(transposeChord('C', 2)).toBe('D')
        expect(transposeChord('Am', 2)).toBe('Bm')
        expect(transposeChord('G#m7', 1)).toBe('Am7')
    })

    it('handles negative semitone wrapping (downward transposition)', () => {
        expect(transposeChord('C', -1)).toBe('B')
        expect(transposeChord('F', -2)).toBe('D#')
    })

    it('transposes slash chords including bass notes', () => {
        expect(transposeChord('D/F#', 2)).toBe('E/G#')
    })

    it('supports flat preference when requested', () => {
        expect(transposeChord('F', 1, true)).toBe('Gb')
    })

    it('returns unmodified string if semitones is 0 or chord is invalid', () => {
        expect(transposeChord('Am', 0)).toBe('Am')
    })
})
